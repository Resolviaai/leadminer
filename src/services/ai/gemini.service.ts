import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';

export interface PersonalizationInput {
  channelTitle: string;
  category?: string;
  description?: string;
  subscriberCount?: number;
}

export interface PersonalizationOutput {
  customLine: string;
  status: 'CUSTOMIZED' | 'FALLBACK' | 'FAILED';
  model?: string;
  error?: string;
}

export class GeminiPersonalizerService {
  private genAI: GoogleGenerativeAI | null = null;
  private defaultFallbackLine = 'I came across your content and was really impressed by the consistency of your recent uploads.';

  constructor() {
    if (env.GEMINI_API_KEY) {
      try {
        this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      } catch (e) {
        console.warn('Failed to initialize GoogleGenerativeAI client:', e);
      }
    }
  }

  public async generateCustomLine(input: PersonalizationInput): Promise<PersonalizationOutput> {
    if (!this.genAI || !env.GEMINI_API_KEY) {
      return {
        customLine: this.defaultFallbackLine,
        status: 'FALLBACK',
        model: 'none',
        error: 'GEMINI_API_KEY not configured',
      };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: env.GEMINI_MODEL || 'gemini-2.0-flash' });

      const prompt = `
You are an expert outreach copywriter for a video editing agency.
Write exactly ONE natural, genuine, specific compliment or observation (1 sentence only, max 25 words) about this YouTube creator based on their details below.
Focus on their niche, topic, or content consistency.
Do not use hyperbolic flattery or generic clichés like "stumbled upon your channel".
Do not include quotes or greetings. Output only the single sentence.

Channel Title: ${input.channelTitle}
Category: ${input.category || 'Content Creator'}
Description: ${input.description ? input.description.slice(0, 300) : 'Active video creator'}
`.trim();

      // Wrap in a 5-second timeout to protect worker throughput
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Gemini API request timed out')), 5000)),
      ]);

      const text = result.response.text()?.trim();
      if (!text || text.length < 10) {
        return {
          customLine: this.defaultFallbackLine,
          status: 'FALLBACK',
          model: env.GEMINI_MODEL,
        };
      }

      // Strip any wrapping quotes
      const cleanLine = text.replace(/^["']|["']$/g, '');

      return {
        customLine: cleanLine,
        status: 'CUSTOMIZED',
        model: env.GEMINI_MODEL,
      };
    } catch (error: any) {
      console.warn(`[Gemini Service] Personalization error: ${error.message}. Using fallback line.`);
      return {
        customLine: this.defaultFallbackLine,
        status: 'FALLBACK',
        model: env.GEMINI_MODEL,
        error: error.message,
      };
    }
  }
}

export const geminiService = new GeminiPersonalizerService();

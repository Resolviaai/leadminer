import {
  TypeSafeClient,
  choice,
  noul,
  score,
  APIError,
  RateLimitError,
  APITimeoutError,
  APIConnectionError,
} from '@typesafe-ai/sdk';
import crypto from 'crypto';
import { env } from '../../config/env';
import { getDbPool } from '../../db/client';

export const QUESTION_SET_VERSION = 'contact-eval-v1';

export interface JevEvaluatorState {
  channelTitle?: string;
  sourceType?: string;
  descriptionSnippet: string;
  detectedContacts?: {
    emails?: string[];
    socials?: string[];
    phones?: string[];
    websites?: string[];
  };
}

export interface JevOpportunityEvaluation {
  hasCommercialContact: boolean;
  commercialProbability: number;
  contactIntent: string;
  intentConfidence: number;
  intentMargin: number;
  bestChannel: string;
  channelConfidence: number;
  /**
   * Heuristic triage metric (0-4): Strength of commercial signal present in available text evidence.
   * NOTE: Ranking and prioritization signal ONLY. Does NOT qualify a lead or replace verification.
   */
  commercialOpportunityScore: number;
  commercialOpportunityConfidence: number;
  /**
   * Heuristic triage metric (0-4): Reachability and relevance score according to provided text.
   * NOTE: Soft triage signal. Authoritative mailbox deliverability remains deterministic.
   */
  contactQualityScore: number;
  contactQualityConfidence: number;
  isObfuscated: boolean;
  obfuscatedProbability: number;
  investigateFurther: boolean;
  investigateProbability: number;
  model: string;
  questionSetVersion: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  source: 'JEV_SYSTEM_ONE' | 'CACHE' | 'FALLBACK';
}

export interface JevContactEvaluation {
  hasContactInfo: boolean;
  hasEmail: boolean;
  hasDiscord: boolean;
  hasSocialOrPhone: boolean;
  isObfuscated: boolean;
  confidence: number;
  source: 'JEV_SYSTEM_ONE' | 'CACHE' | 'FALLBACK';
}

// Backward-compatible generic interfaces for legacy callers
export interface JevQuestion {
  id: string;
  type: 'choice' | 'score' | 'noul';
  question?: string;
  statement?: string;
  options?: string[];
  min?: number;
  max?: number;
}

export interface JevResponse {
  results: Record<string, any>;
  usage: {
    inputTokens: number;
    latencyMs: number;
  };
}

export class JevService {
  private client: TypeSafeClient | null = null;
  private readonly apiKey: string | null;
  private readonly timeoutMs: number;
  private readonly model: string;

  // In-memory fallback tracking when PostgreSQL pool is unavailable (e.g. testing / offline)
  private memoryCallsToday: number = 0;
  private memoryLastResetPt: string = '';
  private memoryCache = new Map<string, JevOpportunityEvaluation>();

  // Absolute maximum characters allowed from YouTube (5,000 chars for video descriptions, 1,000 for channel about)
  public static readonly MAX_YT_DESCRIPTION_CHARS = 5000;

  constructor(timeoutMs = 3000) {
    this.apiKey = env.TYPESAFE_API_KEY || process.env.TYPESAFE_API_KEY || null;
    this.timeoutMs = timeoutMs;
    this.model = env.JEV_MODEL || 'jev-latest';

    if (this.isConfiguredKey(this.apiKey)) {
      this.client = new TypeSafeClient({
        apiKey: this.apiKey || undefined,
        timeout: this.timeoutMs,
        defaultModel: this.model,
        retry: { maxRetries: 1 },
      });
    }
  }

  private isConfiguredKey(key: string | null): boolean {
    return Boolean(key && key.trim().length > 0 && !key.includes('[YOUR') && !key.includes('PLACEHOLDER'));
  }

  public isAvailable(): boolean {
    if (!env.JEV_ENABLED) return false;
    return Boolean(this.isConfiguredKey(this.apiKey));
  }

  private getPacificDateString(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  }

  private shouldUseMemoryState(): boolean {
    return process.env.NODE_ENV === 'test' || !env.DATABASE_URL;
  }

  /**
   * Serverless-Safe Daily Quota Reservation
   * Atomically checks and increments call quota in PostgreSQL (daily_api_usage).
   * Falls back to memory-based accounting if database is unreachable or in test environment.
   */
  public async reserveDailyQuota(dailyLimit: number = env.JEV_DAILY_CALL_LIMIT): Promise<boolean> {
    const today = this.getPacificDateString();

    if (this.shouldUseMemoryState()) {
      if (this.memoryLastResetPt !== today) {
        this.memoryLastResetPt = today;
        this.memoryCallsToday = 0;
      }
      if (this.memoryCallsToday >= dailyLimit) {
        return false;
      }
      this.memoryCallsToday += 1;
      return true;
    }

    try {
      const pool = getDbPool();
      const result = await pool.query(
        `
        INSERT INTO daily_api_usage (service, usage_date, call_count, created_at, updated_at)
        VALUES ('jev', $1, 1, NOW(), NOW())
        ON CONFLICT (service, usage_date)
        DO UPDATE SET call_count = daily_api_usage.call_count + 1, updated_at = NOW()
        WHERE daily_api_usage.call_count < $2
        RETURNING call_count;
        `,
        [today, dailyLimit]
      );

      if (result.rowCount && result.rowCount > 0) {
        return true;
      }
      return false; // Quota ceiling reached
    } catch (dbErr: any) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[JevService] Database error checking daily quota in production. Failing closed:', dbErr?.message);
        return false; // Strict fail-closed invariant in production: never bypass quota if DB fails
      }
      // In-memory fallback for offline or unit tests
      if (this.memoryLastResetPt !== today) {
        this.memoryLastResetPt = today;
        this.memoryCallsToday = 0;
      }
      if (this.memoryCallsToday >= dailyLimit) {
        return false;
      }
      this.memoryCallsToday += 1;
      return true;
    }
  }

  /**
   * Record Token Usage & Outcomes in PostgreSQL
   */
  public async recordUsageMetrics(
    inputTokens: number,
    outputTokens: number,
    success: boolean
  ): Promise<void> {
    if (this.shouldUseMemoryState()) return;

    const today = this.getPacificDateString();
    try {
      const pool = getDbPool();
      await pool.query(
        `
        UPDATE daily_api_usage
        SET input_tokens = input_tokens + $1,
            output_tokens = output_tokens + $2,
            successful_calls = successful_calls + $3,
            failed_calls = failed_calls + $4,
            updated_at = NOW()
        WHERE service = 'jev' AND usage_date = $5;
        `,
        [inputTokens, outputTokens, success ? 1 : 0, success ? 0 : 1, today]
      );
    } catch {
      // Non-fatal if usage metrics write fails
    }
  }

  /**
   * Persistent SHA-256 Cache Lookup
   */
  private async getCachedEvaluation(cacheKey: string): Promise<JevOpportunityEvaluation | null> {
    // 1. Check memory cache first
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!;
    }

    if (this.shouldUseMemoryState()) {
      return null;
    }

    // 2. Check PostgreSQL cache table
    try {
      const pool = getDbPool();
      const res = await pool.query(
        `SELECT evaluation FROM jev_evaluations_cache WHERE cache_key = $1 LIMIT 1`,
        [cacheKey]
      );
      if (res.rowCount && res.rowCount > 0) {
        const evalData = res.rows[0].evaluation as JevOpportunityEvaluation;
        this.memoryCache.set(cacheKey, evalData);
        return evalData;
      }
    } catch {
      // Database cache miss or unreachable
    }

    return null;
  }

  /**
   * Persistent SHA-256 Cache Save
   */
  private async saveCachedEvaluation(
    cacheKey: string,
    stateSnippet: string,
    evaluation: JevOpportunityEvaluation
  ): Promise<void> {
    // 1. Save to in-memory cache (LRU protection: cap at 5,000 entries)
    if (this.memoryCache.size >= 5000) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) this.memoryCache.delete(firstKey);
    }
    this.memoryCache.set(cacheKey, evaluation);

    if (this.shouldUseMemoryState()) {
      return;
    }

    // 2. Save to PostgreSQL cache table
    try {
      const pool = getDbPool();
      await pool.query(
        `
        INSERT INTO jev_evaluations_cache (cache_key, question_set_version, model, source_type, state_snippet, evaluation, input_tokens, output_tokens, latency_ms, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (cache_key) DO NOTHING;
        `,
        [
          cacheKey,
          evaluation.questionSetVersion,
          evaluation.model,
          'youtube_description',
          stateSnippet.slice(0, 500),
          JSON.stringify(evaluation),
          evaluation.inputTokens,
          evaluation.outputTokens,
          evaluation.latencyMs,
        ]
      );
    } catch {
      // Non-fatal if database cache write fails
    }
  }

  /**
   * Record Cache Hit Metric
   */
  public async recordCacheHit(): Promise<void> {
    if (this.shouldUseMemoryState()) return;
    const today = this.getPacificDateString();
    try {
      const pool = getDbPool();
      await pool.query(
        `
        UPDATE daily_api_usage
        SET cache_hits = cache_hits + 1, updated_at = NOW()
        WHERE service = 'jev' AND usage_date = $1;
        `,
        [today]
      );
    } catch {
      // Non-fatal
    }
  }

  /**
   * Primary Contact Opportunity Evaluator (TypeSafe AI System One)
   * Evaluates 7 structured decision dimensions in a single atomic API call.
   */
  public async evaluateContactOpportunity(
    state: JevEvaluatorState
  ): Promise<JevOpportunityEvaluation | null> {
    if (!this.isAvailable()) {
      return null;
    }

    // 1. Token & Input Bounding: Enforce strict YouTube description ceiling
    const boundedSnippet = (state.descriptionSnippet || '').slice(0, JevService.MAX_YT_DESCRIPTION_CHARS).trim();
    if (!boundedSnippet) {
      return {
        hasCommercialContact: false,
        commercialProbability: 0,
        contactIntent: 'none',
        intentConfidence: 1.0,
        intentMargin: 1.0,
        bestChannel: 'none',
        channelConfidence: 1.0,
        commercialOpportunityScore: 0,
        commercialOpportunityConfidence: 1.0,
        contactQualityScore: 0,
        contactQualityConfidence: 1.0,
        isObfuscated: false,
        obfuscatedProbability: 0,
        investigateFurther: false,
        investigateProbability: 0,
        model: this.model,
        questionSetVersion: QUESTION_SET_VERSION,
        latencyMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        source: 'FALLBACK',
      };
    }

    // 2. Deterministic SHA-256 Cache Key
    const normalizedPayload = {
      version: QUESTION_SET_VERSION,
      model: this.model,
      channelTitle: (state.channelTitle || '').trim().toLowerCase(),
      sourceType: state.sourceType || 'youtube_description',
      snippet: boundedSnippet,
      detectedContacts: {
        emails: (state.detectedContacts?.emails || []).slice().sort(),
        socials: (state.detectedContacts?.socials || []).slice().sort(),
        phones: (state.detectedContacts?.phones || []).slice().sort(),
        websites: (state.detectedContacts?.websites || []).slice().sort(),
      },
    };
    const cacheKey = crypto
      .createHash('sha256')
      .update(JSON.stringify(normalizedPayload))
      .digest('hex');

    // 3. Cache Check
    const cached = await this.getCachedEvaluation(cacheKey);
    if (cached) {
      await this.recordCacheHit();
      return { ...cached, source: 'CACHE' };
    }

    // 4. Serverless-Safe Daily Quota Check
    const quotaGranted = await this.reserveDailyQuota();
    if (!quotaGranted) {
      console.warn(`[JevService] Daily quota governor reached. Bypassing Jev.`);
      return null;
    }

    // 5. Construct Structured Multi-Question Set via Official SDK
    const questions = {
      commercialContact: noul(
        'Does this creator bio or description contain or strongly imply a legitimate business/commercial contact route?'
      ),
      contactIntent: choice(
        'What is the primary intent of the most useful contact method found?',
        {
          none: 'No commercial or business contact method found',
          business_inquiries: 'Direct inquiries, sponsors, advertising, or booking',
          management: 'Talent management, agency, or representative',
          press_media: 'Press, media relations, or PR',
          creator_direct: 'Direct personal email or personal inbox of the creator',
          community: 'Discord server, fan community, or generic gaming chat',
          generic: 'General support, feedback, or unspecified inquiries',
        }
      ),
      bestChannel: choice(
        'Which available communication channel is most appropriate for business outreach?',
        {
          email: 'Direct or business email address',
          website: 'Official website, booking page, or contact form',
          instagram: 'Instagram direct message or profile',
          x: 'Twitter/X direct message or profile',
          linkedin: 'LinkedIn profile or company page',
          discord: 'Discord user tag or direct community',
          whatsapp: 'WhatsApp number or direct chat link',
          phone: 'Direct telephone or mobile number',
          none: 'No suitable business outreach channel available',
        }
      ),
      commercialOpportunity: score(
        'How strong is the commercial business signal present in the available text evidence?',
        ['none', 'weak', 'possible', 'strong', 'very strong']
      ),
      contactQuality: score(
        'How directly reachable and relevant is the contact route according to the provided text?',
        ['unusable', 'weak', 'usable', 'strong', 'highly relevant']
      ),
      obfuscatedContact: noul(
        'Does the text contain an intentionally obfuscated email or contact (e.g. [at], (dot), spaced out, or spelled out)?'
      ),
      investigateFurther: noul(
        'Is there a credible reason to inspect external or linked pages (e.g. Linktree, website) for additional commercial contact info?'
      ),
    };

    const clientInstance = this.client || new TypeSafeClient({
      apiKey: this.apiKey || undefined,
      timeout: this.timeoutMs,
      defaultModel: this.model,
      retry: { maxRetries: 1 },
    });

    const startTime = performance.now();

    try {
      const response = await clientInstance.systemOne({
        state: normalizedPayload,
        questions,
        model: this.model,
      });

      const latencyMs = Math.round(performance.now() - startTime);
      const inputTokens = response.usage?.input_tokens ?? 0;
      const outputTokens = response.usage?.output_tokens ?? 0;

      // Extract Intent Probabilities and Compute Top Margin
      const intentProbs = (response.answers.contactIntent?.probabilities || {}) as Record<string, number>;
      const sortedIntentProbs = Object.values(intentProbs).sort((a, b) => b - a);
      const topProb = sortedIntentProbs[0] || response.answers.contactIntent?.confidence || 0.8;
      const secondProb = sortedIntentProbs[1] || 0;
      const intentMargin = Number((topProb - secondProb).toFixed(3));

      const evaluation: JevOpportunityEvaluation = {
        hasCommercialContact: (response.answers.commercialContact?.noul ?? 0) >= 0.5,
        commercialProbability: response.answers.commercialContact?.noul ?? 0,
        contactIntent: response.answers.contactIntent?.choice || 'none',
        intentConfidence: response.answers.contactIntent?.confidence ?? topProb,
        intentMargin,
        bestChannel: response.answers.bestChannel?.choice || 'none',
        channelConfidence: response.answers.bestChannel?.confidence ?? 0.8,
        commercialOpportunityScore: response.answers.commercialOpportunity?.score ?? 0,
        commercialOpportunityConfidence: response.answers.commercialOpportunity?.confidence ?? 0.8,
        contactQualityScore: response.answers.contactQuality?.score ?? 0,
        contactQualityConfidence: response.answers.contactQuality?.confidence ?? 0.8,
        isObfuscated: (response.answers.obfuscatedContact?.noul ?? 0) >= 0.5,
        obfuscatedProbability: response.answers.obfuscatedContact?.noul ?? 0,
        investigateFurther: (response.answers.investigateFurther?.noul ?? 0) >= 0.5,
        investigateProbability: response.answers.investigateFurther?.noul ?? 0,
        model: response.model || this.model,
        questionSetVersion: QUESTION_SET_VERSION,
        latencyMs,
        inputTokens,
        outputTokens,
        source: 'JEV_SYSTEM_ONE',
      };

      // Save to persistent cache & update usage metrics asynchronously
      await this.saveCachedEvaluation(cacheKey, boundedSnippet, evaluation);
      await this.recordUsageMetrics(inputTokens, outputTokens, true);

      return evaluation;
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - startTime);
      await this.recordUsageMetrics(0, 0, false);

      if (err instanceof RateLimitError) {
        console.warn(`[JevService] Rate limited (429) by TypeSafe AI. Bypassing.`);
      } else if (err instanceof APITimeoutError) {
        console.warn(`[JevService] Request timed out after ${this.timeoutMs}ms.`);
      } else if (err instanceof APIConnectionError) {
        console.warn(`[JevService] Network connection error communicating with TypeSafe AI.`);
      } else if (err instanceof APIError) {
        console.warn(`[JevService] API error (${err.status}): ${err.message}`);
      } else {
        console.warn(`[JevService] Unexpected evaluation failure:`, (err as any)?.message || err);
      }
      return null;
    }
  }

  /**
   * Backward-Compatible Contact Presence Classifier
   * Wraps the multi-question evaluator to support existing pipeline consumers seamlessly.
   */
  public async evaluateContactPresence(
    description: string,
    channelTitle?: string,
    detectedContacts?: JevEvaluatorState['detectedContacts']
  ): Promise<JevContactEvaluation | null> {
    const oppEval = await this.evaluateContactOpportunity({
      channelTitle,
      descriptionSnippet: description,
      detectedContacts,
    });

    if (!oppEval) {
      return null;
    }

    const hasEmail =
      oppEval.bestChannel === 'email' ||
      oppEval.contactIntent === 'business_inquiries' ||
      oppEval.contactIntent === 'management' ||
      oppEval.obfuscatedProbability > 0.6;

    const hasDiscord =
      oppEval.bestChannel === 'discord' ||
      oppEval.contactIntent === 'community';

    const hasSocialOrPhone =
      oppEval.bestChannel === 'instagram' ||
      oppEval.bestChannel === 'x' ||
      oppEval.bestChannel === 'linkedin' ||
      oppEval.bestChannel === 'phone' ||
      oppEval.bestChannel === 'whatsapp';

    return {
      hasContactInfo: oppEval.hasCommercialContact,
      hasEmail,
      hasDiscord,
      hasSocialOrPhone,
      isObfuscated: oppEval.isObfuscated,
      confidence: oppEval.commercialProbability,
      source: oppEval.source,
    };
  }

  /**
   * Low-Level Generic Evaluator (Backward Compatibility)
   */
  public async evaluate(
    state: Record<string, unknown> | string,
    questions: JevQuestion[]
  ): Promise<JevResponse | null> {
    if (!this.isAvailable()) return null;

    const clientInstance = this.client || new TypeSafeClient({
      apiKey: this.apiKey || undefined,
      timeout: this.timeoutMs,
      defaultModel: this.model,
    });

    try {
      const sdkQuestions: Record<string, any> = {};
      for (const q of questions) {
        if (q.type === 'noul') {
          sdkQuestions[q.id] = noul(q.statement || q.question || 'Is this statement true?');
        } else if (q.type === 'choice' && q.options) {
          const criteria: Record<string, string> = {};
          q.options.forEach((opt) => {
            criteria[opt] = opt;
          });
          sdkQuestions[q.id] = choice(q.question || 'Select an option', criteria);
        } else if (q.type === 'score') {
          sdkQuestions[q.id] = score(q.question || 'Rate this item', ['low', 'medium', 'high']);
        }
      }

      const res = await clientInstance.systemOne({
        state: state as any,
        questions: sdkQuestions,
      });

      return {
        results: res.answers as any,
        usage: {
          inputTokens: res.usage?.input_tokens ?? 0,
          latencyMs: 100,
        },
      };
    } catch {
      return null;
    }
  }

  /**
   * Query Governor & Usage Status
   */
  public async getGovernorStatus(): Promise<{ callsToday: number; dailyLimit: number; remaining: number }> {
    const today = this.getPacificDateString();
    const limit = env.JEV_DAILY_CALL_LIMIT;

    if (this.shouldUseMemoryState()) {
      return {
        callsToday: this.memoryCallsToday,
        dailyLimit: limit,
        remaining: Math.max(0, limit - this.memoryCallsToday),
      };
    }

    try {
      const pool = getDbPool();
      const res = await pool.query(
        `SELECT call_count FROM daily_api_usage WHERE service = 'jev' AND usage_date = $1 LIMIT 1`,
        [today]
      );
      const callsToday = res.rowCount && res.rowCount > 0 ? Number(res.rows[0].call_count) : 0;
      return {
        callsToday,
        dailyLimit: limit,
        remaining: Math.max(0, limit - callsToday),
      };
    } catch {
      return {
        callsToday: this.memoryCallsToday,
        dailyLimit: limit,
        remaining: Math.max(0, limit - this.memoryCallsToday),
      };
    }
  }
}

export const jevService = new JevService();

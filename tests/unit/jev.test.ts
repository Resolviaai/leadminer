import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JevService, jevService, QUESTION_SET_VERSION } from '../../src/services/ai/jev.service';
import { env } from '../../src/config/env';
import * as clientDb from '../../src/db/client';
import { RateLimitError, APITimeoutError } from '@typesafe-ai/sdk';

describe('Jev Service (TypeSafe AI System One SDK Integration)', () => {
  let customJev: JevService;

  beforeEach(() => {
    vi.restoreAllMocks();
    customJev = new JevService(500);
    // Force a mock valid API key and initialize client
    (customJev as any).apiKey = 'test-typesafe-key-123';
    (customJev as any).client = {
      systemOne: vi.fn(),
    };
    (customJev as any).memoryCallsToday = 0;
    (customJev as any).memoryCache.clear();
  });

  it('should verify availability based on key and enabled flag', () => {
    expect(jevService.isAvailable()).toBe(Boolean(env.TYPESAFE_API_KEY && env.TYPESAFE_API_KEY.length > 0));
  });

  it('should strictly cap description payload to maximum YouTube length (5,000 chars)', async () => {
    const massiveDescription = 'a'.repeat(10000);

    const mockSystemOne = vi.fn().mockResolvedValue({
      model: 'jev-latest',
      answers: {
        commercialContact: { noul: 0.95 },
        contactIntent: { choice: 'business_inquiries', confidence: 0.9, probabilities: { business_inquiries: 0.9 } },
        bestChannel: { choice: 'email', confidence: 0.95 },
        commercialOpportunity: { score: 3.5, confidence: 0.9 },
        contactQuality: { score: 3.8, confidence: 0.9 },
        obfuscatedContact: { noul: 0.1 },
        investigateFurther: { noul: 0.2 },
      },
      usage: { input_tokens: 1400, output_tokens: 0 },
    });
    (customJev as any).client.systemOne = mockSystemOne;

    await customJev.evaluateContactOpportunity({
      descriptionSnippet: massiveDescription,
      channelTitle: 'Test Channel',
    });

    expect(mockSystemOne).toHaveBeenCalledTimes(1);
    const sentPayload = mockSystemOne.mock.calls[0][0];
    const snippetSent = sentPayload.state.snippet;

    expect(snippetSent.length).toBeLessThanOrEqual(JevService.MAX_YT_DESCRIPTION_CHARS);
    expect(snippetSent.length).toBe(5000);
  });

  it('should enforce daily quota governor limit and fail soft', async () => {
    const mockSystemOne = vi.fn();
    (customJev as any).client.systemOne = mockSystemOne;

    // Simulate quota exhaustion
    vi.spyOn(customJev, 'reserveDailyQuota').mockResolvedValue(false);

    const result = await customJev.evaluateContactOpportunity({
      descriptionSnippet: 'Business: hello@creator.com',
      channelTitle: 'Test Channel',
    });

    expect(result).toBeNull();
    expect(mockSystemOne).not.toHaveBeenCalled();
  });

  it('should accurately parse multi-question answers, compute intent margin, and return opportunity evaluation', async () => {
    const mockSystemOne = vi.fn().mockResolvedValue({
      model: 'jev-latest',
      answers: {
        commercialContact: { noul: 0.94 },
        contactIntent: {
          choice: 'business_inquiries',
          confidence: 0.85,
          probabilities: { business_inquiries: 0.85, management: 0.10, none: 0.05 },
        },
        bestChannel: { choice: 'email', confidence: 0.92 },
        commercialOpportunity: { score: 3.7, confidence: 0.88 },
        contactQuality: { score: 3.9, confidence: 0.91 },
        obfuscatedContact: { noul: 0.88 },
        investigateFurther: { noul: 0.75 },
      },
      usage: { input_tokens: 380, output_tokens: 0 },
    });
    (customJev as any).client.systemOne = mockSystemOne;

    const evalResult = await customJev.evaluateContactOpportunity({
      descriptionSnippet: 'Business: alex [at] studio.io | Discord: alex#1234',
      channelTitle: 'Alex Gaming',
      detectedContacts: { emails: ['alex@studio.io'] },
    });

    expect(evalResult).not.toBeNull();
    expect(evalResult?.hasCommercialContact).toBe(true);
    expect(evalResult?.commercialProbability).toBe(0.94);
    expect(evalResult?.contactIntent).toBe('business_inquiries');
    // Margin = top (0.85) - second (0.10) = 0.75
    expect(evalResult?.intentMargin).toBe(0.75);
    expect(evalResult?.bestChannel).toBe('email');
    expect(evalResult?.isObfuscated).toBe(true);
    expect(evalResult?.investigateFurther).toBe(true);
    expect(evalResult?.questionSetVersion).toBe(QUESTION_SET_VERSION);
    expect(evalResult?.source).toBe('JEV_SYSTEM_ONE');
  });

  it('should provide backward-compatible evaluateContactPresence matching legacy contract', async () => {
    const mockSystemOne = vi.fn().mockResolvedValue({
      model: 'jev-latest',
      answers: {
        commercialContact: { noul: 0.92 },
        contactIntent: { choice: 'business_inquiries', confidence: 0.9 },
        bestChannel: { choice: 'email', confidence: 0.95 },
        commercialOpportunity: { score: 3.0, confidence: 0.8 },
        contactQuality: { score: 3.5, confidence: 0.85 },
        obfuscatedContact: { noul: 0.8 },
        investigateFurther: { noul: 0.1 },
      },
      usage: { input_tokens: 200, output_tokens: 0 },
    });
    (customJev as any).client.systemOne = mockSystemOne;

    const result = await customJev.evaluateContactPresence('Reach out at alex [at] gmail', 'Alex Channel');

    expect(result).not.toBeNull();
    expect(result?.hasContactInfo).toBe(true);
    expect(result?.hasEmail).toBe(true);
    expect(result?.isObfuscated).toBe(true);
    expect(result?.confidence).toBe(0.92);
  });

  it('should cache repeated identical queries using SHA-256 without calling SDK twice', async () => {
    const mockSystemOne = vi.fn().mockResolvedValue({
      model: 'jev-latest',
      answers: {
        commercialContact: { noul: 0.05 },
        contactIntent: { choice: 'none', confidence: 0.98 },
        bestChannel: { choice: 'none', confidence: 0.98 },
        commercialOpportunity: { score: 0, confidence: 0.95 },
        contactQuality: { score: 0, confidence: 0.95 },
        obfuscatedContact: { noul: 0.01 },
        investigateFurther: { noul: 0.02 },
      },
      usage: { input_tokens: 150, output_tokens: 0 },
    });
    (customJev as any).client.systemOne = mockSystemOne;

    const desc = 'Just playing Minecraft and hanging out!';
    const firstCall = await customJev.evaluateContactOpportunity({
      descriptionSnippet: desc,
      channelTitle: 'Gamer123',
    });
    const secondCall = await customJev.evaluateContactOpportunity({
      descriptionSnippet: desc,
      channelTitle: 'Gamer123',
    });

    expect(firstCall?.hasCommercialContact).toBe(false);
    expect(firstCall?.source).toBe('JEV_SYSTEM_ONE');
    expect(secondCall?.hasCommercialContact).toBe(false);
    expect(secondCall?.source).toBe('CACHE');
    expect(mockSystemOne).toHaveBeenCalledTimes(1);
  });

  it('should gracefully handle RateLimitError and APITimeoutError without throwing', async () => {
    (customJev as any).client.systemOne = vi.fn().mockRejectedValue(
      RateLimitError.fromResponse(429, { message: 'Too many requests' }, new Headers())
    );

    const result = await customJev.evaluateContactOpportunity({
      descriptionSnippet: 'Business: alex@domain.com',
      channelTitle: 'Channel',
    });

    expect(result).toBeNull();
  });

  it('should strictly enforce quota atomicity under concurrent requests', async () => {
    const limit = 10;
    // Launch 50 simultaneous quota reservation requests
    const requests = Array.from({ length: 50 }, () => customJev.reserveDailyQuota(limit));
    const results = await Promise.all(requests);

    const granted = results.filter(Boolean).length;
    const denied = results.filter((r) => !r).length;

    // Exactly 10 must succeed, exactly 40 must be denied
    expect(granted).toBe(10);
    expect(denied).toBe(40);

    const status = await customJev.getGovernorStatus();
    expect(status.callsToday).toBe(10);
    expect(status.remaining).toBe(env.JEV_DAILY_CALL_LIMIT - 10);
  });

  it('should fail closed in production if PostgreSQL quota check throws an error', async () => {
    const prevEnv = process.env.NODE_ENV;
    try {
      (process.env as any).NODE_ENV = 'production';
      vi.spyOn(clientDb, 'getDbPool').mockImplementation(() => {
        throw new Error('PostgreSQL connection pool exhausted');
      });

      const granted = await customJev.reserveDailyQuota(100);
      // In production, when DB fails, it MUST fail closed (false) to prevent quota blowouts
      expect(granted).toBe(false);
    } finally {
      (process.env as any).NODE_ENV = prevEnv;
    }
  });

  it('should generate deterministic cache keys regardless of contacts array ordering', async () => {
    const mockSystemOne = vi.fn().mockResolvedValue({
      model: 'jev-latest',
      answers: {
        commercialContact: { noul: 0.9 },
        contactIntent: { choice: 'business_inquiries', confidence: 0.9 },
        bestChannel: { choice: 'email', confidence: 0.9 },
        commercialOpportunity: { score: 3.5, confidence: 0.9 },
        contactQuality: { score: 4.0, confidence: 0.9 },
        obfuscatedContact: { noul: 0.1 },
        investigateFurther: { noul: 0.1 },
      },
      usage: { input_tokens: 100, output_tokens: 0 },
    });
    (customJev as any).client.systemOne = mockSystemOne;

    // Order 1: ['a@test.com', 'b@test.com']
    await customJev.evaluateContactOpportunity({
      descriptionSnippet: 'Email: a@test.com or b@test.com',
      channelTitle: 'TechChannel',
      detectedContacts: { emails: ['a@test.com', 'b@test.com'] },
    });

    // Order 2: ['b@test.com', 'a@test.com']
    const cachedResult = await customJev.evaluateContactOpportunity({
      descriptionSnippet: 'Email: a@test.com or b@test.com',
      channelTitle: 'TechChannel',
      detectedContacts: { emails: ['b@test.com', 'a@test.com'] },
    });

    expect(cachedResult?.source).toBe('CACHE');
    expect(mockSystemOne).toHaveBeenCalledTimes(1);
  });

  it('should isolate cache entries across different channel titles', async () => {
    const mockSystemOne = vi.fn().mockResolvedValue({
      model: 'jev-latest',
      answers: {
        commercialContact: { noul: 0.9 },
        contactIntent: { choice: 'business_inquiries', confidence: 0.9 },
        bestChannel: { choice: 'email', confidence: 0.9 },
        commercialOpportunity: { score: 3.5, confidence: 0.9 },
        contactQuality: { score: 4.0, confidence: 0.9 },
        obfuscatedContact: { noul: 0.1 },
        investigateFurther: { noul: 0.1 },
      },
      usage: { input_tokens: 100, output_tokens: 0 },
    });
    (customJev as any).client.systemOne = mockSystemOne;

    await customJev.evaluateContactOpportunity({
      descriptionSnippet: 'Same bio text',
      channelTitle: 'ChannelAlpha',
    });

    const secondResult = await customJev.evaluateContactOpportunity({
      descriptionSnippet: 'Same bio text',
      channelTitle: 'ChannelBeta',
    });

    // Different channel title must NOT cross-pollute cache
    expect(secondResult?.source).toBe('JEV_SYSTEM_ONE');
    expect(mockSystemOne).toHaveBeenCalledTimes(2);
  });
});

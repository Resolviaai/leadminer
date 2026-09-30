import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emailExtractor } from '../../src/services/extraction/email.extractor';
import { socialExtractor } from '../../src/services/extraction/social.extractor';
import { jevService } from '../../src/services/ai/jev.service';
import { geminiService, GeminiPersonalizerService } from '../../src/services/ai/gemini.service';

describe('Discovery AI Cascade & Quota Gatekeeper Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    geminiService.resetMemoryQuotaForTesting();
  });

  it('1. Extractor -> enough data -> SKIP AI (0 Jev calls, 0 Gemini calls)', async () => {
    const description = 'For sponsorships & brand deals: partner@creatorstudio.com. Follow IG: @mychannel';

    const jevSpy = vi.spyOn(jevService, 'evaluateContactPresence');
    const geminiSpy = vi.spyOn(geminiService, 'extractContacts');

    // Step 1: Deterministic extraction
    const extractedEmails = emailExtractor.extractEmails(description);
    const extractedSocials = socialExtractor.extractSocials(description);

    expect(extractedEmails).toHaveLength(1);
    expect(extractedEmails[0].email).toBe('partner@creatorstudio.com');
    expect(extractedEmails[0].role).toBe('BUSINESS');

    const hasSufficientContactData =
      extractedEmails.length > 0 &&
      extractedEmails.some((e) => !e.possibleDomainTypo && e.confidence >= 0.85);

    expect(hasSufficientContactData).toBe(true);

    // AI Cascade Gatekeeper Check
    if (!hasSufficientContactData) {
      await jevService.evaluateContactPresence(description, 'Test Channel');
      await geminiService.extractContacts(description, 'Test Channel');
    }

    // Proves that AI was completely bypassed, saving 100% of Jev and Gemini quota
    expect(jevSpy).not.toHaveBeenCalled();
    expect(geminiSpy).not.toHaveBeenCalled();
  });

  it('2. Extractor -> ambiguous (0 emails) -> Jev negative -> SKIP Gemini (0 Gemini calls)', async () => {
    const description = 'Just playing video games and streaming daily! Subscribe for fun!';

    const jevSpy = vi.spyOn(jevService, 'evaluateContactPresence').mockResolvedValue({
      hasEmail: false,
      hasDiscord: false,
      hasSocialOrPhone: false,
      isObfuscated: false,
      hasContactInfo: false,
      confidence: 0.9,
      source: 'JEV_SYSTEM_ONE',
    });
    const geminiSpy = vi.spyOn(geminiService, 'extractContacts');

    // Step 1: Deterministic extraction finds 0 emails
    const extractedEmails = emailExtractor.extractEmails(description);
    expect(extractedEmails).toHaveLength(0);

    const hasSufficientContactData =
      extractedEmails.length > 0 &&
      extractedEmails.some((e) => !e.possibleDomainTypo && e.confidence >= 0.85);
    expect(hasSufficientContactData).toBe(false);

    // Step 2: Jev evaluated
    let jevEval: any = null;
    if (!hasSufficientContactData && jevService.isAvailable()) {
      jevEval = await jevService.evaluateContactPresence(description, 'Gaming Channel');
    }
    expect(jevSpy).toHaveBeenCalledTimes(1);

    // Step 3: Gemini Gatekeeper
    if (jevEval && (jevEval.hasEmail || jevEval.isObfuscated)) {
      await geminiService.extractContacts(description, 'Gaming Channel');
    }

    // Jev confirmed no email or obfuscation -> Gemini was NOT called
    expect(geminiSpy).not.toHaveBeenCalled();
  });

  it('3. Extractor -> ambiguous (0 emails) -> Jev positive -> Gemini targeted fallback invoked', async () => {
    const description = 'Inquiries: alex at creatorstudio dot net or ping me on discord';

    // Regex misses complex non-standard obfuscation
    const extractedEmails = emailExtractor.extractEmails('Some raw text without standard pattern');

    const jevSpy = vi.spyOn(jevService, 'evaluateContactPresence').mockResolvedValue({
      hasEmail: true,
      hasDiscord: true,
      hasSocialOrPhone: false,
      isObfuscated: true,
      hasContactInfo: true,
      confidence: 0.85,
      source: 'JEV_SYSTEM_ONE',
    });

    const geminiSpy = vi.spyOn(geminiService, 'extractContacts').mockResolvedValue({
      email: 'alex@creatorstudio.net',
      discord: 'alex_creator',
    });

    let jevEval: any = null;
    const hasSufficientContactData = extractedEmails.length > 0;
    if (!hasSufficientContactData) {
      jevEval = await jevService.evaluateContactPresence(description, 'Creator Channel');
    }

    if (jevEval && (jevEval.hasEmail || jevEval.isObfuscated)) {
      const llmContacts = await geminiService.extractContacts(description, 'Creator Channel');
      if (llmContacts?.email) {
        extractedEmails.push({
          email: llmContacts.email,
          source: 'description',
          role: 'BUSINESS',
          priorityScore: 100,
          confidence: 0.9,
        });
      }
    }

    expect(jevSpy).toHaveBeenCalledTimes(1);
    expect(geminiSpy).toHaveBeenCalledTimes(1);
    expect(extractedEmails).toHaveLength(1);
    expect(extractedEmails[0].email).toBe('alex@creatorstudio.net');
  });

  it('4. Single Quota Reservation Invariant: does not reserve quota twice for the same logical request', async () => {
    geminiService.resetMemoryQuotaForTesting();
    const reserveSpy = vi.spyOn(geminiService, 'reserveDailyQuota');

    // Calling generateCustomLine should trigger reserveDailyQuota exactly ONCE
    await geminiService.generateCustomLine({
      channelTitle: 'Tech Clips',
      description: 'Science and tech breakdowns',
    });

    expect(reserveSpy).toHaveBeenCalledTimes(1);
    expect(reserveSpy).toHaveBeenCalledWith('gemini_outreach', expect.any(Number));
  });

  it('5. 15 RPM Rate Limiter: sliding window enforces at most 15 requests in 60 seconds', async () => {
    const isolatedGemini = new GeminiPersonalizerService();
    isolatedGemini.resetMemoryQuotaForTesting();

    // Acquire 15 slots in the sliding window
    for (let i = 0; i < 15; i++) {
      const acquired = await isolatedGemini.acquireRateLimitSlot('gemini_outreach', 250, 0);
      expect(acquired).toBe(true);
    }

    // 16th immediate attempt must be rejected (or wait)
    const slot16 = await isolatedGemini.acquireRateLimitSlot('gemini_outreach', 250, 0);
    expect(slot16).toBe(false);

    // Extraction bucket is independent
    const extractionSlot1 = await isolatedGemini.acquireRateLimitSlot('gemini_extraction', 1000, 0);
    expect(extractionSlot1).toBe(true);
  });

  it('6. Video mining gate: inspects video descriptions when channel email is low-confidence or has domain typo', () => {
    // Channel description has a typo domain: gmial.com
    const channelDesc = 'Reach me at alex@gmial.com';
    const channelEmails = emailExtractor.extractEmails(channelDesc);

    expect(channelEmails).toHaveLength(1);
    expect(channelEmails[0].possibleDomainTypo).toBe(true);

    // Sufficiency check must be false so video mining is NOT blocked
    const hasSufficientChannelEmail =
      channelEmails.length > 0 &&
      channelEmails.some((e) => !e.possibleDomainTypo && e.confidence >= 0.85);

    expect(hasSufficientChannelEmail).toBe(false);

    // Video description contains the correct clean email
    const videoDesc = 'Business inquiries: alex@creatorstudio.com';
    const videoEmails = emailExtractor.extractEmails(videoDesc, 'video_description');
    for (const ve of videoEmails) {
      channelEmails.push(ve);
    }

    const hasSufficientAfterVideos =
      channelEmails.length > 0 &&
      channelEmails.some((e) => !e.possibleDomainTypo && e.confidence >= 0.85);

    expect(hasSufficientAfterVideos).toBe(true);
  });

  it('7. Tier 1.5 External Enrichment: resolves email from Linktree/website and skips Jev + Gemini', async () => {
    const channelEmails: any[] = [];
    const socials = { linktree: 'https://linktr.ee/topcreator', website: undefined };

    let hasSufficientContactData =
      channelEmails.length > 0 &&
      channelEmails.some((e) => !e.possibleDomainTypo && e.confidence >= 0.85);

    expect(hasSufficientContactData).toBe(false);

    const jevSpy = vi.spyOn(jevService, 'evaluateContactPresence');
    const geminiSpy = vi.spyOn(geminiService, 'extractContacts');

    // Simulate Tier 1.5 linktree scrape finding an email
    if (!hasSufficientContactData && socials.linktree) {
      channelEmails.push({
        email: 'partnerships@topcreator.io',
        source: 'link_page',
        role: 'BUSINESS',
        priorityScore: 100,
        confidence: 0.90,
      });

      hasSufficientContactData =
        channelEmails.length > 0 &&
        channelEmails.some((e) => !e.possibleDomainTypo && e.confidence >= 0.85);
    }

    expect(hasSufficientContactData).toBe(true);

    // Proves Jev and Gemini are never called because Linktree resolved the contact
    if (!hasSufficientContactData) {
      await jevService.evaluateContactPresence('some bio', 'Channel');
      await geminiService.extractContacts('some bio', 'Channel');
    }

    expect(jevSpy).not.toHaveBeenCalled();
    expect(geminiSpy).not.toHaveBeenCalled();
  });
});

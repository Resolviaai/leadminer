import { ExtractedEmail, EmailRole, EmailCategory, emailExtractor, classifyEmailRole, categorizeEmail } from './email.extractor';
import { ExtractedSocials, ExtractedContactItem, ContactItemType } from './social.extractor';

export interface ResolvedContactResult {
  primaryEmail: ExtractedEmail | null;
  secondaryEmails: ExtractedEmail[];
  allEmails: ExtractedEmail[];
  socials: ExtractedSocials;
  isSufficient: boolean;
  sufficiencyReason: string;
}

export type ExtractionAction = 'STOP' | 'CHECK_VIDEOS' | 'CRAWL_EXTERNAL' | 'CALL_JEV' | 'CALL_GEMINI';

export interface ExtractionState {
  hasSufficientEmail: boolean;
  videoMiningAttempted: boolean;
  hasUploadsPlaylist: boolean;
  externalCrawlAttempted: boolean;
  hasExternalTarget: boolean;
  jevAttempted: boolean;
  jevConfirmedContact: boolean;
  geminiAttempted: boolean;
}

export class ContactResolutionEngine {
  private static ROLE_PRIORITY: Record<EmailRole, number> = {
    BUSINESS: 100,
    MANAGEMENT: 95,
    DIRECT: 85,
    SALES: 75,
    GENERIC: 50,
    PRESS: 40,
    SUPPORT: 15,
    CAREERS: 10,
    LEGAL: 5,
  };

  /**
   * Evaluates whether the currently discovered emails meet the sufficiency threshold
   * for outreach without expending additional network or AI tokens.
   */
  public evaluateSufficiency(emails: ExtractedEmail[]): { isSufficient: boolean; reason: string } {
    if (!emails || emails.length === 0) {
      return { isSufficient: false, reason: 'NO_EMAILS_FOUND' };
    }

    // High confidence, non-typo email with commercial or creator priority (score >= 70 or role in BUSINESS/MANAGEMENT/DIRECT/SALES)
    const topCleanCandidate = emails.find(
      (e) => !e.possibleDomainTypo && e.confidence >= 0.85 && (e.priorityScore >= 70 || ['BUSINESS', 'MANAGEMENT', 'DIRECT', 'SALES'].includes(e.role))
    );

    if (topCleanCandidate) {
      return {
        isSufficient: true,
        reason: `HIGH_CONFIDENCE_${topCleanCandidate.role}`,
      };
    }

    // If there's an email but it's low confidence or generic/support only
    const hasAnyClean = emails.some((e) => !e.possibleDomainTypo && e.confidence >= 0.7);
    if (hasAnyClean) {
      return {
        isSufficient: false,
        reason: 'GENERIC_OR_LOW_PRIORITY_INBOX_ONLY',
      };
    }

    return {
      isSufficient: false,
      reason: 'POSSIBLE_TYPO_OR_LOW_CONFIDENCE',
    };
  }

  /**
   * Deterministic Decision Router: Determines the next extraction action
   * strictly adhering to the Architecture B hierarchy:
   * Channel Desc -> Video Mining -> Budgeted External Crawl -> Jev (0-email only) -> Gemini (Obfuscated only) -> Stop
   */
  public getNextAction(state: ExtractionState): ExtractionAction {
    if (state.hasSufficientEmail) {
      return 'STOP';
    }

    if (!state.videoMiningAttempted && state.hasUploadsPlaylist) {
      return 'CHECK_VIDEOS';
    }

    if (!state.externalCrawlAttempted && state.hasExternalTarget) {
      return 'CRAWL_EXTERNAL';
    }

    if (!state.jevAttempted) {
      return 'CALL_JEV';
    }

    if (state.jevConfirmedContact && !state.geminiAttempted) {
      return 'CALL_GEMINI';
    }

    return 'STOP';
  }

  /**
   * Combines, de-duplicates, classifies, and ranks candidate emails from multiple sources.
   * Ensures the single most actionable commercial address is selected as primary,
   * while all secondary addresses and provenance are preserved.
   */
  public resolveEmails(
    candidateEmails: (ExtractedEmail | { email: string; source?: string; contextSnippet?: string; category?: EmailCategory })[]
  ): {
    primaryEmail: ExtractedEmail | null;
    secondaryEmails: ExtractedEmail[];
    allEmails: ExtractedEmail[];
  } {
    const emailMap = new Map<string, ExtractedEmail>();

    for (const raw of candidateEmails) {
      if (!raw || !raw.email) continue;
      const cleanEmail = raw.email.toLowerCase().trim();
      if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) continue;

      const domain = cleanEmail.split('@')[1];
      const blockedDomains = ['youtube.com', 'google.com', 'example.com', 'sentry.io', 'wixpress.com'];
      if (blockedDomains.includes(domain)) continue;

      const existing = emailMap.get(cleanEmail);

      let resolvedObj: ExtractedEmail;
      if ('role' in raw && 'priorityScore' in raw && 'confidence' in raw) {
        resolvedObj = { ...(raw as ExtractedEmail), email: cleanEmail };
      } else {
        const { role, priorityScore } = classifyEmailRole(cleanEmail, raw.contextSnippet);
        const category = raw.category || categorizeEmail(cleanEmail);
        resolvedObj = {
          email: cleanEmail,
          source: (raw.source as any) || 'description',
          role,
          priorityScore,
          category,
          confidence: 0.90,
          contextSnippet: raw.contextSnippet,
        };
      }

      if (!existing) {
        emailMap.set(cleanEmail, resolvedObj);
      } else {
        // Merge attributes, keeping highest confidence and priority
        const highestConfidence = Math.max(existing.confidence, resolvedObj.confidence);
        const highestScore = Math.max(existing.priorityScore, resolvedObj.priorityScore);
        const bestRole =
          ContactResolutionEngine.ROLE_PRIORITY[resolvedObj.role] > ContactResolutionEngine.ROLE_PRIORITY[existing.role]
            ? resolvedObj.role
            : existing.role;

        emailMap.set(cleanEmail, {
          ...existing,
          confidence: highestConfidence,
          priorityScore: highestScore,
          role: bestRole,
          category: resolvedObj.category || existing.category,
          contextSnippet: existing.contextSnippet || resolvedObj.contextSnippet,
          possibleDomainTypo: existing.possibleDomainTypo && resolvedObj.possibleDomainTypo,
          wasRepaired: existing.wasRepaired || resolvedObj.wasRepaired,
          repairedFrom: existing.repairedFrom || resolvedObj.repairedFrom,
          repairCode: existing.repairCode || resolvedObj.repairCode,
          rawContextSnippet: existing.rawContextSnippet || resolvedObj.rawContextSnippet,
        });
      }
    }

    const allEmails = Array.from(emailMap.values());

    // Rank emails:
    // 1. Non-typo first
    // 2. priorityScore descending
    // 3. confidence descending
    allEmails.sort((a, b) => {
      if (a.possibleDomainTypo !== b.possibleDomainTypo) {
        return a.possibleDomainTypo ? 1 : -1;
      }
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return b.confidence - a.confidence;
    });

    const primaryEmail = allEmails.length > 0 ? allEmails[0] : null;
    const secondaryEmails = allEmails.slice(1);

    return {
      primaryEmail,
      secondaryEmails,
      allEmails,
    };
  }

  /**
   * Consolidates social links and contact items across sources without losing items.
   */
  public consolidateSocials(sources: ExtractedSocials[]): ExtractedSocials {
    const result: ExtractedSocials = {
      items: [],
    };
    const seenItems = new Set<string>();

    for (const s of sources) {
      if (!s) continue;
      if (!result.website && s.website) result.website = s.website;
      if (!result.instagram && s.instagram) result.instagram = s.instagram;
      if (!result.twitter && s.twitter) result.twitter = s.twitter;
      if (!result.discord && s.discord) result.discord = s.discord;
      if (!result.tiktok && s.tiktok) result.tiktok = s.tiktok;
      if (!result.linkedin && s.linkedin) result.linkedin = s.linkedin;
      if (!result.linktree && s.linktree) result.linktree = s.linktree;
      if (!result.beacons && s.beacons) result.beacons = s.beacons;
      if (!result.phone && s.phone) result.phone = s.phone;
      if (!result.whatsapp && s.whatsapp) result.whatsapp = s.whatsapp;

      if (s.items && Array.isArray(s.items)) {
        for (const item of s.items) {
          const key = `${item.type}:${item.normalizedValue.toLowerCase()}`;
          if (!seenItems.has(key)) {
            seenItems.add(key);
            result.items.push(item);
          }
        }
      }
    }

    return result;
  }
}

export const contactResolutionEngine = new ContactResolutionEngine();

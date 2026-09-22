import { env } from '../../config/env';
import { isTier1Country } from '../../config/countries';

export interface QualificationCriteria {
  minSubscribers?: number;
  maxSubscribers?: number;
  requireEmail?: boolean;
  requireValidEmail?: boolean;
  requireWebsite?: boolean;
  categoryWhitelist?: string[];
  targetCountry?: string;
}

export type LeadQualificationCriteria = QualificationCriteria;

export interface QualificationCandidate {
  subscriberCount: number;
  email?: string | null;
  emailStatus?: string | null;
  website?: string | null;
  category?: string | null;
  country?: string | null;
  isSuppressed?: boolean;
  alreadyContacted?: boolean;
}

export type LeadCandidate = QualificationCandidate;

export interface QualificationResult {
  qualified: boolean;
  reason: string;
}

/** Aggregate contact-level results without allowing a later invalid contact
 * to downgrade a lead that has another deliverable contact. */
export function aggregateQualificationStatus(
  results: QualificationResult[]
): 'QUALIFIED' | 'DISQUALIFIED' {
  return results.some((result) => result.qualified) ? 'QUALIFIED' : 'DISQUALIFIED';
}

export class LeadQualificationService {
  public qualify(candidate: QualificationCandidate, criteria: QualificationCriteria): QualificationResult {
    // 1. Suppression check
    if (candidate.isSuppressed) {
      return { qualified: false, reason: 'Lead is in suppression/unsubscribe list' };
    }

    // 2. Prior outreach check
    if (candidate.alreadyContacted) {
      return { qualified: false, reason: 'Lead was already contacted previously' };
    }

    // 3. Email requirement check
    if (criteria.requireEmail && !candidate.email) {
      return { qualified: false, reason: 'Lead does not have a discovered email address' };
    }

    // 4. Email validity check
    // Strictly require MAILBOX_VERIFIED (or VALID) by default.
    // DOMAIN_VALID is only treated as deliverable if explicitly configured via ALLOW_DOMAIN_VALID_OUTREACH.
    const isDeliverable = candidate.emailStatus === 'MAILBOX_VERIFIED' ||
                          candidate.emailStatus === 'VALID' ||
                          (Boolean(env.ALLOW_DOMAIN_VALID_OUTREACH) && candidate.emailStatus === 'DOMAIN_VALID');
    if (criteria.requireValidEmail && !isDeliverable) {
      return { qualified: false, reason: `Email is not verified as deliverable (current status: ${candidate.emailStatus || 'UNKNOWN'})` };
    }

    // 5. Subscriber count bounds
    if (criteria.minSubscribers !== undefined && candidate.subscriberCount < criteria.minSubscribers) {
      return { qualified: false, reason: `Subscriber count (${candidate.subscriberCount}) below minimum threshold (${criteria.minSubscribers})` };
    }

    if (criteria.maxSubscribers !== undefined && candidate.subscriberCount > criteria.maxSubscribers) {
      return { qualified: false, reason: `Subscriber count (${candidate.subscriberCount}) exceeds maximum threshold (${criteria.maxSubscribers})` };
    }

    // 6. Category match
    if (criteria.categoryWhitelist && criteria.categoryWhitelist.length > 0) {
      if (!candidate.category || !criteria.categoryWhitelist.includes(candidate.category)) {
        return { qualified: false, reason: `Category '${candidate.category || 'unknown'}' not in campaign target list` };
      }
    }

    // 7. Country match check
    if (criteria.targetCountry && candidate.country) {
      const target = criteria.targetCountry.toUpperCase();
      if (target === 'TIER_1' || target === 'TIER1') {
        if (!isTier1Country(candidate.country)) {
          return {
            qualified: false,
            reason: `Channel country (${candidate.country}) is not in Tier 1 target countries`,
          };
        }
      } else if (target !== 'ALL') {
        if (candidate.country.toUpperCase() !== target) {
          return {
            qualified: false,
            reason: `Channel country (${candidate.country}) does not match target (${criteria.targetCountry})`,
          };
        }
      }
    }

    return { qualified: true, reason: 'Lead satisfies all campaign qualification criteria' };
  }
}

export const leadQualificationService = new LeadQualificationService();

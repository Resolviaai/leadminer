export interface QualificationCriteria {
  minSubscribers?: number;
  maxSubscribers?: number;
  requireEmail?: boolean;
  requireValidEmail?: boolean;
  requireWebsite?: boolean;
  categoryWhitelist?: string[];
}

export interface QualificationCandidate {
  subscriberCount: number;
  email?: string | null;
  emailStatus?: string | null;
  website?: string | null;
  category?: string | null;
  isSuppressed?: boolean;
  alreadyContacted?: boolean;
}

export interface QualificationResult {
  qualified: boolean;
  reason: string;
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
    if (criteria.requireValidEmail && candidate.emailStatus !== 'VALID') {
      return { qualified: false, reason: `Email is not verified as VALID (current status: ${candidate.emailStatus || 'UNKNOWN'})` };
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

    return { qualified: true, reason: 'Lead satisfies all campaign qualification criteria' };
  }
}

export const leadQualificationService = new LeadQualificationService();

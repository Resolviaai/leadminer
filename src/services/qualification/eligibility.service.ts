import { env } from '../../config/env';
import { isTier1Country } from '../../config/countries';

export interface ContactCandidate {
  contactId: number;
  leadId: number;
  email: string | null;
  emailStatus: string | null;
  verificationReason?: string | null;
  confidenceScore?: number | null;
  isPrimary?: boolean;
  emailCategory?: string | null;
  isRoleBased?: boolean;
  isCommercialRole?: boolean;
  domain?: string;
  mxProvider?: string;
  domainBounces?: number;

  // Lead-level attributes
  channelTitle?: string | null;
  subscriberCount?: number;
  category?: string | null;
  country?: string | null;
  isSuppressed?: boolean;
  alreadyContactedLead?: boolean;
  alreadyContactedContact?: boolean;
  outreachStatus?: string | null;
}

export interface EligibilityPolicy {
  // Verification & deliverability thresholds (modular & calibratable)
  minConfidenceScore?: number;
  allowDomainValid?: boolean;
  allowCommercialRoleBased?: boolean;
  allowGenericRoleBased?: boolean;
  allowCatchAll?: boolean;
  maxDomainBounces?: number;

  // Lead-level criteria
  requireEmail?: boolean;
  requireValidEmail?: boolean;
  minSubscribers?: number;
  maxSubscribers?: number;
  categoryWhitelist?: string[];
  targetCountry?: string;
}

export type EligibilityDecision =
  | 'HARD_NEGATIVE'   // Irrevocably undeliverable, suppressed, or invalid -> NEVER SEND
  | 'POLICY_EXCLUDED'  // Uncertain or viable, but filtered out by current campaign policy
  | 'ELIGIBLE';        // Safe under current policy -> Ready for Priority Ranking

export interface EligibilityResult {
  eligible: boolean;
  decision: EligibilityDecision;
  reason: string;
  confidenceScore: number;
  evidence: {
    isDeliverableStatus: boolean;
    mxProvider?: string;
    isRoleBased: boolean;
    isCommercialRole: boolean;
    isCatchAll: boolean;
    domainBounces: number;
  };
}

export const DEFAULT_ELIGIBILITY_POLICY: EligibilityPolicy = {
  minConfidenceScore: 0.50,
  allowDomainValid: true,
  allowCommercialRoleBased: true,
  allowGenericRoleBased: false,
  allowCatchAll: false,
  maxDomainBounces: 2,
  requireEmail: true,
  requireValidEmail: true,
};

export class OutreachEligibilityEngine {
  /**
   * Evaluate a contact strictly through the deliverability hierarchy:
   * 1. HARD NEGATIVE -> never send
   * 2. UNCERTAIN -> campaign policy decides
   * 3. ELIGIBLE -> passed for priority ranking
   *
   * Crucial principle: Priority NEVER overrides deliverability policy.
   */
  public evaluate(
    candidate: ContactCandidate,
    policyOverride: Partial<EligibilityPolicy> = {}
  ): EligibilityResult {
    const policy: EligibilityPolicy = {
      ...DEFAULT_ELIGIBILITY_POLICY,
      allowDomainValid:
        policyOverride.allowDomainValid !== undefined
          ? policyOverride.allowDomainValid
          : Boolean(env.ALLOW_DOMAIN_VALID_OUTREACH),
      ...policyOverride,
    };

    const confidence = candidate.confidenceScore !== null && candidate.confidenceScore !== undefined
      ? Number(candidate.confidenceScore)
      : candidate.emailStatus === 'MAILBOX_VERIFIED' || candidate.emailStatus === 'VALID'
        ? 0.90
        : candidate.emailStatus === 'DOMAIN_VALID'
          ? 0.70
          : 0.0;

    const evidence = {
      isDeliverableStatus:
        candidate.emailStatus === 'MAILBOX_VERIFIED' ||
        candidate.emailStatus === 'VALID' ||
        candidate.emailStatus === 'DOMAIN_VALID',
      mxProvider: candidate.mxProvider,
      isRoleBased: Boolean(candidate.isRoleBased),
      isCommercialRole: Boolean(candidate.isCommercialRole),
      isCatchAll: false,
      domainBounces: candidate.domainBounces || 0,
    };

    // ─────────────────────────────────────────────────────────────
    // LAYER 1: HARD NEGATIVES (Absolute block: NEVER SEND)
    // ─────────────────────────────────────────────────────────────

    // 1. Suppression / Unsubscribe
    if (candidate.isSuppressed) {
      return {
        eligible: false,
        decision: 'HARD_NEGATIVE',
        reason: 'Lead or contact is on suppression/unsubscribe list',
        confidenceScore: 0.0,
        evidence,
      };
    }

    // 2. Lead-level outreach status lock (already contacted, replied, bounced)
    const deadStatuses = ['CONTACTED', 'REPLIED', 'UNSUBSCRIBED', 'BOUNCED'];
    if (candidate.outreachStatus && deadStatuses.includes(candidate.outreachStatus.toUpperCase())) {
      return {
        eligible: false,
        decision: 'HARD_NEGATIVE',
        reason: `Lead is already in terminal/contacted status: ${candidate.outreachStatus}`,
        confidenceScore: confidence,
        evidence,
      };
    }

    if (candidate.alreadyContactedLead) {
      return {
        eligible: false,
        decision: 'HARD_NEGATIVE',
        reason: 'Lead was already contacted previously',
        confidenceScore: confidence,
        evidence,
      };
    }

    // 3. Contact-level already contacted check
    if (candidate.alreadyContactedContact) {
      return {
        eligible: false,
        decision: 'HARD_NEGATIVE',
        reason: 'Contact was already sent a message in this campaign',
        confidenceScore: confidence,
        evidence,
      };
    }

    // 4. Missing email address
    if (!candidate.email || candidate.email.trim() === '') {
      return {
        eligible: false,
        decision: 'HARD_NEGATIVE',
        reason: 'Contact does not have an email address',
        confidenceScore: 0.0,
        evidence,
      };
    }

    // 5. Hard deliverability failure statuses
    const status = (candidate.emailStatus || 'UNKNOWN').toUpperCase();
    if (status === 'INVALID') {
      return {
        eligible: false,
        decision: 'HARD_NEGATIVE',
        reason: `Email is classified as INVALID (${candidate.verificationReason || 'Syntax or MX failure'})`,
        confidenceScore: 0.0,
        evidence,
      };
    }

    if (status === 'DISPOSABLE') {
      return {
        eligible: false,
        decision: 'HARD_NEGATIVE',
        reason: 'Email domain is a known temporary/disposable provider',
        confidenceScore: 0.0,
        evidence,
      };
    }

    // 6. Hard-bounce domain history safety gate
    const maxBounces = policy.maxDomainBounces ?? 2;
    if (evidence.domainBounces >= maxBounces) {
      return {
        eligible: false,
        decision: 'HARD_NEGATIVE',
        reason: `Domain has excessive bounce history (${evidence.domainBounces} bounces >= ${maxBounces} threshold)`,
        confidenceScore: 0.0,
        evidence,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // LAYER 2: UNCERTAIN & POLICY-BASED EVALUATION
    // ─────────────────────────────────────────────────────────────

    // Unverified / Failed status
    if (status === 'UNKNOWN' || status === 'FAILED') {
      return {
        eligible: false,
        decision: 'POLICY_EXCLUDED',
        reason: `Email verification pending or transiently unverified (${status})`,
        confidenceScore: 0.0,
        evidence,
      };
    }

    // Require valid email check
    const isDeliverable =
      status === 'MAILBOX_VERIFIED' ||
      status === 'VALID' ||
      (policy.allowDomainValid && status === 'DOMAIN_VALID');

    if (policy.requireValidEmail && !isDeliverable) {
      return {
        eligible: false,
        decision: 'POLICY_EXCLUDED',
        reason: `Email status '${status}' not permitted under current deliverability policy`,
        confidenceScore: confidence,
        evidence,
      };
    }

    // Policy confidence threshold
    const minConf = policy.minConfidenceScore ?? 0.50;
    if (confidence < minConf) {
      return {
        eligible: false,
        decision: 'POLICY_EXCLUDED',
        reason: `Verification confidence (${confidence.toFixed(2)}) is below policy threshold (${minConf.toFixed(2)})`,
        confidenceScore: confidence,
        evidence,
      };
    }

    // Generic role-based check
    if (evidence.isRoleBased && !evidence.isCommercialRole && !policy.allowGenericRoleBased) {
      return {
        eligible: false,
        decision: 'POLICY_EXCLUDED',
        reason: 'Generic role-based address (info/support/admin) excluded by policy',
        confidenceScore: confidence,
        evidence,
      };
    }

    // Lead-level criteria checks
    const subCount = candidate.subscriberCount ?? 0;
    if (policy.minSubscribers !== undefined && subCount < policy.minSubscribers) {
      return {
        eligible: false,
        decision: 'POLICY_EXCLUDED',
        reason: `Subscriber count (${subCount}) below minimum threshold (${policy.minSubscribers})`,
        confidenceScore: confidence,
        evidence,
      };
    }

    if (policy.maxSubscribers !== undefined && subCount > policy.maxSubscribers) {
      return {
        eligible: false,
        decision: 'POLICY_EXCLUDED',
        reason: `Subscriber count (${subCount}) exceeds maximum threshold (${policy.maxSubscribers})`,
        confidenceScore: confidence,
        evidence,
      };
    }

    if (policy.categoryWhitelist && policy.categoryWhitelist.length > 0) {
      if (!candidate.category || !policy.categoryWhitelist.includes(candidate.category)) {
        return {
          eligible: false,
          decision: 'POLICY_EXCLUDED',
          reason: `Category '${candidate.category || 'unknown'}' not in campaign target list`,
          confidenceScore: confidence,
          evidence,
        };
      }
    }

    if (policy.targetCountry && policy.targetCountry.toUpperCase() !== 'ALL') {
      const target = policy.targetCountry.toUpperCase();
      if (!candidate.country) {
        return {
          eligible: false,
          decision: 'POLICY_EXCLUDED',
          reason: `Channel country unspecified, campaign requires '${policy.targetCountry}'`,
          confidenceScore: confidence,
          evidence,
        };
      }

      if (target === 'TIER_1' || target === 'TIER1') {
        if (!isTier1Country(candidate.country)) {
          return {
            eligible: false,
            decision: 'POLICY_EXCLUDED',
            reason: `Channel country (${candidate.country}) is not Tier 1`,
            confidenceScore: confidence,
            evidence,
          };
        }
      } else if (candidate.country.toUpperCase() !== target) {
        return {
          eligible: false,
          decision: 'POLICY_EXCLUDED',
          reason: `Channel country (${candidate.country}) does not match target (${policy.targetCountry})`,
          confidenceScore: confidence,
          evidence,
        };
      }
    }

    // ─────────────────────────────────────────────────────────────
    // LAYER 3: ELIGIBLE
    // ─────────────────────────────────────────────────────────────
    return {
      eligible: true,
      decision: 'ELIGIBLE',
      reason: 'Passed deliverability and campaign policy checks',
      confidenceScore: confidence,
      evidence,
    };
  }
}

export const outreachEligibilityEngine = new OutreachEligibilityEngine();

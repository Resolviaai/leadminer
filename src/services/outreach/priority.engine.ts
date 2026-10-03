export type OpportunityTier = 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6';

export const TIER_ORDER: Record<OpportunityTier, number> = {
  A1: 1,
  A2: 2,
  A3: 3,
  A4: 4,
  A5: 5,
  A6: 6,
};

export interface PriorityCandidate {
  contactId: number;
  leadId: number;
  email: string;
  isPrimary: boolean;
  emailCategory?: string | null;
  source?: string | null;
  confidenceScore: number;
  mxProvider?: string | null;
  isCommercialRole?: boolean;
  isRoleBased?: boolean;

  // Lead Context
  subscriberCount?: number;
  discoveredAt?: Date | string | null;
  category?: string | null;
  country?: string | null;

  // History & Interaction signals
  attemptCount?: number;
  previousCampaignReplies?: number;
  hasActiveSiblingContact?: boolean;
  isSecondaryContact?: boolean;

  // Verification & Provenance Signals
  emailStatus?: string | null;
  verificationReasonCode?: string | null;
  wasRepaired?: boolean;
  repairedFrom?: string | null;
  repairCode?: string | null;
}

export interface FactorBreakdown {
  rawScore: number;     // 0 to 100
  weight: number;       // percentage, e.g. 0.30
  weightedScore: number; // rawScore * weight
  reason: string;
}

export interface PriorityEvaluation {
  contactId: number;
  leadId: number;
  email: string;
  opportunityTier: OpportunityTier;
  tierReason: string;
  priorityScore: number; // 0 to 100 integer
  factors: {
    verification: FactorBreakdown;
    role: FactorBreakdown;
    source: FactorBreakdown;
    leadQuality: FactorBreakdown;
    engagement: FactorBreakdown;
    penalties: { name: string; deduction: number; reason: string }[];
  };
  explanation: string;
}

export interface PriorityEngineConfig {
  verificationWeight: number; // e.g. 0.30
  roleWeight: number;         // e.g. 0.25
  sourceWeight: number;       // e.g. 0.15
  leadQualityWeight: number;  // e.g. 0.20
  engagementWeight: number;   // e.g. 0.10
}

export const DEFAULT_PRIORITY_CONFIG: PriorityEngineConfig = {
  verificationWeight: 0.30,
  roleWeight: 0.25,
  sourceWeight: 0.15,
  leadQualityWeight: 0.20,
  engagementWeight: 0.10,
};

export class OpportunityPriorityEngine {
  private config: PriorityEngineConfig;

  constructor(config: Partial<PriorityEngineConfig> = {}) {
    this.config = { ...DEFAULT_PRIORITY_CONFIG, ...config };
  }

  /**
   * Update weights dynamically (e.g. from campaign config or historical calibration)
   */
  public calibrateWeights(newWeights: Partial<PriorityEngineConfig>): void {
    this.config = { ...this.config, ...newWeights };
  }

  /**
   * Derives the 6-level gradient opportunity tier from total evidence:
   * A1 = Top-tier opportunity (send first)
   * A2 = Strong opportunity (send when A1 insufficient)
   * A3 = Good usable opportunity (send when A1+A2 insufficient)
   * A4 = Acceptable fallback opportunity (send when A1-A3 insufficient; still sendable!)
   * A5 = Highly uncertain / reserve (preserved for future verification, normally not bulk-sent)
   * A6 = Hard-negative boundary (definitively bad, do not send)
   */
  public deriveOpportunityTier(
    candidate: PriorityCandidate,
    score: number
  ): { tier: OpportunityTier; reason: string } {
    // 1. Hard-negative boundary (A6)
    // ONLY assign A6 for confirmed hard negatives (invalid syntax, disposable, no mail records/NXDOMAIN, null MX, hard bounce, suppression).
    // DNS timeouts or unresolved candidates with attempts >= 3 are NOT hard negatives; they fall into A5 (reserve).
    const HARD_NEGATIVE_CODES = new Set([
      'SYNTAX_INVALID',
      'DISPOSABLE_DOMAIN',
      'NO_MAIL_RECORDS',
      'DOMAIN_NOT_FOUND',
      'NULL_MX_REFUSES_MAIL',
      'HARD_BOUNCE',
      'SUPPRESSED',
      'UNSUBSCRIBED',
    ]);

    const isHardNegative =
      candidate.emailStatus === 'INVALID' ||
      (candidate.verificationReasonCode && HARD_NEGATIVE_CODES.has(candidate.verificationReasonCode));

    if (isHardNegative) {
      return {
        tier: 'A6',
        reason: `Definitive hard-negative verification: ${candidate.verificationReasonCode || candidate.emailStatus || 'INVALID'}`,
      };
    }

    // 2. Highly uncertain / reserve (A5)
    // Preserved for re-verification; not normally sent in bulk while A1-A4 exist
    if (candidate.confidenceScore < 0.35) {
      return {
        tier: 'A5',
        reason: 'Low verification confidence / unverified reserve (preserved for future enrichment)',
      };
    }

    // 3. Sendable Gradient (A1 - A4)
    // Note: Repaired emails stack two uncertainties (regex guess + unconfirmed mailbox).
    // They are capped at Tier A4 so literal creator emails (A1-A3) are dispatched first.
    let derivedTier: OpportunityTier = 'A4';
    let derivedReason = 'Acceptable fallback opportunity: weaker evidence/relevance, but no negative flags';

    if (candidate.confidenceScore >= 0.85 && score >= 75) {
      derivedTier = 'A1';
      derivedReason = 'Top opportunity: strong verification evidence + high contact relevance';
    } else if (candidate.confidenceScore >= 0.65 && score >= 60) {
      derivedTier = 'A2';
      derivedReason = 'Strong opportunity: verified or major provider infrastructure with good relevance';
    } else if (candidate.confidenceScore >= 0.50 && score >= 45) {
      derivedTier = 'A3';
      derivedReason = 'Good usable opportunity: valid domain with acceptable relevance';
    }

    // Cap repaired candidates at A4
    if (candidate.wasRepaired && (derivedTier === 'A1' || derivedTier === 'A2' || derivedTier === 'A3')) {
      return {
        tier: 'A4',
        reason: `Repaired typo domain candidate (repaired from "${candidate.repairedFrom || 'unknown'}"): capped at Tier A4 pending verified mailbox delivery`,
      };
    }

    return {
      tier: derivedTier,
      reason: derivedReason,
    };
  }

  /**
   * Calculates an explainable, modular composite priority score and assigns the Opportunity Tier.
   */
  public scoreCandidate(candidate: PriorityCandidate): PriorityEvaluation {
    // 1. Verification Evidence Factor (0 - 100)
    let verRaw = Math.min(100, Math.max(0, Math.round(candidate.confidenceScore * 100)));
    let verReason = `Confidence score ${candidate.confidenceScore.toFixed(2)}`;

    if (candidate.mxProvider === 'GOOGLE_WORKSPACE' || candidate.mxProvider === 'MICROSOFT_365') {
      verRaw = Math.min(100, verRaw + 5);
      verReason += ` with premium enterprise MX (${candidate.mxProvider})`;
    } else if (candidate.mxProvider === 'CONSUMER_GMAIL' || candidate.mxProvider === 'CONSUMER_OUTLOOK') {
      verReason += ` on major consumer infrastructure (${candidate.mxProvider})`;
    }

    const verification: FactorBreakdown = {
      rawScore: verRaw,
      weight: this.config.verificationWeight,
      weightedScore: verRaw * this.config.verificationWeight,
      reason: verReason,
    };

    // 2. Role Relevance Factor (0 - 100)
    let roleRaw = 70;
    let roleReason = 'Standard contact address';

    if (candidate.isCommercialRole || candidate.emailCategory === 'BUSINESS' || candidate.emailCategory === 'SPONSOR') {
      roleRaw = 95;
      roleReason = 'High-intent commercial/business address';
    } else if (candidate.emailCategory === 'DIRECT') {
      roleRaw = 90;
      roleReason = 'Personal/direct creator address';
    } else if (candidate.isRoleBased && !candidate.isCommercialRole) {
      roleRaw = 45;
      roleReason = 'Generic role address (info/support)';
    } else if (candidate.isPrimary) {
      roleRaw = 80;
      roleReason = 'Primary resolved contact for creator';
    }

    const role: FactorBreakdown = {
      rawScore: roleRaw,
      weight: this.config.roleWeight,
      weightedScore: roleRaw * this.config.roleWeight,
      reason: roleReason,
    };

    // 3. Source Attribution Factor (0 - 100)
    let sourceRaw = 60;
    let sourceReason = 'Standard extraction source';
    const s = (candidate.source || '').toLowerCase();

    if (s.includes('about') || s.includes('youtube_about')) {
      sourceRaw = 100;
      sourceReason = 'Explicit channel About section business contact';
    } else if (s.includes('description') || s.includes('video')) {
      sourceRaw = 85;
      sourceReason = 'Extracted directly from recent video description';
    } else if (s.includes('website') || s.includes('external')) {
      sourceRaw = 75;
      sourceReason = 'Resolved from creator personal or agency website';
    } else if (s.includes('jev') || s.includes('gemini') || s.includes('ai')) {
      sourceRaw = 65;
      sourceReason = 'AI-assisted state extraction';
    }

    const source: FactorBreakdown = {
      rawScore: sourceRaw,
      weight: this.config.sourceWeight,
      weightedScore: sourceRaw * this.config.sourceWeight,
      reason: sourceReason,
    };

    // 4. Lead Quality & Creator Channel Fit (0 - 100)
    let leadRaw = 70;
    let leadReason = 'Standard creator profile';
    const subs = candidate.subscriberCount || 0;

    // Sweet spot curve for YouTube sponsorship outreach response rates
    if (subs >= 25000 && subs <= 250000) {
      leadRaw = 95;
      leadReason = `Prime engagement bracket (${(subs / 1000).toFixed(0)}k subs)`;
    } else if (subs > 250000 && subs <= 1000000) {
      leadRaw = 85;
      leadReason = `High-tier creator (${(subs / 1000).toFixed(0)}k subs)`;
    } else if (subs > 1000000) {
      leadRaw = 75;
      leadReason = `Mega creator (${(subs / 1000000).toFixed(1)}M subs, lower direct reply rate)`;
    } else if (subs >= 5000 && subs < 25000) {
      leadRaw = 80;
      leadReason = `Micro-creator (${(subs / 1000).toFixed(1)}k subs)`;
    }

    const leadQuality: FactorBreakdown = {
      rawScore: leadRaw,
      weight: this.config.leadQualityWeight,
      weightedScore: leadRaw * this.config.leadQualityWeight,
      reason: leadReason,
    };

    // 5. Engagement & Freshness Factor (0 - 100)
    let engRaw = 70;
    let engReason = 'Normal lead lifecycle';

    if (candidate.discoveredAt) {
      const ageDays = (Date.now() - new Date(candidate.discoveredAt).getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays <= 7) {
        engRaw = 95;
        engReason = 'Freshly discovered opportunity (< 7 days)';
      } else if (ageDays <= 30) {
        engRaw = 80;
        engReason = 'Active discovery window (7-30 days)';
      } else {
        engRaw = 60;
        engReason = 'Older discovered lead (> 30 days)';
      }
    }

    if (candidate.previousCampaignReplies && candidate.previousCampaignReplies > 0) {
      engRaw = Math.min(100, engRaw + 20);
      engReason += ' + Prior positive reply history';
    }

    const engagement: FactorBreakdown = {
      rawScore: engRaw,
      weight: this.config.engagementWeight,
      weightedScore: engRaw * this.config.engagementWeight,
      reason: engReason,
    };

    // 6. Explicit Deductions / Penalties
    const penalties: { name: string; deduction: number; reason: string }[] = [];

    // Prior send attempts
    if (candidate.attemptCount && candidate.attemptCount > 0) {
      const deduction = Math.min(30, candidate.attemptCount * 15);
      penalties.push({
        name: 'prior_attempts',
        deduction,
        reason: `Deducted ${deduction} points for ${candidate.attemptCount} prior attempt(s)`,
      });
    }

    // Multi-contact sibling staggering penalty (secondary contact on same lead)
    if (candidate.isSecondaryContact || candidate.hasActiveSiblingContact) {
      penalties.push({
        name: 'secondary_contact_stagger',
        deduction: 25,
        reason: 'Secondary contact on lead - staggered behind primary email',
      });
    }

    // Repaired typo domain candidate provisional deduction
    if (candidate.wasRepaired) {
      penalties.push({
        name: 'repaired_email_provisional',
        deduction: 10,
        reason: 'Typo-repaired domain pending verified mailbox delivery',
      });
    }

    // Compute composite score
    const baseWeightedSum =
      verification.weightedScore +
      role.weightedScore +
      source.weightedScore +
      leadQuality.weightedScore +
      engagement.weightedScore;

    const totalDeductions = penalties.reduce((sum, p) => sum + p.deduction, 0);
    const finalScore = Math.max(0, Math.min(100, Math.round(baseWeightedSum - totalDeductions)));

    // Derive Opportunity Tier (A1 - A6)
    const { tier, reason: tierReason } = this.deriveOpportunityTier(candidate, finalScore);

    const explanation = `[${tier}] Score ${finalScore}/100: [Ver: ${verification.rawScore} (${(verification.weight * 100).toFixed(0)}%) | Role: ${role.rawScore} (${(role.weight * 100).toFixed(0)}%) | Source: ${source.rawScore} (${(source.weight * 100).toFixed(0)}%) | Lead: ${leadQuality.rawScore} (${(leadQuality.weight * 100).toFixed(0)}%) | Eng: ${engagement.rawScore} (${(engagement.weight * 100).toFixed(0)}%)] - ${totalDeductions} pts deductions (${tierReason})`;

    return {
      contactId: candidate.contactId,
      leadId: candidate.leadId,
      email: candidate.email,
      opportunityTier: tier,
      tierReason,
      priorityScore: finalScore,
      factors: {
        verification,
        role,
        source,
        leadQuality,
        engagement,
        penalties,
      },
      explanation,
    };
  }

  /**
   * Sort candidates deterministically by Opportunity Tier (A1 -> A2 -> A3 -> A4 -> A5 -> A6),
   * then by priority score descending within the tier.
   */
  public rankCandidates(candidates: PriorityCandidate[]): PriorityEvaluation[] {
    const evaluated = candidates.map((cand) => this.scoreCandidate(cand));

    evaluated.sort((a, b) => {
      const tierDiff = TIER_ORDER[a.opportunityTier] - TIER_ORDER[b.opportunityTier];
      if (tierDiff !== 0) return tierDiff;
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return 0;
    });

    return evaluated;
  }
}

export const opportunityPriorityEngine = new OpportunityPriorityEngine();

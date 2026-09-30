export type VerificationStatus =
  | 'UNKNOWN'
  | 'VALID'
  | 'DOMAIN_VALID'
  | 'MAILBOX_VERIFIED'
  | 'INVALID'
  | 'RISKY'
  | 'DISPOSABLE'
  | 'FAILED';

export interface VerificationResult {
  email: string;
  status: VerificationStatus;
  confidenceScore: number; // 0.00 to 1.00 deterministic calibrated score
  reason?: string;
  reasonCode?: string;
  isRoleBased?: boolean;
  isCommercialRole?: boolean;
  isCatchAll?: boolean;
  mxProvider?: string;
  domain?: string;
  evidenceDetails?: Record<string, any>;
  provider: string;
  timestamp: Date;
}

export interface IEmailVerifier {
  readonly providerName: string;
  verify(email: string): Promise<VerificationResult>;
  verifyBatch(emails: string[], concurrency?: number): Promise<VerificationResult[]>;
}


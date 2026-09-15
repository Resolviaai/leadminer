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
  reason?: string;
  reasonCode?: string;
  isRoleBased?: boolean;
  provider: string;
  timestamp: Date;
}

export interface IEmailVerifier {
  readonly providerName: string;
  verify(email: string): Promise<VerificationResult>;
  verifyBatch(emails: string[], concurrency?: number): Promise<VerificationResult[]>;
}


export type VerificationStatus = 'UNKNOWN' | 'VALID' | 'INVALID' | 'RISKY' | 'DISPOSABLE' | 'FAILED';

export interface VerificationResult {
  email: string;
  status: VerificationStatus;
  reason?: string;
  provider: string;
  timestamp: Date;
}

export interface IEmailVerifier {
  readonly providerName: string;
  verify(email: string): Promise<VerificationResult>;
}

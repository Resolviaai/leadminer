import { env } from '../../config/env';
import { IEmailVerifier, VerificationResult } from './verifier.interface';
import { localVerifier } from './local.verifier';

export class EmailVerificationService {
  private verifier: IEmailVerifier;

  constructor(verifier?: IEmailVerifier) {
    if (verifier) {
      this.verifier = verifier;
    } else {
      // Default to LocalVerifier with DNS MX checks
      this.verifier = localVerifier;
    }
  }

  public setVerifier(verifier: IEmailVerifier): void {
    this.verifier = verifier;
  }

  public async verifyEmail(email: string): Promise<VerificationResult> {
    if (!email) {
      return {
        email: '',
        status: 'INVALID',
        reason: 'Empty email provided',
        provider: 'none',
        timestamp: new Date(),
      };
    }

    try {
      return await this.verifier.verify(email);
    } catch (error: any) {
      console.error(`Verification error for ${email} with provider ${this.verifier.providerName}:`, error);
      // Fallback to local verifier if external provider fails
      if (this.verifier !== localVerifier) {
        console.warn(`Falling back to local DNS verifier for ${email}...`);
        return await localVerifier.verify(email);
      }

      return {
        email,
        status: 'FAILED',
        reason: error.message || 'Unknown verification error',
        provider: this.verifier.providerName,
        timestamp: new Date(),
      };
    }
  }
}

export const emailVerificationService = new EmailVerificationService();

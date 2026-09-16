import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/config/env', () => ({
  env: {
    DRY_RUN: false,
    APP_URL: 'http://localhost:3000',
    ALLOW_DOMAIN_VALID_OUTREACH: true,
  },
}));

vi.mock('../../src/services/security/encryption.service', () => ({
  encryptionService: {
    decrypt: vi.fn((token: string) => token ? `decrypted_${token}` : null),
  },
}));

const mockMessagesSend = vi.fn();
const mockMessagesGet = vi.fn();
const mockGetProfile = vi.fn();

vi.mock('googleapis', () => {
  return {
    google: {
      auth: {
        OAuth2: vi.fn().mockImplementation(() => ({
          setCredentials: vi.fn(),
          on: vi.fn(),
        })),
      },
      gmail: vi.fn().mockImplementation(() => ({
        users: {
          getProfile: mockGetProfile,
          messages: {
            send: mockMessagesSend,
            get: mockMessagesGet,
          },
        },
      })),
    },
  };
});

// Mock database methods
const mockDbInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockReturnValue({
    onConflictDoNothing: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: 999 }]),
    }),
    returning: vi.fn().mockResolvedValue([{ id: 999 }]),
  }),
});

const mockDbUpdate = vi.fn().mockReturnValue({
  set: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue([]),
  }),
});

const mockDbSelect = vi.fn();

vi.mock('../../src/db/client', () => ({
  db: {
    select: () => mockDbSelect(),
    insert: () => mockDbInsert(),
    update: () => mockDbUpdate(),
  },
}));

import { gmailSendingService } from '../../src/services/outreach/gmail.service';
import { env } from '../../src/config/env';

describe('Gmail Safety & Edge-Case Protection Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (env as any).DRY_RUN = false;

    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
  });

  it('1. Kill Switch Guard: should halt immediately when kill switch is engaged', async () => {
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ value: { enabled: true } }]),
        }),
      }),
    });

    const result = await gmailSendingService.sendEmail({
      leadId: 1,
      campaignId: 1,
      recipientEmail: 'creator@channel.com',
      subject: 'Test Subject',
      body: 'Test Body',
      idempotencyKey: 'camp_1_lead_1',
    });

    expect(result.success).toBe(false);
    expect(result.skippedReason).toBe('KILL_SWITCH_ACTIVE');
    expect(mockMessagesSend).not.toHaveBeenCalled();
  });

  it('2. Suppression Guard: should block sending to unsubscribed recipients', async () => {
    let callCount = 0;
    mockDbSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return { limit: vi.fn().mockResolvedValue([]) };
          }
          return { limit: vi.fn().mockResolvedValue([{ email: 'suppressed@creator.com' }]) };
        }),
      }),
    }));

    const result = await gmailSendingService.sendEmail({
      leadId: 2,
      campaignId: 1,
      recipientEmail: 'suppressed@creator.com',
      subject: 'Outreach',
      body: 'Body',
      idempotencyKey: 'camp_1_lead_2',
    });

    expect(result.success).toBe(false);
    expect(result.skippedReason).toBe('RECIPIENT_SUPPRESSED');
    expect(mockMessagesSend).not.toHaveBeenCalled();
  });

  it('3. DRY_RUN Mode: should persist as SIMULATED, consume 0 quota, and never touch live Gmail API', async () => {
    (env as any).DRY_RUN = true;

    const reserveSpy = vi.spyOn(gmailSendingService, 'reserveSendingAccount');

    const result = await gmailSendingService.sendEmail({
      leadId: 3,
      campaignId: 1,
      recipientEmail: 'test@creator.com',
      subject: 'Test Pitch',
      body: 'Pitch body',
      idempotencyKey: 'camp_1_lead_3',
    });

    expect(result.success).toBe(true);
    expect(result.simulated).toBe(true);
    expect(result.messageId).toMatch(/^mock_msg_/);
    expect(reserveSpy).not.toHaveBeenCalled();
    expect(mockMessagesSend).not.toHaveBeenCalled();

    reserveSpy.mockRestore();
  });

  it('4. Sender Identity Verification: should halt and flag AUTH_ERROR on email mismatch', async () => {
    (env as any).DRY_RUN = false;

    vi.spyOn(gmailSendingService, 'reserveSendingAccount').mockResolvedValue({
      id: 10,
      email: 'configured-sender@agency.com',
      status: 'ACTIVE',
      encryptedRefreshToken: 'enc_token_123',
    } as any);

    const releaseSpy = vi.spyOn(gmailSendingService, 'releaseAccountReservation').mockResolvedValue();

    mockGetProfile.mockResolvedValue({
      data: { emailAddress: 'mismatched-auth@gmail.com' },
    });

    const result = await gmailSendingService.sendEmail({
      leadId: 4,
      campaignId: 1,
      recipientEmail: 'lead@channel.com',
      subject: 'Subject',
      body: 'Body',
      idempotencyKey: 'camp_1_lead_4',
    });

    expect(result.success).toBe(false);
    expect(result.skippedReason).toBe('SENDER_IDENTITY_MISMATCH');
    expect(releaseSpy).toHaveBeenCalledWith(10);
    expect(mockMessagesSend).not.toHaveBeenCalled();

    releaseSpy.mockRestore();
  });

  it('5. Crash Safety / Two-Phase Outreach: should preserve SENT status if DB update fails after Gmail 200 and verified', async () => {
    (env as any).DRY_RUN = false;

    vi.spyOn(gmailSendingService, 'reserveSendingAccount').mockResolvedValue({
      id: 10,
      email: 'verified-sender@agency.com',
      status: 'ACTIVE',
      encryptedRefreshToken: 'enc_token_123',
    } as any);

    const releaseSpy = vi.spyOn(gmailSendingService, 'releaseAccountReservation').mockResolvedValue();

    mockGetProfile.mockResolvedValue({
      data: { emailAddress: 'verified-sender@agency.com' },
    });

    mockMessagesSend.mockResolvedValue({
      data: { id: 'live_gmail_msg_99999', threadId: 'live_gmail_thread_99999' },
    });

    mockMessagesGet.mockResolvedValue({
      data: {
        id: 'live_gmail_msg_99999',
        labelIds: ['SENT'],
        payload: {
          headers: [
            { name: 'From', value: 'verified-sender@agency.com' },
            { name: 'To', value: 'creator@domain.com' },
          ],
        },
      },
    });

    let updateCount = 0;
    mockDbUpdate.mockImplementation(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => {
          updateCount++;
          if (updateCount >= 1) {
            return Promise.reject(new Error('Postgres connection lost during Phase 2'));
          }
          return Promise.resolve([]);
        }),
      }),
    }));

    const result = await gmailSendingService.sendEmail({
      leadId: 5,
      campaignId: 1,
      recipientEmail: 'creator@domain.com',
      subject: 'Pitch',
      body: 'Body',
      idempotencyKey: 'camp_1_lead_5',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('live_gmail_msg_99999');
    expect(result.senderEmail).toBe('verified-sender@agency.com');
    expect(releaseSpy).not.toHaveBeenCalled();

    releaseSpy.mockRestore();
  });

  it('6. Strict Post-Send Verification Failure: missing SENT label must lock message in UNCONFIRMED state and never mark SENT', async () => {
    (env as any).DRY_RUN = false;

    vi.spyOn(gmailSendingService, 'reserveSendingAccount').mockResolvedValue({
      id: 11,
      email: 'verified-sender@agency.com',
      status: 'ACTIVE',
      encryptedRefreshToken: 'enc_token_123',
    } as any);

    const releaseSpy = vi.spyOn(gmailSendingService, 'releaseAccountReservation').mockResolvedValue();

    mockGetProfile.mockResolvedValue({
      data: { emailAddress: 'verified-sender@agency.com' },
    });

    mockMessagesSend.mockResolvedValue({
      data: { id: 'live_gmail_msg_unconfirmed_1', threadId: 'thread_1' },
    });

    // Mock Gmail returning message without SENT label (e.g. DRAFT or rejected)
    mockMessagesGet.mockResolvedValue({
      data: {
        id: 'live_gmail_msg_unconfirmed_1',
        labelIds: ['DRAFT'],
        payload: {
          headers: [
            { name: 'From', value: 'verified-sender@agency.com' },
            { name: 'To', value: 'target@creator.com' },
          ],
        },
      },
    });

    const setCalls: any[] = [];
    mockDbUpdate.mockImplementation(() => ({
      set: vi.fn().mockImplementation((val) => {
        setCalls.push(val);
        return {
          where: vi.fn().mockResolvedValue([]),
        };
      }),
    }));

    const result = await gmailSendingService.sendEmail({
      leadId: 6,
      campaignId: 1,
      recipientEmail: 'target@creator.com',
      subject: 'Pitch',
      body: 'Body',
      idempotencyKey: 'camp_1_lead_6',
    });

    // Must NOT return success: true
    expect(result.success).toBe(false);
    expect(result.skippedReason).toBe('POST_SEND_VERIFICATION_FAILED');
    expect(result.verified).toBe(false);

    // Message must be set to UNCONFIRMED
    const messageUpdate = setCalls.find((c) => c.sendStatus === 'UNCONFIRMED');
    expect(messageUpdate).toBeDefined();
    expect(messageUpdate.error).toContain('missing SENT label');

    // Lead must be locked in CONTACTED status to prevent duplicate sending
    const leadUpdate = setCalls.find((c) => c.outreachStatus === 'CONTACTED');
    expect(leadUpdate).toBeDefined();

    // Quota must NOT be refunded because dispatch was already attempted
    expect(releaseSpy).not.toHaveBeenCalled();

    releaseSpy.mockRestore();
  });

  it('7. Strict Post-Send Verification Failure: recipient To mismatch must lock in UNCONFIRMED state', async () => {
    (env as any).DRY_RUN = false;

    vi.spyOn(gmailSendingService, 'reserveSendingAccount').mockResolvedValue({
      id: 12,
      email: 'verified-sender@agency.com',
      status: 'ACTIVE',
      encryptedRefreshToken: 'enc_token_123',
    } as any);

    mockGetProfile.mockResolvedValue({
      data: { emailAddress: 'verified-sender@agency.com' },
    });

    mockMessagesSend.mockResolvedValue({
      data: { id: 'live_gmail_msg_mismatch_to', threadId: 'thread_2' },
    });

    // Mock Gmail returning message with DIFFERENT To recipient
    mockMessagesGet.mockResolvedValue({
      data: {
        id: 'live_gmail_msg_mismatch_to',
        labelIds: ['SENT'],
        payload: {
          headers: [
            { name: 'From', value: 'verified-sender@agency.com' },
            { name: 'To', value: 'wrong-recipient@other.com' },
          ],
        },
      },
    });

    const setCalls: any[] = [];
    mockDbUpdate.mockImplementation(() => ({
      set: vi.fn().mockImplementation((val) => {
        setCalls.push(val);
        return {
          where: vi.fn().mockResolvedValue([]),
        };
      }),
    }));

    const result = await gmailSendingService.sendEmail({
      leadId: 7,
      campaignId: 1,
      recipientEmail: 'expected-creator@domain.com',
      subject: 'Pitch',
      body: 'Body',
      idempotencyKey: 'camp_1_lead_7',
    });

    expect(result.success).toBe(false);
    expect(result.skippedReason).toBe('POST_SEND_VERIFICATION_FAILED');
    expect(result.error).toContain('To header mismatch');

    const messageUpdate = setCalls.find((c) => c.sendStatus === 'UNCONFIRMED');
    expect(messageUpdate).toBeDefined();

    const leadUpdate = setCalls.find((c) => c.outreachStatus === 'CONTACTED');
    expect(leadUpdate).toBeDefined();
  });

  it('8. Strict Post-Send Verification Success: confirms message exists, has SENT label, From matches, and To matches', async () => {
    (env as any).DRY_RUN = false;

    vi.spyOn(gmailSendingService, 'reserveSendingAccount').mockResolvedValue({
      id: 13,
      email: 'verified-sender@agency.com',
      status: 'ACTIVE',
      encryptedRefreshToken: 'enc_token_123',
    } as any);

    mockGetProfile.mockResolvedValue({
      data: { emailAddress: 'verified-sender@agency.com' },
    });

    mockMessagesSend.mockResolvedValue({
      data: { id: 'live_gmail_msg_perfect_match', threadId: 'thread_3' },
    });

    mockMessagesGet.mockResolvedValue({
      data: {
        id: 'live_gmail_msg_perfect_match',
        labelIds: ['SENT'],
        payload: {
          headers: [
            { name: 'From', value: 'verified-sender@agency.com' },
            { name: 'To', value: 'creator@verified.com' },
          ],
        },
      },
    });

    const setCalls: any[] = [];
    mockDbUpdate.mockImplementation(() => ({
      set: vi.fn().mockImplementation((val) => {
        setCalls.push(val);
        return {
          where: vi.fn().mockResolvedValue([]),
        };
      }),
    }));

    const result = await gmailSendingService.sendEmail({
      leadId: 8,
      campaignId: 1,
      recipientEmail: 'creator@verified.com',
      subject: 'Valid Pitch',
      body: 'Body',
      idempotencyKey: 'camp_1_lead_8',
    });

    // Confirmed live send
    expect(result.success).toBe(true);
    expect(result.verified).toBe(true);
    expect(result.messageId).toBe('live_gmail_msg_perfect_match');

    // Message row marked SENT
    const messageUpdate = setCalls.find((c) => c.sendStatus === 'SENT');
    expect(messageUpdate).toBeDefined();

    // Lead row marked CONTACTED
    const leadUpdate = setCalls.find((c) => c.outreachStatus === 'CONTACTED');
    expect(leadUpdate).toBeDefined();
  });
});

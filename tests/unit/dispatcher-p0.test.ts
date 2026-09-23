import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTxExecute = vi.fn();
const mockTxUpdate = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbSelect = vi.fn();

vi.mock('../../src/db/client', () => ({
  db: {
    select: (...args: any[]) => mockDbSelect(...args),
    update: (...args: any[]) => mockDbUpdate(...args),
    transaction: async (cb: any) => {
      return cb({
        execute: mockTxExecute,
        update: mockTxUpdate,
      });
    },
  },
}));

vi.mock('../../src/workers/replies.worker', () => ({
  runReplySync: vi.fn().mockResolvedValue({ processedThreads: 0, newRepliesDetected: 0 }),
}));

vi.mock('../../src/services/ai/gemini.service', () => ({
  geminiService: {
    generatePersonalizedLine: vi.fn().mockResolvedValue('Love your recent video!'),
  },
}));

const mockSendEmail = vi.fn();
vi.mock('../../src/services/outreach/gmail.service', () => ({
  gmailSendingService: {
    sendEmail: (...args: any[]) => mockSendEmail(...args),
  },
}));

import { runDispatcher } from '../../src/workers/dispatcher.worker';

describe('Dispatcher P0 Terminal Failure Guard (BUG-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark scheduled email as FAILED (terminal) when POST_SEND_VERIFICATION_FAILED occurs, never requeuing to PENDING', async () => {
    mockTxExecute.mockResolvedValue({
      rows: [{ id: 101 }],
    });

    mockTxUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const updateSets: any[] = [];
    mockDbUpdate.mockImplementation(() => ({
      set: vi.fn().mockImplementation((val) => {
        updateSets.push(val);
        return {
          where: vi.fn().mockResolvedValue([]),
        };
      }),
    }));

    let selectCount = 0;
    mockDbSelect.mockImplementation(() => {
      selectCount++;
      const currentCall = selectCount;

      const fullDetailsData = [
        {
          id: 101,
          leadId: 50,
          contactId: 500,
          campaignId: 1,
          gmailAccountId: 5,
          stepNumber: 1,
          attempts: 1,
          leadOutreachStatus: 'PENDING',
          recipientEmail: 'lead@channel.com',
          firstName: 'Lead',
          channelTitle: 'Tech Channel',
          campaignSubject: 'Collab Pitch',
          campaignBody: 'Hey {{first_name}}, let us collab.',
          campaignTemplateId: 1,
        },
      ];

      const chain: any = {
        from: vi.fn().mockImplementation(() => chain),
        innerJoin: vi.fn().mockImplementation(() => chain),
        leftJoin: vi.fn().mockImplementation(() => chain),
        where: vi.fn().mockImplementation(() => chain),
        limit: vi.fn().mockImplementation(() => {
          if (currentCall === 1 || currentCall === 2) {
            // Kill switch checks
            return Promise.resolve([{ value: 'false' }]);
          }
          if (currentCall === 3) {
            // Full details query
            return Promise.resolve(fullDetailsData);
          }
          if (currentCall === 4) {
            // Template lookup
            return Promise.resolve([
              {
                id: 1,
                subject: 'Hello {{channel_title}}',
                body: 'Hey {{first_name}}, check this out.',
              },
            ]);
          }
          return Promise.resolve([]);
        }),
        then: (resolve: any, reject: any) => {
          if (currentCall === 1 || currentCall === 2) {
            return Promise.resolve([{ value: 'false' }]).then(resolve, reject);
          }
          if (currentCall === 3) {
            return Promise.resolve(fullDetailsData).then(resolve, reject);
          }
          if (currentCall === 4) {
            return Promise.resolve([
              {
                id: 1,
                subject: 'Hello {{channel_title}}',
                body: 'Hey {{first_name}}, check this out.',
              },
            ]).then(resolve, reject);
          }
          return Promise.resolve([]).then(resolve, reject);
        },
      };

      return chain;
    });

    // Simulate Gmail post-send verification failure (message dispatched but unconfirmed in SENT mailbox)
    mockSendEmail.mockResolvedValue({
      success: false,
      skippedReason: 'POST_SEND_VERIFICATION_FAILED',
      error: 'Gmail post-send verification failed: Missing SENT label',
    });

    const result = await runDispatcher(1);

    expect(result.failed).toBe(1);
    expect(result.dispatched).toBe(0);

    // Verify scheduled_emails was marked FAILED, NOT PENDING!
    const terminalUpdate = updateSets.find((u) => u.status === 'FAILED');
    expect(terminalUpdate).toBeDefined();
    expect(terminalUpdate.error).toContain('Gmail post-send verification failed');

    // Crucial check: NO update set status back to PENDING!
    const requeueUpdate = updateSets.find((u) => u.status === 'PENDING');
    expect(requeueUpdate).toBeUndefined();
  });

  it('should apply 30+ minute backoff and preserve PENDING status on Gmail 429 rate limit error', async () => {
    mockTxExecute.mockResolvedValue({
      rows: [{ id: 102 }],
    });

    mockTxUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const updateSets: any[] = [];
    mockDbUpdate.mockImplementation(() => ({
      set: vi.fn().mockImplementation((val) => {
        updateSets.push(val);
        return {
          where: vi.fn().mockResolvedValue([]),
        };
      }),
    }));

    let selectCount = 0;
    mockDbSelect.mockImplementation(() => {
      selectCount++;
      const currentCall = selectCount;

      const fullDetailsData = [
        {
          id: 102,
          leadId: 51,
          contactId: 501,
          campaignId: 1,
          gmailAccountId: 5,
          stepNumber: 1,
          attempts: 1,
          leadOutreachStatus: 'PENDING',
          recipientEmail: 'rate-limited@channel.com',
          firstName: 'Creator',
          channelTitle: 'Creator Channel',
          campaignSubject: 'Collab Pitch',
          campaignBody: 'Hey {{first_name}}, let us collab.',
          campaignTemplateId: 1,
        },
      ];

      const chain: any = {
        from: vi.fn().mockImplementation(() => chain),
        innerJoin: vi.fn().mockImplementation(() => chain),
        leftJoin: vi.fn().mockImplementation(() => chain),
        where: vi.fn().mockImplementation(() => chain),
        limit: vi.fn().mockImplementation(() => {
          if (currentCall === 1 || currentCall === 2) {
            return Promise.resolve([{ value: 'false' }]);
          }
          if (currentCall === 3) {
            return Promise.resolve(fullDetailsData);
          }
          if (currentCall === 4) {
            return Promise.resolve([
              {
                id: 1,
                subject: 'Hello {{channel_title}}',
                body: 'Hey {{first_name}}, check this out.',
              },
            ]);
          }
          return Promise.resolve([]);
        }),
        then: (resolve: any, reject: any) => {
          if (currentCall === 1 || currentCall === 2) {
            return Promise.resolve([{ value: 'false' }]).then(resolve, reject);
          }
          if (currentCall === 3) {
            return Promise.resolve(fullDetailsData).then(resolve, reject);
          }
          if (currentCall === 4) {
            return Promise.resolve([
              {
                id: 1,
                subject: 'Hello {{channel_title}}',
                body: 'Hey {{first_name}}, check this out.',
              },
            ]);
          }
          return Promise.resolve([]).then(resolve, reject);
        },
      };

      return chain;
    });

    mockSendEmail.mockResolvedValue({
      success: false,
      error: 'HTTP 429: userRateLimitExceeded Rate limit exceeded',
    });

    const result = await runDispatcher(1);

    expect(result.failed).toBe(1);
    const rateLimitUpdate = updateSets.find((u) => u.error && u.error.includes('Rate limited'));
    expect(rateLimitUpdate).toBeDefined();
    expect(rateLimitUpdate.status).toBe('PENDING');
    // Ensure scheduledAt was backed off by at least 25 minutes
    const futureDiff = new Date(rateLimitUpdate.scheduledAt).getTime() - Date.now();
    expect(futureDiff).toBeGreaterThan(25 * 60 * 1000);
  });
});


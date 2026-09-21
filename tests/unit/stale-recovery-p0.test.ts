import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDbSelect = vi.fn();
const mockDbUpdate = vi.fn();

vi.mock('../../src/db/client', () => ({
  db: {
    select: () => mockDbSelect(),
    update: () => mockDbUpdate(),
  },
}));

import { jobRunner } from '../../src/services/jobs/job.runner';

describe('BUG-03 Watchdog Recovery for Stale SENDING Scheduled Emails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should recover orphaned SENDING scheduled email back to PENDING when not yet delivered in messages', async () => {
    const updateSets: any[] = [];
    mockDbUpdate.mockImplementation(() => ({
      set: vi.fn().mockImplementation((val) => {
        updateSets.push(val);
        return {
          where: vi.fn().mockResolvedValue([]),
        };
      }),
    }));

    let selectCall = 0;
    mockDbSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => {
          selectCall++;
          if (selectCall === 1) {
            // Find stale SENDING rows
            return Promise.resolve([
              {
                id: 201,
                leadId: 40,
                campaignId: 2,
                contactId: 400,
                stepNumber: 1,
              },
            ]);
          }
          // Check existing message in messages table: none delivered yet
          return {
            limit: vi.fn().mockResolvedValue([]),
          };
        }),
      }),
    }));

    const recoveredCount = await jobRunner.recoverStaleScheduledEmails(30);

    expect(recoveredCount).toBe(1);

    const pendingReset = updateSets.find((u) => u.status === 'PENDING');
    expect(pendingReset).toBeDefined();
    expect(pendingReset.error).toContain('Recovered by watchdog');
  });

  it('should mark orphaned SENDING scheduled email as COMPLETED if message was already delivered', async () => {
    const updateSets: any[] = [];
    mockDbUpdate.mockImplementation(() => ({
      set: vi.fn().mockImplementation((val) => {
        updateSets.push(val);
        return {
          where: vi.fn().mockResolvedValue([]),
        };
      }),
    }));

    let selectCall = 0;
    mockDbSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => {
          selectCall++;
          if (selectCall === 1) {
            // Find stale SENDING rows
            return Promise.resolve([
              {
                id: 202,
                leadId: 41,
                campaignId: 2,
                contactId: 401,
                stepNumber: 1,
              },
            ]);
          }
          // Existing message in messages table WAS delivered (status SENT)
          return {
            limit: vi.fn().mockResolvedValue([
              {
                id: 999,
                sendStatus: 'SENT',
              },
            ]),
          };
        }),
      }),
    }));

    const recoveredCount = await jobRunner.recoverStaleScheduledEmails(30);

    expect(recoveredCount).toBe(1);

    const sentSet = updateSets.find((u) => u.status === 'SENT');
    expect(sentSet).toBeDefined();
  });

  it('should return 0 and make no changes if there are no stale SENDING rows', async () => {
    mockDbSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }));

    const recoveredCount = await jobRunner.recoverStaleScheduledEmails(30);

    expect(recoveredCount).toBe(0);
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });
});

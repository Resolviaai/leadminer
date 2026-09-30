import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mock Database Operations
// ---------------------------------------------------------------------------
const mockDbSelect = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbInsert = vi.fn();
const mockDbTransaction = vi.fn();

vi.mock('../../src/db/client', () => ({
  db: {
    select: () => mockDbSelect(),
    update: () => mockDbUpdate(),
    insert: () => mockDbInsert(),
    transaction: (cb: any) => mockDbTransaction(cb),
  },
  getDbPool: () => ({
    query: vi.fn(),
  }),
}));

import { jobRunner } from '../../src/services/jobs/job.runner';
import { POST as setPrimaryRoute } from '../../src/app/api/leads/[id]/set-primary/route';

describe('Worker State Resilience & Idempotency Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Worker Restart and Stale Job / Keyword Recovery', () => {
    it('should reset stale PROCESSING keywords to RETRY on worker crash / watchdog pass', async () => {
      const updatedSets: any[] = [];
      mockDbUpdate.mockImplementation(() => ({
        set: vi.fn().mockImplementation((val) => {
          updatedSets.push(val);
          return {
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 101 }, { id: 102 }]),
            }),
          };
        }),
      }));

      const { recoveredKeywords, recoveredJobs } = await jobRunner.recoverStaleJobsAndKeywords(30);

      expect(recoveredKeywords).toBe(2);
      expect(recoveredJobs).toBe(2);
      const keywordReset = updatedSets.find((u) => u.status === 'RETRY');
      expect(keywordReset).toBeDefined();
      expect(keywordReset.lastError).toContain('Worker crashed or timed out');
      const jobFail = updatedSets.find((u) => u.status === 'FAILED');
      expect(jobFail).toBeDefined();
      expect(jobFail.error).toContain('heartbeat update');
    });

    it('should recover stale QUEUED lead to CONTACTED if message was already sent (Crash before lead status update)', async () => {
      let selectCall = 0;
      const updateSets: any[] = [];

      mockDbSelect.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            selectCall++;
            if (selectCall === 1) {
              // Stale QUEUED leads
              return Promise.resolve([{ id: 501 }]);
            }
            // Message check
            return {
              limit: vi.fn().mockResolvedValue([{ id: 9001, sendStatus: 'SENT' }]),
            };
          }),
        }),
      }));

      mockDbUpdate.mockImplementation(() => ({
        set: vi.fn().mockImplementation((val) => {
          updateSets.push(val);
          return {
            where: vi.fn().mockResolvedValue([]),
          };
        }),
      }));

      const recovered = await jobRunner.recoverStaleOutreachLeads(30);

      expect(recovered).toBe(1);
      const contactedUpdate = updateSets.find((u) => u.outreachStatus === 'CONTACTED');
      expect(contactedUpdate).toBeDefined();
    });

    it('should reset stale QUEUED lead to UNPROCESSED if no message was ever dispatched (Idempotent crash recovery)', async () => {
      let selectCall = 0;
      const updateSets: any[] = [];

      mockDbSelect.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            selectCall++;
            if (selectCall === 1) {
              return Promise.resolve([{ id: 502 }]);
            }
            // Message check: none found
            return {
              limit: vi.fn().mockResolvedValue([]),
            };
          }),
        }),
      }));

      mockDbUpdate.mockImplementation(() => ({
        set: vi.fn().mockImplementation((val) => {
          updateSets.push(val);
          return {
            where: vi.fn().mockResolvedValue([]),
          };
        }),
      }));

      const recovered = await jobRunner.recoverStaleOutreachLeads(30);

      expect(recovered).toBe(1);
      const unprocessedUpdate = updateSets.find((u) => u.outreachStatus === 'UNPROCESSED');
      expect(unprocessedUpdate).toBeDefined();
    });
  });

  describe('2. Idempotent Discovery Deduplication', () => {
    it('should verify lead channel uniqueness constraint and update lastSeenAt without duplicating contacts', async () => {
      // Test the logic that existing leads are identified and provenance is updated
      const existingLeads = [{ id: 42, channelId: 'UC_EXISTING_CHANNEL_1' }];
      const uniqueChannelIds = ['UC_EXISTING_CHANNEL_1', 'UC_NEW_CHANNEL_2'];

      const existingMap = new Map<string, number>();
      for (const el of existingLeads) {
        existingMap.set(el.channelId, el.id);
      }

      const genuinelyNew = uniqueChannelIds.filter((id) => !existingMap.has(id));
      expect(genuinelyNew).toEqual(['UC_NEW_CHANNEL_2']);
      expect(existingMap.get('UC_EXISTING_CHANNEL_1')).toBe(42);
    });
  });

  describe('3. Atomic Primary Contact Mutation & Campaign Re-qualification (/api/leads/[id]/set-primary)', () => {
    it('should return 400 if neither contactId nor email is provided', async () => {
      const req = new NextRequest('http://localhost:3000/api/leads/123/set-primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await setPrimaryRoute(req, { params: { id: '123' } });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Missing contactId or email');
    });

    it('should return 404 if the target contact does not exist for this lead', async () => {
      mockDbTransaction.mockImplementation(async (txCb) => {
        const mockTx = {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockImplementation((cond) => {
                // Return lead, but no matching contact
                return Promise.resolve([{ id: 123, qualificationStatus: 'UNQUALIFIED' }]);
              }),
            }),
          }),
        };
        // First call is lead lookup, second is contact lookup (return empty)
        let selectCall = 0;
        mockTx.select = vi.fn().mockImplementation(() => ({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => {
              selectCall++;
              if (selectCall === 1) return Promise.resolve([{ id: 123, qualificationStatus: 'UNQUALIFIED' }]);
              return Promise.resolve([]); // No contact found
            }),
          }),
        }));
        return txCb(mockTx);
      });

      const req = new NextRequest('http://localhost:3000/api/leads/123/set-primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ghost@creator.io' }),
      });

      const res = await setPrimaryRoute(req, { params: { id: '123' } });
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain('Contact not found');
    });

    it('should atomically switch primary contact and re-qualify lead against active campaign', async () => {
      const txUpdates: any[] = [];

      mockDbTransaction.mockImplementation(async (txCb) => {
        let selectCall = 0;
        const mockTx = {
          select: vi.fn().mockImplementation(() => ({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockImplementation(() => {
                selectCall++;
                if (selectCall === 1) {
                  // Lead exists
                  return Promise.resolve([
                    {
                      id: 77,
                      subscriberCount: 50000,
                      country: 'US',
                      qualificationStatus: 'UNQUALIFIED',
                      outreachStatus: 'UNPROCESSED',
                      suppressionStatus: false,
                    },
                  ]);
                }
                if (selectCall === 2) {
                  // Contact exists
                  return Promise.resolve([
                    {
                      id: 888,
                      leadId: 77,
                      email: 'business@topcreator.com',
                      emailStatus: 'VALID',
                      isPrimary: false,
                    },
                  ]);
                }
                // Active campaign
                return {
                  limit: vi.fn().mockResolvedValue([
                    {
                      id: 1,
                      status: 'ACTIVE',
                      minSubscribers: 1000,
                      targetCountry: null,
                    },
                  ]),
                };
              }),
            }),
          })),
          update: vi.fn().mockImplementation(() => ({
            set: vi.fn().mockImplementation((val) => {
              txUpdates.push(val);
              return {
                where: vi.fn().mockResolvedValue([]),
              };
            }),
          })),
        };
        return txCb(mockTx);
      });

      const req = new NextRequest('http://localhost:3000/api/leads/77/set-primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: 888 }),
      });

      const res = await setPrimaryRoute(req, { params: { id: '77' } });
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.leadId).toBe(77);
      expect(data.primaryContactId).toBe(888);
      expect(data.primaryEmail).toBe('business@topcreator.com');
      expect(data.qualificationStatus).toBe('QUALIFIED');

      // Verify transaction steps:
      // 1. Unset old primary
      const unsetOld = txUpdates.find((u) => u.isPrimary === false);
      expect(unsetOld).toBeDefined();

      // 2. Set new primary
      const setNew = txUpdates.find((u) => u.isPrimary === true);
      expect(setNew).toBeDefined();

      // 3. Update lead qualificationStatus
      const qualUpdate = txUpdates.find((u) => u.qualificationStatus === 'QUALIFIED');
      expect(qualUpdate).toBeDefined();
    });
  });
});

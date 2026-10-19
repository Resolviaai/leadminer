import { describe, it, expect, vi, beforeEach } from 'vitest';

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

vi.mock('../../src/services/notifications/telegram.service', () => ({
  telegramService: {
    notifyCriticalError: vi.fn().mockResolvedValue(undefined),
    notifyInfo: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/services/youtube/quota', () => ({
  getAvailableYouTubeKeys: () => ['MOCK_KEY_1'],
  quotaManager: {
    canExecuteSearch: vi.fn().mockResolvedValue(true),
    recordUsage: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/services/youtube/discovery.service', () => ({
  youtubeDiscoveryService: {
    searchChannelIds: vi.fn(),
    enrichChannelsBatch: vi.fn(),
    getRecentVideoDescriptions: vi.fn(),
  },
}));

vi.mock('../../src/services/jobs/job.runner', () => ({
  jobRunner: {
    createJob: vi.fn().mockResolvedValue(999),
    updateHeartbeat: vi.fn().mockResolvedValue(undefined),
    completeJob: vi.fn().mockResolvedValue(undefined),
    failJob: vi.fn().mockResolvedValue(undefined),
    stopJobQuota: vi.fn().mockResolvedValue(undefined),
    logEvent: vi.fn().mockResolvedValue(undefined),
    recoverStaleJobsAndKeywords: vi.fn().mockResolvedValue({ recoveredKeywords: 0, recoveredJobs: 0 }),
  },
}));

import { runDiscoveryBatch } from '../../src/workers/discovery.worker';
import { jobRunner } from '../../src/services/jobs/job.runner';
import { LOCK_KEYS } from '../../src/lib/pipeline-lock';
import fs from 'fs';
import path from 'path';

describe('Sending Pipeline Resilience & Timeout Decoupling Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Discovery Time Budgeting & Unstarted Keyword Rollback', () => {
    it('gracefully yields and rolls back claimed keywords to PENDING when time budget expires', async () => {
      const mockKeywords = [
        { id: 101, keyword: 'tech founders podcast', category: 'tech', entity: 'founder', priorityScore: 80, attemptCount: 1 },
        { id: 102, keyword: 'ai builders club', category: 'tech', entity: 'builder', priorityScore: 70, attemptCount: 1 },
        { id: 103, keyword: 'saas founders interview', category: 'saas', entity: 'founder', priorityScore: 60, attemptCount: 1 },
      ];

      const updatedSets: any[] = [];
      let whereFilter: any = null;

      mockDbUpdate.mockImplementation(() => ({
        set: vi.fn().mockImplementation((val) => {
          updatedSets.push(val);
          return {
            where: vi.fn().mockImplementation((w) => {
              whereFilter = w;
              return {
                returning: vi.fn().mockResolvedValue(mockKeywords),
              };
            }),
          };
        }),
      }));

      // Trigger runDiscoveryBatch with maxExecutionSeconds = 0 (immediately exceeds deadline)
      const result = await runDiscoveryBatch({ batchSize: 3, maxExecutionSeconds: 0 });

      // Should indicate time budget reached without crashing or throwing
      expect(result.timeBudgetReached).toBe(true);
      expect(result.processed).toBe(0);

      // Verify that unstarted keywords were rolled back to PENDING
      const rollbackSet = updatedSets.find((u) => u.status === 'PENDING');
      expect(rollbackSet).toBeDefined();

      // Verify that jobRunner completed the job and logged the event
      expect(jobRunner.logEvent).toHaveBeenCalledWith(
        999,
        'TIME_BUDGET_REACHED',
        'INFO',
        expect.stringContaining('Discovery batch yielded early'),
        expect.any(Object)
      );
      expect(jobRunner.completeJob).toHaveBeenCalledWith(999, 0);
    });
  });

  describe('2. Pipeline Decoupling & Independent Step Protection', () => {
    it('ensures GitHub Actions daily pipeline decoupled steps record failure without premature exit', () => {
      const workflowPath = path.resolve(__dirname, '../../.github/workflows/daily-pipeline.yml');
      const workflowContent = fs.readFileSync(workflowPath, 'utf8');

      // Verify FAILED_STEPS array tracks failures instead of immediate exit 1 inside loop
      expect(workflowContent).toContain('FAILED_STEPS=()');
      expect(workflowContent).toContain('FAILED_STEPS+=("$STEP (HTTP $HTTP_STATUS)")');
      expect(workflowContent).not.toMatch(/if\s*\[\s*"(\$HTTP_STATUS)"\s*-ne\s*200[\s\S]*exit 1[\s\S]*elif/);

      // Verify final failure summary checks all failed steps at end of run
      expect(workflowContent).toContain('if [ ${#FAILED_STEPS[@]} -gt 0 ]; then');
      expect(workflowContent).toContain('Downstream planning and dispatch steps were attempted');
    });

    it('ensures LOCK_KEYS for DISCOVERY, PLANNER, and DISPATCHER are completely distinct', () => {
      expect(LOCK_KEYS.DISCOVERY).toBeDefined();
      expect(LOCK_KEYS.PLANNER).toBeDefined();
      expect(LOCK_KEYS.DISPATCHER).toBeDefined();

      const keys = [LOCK_KEYS.DISCOVERY, LOCK_KEYS.PLANNER, LOCK_KEYS.DISPATCHER];
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(3);
    });
  });

  describe('3. cron-job.org Redundancy & Planner Scheduling', () => {
    it('verifies setup-cron-job.ts defines LeadMiner Daily Planner and tuned discovery limits', () => {
      const scriptPath = path.resolve(__dirname, '../../scripts/setup-cron-job.ts');
      const scriptContent = fs.readFileSync(scriptPath, 'utf8');

      // Verify standalone LeadMiner Daily Planner job exists
      expect(scriptContent).toContain("title: 'LeadMiner Daily Planner'");
      expect(scriptContent).toContain("path: '/api/workers/planner'");
      expect(scriptContent).toContain('minutes: [35]');

      // Verify Discovery cron is tuned for cron-job.org 30s timeout
      expect(scriptContent).toContain("batchSize=3&timeout=25");
    });
  });
});

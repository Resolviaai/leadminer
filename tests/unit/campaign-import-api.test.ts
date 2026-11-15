import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as previewPost } from '../../src/app/api/campaigns/[id]/import/preview/route';
import { POST as commitPost } from '../../src/app/api/campaigns/[id]/import/commit/route';
import { GET as leadsGet } from '../../src/app/api/campaigns/[id]/leads/route';
import { env } from '../../src/config/env';

describe('Campaign Ingestion & Leads API Suite', () => {
  const originalCronSecret = env.CRON_SECRET;
  const originalEnvNodeEnv = env.NODE_ENV;
  const originalProcessNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    Object.defineProperty(env, 'CRON_SECRET', { value: 'test_secret_for_campaign_tests', configurable: true, writable: true });
    Object.defineProperty(env, 'NODE_ENV', { value: 'production', configurable: true, writable: true });
    (process.env as any).NODE_ENV = 'production';
  });

  afterEach(() => {
    Object.defineProperty(env, 'CRON_SECRET', { value: originalCronSecret, configurable: true, writable: true });
    Object.defineProperty(env, 'NODE_ENV', { value: originalEnvNodeEnv, configurable: true, writable: true });
    (process.env as any).NODE_ENV = originalProcessNodeEnv;
    vi.restoreAllMocks();
  });

  describe('1. Authentication Gate', () => {
    it('should reject unauthenticated preview requests with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/campaigns/1/import/preview', {
        method: 'POST',
      });
      const res = await previewPost(req, { params: { id: '1' } });
      expect(res.status).toBe(401);
    });

    it('should reject unauthenticated commit requests with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/campaigns/1/import/commit', {
        method: 'POST',
      });
      const res = await commitPost(req, { params: { id: '1' } });
      expect(res.status).toBe(401);
    });

    it('should reject unauthenticated leads GET requests with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/campaigns/1/leads', {
        method: 'GET',
      });
      const res = await leadsGet(req, { params: { id: '1' } });
      expect(res.status).toBe(401);
    });
  });

  describe('2. Parameter Validation', () => {
    it('should return 400 for invalid non-numeric campaign ID on preview', async () => {
      const req = new NextRequest('http://localhost:3000/api/campaigns/invalid-id/import/preview', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.CRON_SECRET}`,
        },
      });
      const res = await previewPost(req, { params: { id: 'invalid-id' } });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid campaign ID');
    });

    it('should return 400 for invalid non-numeric campaign ID on commit', async () => {
      const req = new NextRequest('http://localhost:3000/api/campaigns/abc/import/commit', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.CRON_SECRET}`,
        },
      });
      const res = await commitPost(req, { params: { id: 'abc' } });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid campaign ID');
    });

    it('should return 400 for invalid non-numeric campaign ID on leads query', async () => {
      const req = new NextRequest('http://localhost:3000/api/campaigns/xyz/leads', {
        method: 'GET',
        headers: {
          authorization: `Bearer ${env.CRON_SECRET}`,
        },
      });
      const res = await leadsGet(req, { params: { id: 'xyz' } });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid campaign ID');
    });
  });
});

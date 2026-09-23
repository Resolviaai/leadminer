import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { verifyWorkerAuth } from '../../src/lib/worker-auth';
import {
  validateLoginCredentials,
  createSessionCookie,
  verifyDashboardAuth,
  COOKIE_NAME,
} from '../../src/lib/api-auth';
import { env } from '../../src/config/env';

describe('Worker & Dashboard Auth Security Hardening', () => {
  const originalCronSecret = env.CRON_SECRET;
  const originalEmail = env.DASHBOARD_EMAIL;
  const originalPassword = env.DASHBOARD_PASSWORD;

  beforeEach(() => {
    (env as any).CRON_SECRET = 'test_cron_secret_1234567890abcdef';
    (env as any).DASHBOARD_EMAIL = 'operator@test.com';
    (env as any).DASHBOARD_PASSWORD = 'super_secret_password_123';
  });

  afterEach(() => {
    (env as any).CRON_SECRET = originalCronSecret;
    (env as any).DASHBOARD_EMAIL = originalEmail;
    (env as any).DASHBOARD_PASSWORD = originalPassword;
  });

  describe('Worker Auth (Bearer-only)', () => {
    it('should reject requests with fake Vercel cron headers when enforced', () => {
      const req = new NextRequest('http://localhost:3000/api/workers/pipeline', {
        headers: {
          'user-agent': 'vercel-cron/1.0',
          'x-vercel-cron': '1',
        },
      });
      const res = verifyWorkerAuth(req, { forceEnforce: true });
      expect(res.authorized).toBe(false);
      expect(res.response?.status).toBe(401);
    });

    it('should reject requests with fake same-origin headers when enforced', () => {
      const req = new NextRequest('http://localhost:3000/api/workers/pipeline', {
        headers: {
          'sec-fetch-site': 'same-origin',
          origin: 'http://localhost:3000',
          referer: 'http://localhost:3000/dashboard',
        },
      });
      const res = verifyWorkerAuth(req, { forceEnforce: true });
      expect(res.authorized).toBe(false);
      expect(res.response?.status).toBe(401);
    });

    it('should reject requests with invalid Bearer token', () => {
      const req = new NextRequest('http://localhost:3000/api/workers/pipeline', {
        headers: {
          authorization: 'Bearer wrong_token_attempt',
        },
      });
      const res = verifyWorkerAuth(req, { forceEnforce: true });
      expect(res.authorized).toBe(false);
      expect(res.response?.status).toBe(401);
    });

    it('should authorize requests with valid CRON_SECRET Bearer token', () => {
      const req = new NextRequest('http://localhost:3000/api/workers/pipeline', {
        headers: {
          authorization: 'Bearer test_cron_secret_1234567890abcdef',
        },
      });
      const res = verifyWorkerAuth(req, { forceEnforce: true });
      expect(res.authorized).toBe(true);
    });

    it('should fail closed with 503 if CRON_SECRET is not configured in production', () => {
      (env as any).CRON_SECRET = '';
      const req = new NextRequest('http://localhost:3000/api/workers/pipeline', {
        headers: {
          authorization: 'Bearer test_cron_secret_1234567890abcdef',
        },
      });
      const res = verifyWorkerAuth(req, { forceEnforce: true });
      expect(res.authorized).toBe(false);
      expect(res.response?.status).toBe(503);
    });
  });

  describe('Dashboard Credentials & Session Auth', () => {
    it('should validate matching credentials in constant time', () => {
      expect(validateLoginCredentials('operator@test.com', 'super_secret_password_123')).toBe(true);
    });

    it('should reject incorrect email or password', () => {
      expect(validateLoginCredentials('wrong@test.com', 'super_secret_password_123')).toBe(false);
      expect(validateLoginCredentials('operator@test.com', 'wrong_password')).toBe(false);
      expect(validateLoginCredentials('', '')).toBe(false);
    });

    it('should issue and verify a tamper-evident session cookie', () => {
      const cookieHeader = createSessionCookie('operator@test.com');
      expect(cookieHeader).toContain(COOKIE_NAME);
      expect(cookieHeader).toContain('HttpOnly');
      expect(cookieHeader).toContain('SameSite=Strict');

      // Extract the raw cookie token
      const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
      const token = match![1];

      // Request with valid session cookie
      const validReq = new NextRequest('http://localhost:3000/api/keywords', {
        headers: {
          cookie: `${COOKIE_NAME}=${token}`,
        },
      });
      const res = verifyDashboardAuth(validReq);
      expect(res.authorized).toBe(true);
    });
  });
});

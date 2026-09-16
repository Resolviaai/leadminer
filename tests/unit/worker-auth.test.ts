import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { verifyWorkerAuth } from '../../src/lib/worker-auth';

describe('Worker Auth Guard', () => {
  it('should allow requests with x-vercel-cron header', () => {
    const req = new NextRequest('http://localhost:3000/api/workers/pipeline', {
      headers: { 'x-vercel-cron': '1' },
    });
    const res = verifyWorkerAuth(req);
    expect(res.authorized).toBe(true);
  });

  it('should allow requests with same-origin header', () => {
    const req = new NextRequest('http://localhost:3000/api/workers/pipeline', {
      headers: { 'sec-fetch-site': 'same-origin' },
    });
    const res = verifyWorkerAuth(req);
    expect(res.authorized).toBe(true);
  });
});

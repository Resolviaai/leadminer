import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockDbDelete = vi.fn();
const mockDbInsert = vi.fn();
const mockDbSelect = vi.fn();
const mockDbUpdate = vi.fn();

vi.mock('../../src/db/client', () => ({
  db: {
    delete: () => mockDbDelete(),
    insert: () => mockDbInsert(),
    select: () => mockDbSelect(),
    update: () => mockDbUpdate(),
  },
}));

vi.mock('../../src/lib/api-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/api-auth')>();
  return {
    ...actual,
    verifyDashboardAuth: vi.fn(),
  };
});

vi.mock('../../src/lib/unsubscribe-token', () => ({
  verifyUnsubscribeToken: vi.fn(),
}));

import { POST } from '../../src/app/api/gdpr/delete/route';
import { verifyDashboardAuth } from '../../src/lib/api-auth';
import { verifyUnsubscribeToken } from '../../src/lib/unsubscribe-token';

describe('N-P0-1 GDPR Erasure Authorization Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockDbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue([]),
      }),
    });

    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    mockDbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    mockDbDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });
  });

  it('rejects unauthenticated request with no token with HTTP 403', async () => {
    vi.mocked(verifyDashboardAuth).mockReturnValue({
      authorized: false,
      response: undefined,
    });
    vi.mocked(verifyUnsubscribeToken).mockReturnValue(false);

    const req = new NextRequest('http://localhost:3000/api/gdpr/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'victim@example.com', leadId: 42, confirmation: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('Unauthorized: valid signature token or admin session required');
    expect(mockDbInsert).not.toHaveBeenCalled();
  });

  it('rejects invalid or forged HMAC token with HTTP 403', async () => {
    vi.mocked(verifyDashboardAuth).mockReturnValue({
      authorized: false,
      response: undefined,
    });
    vi.mocked(verifyUnsubscribeToken).mockReturnValue(false);

    const req = new NextRequest('http://localhost:3000/api/gdpr/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'victim@example.com', leadId: 42, token: 'forged_deadbeef', confirmation: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(mockDbInsert).not.toHaveBeenCalled();
  });

  it('allows deletion when valid HMAC token is provided', async () => {
    vi.mocked(verifyDashboardAuth).mockReturnValue({
      authorized: false,
      response: undefined,
    });
    vi.mocked(verifyUnsubscribeToken).mockReturnValue(true);

    const req = new NextRequest('http://localhost:3000/api/gdpr/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'victim@example.com', leadId: 42, token: 'valid_hmac_token', confirmation: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockDbInsert).toHaveBeenCalled();
  });

  it('allows deletion when authenticated dashboard admin session is present', async () => {
    vi.mocked(verifyDashboardAuth).mockReturnValue({
      authorized: true,
      email: 'admin@leadminer.io',
    });

    const req = new NextRequest('http://localhost:3000/api/gdpr/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'victim@example.com', leadId: 42, confirmation: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockDbInsert).toHaveBeenCalled();
  });
});

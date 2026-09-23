import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDbSelect = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbDelete = vi.fn();
const mockDbInsert = vi.fn();

vi.mock('../../src/db/client', () => ({
  db: {
    select: () => mockDbSelect(),
    update: () => mockDbUpdate(),
    delete: () => mockDbDelete(),
    insert: () => mockDbInsert(),
  },
}));

vi.mock('../../src/services/security/encryption.service', () => ({
  encryptionService: {
    decrypt: vi.fn((token: string) => token ? `decrypted_${token}` : null),
  },
}));

vi.mock('../../src/services/outreach/gmail.service', () => ({
  gmailSendingService: {
    releaseAccountReservation: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock global fetch for Google OAuth revocation
const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
global.fetch = mockFetch;

import { POST } from '../../src/app/api/gmail/disconnect/route';
import { NextRequest } from 'next/server';
import { gmailSendingService } from '../../src/services/outreach/gmail.service';

describe('Gmail Disconnect & Removal Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when accountId is missing or invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/gmail/disconnect', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Valid accountId is required');
  });

  it('should return 404 when account does not exist', async () => {
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const req = new NextRequest('http://localhost:3000/api/gmail/disconnect', {
      method: 'POST',
      body: JSON.stringify({ accountId: 999 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('should revoke Google OAuth token and soft-disconnect account', async () => {
    let selectCall = 0;
    mockDbSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => {
          selectCall++;
          if (selectCall === 1) {
            return {
              limit: vi.fn().mockResolvedValue([
                {
                  id: 1,
                  email: 'test@gmail.com',
                  status: 'ACTIVE',
                  refreshToken: 'enc_refresh_token',
                },
              ]),
            };
          }
          if (selectCall === 2) {
            // Count of messages
            return Promise.resolve([{ count: 5 }]);
          }
          // otherActiveAccounts
          return Promise.resolve([
            { id: 2, email: 'secondary@gmail.com', status: 'ACTIVE' },
          ]);
        }),
      }),
    }));

    const updateSetCalls: any[] = [];
    mockDbUpdate.mockReturnValue({
      set: vi.fn().mockImplementation((val) => {
        updateSetCalls.push(val);
        return {
          where: vi.fn().mockResolvedValue([]),
        };
      }),
    });

    mockDbInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue([]),
    });

    const req = new NextRequest('http://localhost:3000/api/gmail/disconnect', {
      method: 'POST',
      body: JSON.stringify({ accountId: 1, permanent: false }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.action).toBe('DISCONNECTED');
    expect(data.tokenRevoked).toBe(true);

    // Assert Google OAuth revoke endpoint was called
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('https://oauth2.googleapis.com/revoke?token=decrypted_enc_refresh_token'),
      expect.objectContaining({ method: 'POST' })
    );

    // Assert account status set to DISCONNECTED and tokens wiped
    const updatedFields = updateSetCalls.find((u) => u.status === 'DISCONNECTED');
    expect(updatedFields).toBeDefined();
    expect(updatedFields.status).toBe('DISCONNECTED');
    expect(updatedFields.refreshToken).toBeNull();
    expect(updatedFields.accessToken).toBeNull();

    // Assert in-memory quota was released
    expect(gmailSendingService.releaseAccountReservation).toHaveBeenCalledWith(1);
  });

  it('should permanently delete account if requested and 0 messages sent', async () => {
    let selectCall = 0;
    mockDbSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => {
          selectCall++;
          if (selectCall === 1) {
            return {
              limit: vi.fn().mockResolvedValue([
                {
                  id: 2,
                  email: 'unused@gmail.com',
                  status: 'ACTIVE',
                  refreshToken: 'enc_token',
                },
              ]),
            };
          }
          if (selectCall === 2) {
            return Promise.resolve([{ count: 0 }]); // 0 messages sent
          }
          return Promise.resolve([{ id: 3, email: 'active@gmail.com', status: 'ACTIVE' }]);
        }),
      }),
    }));

    mockDbDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });

    mockDbInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue([]),
    });

    const req = new NextRequest('http://localhost:3000/api/gmail/disconnect', {
      method: 'POST',
      body: JSON.stringify({ accountId: 2, permanent: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.action).toBe('DELETED');
    expect(mockDbDelete).toHaveBeenCalled();
  });
});

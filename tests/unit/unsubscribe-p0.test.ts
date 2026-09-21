import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockDbSelect = vi.fn();
const mockDbInsert = vi.fn();
const mockDbUpdate = vi.fn();

vi.mock('../../src/db/client', () => ({
  db: {
    select: () => mockDbSelect(),
    insert: () => mockDbInsert(),
    update: () => mockDbUpdate(),
  },
}));

vi.mock('../../src/services/notifications/telegram.service', () => ({
  telegramService: {
    notifyUnsubscribe: vi.fn().mockResolvedValue(true),
  },
}));

import { GET, POST } from '../../src/app/api/unsubscribe/route';

describe('BUG-04 / BUG-28 / BUG-29 Unsubscribe Safety Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. GET request must render confirmation page and NEVER insert into suppressions or mutate database', async () => {
    const req = new NextRequest('http://localhost:3000/api/unsubscribe?email=creator%40channel.com&leadId=12');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const html = await res.text();

    // Verify confirmation UI rendered
    expect(html).toContain('Unsubscribe Confirmation');
    expect(html).toContain('Confirm Unsubscribe');
    expect(html).toContain('creator@channel.com');
    expect(html).toContain('method="POST"');

    // Critical assertion: DB was NEVER touched on GET!
    expect(mockDbInsert).not.toHaveBeenCalled();
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });

  it('2. GET request escapes email in HTML preventing Reflected XSS (BUG-28)', async () => {
    const xssPayload = '"><script>alert(1)</script>';
    const req = new NextRequest(`http://localhost:3000/api/unsubscribe?email=${encodeURIComponent(xssPayload)}`);
    const res = await GET(req);

    expect(res.status).toBe(200);
    const html = await res.text();

    // Must be escaped
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('3. POST request mutates database: records suppression and marks lead UNSUBSCRIBED', async () => {
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 10, channelTitle: 'My Channel', channelId: 'UC123' }]),
        }),
      }),
    });

    mockDbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue([]),
      }),
    });

    const updateSets: any[] = [];
    mockDbUpdate.mockReturnValue({
      set: vi.fn().mockImplementation((val) => {
        updateSets.push(val);
        return {
          where: vi.fn().mockResolvedValue([]),
        };
      }),
    });

    const req = new NextRequest('http://localhost:3000/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'creator@channel.com', leadId: '10' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify DB insert called on suppressions
    expect(mockDbInsert).toHaveBeenCalled();

    // Verify lead status updated to UNSUBSCRIBED
    const leadUpdate = updateSets.find((u) => u.outreachStatus === 'UNSUBSCRIBED');
    expect(leadUpdate).toBeDefined();
    expect(leadUpdate.suppressionStatus).toBe(true);
  });

  it('4. POST request fails honestly with HTTP 500 when database operation throws (BUG-04 fail-honest)', async () => {
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(new Error('Postgres connection pool exhausted')),
        }),
      }),
    });

    const req = new NextRequest('http://localhost:3000/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'creator@channel.com' }),
    });

    const res = await POST(req);
    // Must return HTTP 500 and NOT claim success!
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('5. Mismatched leadId does not update unverified lead (BUG-29)', async () => {
    let selectCall = 0;
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockImplementation(() => {
            selectCall++;
            if (selectCall === 1) {
              // Contact check: email does NOT belong to leadId 999
              return Promise.resolve([]);
            }
            // Contact check by email alone: no match found
            return Promise.resolve([]);
          }),
        }),
      }),
    });

    mockDbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue([]),
      }),
    });

    const req = new NextRequest('http://localhost:3000/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'attacker@channel.com', leadId: '999' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Suppressions table is still inserted
    expect(mockDbInsert).toHaveBeenCalled();

    // But lead 999 is NOT updated!
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });
});

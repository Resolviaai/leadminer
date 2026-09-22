import { describe, expect, it } from 'vitest';
import { calculateRemainingSlots } from '../../src/workers/planner.worker';
import { aggregateQualificationStatus } from '../../src/services/qualification/qualification.service';
import { decodeGmailBody } from '../../src/workers/replies.worker';

describe('Safety hardening helpers', () => {
  it('counts sent and scheduled slots cumulatively', () => {
    expect(calculateRemainingSlots(10, 10, 25)).toBe(5);
    expect(calculateRemainingSlots(30, 10, 25)).toBe(0);
  });

  it('keeps a lead qualified when any contact is deliverable', () => {
    expect(
      aggregateQualificationStatus([
        { qualified: true, reason: 'valid' },
        { qualified: false, reason: 'invalid' },
      ])
    ).toBe('QUALIFIED');
    expect(aggregateQualificationStatus([{ qualified: false, reason: 'invalid' }])).toBe('DISQUALIFIED');
  });

  it('decodes nested Gmail MIME body parts for full-text opt-out scanning', () => {
    const encoded = Buffer.from('Long reply... please remove me from your list').toString('base64url');
    expect(
      decodeGmailBody({
        parts: [{ mimeType: 'text/plain', body: { data: encoded } }],
      })
    ).toContain('please remove me from your list');
  });
});

import { describe, it, expect } from 'vitest';
import { OPT_OUT_REGEX } from '../../src/services/replies/reply.detector';

describe('N-P1-5 / D7 Expanded Opt-Out & Unsubscribe Intent Detection Suite', () => {
  it('detects standalone STOP variations', () => {
    expect(OPT_OUT_REGEX.test('STOP')).toBe(true);
    expect(OPT_OUT_REGEX.test('stop')).toBe(true);
    expect(OPT_OUT_REGEX.test('stop.')).toBe(true);
    expect(OPT_OUT_REGEX.test('Stop!')).toBe(true);
    expect(OPT_OUT_REGEX.test('  STOP  ')).toBe(true);
    expect(OPT_OUT_REGEX.test('please stop')).toBe(true);
    expect(OPT_OUT_REGEX.test('Please stop.')).toBe(true);
  });

  it('detects missing variants identified in chief architect re-audit', () => {
    expect(OPT_OUT_REGEX.test('Not interested')).toBe(true);
    expect(OPT_OUT_REGEX.test("I'm not interested in this")).toBe(true);
    expect(OPT_OUT_REGEX.test('No thanks')).toBe(true);
    expect(OPT_OUT_REGEX.test('No thanks, we already have an editor')).toBe(true);
    expect(OPT_OUT_REGEX.test('Do not email me')).toBe(true);
    expect(OPT_OUT_REGEX.test("Don't email me again")).toBe(true);
    expect(OPT_OUT_REGEX.test('Never contact me again')).toBe(true);
    expect(OPT_OUT_REGEX.test('Cease and desist')).toBe(true);
    expect(OPT_OUT_REGEX.test('Please remove my email')).toBe(true);
    expect(OPT_OUT_REGEX.test('Already unsubscribed')).toBe(true);
    expect(OPT_OUT_REGEX.test("Don't send me emails")).toBe(true);
    expect(OPT_OUT_REGEX.test('Do not send me emails')).toBe(true);
    expect(OPT_OUT_REGEX.test('Please take me off your list')).toBe(true);
    expect(OPT_OUT_REGEX.test('Leave me alone')).toBe(true);
    expect(OPT_OUT_REGEX.test('Unsubscribe me please')).toBe(true);
  });

  it('detects stop with outreach actions', () => {
    expect(OPT_OUT_REGEX.test('Stop emailing me')).toBe(true);
    expect(OPT_OUT_REGEX.test('Please stop contacting our team')).toBe(true);
    expect(OPT_OUT_REGEX.test('Stop sending these messages')).toBe(true);
    expect(OPT_OUT_REGEX.test('reply STOP to cancel')).toBe(true);
  });

  it('never triggers false positives on ordinary conversational English containing stop', () => {
    expect(OPT_OUT_REGEX.test("Let's stop by your booth at VidCon!")).toBe(false);
    expect(OPT_OUT_REGEX.test("Can't stop watching your latest videos, super cool stuff.")).toBe(false);
    expect(OPT_OUT_REGEX.test('We should not stop editing until the deadline.')).toBe(false);
    expect(OPT_OUT_REGEX.test('Next stop is Los Angeles for the premiere.')).toBe(false);
    expect(OPT_OUT_REGEX.test('Sounds great! Send over the samples.')).toBe(false);
  });
});

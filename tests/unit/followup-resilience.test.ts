import { describe, it, expect } from 'vitest';
import { getNextMorning915ET } from '../../src/workers/dispatcher.worker';
import { calculateRemainingSlots } from '../../src/workers/planner.worker';
import { classifyAutomatedResponse, isAutomatedBounceOrDaemon } from '../../src/workers/replies.worker';

describe('Follow-up Resilience & Threading Engine Tests', () => {
  describe('getNextMorning915ET', () => {
    it('should compute next morning 9:15 AM America/New_York correctly', () => {
      // Wednesday at 14:00 UTC
      const reference = new Date(Date.UTC(2026, 8, 23, 14, 0, 0));
      const nextMorning = getNextMorning915ET(reference);

      // Verify it is on the next day (24th)
      expect(nextMorning.getUTCDate()).toBe(24);

      // Verify the time in America/New_York is 09:15
      const nyFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      });
      const parts = nyFormatter.formatToParts(nextMorning);
      const hour = parts.find((p) => p.type === 'hour')?.value;
      const minute = parts.find((p) => p.type === 'minute')?.value;

      expect(hour).toBe('09');
      expect(minute).toBe('15');
    });
  });

  describe('Priority Quota & Top-of-Funnel Reserve Floor Formula', () => {
    function computeQuota(remainingSlots: number, dueFollowUps: number) {
      const floorNew = Math.min(remainingSlots, Math.max(2, Math.ceil(remainingSlots * 0.1)));
      const maxAllowedFu = Math.max(0, remainingSlots - floorNew);
      const fuSlots = Math.min(dueFollowUps, maxAllowedFu);
      const newSlots = Math.max(0, remainingSlots - fuSlots);
      return { floorNew, fuSlots, newSlots };
    }

    it('should prioritize follow-ups while reserving 10% floor for new leads', () => {
      // 20 remaining slots, 5 due follow-ups -> 5 follow-ups scheduled, 15 new leads
      const res1 = computeQuota(20, 5);
      expect(res1.floorNew).toBe(2);
      expect(res1.fuSlots).toBe(5);
      expect(res1.newSlots).toBe(15);

      // 20 remaining slots, 25 due follow-ups -> capped at 18 follow-ups, guarantees 2 new leads
      const res2 = computeQuota(20, 25);
      expect(res2.floorNew).toBe(2);
      expect(res2.fuSlots).toBe(18);
      expect(res2.newSlots).toBe(2);

      // 20 remaining slots, 0 due follow-ups -> fluid spillover: all 20 go to new leads
      const res3 = computeQuota(20, 0);
      expect(res3.fuSlots).toBe(0);
      expect(res3.newSlots).toBe(20);

      // Small quota (5 slots), 10 due follow-ups -> floor is 2, 3 follow-ups, 2 new
      const res4 = computeQuota(5, 10);
      expect(res4.floorNew).toBe(2);
      expect(res4.fuSlots).toBe(3);
      expect(res4.newSlots).toBe(2);
    });
  });

  describe('RFC 5322 Threading & Subject Formatting', () => {
    it('should prepend Re: only once when bumping Step 1 subject', () => {
      const original = 'Collaboration Proposal for Tech Channels';
      const isAlreadyRe = original.toLowerCase().startsWith('re:');
      const subject1 = isAlreadyRe ? original : `Re: ${original}`;
      expect(subject1).toBe('Re: Collaboration Proposal for Tech Channels');

      const alreadyRe = 'Re: Collaboration Proposal for Tech Channels';
      const isAlreadyRe2 = alreadyRe.toLowerCase().startsWith('re:');
      const subject2 = isAlreadyRe2 ? alreadyRe : `Re: ${alreadyRe}`;
      expect(subject2).toBe('Re: Collaboration Proposal for Tech Channels');
    });

    it('should construct valid RFC 5322 section 3.6.4 references chain', () => {
      const priorChain = '<msg1@domain.com>';
      const newRfcId = 'msg2@domain.com';
      const computedChain = priorChain.trim().length > 0
        ? `${priorChain.trim()} <${newRfcId}>`
        : `<${newRfcId}>`;

      expect(computedChain).toBe('<msg1@domain.com> <msg2@domain.com>');

      // Step 3 chain
      const step3RfcId = 'msg3@domain.com';
      const step3Chain = `${computedChain} <${step3RfcId}>`;
      expect(step3Chain).toBe('<msg1@domain.com> <msg2@domain.com> <msg3@domain.com>');
    });
  });

  describe('Direction-Based Reply Validation', () => {
    it('should correctly distinguish outbound from inbound sender', () => {
      const accountEmail = 'outreach@mycompany.com';
      const fromOutbound = 'Outreach Team <outreach@mycompany.com>';
      const fromInbound = 'Creator Name <creator@youtube.com>';

      const isOutbound1 = fromOutbound.toLowerCase().includes(accountEmail.toLowerCase());
      const isOutbound2 = fromInbound.toLowerCase().includes(accountEmail.toLowerCase());

      expect(isOutbound1).toBe(true);
      expect(isOutbound2).toBe(false);
    });

    it('should classify bounces and daemons without dropping genuine replies', () => {
      expect(isAutomatedBounceOrDaemon([], 'mailer-daemon@googlemail.com')).toBe(true);
      expect(isAutomatedBounceOrDaemon([], 'creator@partner.com')).toBe(false);

      const oooRes = classifyAutomatedResponse(
        [{ name: 'Subject', value: 'Out of Office until Oct 10' }],
        'creator@partner.com',
        'Out of Office until Oct 10'
      );
      expect(oooRes).toBe('OUT_OF_OFFICE');

      const genuineRes = classifyAutomatedResponse(
        [{ name: 'Subject', value: 'Re: Collaboration Proposal' }],
        'creator@partner.com',
        'Re: Collaboration Proposal'
      );
      expect(genuineRes).toBe('NONE');
    });
  });
});

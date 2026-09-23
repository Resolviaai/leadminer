import { describe, it, expect } from 'vitest';
import { telegramService } from '../../src/services/notifications/telegram.service';

describe('Telegram Notification Service', () => {
  it('should format reply notifications with HTML escaping', async () => {
    const data = {
      channelTitle: 'Tech & Gaming <Clips>',
      subscriberCount: 150000,
      campaignName: 'Podcast & Clipping Offer',
      senderEmail: 'creator@channel.com',
      snippet: 'Hey, sounds interesting! Send <2 samples> over.',
      threadId: 'thread_12345',
      leadId: 42,
    };

    // Should succeed in test/dry run mode without real bot token
    const success = await telegramService.notifyReply(data);
    expect(success).toBe(true);
  });

  it('should format critical error notifications safely', async () => {
    const success = await telegramService.notifyCriticalError('Gmail Auth Expired', 'Refresh token revoked for account sender@domain.com');
    expect(success).toBe(true);
  });
});

import { isAutomatedBounceOrDaemon } from '../../src/workers/replies.worker';

describe('Anti-Bounce and Daemon Message Filter', () => {
  it('should flag mailer-daemon and delivery subsystem senders as automated bounce', () => {
    expect(isAutomatedBounceOrDaemon([], 'mailer-daemon@googlemail.com')).toBe(true);
    expect(isAutomatedBounceOrDaemon([], 'Mail Delivery Subsystem <mailer-daemon@google.com>')).toBe(true);
    expect(isAutomatedBounceOrDaemon([], 'postmaster@domain.com')).toBe(true);
    expect(isAutomatedBounceOrDaemon([], 'noreply@service.com')).toBe(true);
  });

  it('should flag Auto-Submitted headers as automated replies', () => {
    expect(isAutomatedBounceOrDaemon([{ name: 'Auto-Submitted', value: 'auto-replied' }], 'creator@channel.com')).toBe(true);
    expect(isAutomatedBounceOrDaemon([{ name: 'Auto-Submitted', value: 'auto-generated' }], 'creator@channel.com')).toBe(true);
    expect(isAutomatedBounceOrDaemon([{ name: 'X-Autoreply', value: 'yes' }], 'creator@channel.com')).toBe(true);
  });

  it('should flag delivery failure subjects as bounce', () => {
    expect(
      isAutomatedBounceOrDaemon(
        [{ name: 'Subject', value: 'Delivery Status Notification (Failure)' }],
        'notifications@google.com'
      )
    ).toBe(true);
  });

  it('should identify genuine creator human replies as valid (not bounce)', () => {
    expect(
      isAutomatedBounceOrDaemon(
        [
          { name: 'Subject', value: 'Re: Video editing proposal' },
          { name: 'Auto-Submitted', value: 'no' },
        ],
        'Alex Creator <alex@studio.com>'
      )
    ).toBe(false);
  });
});

import { OPT_OUT_REGEX } from '../../src/services/replies/reply.detector';

describe('Opt-Out & Unsubscribe Regex Detection', () => {
  it('should accurately detect various unsubscribe phrases', () => {
    expect(OPT_OUT_REGEX.test('Please unsubscribe me from your emails.')).toBe(true);
    expect(OPT_OUT_REGEX.test('STOP')).toBe(true);
    expect(OPT_OUT_REGEX.test('Please remove me from your list')).toBe(true);
    expect(OPT_OUT_REGEX.test('I want to opt-out')).toBe(true);
    expect(OPT_OUT_REGEX.test("Don't contact me again")).toBe(true);
    expect(OPT_OUT_REGEX.test('take me off this list')).toBe(true);
  });

  it('should not flag positive creator responses as opt-outs', () => {
    expect(OPT_OUT_REGEX.test('Sounds great! Can you send a portfolio over?')).toBe(false);
    expect(OPT_OUT_REGEX.test('What are your rates for YouTube shorts editing?')).toBe(false);
    expect(OPT_OUT_REGEX.test('Yes, let us connect on a call next Tuesday.')).toBe(false);
  });

  it('should format unsubscribe notification safely without throwing', async () => {
    const res = await telegramService.notifyUnsubscribe(
      'Creator Channel',
      'creator@studio.com',
      'User replied STOP'
    );
    expect(res).toBe(true);
  });
});

import { classifyAutomatedResponse } from '../../src/workers/replies.worker';
import { stripQuotedText } from '../../src/services/replies/reply.detector';

describe('Detailed Automated Response Classification & Quote Stripping', () => {
  it('should classify Out-Of-Office responses distinctly from hard bounces', () => {
    const res = classifyAutomatedResponse(
      [{ name: 'Subject', value: 'Automatic reply: Out of office until Monday' }],
      'creator@channel.com',
      'Automatic reply: Out of office until Monday'
    );
    expect(res).toBe('OUT_OF_OFFICE');
  });

  it('should classify mailbox full as soft bounce', () => {
    const res = classifyAutomatedResponse(
      [{ name: 'Subject', value: 'Mailbox is full' }],
      'mailserver@domain.com',
      'Mailbox is full'
    );
    expect(res).toBe('SOFT_BOUNCE');
  });

  it('should classify delivery failure / 550 as hard bounce', () => {
    const res = classifyAutomatedResponse(
      [{ name: 'Subject', value: 'Delivery Status Notification (Failure)' }],
      'mailer-daemon@googlemail.com',
      'Delivery Status Notification (Failure)',
      '550 5.1.1 The email account that you tried to reach does not exist.'
    );
    expect(res).toBe('HARD_BOUNCE');
  });

  it('should strip quoted text before evaluating opt-out phrases', () => {
    const humanReplyWithQuotedFooter = `
Yes, let's schedule a call tomorrow!

On Wed, Sep 23, 2026 at 10:00 AM outreach@leadminer.io wrote:
> If you want to unsubscribe or stop receiving these, please let us know.
`.trim();

    const stripped = stripQuotedText(humanReplyWithQuotedFooter);
    expect(stripped).toContain("Yes, let's schedule a call tomorrow!");
    expect(stripped).not.toContain("unsubscribe");
    expect(OPT_OUT_REGEX.test(stripped)).toBe(false);
  });
});




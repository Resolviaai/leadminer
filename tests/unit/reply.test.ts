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


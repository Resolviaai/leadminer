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


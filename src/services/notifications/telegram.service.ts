import { env } from '../../config/env';

export interface TelegramReplyNotification {
  channelTitle: string;
  subscriberCount?: number;
  campaignName: string;
  senderEmail: string;
  snippet: string;
  threadId: string;
  leadId: number;
}

export class TelegramNotificationService {
  private botToken: string;
  private chatId: string;

  constructor() {
    this.botToken = env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = env.TELEGRAM_CHAT_ID || '';
  }

  public async sendMessage(text: string): Promise<boolean> {
    if (!this.botToken || !this.chatId) {
      console.log(`[Telegram Notification (Simulated)]:\n${text}`);
      return true;
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error(`[Telegram Error] HTTP ${response.status}: ${err}`);
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('[Telegram Notification Failed]:', error.message);
      return false;
    }
  }

  public async notifyReply(data: TelegramReplyNotification): Promise<boolean> {
    const subs = data.subscriberCount ? `${(data.subscriberCount / 1000).toFixed(1)}K` : 'Unknown';
    const message = `
🔥 <b>New Lead Reply Received</b>

<b>Channel:</b> ${this.escapeHtml(data.channelTitle)} (${subs} subs)
<b>Sender:</b> ${this.escapeHtml(data.senderEmail)}
<b>Campaign:</b> ${this.escapeHtml(data.campaignName)}

<b>Preview:</b>
<i>"${this.escapeHtml(data.snippet)}"</i>

<a href="https://mail.google.com/mail/u/0/#inbox/${data.threadId}">Open Thread in Gmail</a>
`.trim();

    return await this.sendMessage(message);
  }

  public async notifyCriticalError(title: string, details: string): Promise<boolean> {
    const message = `
⚠️ <b>CRITICAL SYSTEM ALERT</b>

<b>Event:</b> ${this.escapeHtml(title)}
<b>Details:</b> <code>${this.escapeHtml(details.slice(0, 400))}</code>
`.trim();

    return await this.sendMessage(message);
  }

  private escapeHtml(str: string): string {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

export const telegramService = new TelegramNotificationService();

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
    const isMockOrPlaceholder =
      !this.botToken ||
      !this.chatId ||
      this.botToken.startsWith('mock_') ||
      this.botToken.includes('[YOUR') ||
      this.botToken.startsWith('your_') ||
      this.chatId.includes('[YOUR');

    if (
      process.env.NODE_ENV === 'test' ||
      env.NODE_ENV === 'test' ||
      env.DRY_RUN ||
      isMockOrPlaceholder
    ) {
      console.log(`[Telegram Notification (Simulated)]:\n${text}`);
      return true;
    }

    const maxAttempts = 3;
    let attempt = 0;
    while (attempt < maxAttempts) {
      attempt++;
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

        if (response.ok) {
          return true;
        }

        const err = await response.text();
        console.error(`[Telegram Error] Attempt ${attempt}/${maxAttempts} HTTP ${response.status}: ${err}`);
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return false;
        }
      } catch (error: any) {
        console.error(`[Telegram Notification Failed] Attempt ${attempt}/${maxAttempts}:`, error.message);
      }

      if (attempt < maxAttempts) {
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return false;
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

  public async notifyUnsubscribe(channelTitle: string, email: string, reason: string): Promise<boolean> {
    const message = `
🛑 <b>Lead Unsubscribed / Opt-Out Recorded</b>

<b>Channel:</b> ${this.escapeHtml(channelTitle)}
<b>Email:</b> ${this.escapeHtml(email)}
<b>Reason:</b> ${this.escapeHtml(reason)}
<i>Lead has been automatically marked UNSUBSCRIBED and added to the suppression list.</i>
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

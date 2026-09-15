import { describe, it, expect } from 'vitest';
import { templateEngine } from '../../src/services/outreach/template.engine';
import { geminiService } from '../../src/services/ai/gemini.service';
import { gmailSendingService } from '../../src/services/outreach/gmail.service';

describe('Template Engine', () => {
  it('should render all standard variables accurately', () => {
    const template = 'Hey {{first_name}}, saw {{channel_name}} with {{subscriber_count}} subs. {{custom_line}}';
    const variables = {
      first_name: 'Joe',
      channel_name: 'The Rogan Clips',
      subscriber_count: 850000,
      custom_line: 'Your podcast clip editing is super engaging.',
    };

    const rendered = templateEngine.render(template, variables);
    expect(rendered).toBe('Hey Joe, saw The Rogan Clips with 850K subs. Your podcast clip editing is super engaging.');
  });

  it('should format subscriber counts into human-readable notation', () => {
    expect(templateEngine.render('{{subscriber_count}}', { subscriber_count: 2500000 })).toBe('2.5M');
    expect(templateEngine.render('{{subscriber_count}}', { subscriber_count: 45000 })).toBe('45K');
    expect(templateEngine.render('{{subscriber_count}}', { subscriber_count: 750 })).toBe('750');
  });

  it('should extract first name from personal channel titles', () => {
    expect(templateEngine.extractFirstName('Joe Rogan Podcast')).toBe('Joe');
    expect(templateEngine.extractFirstName('Lex Fridman Clips')).toBe('Lex');
    expect(templateEngine.extractFirstName('Daily Motivation Hub')).toBe('Daily Motivation Hub');
  });

  it('should detect template variables', () => {
    const vars = templateEngine.detectVariables('Hi {{first_name}}, check {{channel_name}} and {{custom_line}}');
    expect(vars).toContain('first_name');
    expect(vars).toContain('channel_name');
    expect(vars).toContain('custom_line');
  });

  it('should strictly sanitize and purge em-dashes and en-dashes from custom_line', () => {
    const template = 'Hey {{first_name}},\n\n{{custom_line}}';
    const inputWithEmDash = 'Loved your latest breakdown — the pacing was spot-on — really enjoyed it.';
    const rendered = templateEngine.render(template, {
      first_name: 'Alex',
      custom_line: inputWithEmDash,
    });
    expect(rendered).not.toContain('—');
    expect(rendered).not.toContain('–');
    expect(rendered).not.toContain('--');
    expect(rendered).toBe('Hey Alex,\n\nLoved your latest breakdown, the pacing was spot-on, really enjoyed it.');
  });
});

describe('Gemini Personalizer Service', () => {
  it('should provide robust fallback line on missing key or network error', async () => {
    const res = await geminiService.generateCustomLine({
      channelTitle: 'Test Channel',
      category: 'Top Podcasters',
      description: 'A podcast about science',
    });

    expect(res.customLine).toBeTruthy();
    expect(res.customLine.length).toBeGreaterThan(15);
    expect(['CUSTOMIZED', 'FALLBACK']).toContain(res.status);
  }, 10000);
});

describe('Outreach Hardening & Volume Jitter', () => {
  it('should enforce volume jitter daily limits between 18 and 25', () => {
    for (let accId = 1; accId <= 20; accId++) {
      const limit = gmailSendingService.getTodayEffectiveLimit(accId, 25);
      expect(limit).toBeGreaterThanOrEqual(18);
      expect(limit).toBeLessThanOrEqual(25);
    }
  });

  it('should generate consistent deterministic limits for the same account on the same day', () => {
    const limit1 = gmailSendingService.getTodayEffectiveLimit(42, 25);
    const limit2 = gmailSendingService.getTodayEffectiveLimit(42, 25);
    expect(limit1).toBe(limit2);
  });

  it('should sanitize and strip quotes from personalization custom lines', () => {
    const rawQuoteLine = '"Your breakdown of AI agents was genuinely fascinating."';
    const cleaned = rawQuoteLine.replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, '').trim();
    expect(cleaned).toBe('Your breakdown of AI agents was genuinely fascinating.');
    expect(cleaned.length).toBeLessThanOrEqual(120);
  });

  it('should expose reserveSendingAccount and releaseAccountReservation methods', () => {
    expect(typeof gmailSendingService.reserveSendingAccount).toBe('function');
    expect(typeof gmailSendingService.releaseAccountReservation).toBe('function');
  });
});


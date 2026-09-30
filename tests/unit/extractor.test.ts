import { describe, it, expect } from 'vitest';
import { emailExtractor } from '../../src/services/extraction/email.extractor';
import { socialExtractor } from '../../src/services/extraction/social.extractor';

describe('Email Extractor', () => {
  it('should extract clean business emails from channel description text', () => {
    const text = 'Welcome to my channel! For business collabs contact: colabs@creatorstudio.io or manager@agency.com.';
    const results = emailExtractor.extractEmails(text);
    expect(results).toHaveLength(2);
    expect(results[0].email).toBe('colabs@creatorstudio.io');
    expect(results[0].role).toBe('BUSINESS');
    expect(results[0].priorityScore).toBe(100);
    expect(results[1].email).toBe('manager@agency.com');
    expect(results[1].role).toBe('MANAGEMENT');
    expect(results[1].priorityScore).toBe(95);
  });

  it('should remove trailing punctuation like periods, colons, and brackets', () => {
    const text = 'Inquiries: (contact@domain.co.uk).';
    const results = emailExtractor.extractEmails(text);
    expect(results[0].email).toBe('contact@domain.co.uk');
  });

  it('should reject file extensions (false positives)', () => {
    const text = 'Assets downloaded: banner@2x.png, thumbnail@large.jpg';
    const results = emailExtractor.extractEmails(text);
    expect(results).toHaveLength(0);
  });

  it('should reject blocked platform domains and mock addresses', () => {
    const text = 'Do not write to support@youtube.com or admin@google.com or test@example.com';
    const results = emailExtractor.extractEmails(text);
    expect(results).toHaveLength(0);
  });

  it('should preserve and properly classify commercial support, info, and admin inboxes', () => {
    const text = 'Reach our team at info@creatorbrand.co, agency at admin@talentgroup.net, or support@creatorsoftware.com';
    const results = emailExtractor.extractEmails(text);
    expect(results).toHaveLength(3);

    const info = results.find((r) => r.email === 'info@creatorbrand.co');
    expect(info).toBeDefined();
    expect(info?.role).toBe('GENERIC');
    expect(info?.priorityScore).toBe(50);

    const admin = results.find((r) => r.email === 'admin@talentgroup.net');
    expect(admin).toBeDefined();
    expect(admin?.role).toBe('GENERIC');

    const support = results.find((r) => r.email === 'support@creatorsoftware.com');
    expect(support).toBeDefined();
    expect(support?.role).toBe('SUPPORT');
    expect(support?.priorityScore).toBe(10);
  });

  it('should boost generic inboxes to BUSINESS when context indicates sponsorships or business inquiries', () => {
    const text = 'For business inquiries and sponsorship deals, contact: hello@creatorhub.com';
    const results = emailExtractor.extractEmails(text);
    expect(results).toHaveLength(1);
    expect(results[0].email).toBe('hello@creatorhub.com');
    expect(results[0].role).toBe('BUSINESS');
    expect(results[0].priorityScore).toBe(100);
  });

  it('should de-obfuscate bracketed and spaced email representations', () => {
    const text = `
      Collab with us:
      1. business [at] creator (dot) com
      2. sponsor (at) talentagency [dot] org
      3. partnerships AT agencymedia DOT io
    `;
    const results = emailExtractor.extractEmails(text);
    const emails = results.map((r) => r.email);
    expect(emails).toContain('business@creator.com');
    expect(emails).toContain('sponsor@talentagency.org');
    expect(emails).toContain('partnerships@agencymedia.io');
  });

  it('should strip zero-width characters and decode HTML and fullwidth entities', () => {
    const text = 'Contact: brand\u200B\u200C@\u200Dstudios.com or press&#64;media&#46;com or team＠agency．co';
    const results = emailExtractor.extractEmails(text);
    const emails = results.map((r) => r.email);
    expect(emails).toContain('brand@studios.com');
    expect(emails).toContain('press@media.com');
    expect(emails).toContain('team@agency.co');
  });

  it('should flag possibleDomainTypo without dropping the email', () => {
    const text = 'Direct email: partnerships@gmial.com';
    const results = emailExtractor.extractEmails(text);
    expect(results).toHaveLength(1);
    expect(results[0].email).toBe('partnerships@gmial.com');
    expect(results[0].possibleDomainTypo).toBe(true);
    expect(results[0].confidence).toBeLessThan(0.7);
  });

  it('should extract explicit mailto: links with high confidence', () => {
    const html = '<p>Send pitch to <a href="mailto:talent@superagency.com">our agent</a></p>';
    const results = emailExtractor.extractEmails(html);
    expect(results).toHaveLength(1);
    expect(results[0].email).toBe('talent@superagency.com');
    expect(results[0].source).toBe('mailto');
    expect(results[0].confidence).toBe(0.98);
  });

  it('should reject malformed domains violating DNS and RFC structure', () => {
    const text = 'Bad: user@foo..com, user@-bad.com, user@bad-.com, user@.com, user@domain';
    const results = emailExtractor.extractEmails(text);
    expect(results).toHaveLength(0);
  });

  it('should de-obfuscate slash and dash patterns and auto-complete missing provider TLD', () => {
    const text = `
      Slash: bookings / at / studio.com
      Dash: sponsor - at - brandreach.io
      Missing TLD: collaborations [at] gmail
      Spaced Missing TLD: partnerships at yahoo
    `;
    const results = emailExtractor.extractEmails(text);
    const emails = results.map((r) => r.email);

    expect(emails).toContain('bookings@studio.com');
    expect(emails).toContain('sponsor@brandreach.io');
    expect(emails).toContain('collaborations@gmail.com');
    expect(emails).toContain('partnerships@yahoo.com');
  });
});

describe('Social Extractor', () => {
  it('should extract social handles and Discord links', () => {
    const text = `
      Check out my links:
      Instagram: https://instagram.com/viral_edits
      Twitter: https://x.com/viraledits
      TikTok: https://tiktok.com/@viraledits_official
      Discord: https://discord.gg/supercommunity
      Website: https://myportfoliosite.com/creators
    `;

    const socials = socialExtractor.extractSocials(text);
    expect(socials.instagram).toBe('viral_edits');
    expect(socials.twitter).toBe('viraledits');
    expect(socials.tiktok).toBe('viraledits_official');
    expect(socials.discord).toBe('https://discord.gg/supercommunity');
    expect(socials.website).toBe('https://myportfoliosite.com/creators');
  });

  it('should extract handles formatted with shorthand labels', () => {
    const text = 'For updates, IG: @podcast_clips, Twitter: @podcastclips';
    const socials = socialExtractor.extractSocials(text);
    expect(socials.instagram).toBe('podcast_clips');
    expect(socials.twitter).toBe('podcastclips');
  });

  it('should extract ALL websites and social links without premature break', () => {
    const text = `
      Check our merch at https://creatorstore.com and listen to our podcast at https://daily-cast.fm/listen.
      Also follow second instagram: https://instagram.com/backup_channel and second twitter https://x.com/backup_tw!
    `;
    const socials = socialExtractor.extractSocials(text);
    const websites = socials.items.filter((i) => i.type === 'WEBSITE');
    const igs = socials.items.filter((i) => i.type === 'INSTAGRAM');
    const tws = socials.items.filter((i) => i.type === 'TWITTER_X');

    expect(websites).toHaveLength(2);
    expect(websites[0].value).toBe('https://creatorstore.com');
    expect(websites[1].value).toBe('https://daily-cast.fm/listen');
    expect(igs).toHaveLength(1);
    expect(igs[0].normalizedValue).toBe('backup_channel');
    expect(tws).toHaveLength(1);
    expect(tws[0].normalizedValue).toBe('backup_tw');
  });

  it('should extract WhatsApp from wa.me and api.whatsapp.com URL parameters', () => {
    const text = `
      Chat with my team: https://wa.me/14155552671
      Or customer service: https://api.whatsapp.com/send?phone=18005550199&text=Hello%20Creator
      Direct text: WhatsApp: +1 415 555 9999
    `;
    const socials = socialExtractor.extractSocials(text);
    expect(socials.whatsapp).toBe('+14155552671');

    const waItems = socials.items.filter((i) => i.type === 'WHATSAPP');
    expect(waItems).toHaveLength(3);
    expect(waItems.map((w) => w.normalizedValue)).toContain('+14155552671');
    expect(waItems.map((w) => w.normalizedValue)).toContain('+18005550199');
    expect(waItems.map((w) => w.normalizedValue)).toContain('+14155559999');
  });

  it('should use strict hostname exclusion for websites to avoid false negatives', () => {
    const text = `
      Legitimate creator sites:
      https://myyoutube.com/channel
      https://linktree-alternative.com/profile
      Excluded platforms:
      https://www.youtube.com/watch?v=12345
      https://subdomain.linktr.ee/mycreator
    `;
    const socials = socialExtractor.extractSocials(text);
    const websites = socials.items.filter((i) => i.type === 'WEBSITE');
    const urls = websites.map((w) => w.value);

    expect(urls).toContain('https://myyoutube.com/channel');
    expect(urls).toContain('https://linktree-alternative.com/profile');
    expect(urls).not.toContain('https://www.youtube.com/watch?v=12345');
    expect(urls).not.toContain('https://subdomain.linktr.ee/mycreator');
  });

  it('should extract explicit tel: links and phone numbers', () => {
    const text = 'Call us at <a href="tel:+18005550123">Support</a> or phone: 800-555-0199';
    const socials = socialExtractor.extractSocials(text);
    expect(socials.phone).toBeDefined();

    const phones = socials.items.filter((i) => i.type === 'PHONE');
    expect(phones.length).toBeGreaterThanOrEqual(1);
    expect(phones.some((p) => p.normalizedValue.includes('8005550123') || p.normalizedValue.includes('8005550199'))).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { emailExtractor } from '../../src/services/extraction/email.extractor';
import { socialExtractor } from '../../src/services/extraction/social.extractor';

describe('Email Extractor', () => {
  it('should extract clean business emails from channel description text', () => {
    const text = 'Welcome to my channel! For business collabs contact: colabs@creatorstudio.io or manager@agency.com.';
    const results = emailExtractor.extractEmails(text);
    expect(results).toHaveLength(2);
    expect(results[0].email).toBe('colabs@creatorstudio.io');
    expect(results[1].email).toBe('manager@agency.com');
  });

  it('should remove trailing punctuation like periods and colons', () => {
    const text = 'Inquiries: contact@domain.co.uk.';
    const results = emailExtractor.extractEmails(text);
    expect(results[0].email).toBe('contact@domain.co.uk');
  });

  it('should reject file extensions (false positives)', () => {
    const text = 'Assets downloaded: banner@2x.png, thumbnail@large.jpg';
    const results = emailExtractor.extractEmails(text);
    expect(results).toHaveLength(0);
  });

  it('should reject blocked platform domains and support prefixes', () => {
    const text = 'Do not write to support@youtube.com or admin@google.com or help@test.com';
    const results = emailExtractor.extractEmails(text);
    expect(results).toHaveLength(0);
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
});

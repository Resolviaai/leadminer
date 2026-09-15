import { describe, it, expect } from 'vitest';
import { templateEngine } from '../../src/services/outreach/template.engine';
import { geminiService } from '../../src/services/ai/gemini.service';

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
  });
});

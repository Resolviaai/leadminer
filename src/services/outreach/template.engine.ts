export interface TemplateVariables {
  first_name?: string;
  channel_name?: string;
  channel_url?: string;
  subscriber_count?: number | string;
  website?: string;
  custom_line?: string;
  [key: string]: any;
}

export class TemplateEngine {
  public render(templateString: string, variables: TemplateVariables): string {
    if (!templateString) return '';

    let rendered = templateString;

    // Substitute standard variables
    const cleanVars: Record<string, string> = {
      first_name: variables.first_name || variables.channel_name || 'there',
      channel_name: variables.channel_name || 'your channel',
      channel_url: variables.channel_url || '',
      subscriber_count: this.formatSubscribers(variables.subscriber_count),
      website: variables.website || '',
      custom_line: variables.custom_line || 'I really enjoy the direction of your channel content.',
    };

    for (const [key, val] of Object.entries(cleanVars)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, val);
    }

    // Replace any remaining custom keys
    for (const [key, val] of Object.entries(variables)) {
      if (val !== undefined && val !== null) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        rendered = rendered.replace(regex, String(val));
      }
    }

    return rendered;
  }

  public detectVariables(templateString: string): string[] {
    const matches = templateString.match(/{{\s*([a-zA-Z0-9_]+)\s*}}/g) || [];
    return Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, '').trim())));
  }

  public extractFirstName(channelTitle: string): string {
    if (!channelTitle) return 'there';

    const clean = channelTitle.replace(/[\(\[].*?[\)\]]/g, '').trim();
    const parts = clean.split(/\s+/);

    // If channel is "Joe Rogan Clips" -> "Joe"
    if (parts.length > 0 && /^[a-zA-Z]{2,15}$/.test(parts[0])) {
      const nonNames = ['the', 'top', 'daily', 'official', 'best', 'mr', 'team'];
      if (!nonNames.includes(parts[0].toLowerCase())) {
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
      }
    }

    return channelTitle;
  }

  private formatSubscribers(subs?: number | string): string {
    if (subs === undefined || subs === null) return 'growing audience';
    const num = Number(subs);
    if (isNaN(num)) return String(subs);

    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toLocaleString();
  }
}

export const templateEngine = new TemplateEngine();

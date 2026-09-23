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
  /**
   * BUG-11: Strip CRLF from a variable value to prevent RFC 2822 header injection.
   * All variable substitutions pass through this before being inserted into the template.
   */
  private sanitizeVar(val: string): string {
    return val.replace(/[\r\n]+/g, ' ');
  }

  public render(templateString: string, variables: TemplateVariables, seed?: number): string {
    if (!templateString) return '';

    let rendered = templateString;

    const sanitizeNoEmDash = (s: string) =>
      s
        .replace(/\s*[—–]\s*/g, ', ')
        .replace(/--+/g, ', ')
        .replace(/,\s*,/g, ', ')
        .replace(/,\s*\./g, '.')
        .trim();

    const rawCustomLine = variables.custom_line || 'I really enjoy the direction of your channel content.';

    // BUG-11: sanitizeVar strips \r\n before substitution (CRLF injection guard)
    const cleanVars: Record<string, string> = {
      first_name: this.sanitizeVar(variables.first_name || variables.channel_name || 'there'),
      channel_name: this.sanitizeVar(variables.channel_name || 'your channel'),
      channel_url: this.sanitizeVar(variables.channel_url || ''),
      subscriber_count: this.formatSubscribers(variables.subscriber_count),
      website: this.sanitizeVar(variables.website || ''),
      custom_line: sanitizeNoEmDash(this.sanitizeVar(rawCustomLine)),
    };

    for (const [key, val] of Object.entries(cleanVars)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, val);
    }

    // Replace any remaining custom keys
    for (const [key, val] of Object.entries(variables)) {
      if (val !== undefined && val !== null) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        rendered = rendered.replace(regex, this.sanitizeVar(String(val)));
      }
    }

    // BUG-10: Resolve Spintax with optional deterministic seed (leadId)
    return this.spin(rendered, seed);
  }

  /**
   * Spintax processor: resolves {option1|option2|option3}.
   * BUG-10: accepts an optional numeric seed so the same leadId always picks the
   * same branch — prevents wording drift when a dispatch row is retried.
   * Falls back to Math.random() when no seed is provided.
   */
  public spin(text: string, seed?: number): string {
    if (!text) return '';
    const spintaxRegex = /\{([^{}]*?\|[^{}]*?)\}/g;
    let spun = text;
    let iteration = 0;

    // Simple seeded LCG (Knuth MMIX constants) — gives stable output per leadId
    let lcgState = seed !== undefined ? (seed | 0) : -1;
    const nextRand = (): number => {
      if (lcgState < 0) return Math.random();
      lcgState = Math.imul(lcgState, 6364136223846793005) + 1442695040888963407;
      return (Math.abs(lcgState) % 1000000) / 1000000;
    };

    while (spintaxRegex.test(spun) && iteration < 5) {
      spun = spun.replace(spintaxRegex, (_, optionsStr) => {
        let rawOptions: string[] = optionsStr.split('|');

        // Strip abtest / ab_test / ab-test tag if present as first element
        if (rawOptions.length > 0 && /^\s*ab[-_]?test\s*$/i.test(rawOptions[0])) {
          rawOptions.shift();
        }

        // If formatted with outer delimiters {|opt1|opt2|opt3|}, strip outer empty tokens
        if (rawOptions.length > 2 && rawOptions[0].trim() === '' && rawOptions[rawOptions.length - 1].trim() === '') {
          rawOptions = rawOptions.slice(1, -1);
        } else if (rawOptions.length > 1 && rawOptions[0].trim() === '' && rawOptions.slice(1).some((o: string) => o.trim().length > 0)) {
          rawOptions.shift();
        } else if (rawOptions.length > 2 && rawOptions[rawOptions.length - 1].trim() === '' && rawOptions.slice(0, -1).some((o: string) => o.trim().length > 0)) {
          rawOptions.pop();
        }

        const cleaned: string[] = rawOptions.map((o: string) => o.trim());
        const choices: string[] = cleaned.filter((o: string) => o.length > 0);
        const finalPool: string[] = choices.length > 0 ? choices : cleaned;

        return finalPool[Math.floor(nextRand() * finalPool.length)];
      });
      iteration++;
    }
    return spun;
  }

  public detectVariables(templateString: string): string[] {
    const matches = templateString.match(/{{\s*([a-zA-Z0-9_]+)\s*}}/g) || [];
    return Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, '').trim())));
  }

  /**
   * P3-4: Strip deceptive fake Re: / Fwd: on initial cold outreach step 1
   */
  public sanitizeSubject(subject: string, stepNumber: number = 1): string {
    let clean = this.sanitizeVar(subject).trim();
    if (stepNumber === 1) {
      clean = clean.replace(/^(re|fwd|fw):\s*/i, '');
    }
    return clean;
  }

  public extractFirstName(channelTitle: string, useNeutralFallback = false): string {
    if (!channelTitle) return 'there';

    const clean = channelTitle.replace(/[\(\[].*?[\)\]]/g, '').trim();
    const parts = clean.split(/\s+/);

    // If channel is "Joe Rogan Clips" -> "Joe"
    if (parts.length > 0 && /^[a-zA-Z]{2,15}$/.test(parts[0])) {
      const nonNames = ['the', 'top', 'daily', 'official', 'best', 'mr', 'team', 'channel', 'media', 'tv', 'news', 'clips', 'network', 'podcast', 'podcasts', 'show', 'hub'];
      if (!nonNames.includes(parts[0].toLowerCase())) {
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
      }
    }

    return useNeutralFallback ? 'there' : channelTitle;
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

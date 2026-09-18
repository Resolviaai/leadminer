export interface SpintaxPreset {
  category: "Opening" | "Closing" | "AB Test" | "Hook" | "Custom";
  label: string;
  token: string;
  description: string;
}

export const SPINTAX_CATEGORIES = ["All", "Opening", "Closing", "AB Test", "Hook", "Custom"] as const;

export const VARIABLES = [
  { label: "First Name", token: "{{first_name}}", desc: "Creator's first name (e.g. Joe)" },
  { label: "Channel Name", token: "{{channel_name}}", desc: "YouTube channel title (e.g. The Rogan Clips)" },
  { label: "Channel URL", token: "{{channel_url}}", desc: "Direct channel link" },
  { label: "Subscriber Count", token: "{{subscriber_count}}", desc: "Formatted count (e.g. 850K)" },
  { label: "AI Custom Line", token: "{{custom_line}}", desc: "Gemini AI personalized observation" },
];

export const SAMPLE_DATA: Record<string, string> = {
  "{{first_name}}": "Joe",
  "{{channel_name}}": "The Rogan Clips",
  "{{channel_url}}": "https://youtube.com/c/theroganclips",
  "{{subscriber_count}}": "850,000",
  "{{custom_line}}": "Loved your recent breakdown, the pacing was spot-on.",
};

export const SPINTAX_PRESETS: SpintaxPreset[] = [
  // ─── Opening ───
  {
    category: "Opening",
    label: "Standard Opening",
    token: "{|Hello|Hi|Good morning|Hey|}",
    description: "Rotates friendly greetings to avoid email scanner footprints",
  },
  {
    category: "Opening",
    label: "Personalized Greeting",
    token: "{|Hey {{first_name}}|Hi {{first_name}}|Hello {{first_name}}|}",
    description: "Uses first name with rotated salutation",
  },
  {
    category: "Opening",
    label: "Fast / Direct Opening",
    token: "{|Quick question {{first_name}}|Hope all is well|Hey there|}",
    description: "Direct, human, non-salesy opening line",
  },

  // ─── Closing ───
  {
    category: "Closing",
    label: "Full Sign-off Rotation",
    token: "{|Thanks|Cheers|Regards|Greetings|Sincerely|Best wishes|Kind regards|Best|}",
    description: "Comprehensive 8-way sign-off rotation",
  },
  {
    category: "Closing",
    label: "Warm Sign-off",
    token: "{|Best|Cheers|Talk soon|Warmly|}",
    description: "Modern, friendly closing",
  },
  {
    category: "Closing",
    label: "Conversational CTA",
    token: "{|Let me know what you think|Looking forward to hearing your thoughts|Hope to chat soon|}",
    description: "Casual conversation starter before sign-off",
  },

  // ─── AB Test (Value Props / Offers for YouTube Creators) ───
  {
    category: "AB Test",
    label: "Offer: Speed vs Growth",
    token: "{abtest|We already edited 2 free sample vertical clips with dynamic captions from your latest upload, ready to post.|We help creators turn long-form episodes into viral Shorts and Reels that reach 500k+ new viewers with zero extra recording time.}",
    description: "Split-tests a concrete sample offer against a growth & reach pitch",
  },
  {
    category: "AB Test",
    label: "CTA: Samples vs Open Question",
    token: "{abtest|Could I send over 2 sample clips we edited from your recent upload for free?|Are you open to checking out 2 quick sample Shorts we made from your channel?}",
    description: "Tests a direct free sample delivery against a low-friction question",
  },
  {
    category: "AB Test",
    label: "Subject: Direct vs Curiosity",
    token: "{abtest|Quick question about {{channel_name}}|Idea for {{first_name}}'s channel}",
    description: "Tests channel question vs creator-first idea subject",
  },
  {
    category: "AB Test",
    label: "Custom A/B Split Block",
    token: "{abtest|This is test A: your primary pitch angle|This is test B: your alternative pitch angle}",
    description: "Customizable 50/50 copy split-test block",
  },

  // ─── Hook & Compliments ───
  {
    category: "Hook",
    label: "Channel Compliment",
    token: "{|Loved your latest upload|Big fan of your content on {{channel_name}}|Really enjoyed your recent video|The breakdown in your latest video was great|}",
    description: "Authentic praise specific to YouTube videos",
  },
  {
    category: "Hook",
    label: "Shorts Opportunity",
    token: "{|I noticed your episodes have high-retention moments perfect for vertical video|Repurposing your recent video into Shorts could bring massive discovery|}",
    description: "Highlights vertical video growth potential",
  },

  // ─── Custom ───
  {
    category: "Custom",
    label: "Custom Blank Spin",
    token: "{|Option 1|Option 2|Option 3|}",
    description: "Insert a blank delimiter spin to write your own choices",
  },
];

/**
 * Client-side Spintax processor matching server template.engine.ts
 */
export function spinText(text: string): string {
  if (!text) return "";
  const spintaxRegex = /\{([^{}]*?\|[^{}]*?)\}/g;
  let spun = text;
  let iteration = 0;
  while (spintaxRegex.test(spun) && iteration < 5) {
    spun = spun.replace(spintaxRegex, (_, optionsStr) => {
      let rawOptions: string[] = optionsStr.split("|");

      // Strip abtest / ab_test / ab-test tag if present as first element
      if (rawOptions.length > 0 && /^\s*ab[-_]?test\s*$/i.test(rawOptions[0])) {
        rawOptions.shift();
      }

      // If formatted with outer delimiters {|opt1|opt2|opt3|}, strip outer empty tokens
      if (rawOptions.length > 2 && rawOptions[0].trim() === "" && rawOptions[rawOptions.length - 1].trim() === "") {
        rawOptions = rawOptions.slice(1, -1);
      } else if (rawOptions.length > 1 && rawOptions[0].trim() === "" && rawOptions.slice(1).some((o: string) => o.trim().length > 0)) {
        rawOptions.shift();
      } else if (rawOptions.length > 2 && rawOptions[rawOptions.length - 1].trim() === "" && rawOptions.slice(0, -1).some((o: string) => o.trim().length > 0)) {
        rawOptions.pop();
      }

      const cleaned: string[] = rawOptions.map((o: string) => o.trim());
      const choices: string[] = cleaned.filter((o: string) => o.length > 0);
      const finalPool: string[] = choices.length > 0 ? choices : cleaned;

      const chosen = finalPool[Math.floor(Math.random() * finalPool.length)];
      return chosen;
    });
    iteration++;
  }
  return spun;
}

export function renderTemplatePreview(text: string, _seed: number = 0): string {
  const substituted = Object.entries(SAMPLE_DATA).reduce(
    (acc, [token, val]) => acc.replaceAll(token, val),
    text
  );
  return spinText(substituted);
}

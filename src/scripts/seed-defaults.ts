import { db, getDbPool } from '../db/client';
import { templates, campaigns, systemSettings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { env } from '../config/env';

export async function seedDefaults() {
  console.log('🌱 Seeding system default templates and settings...');

  // 1. Ensure system settings
  await db
    .insert(systemSettings)
    .values([
      {
        key: 'kill_switch',
        value: { enabled: false },
        description: 'Global outreach kill switch. Set enabled=true to immediately halt sending.',
      },
      {
        key: 'youtube_quota',
        value: {
          search_calls_daily_limit: env.YOUTUBE_DAILY_SEARCH_LIMIT,
          search_calls_used_today: 0,
          general_quota_daily_limit: env.YOUTUBE_DAILY_GENERAL_LIMIT,
          general_quota_used_today: 0,
          last_reset_pt: new Date().toISOString(),
        },
        description: `YouTube API dual-bucket quota tracking (search.list ${env.YOUTUBE_DAILY_SEARCH_LIMIT} calls/day; general ${env.YOUTUBE_DAILY_GENERAL_LIMIT} units/day; resets midnight PT).`,
      },
      {
        key: 'batch_config',
        value: {
          keyword_batch_size: 10,
          max_attempts: 3,
          channel_limit_per_keyword: 15,
        },
        description: 'Discovery engine batch processing configuration.',
      },
    ])
    .onConflictDoNothing();

  // 2. Default Outreach Template
  const existingTemplate = await db.select().from(templates).where(eq(templates.name, 'Short-Form Viral Clipping Offer')).limit(1);

  let templateId: number;
  if (existingTemplate.length === 0) {
    const [inserted] = await db
      .insert(templates)
      .values({
        name: 'Short-Form Viral Clipping Offer',
        subject: 'Quick question about {{channel_name}} clips',
        body: `Hey {{first_name}},\n\n{{custom_line}}\n\nI run an agency that turns long-form YouTube episodes into high-retention Shorts, Reels, and TikToks. We handle hook editing, captions, and pacing so you get more reach with zero extra recording time.\n\nCould I send over 2 sample clips we edited from your recent upload for free? If you like them, they're yours to post.\n\nBest,\nLeadMiner Team`,
        variables: ['first_name', 'channel_name', 'channel_url', 'subscriber_count', 'custom_line'],
        isActive: true,
      })
      .returning({ id: templates.id });
    templateId = inserted.id;
    console.log('✅ Created default template: Short-Form Viral Clipping Offer');
  } else {
    templateId = existingTemplate[0].id;
    console.log('ℹ️ Default template already exists.');
  }

  // 3. Default Campaign
  const existingCampaign = await db.select().from(campaigns).where(eq(campaigns.name, 'Top Creators & Podcasters Outreach')).limit(1);

  if (existingCampaign.length === 0) {
    await db.insert(campaigns).values({
      name: 'Top Creators & Podcasters Outreach',
      status: 'DRAFT',
      templateId,
      dailyLimit: 30,
      minSubscribers: 10,
      maxSubscribers: null,
      targetCategories: ['Top Podcasters', 'Top YouTubers', 'Top Business Coaches'],
      enableGeminiPersonalization: true,
    });
    console.log('✅ Created default campaign: Top Creators & Podcasters Outreach');
  } else {
    console.log('ℹ️ Default campaign already exists.');
  }

  console.log('✅ Default seeding completed.');
}

if (require.main === module) {
  seedDefaults()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}

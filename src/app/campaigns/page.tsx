import React from 'react';
import { db } from '../../db/client';
import { campaigns, templates } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { CampaignsClientView, CampaignItem } from '@/components/campaigns/CampaignsClientView';

export const revalidate = 5;

async function getCampaignsData(): Promise<CampaignItem[]> {
  try {
    const list = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        status: campaigns.status,
        dailyLimit: campaigns.dailyLimit,
        minSubscribers: campaigns.minSubscribers,
        maxSubscribers: campaigns.maxSubscribers,
        enableGemini: campaigns.enableGeminiPersonalization,
        targetCountry: campaigns.targetCountry,
        templateName: templates.name,
      })
      .from(campaigns)
      .leftJoin(templates, eq(campaigns.templateId, templates.id))
      .orderBy(desc(campaigns.id));

    return list as CampaignItem[];
  } catch (e) {
    return [];
  }
}

export default async function CampaignsPage() {
  const list = await getCampaignsData();

  return <CampaignsClientView initialCampaigns={list} />;
}

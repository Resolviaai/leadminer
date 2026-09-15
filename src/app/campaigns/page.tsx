import React from 'react';
import { db } from '../../db/client';
import { campaigns, templates } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { Target, Sparkles, Play, Pause, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const revalidate = 5;

async function getCampaignsData() {
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
        templateName: templates.name,
      })
      .from(campaigns)
      .leftJoin(templates, eq(campaigns.templateId, templates.id))
      .orderBy(desc(campaigns.id));

    return list;
  } catch (e) {
    return [];
  }
}

export default async function CampaignsPage() {
  const list = await getCampaignsData();

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border">
        <div>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary" />
            <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
              Email Campaigns
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage your email campaigns, templates, and daily sending limits.
          </p>
        </div>

        <form action="/api/workers/outreach" method="POST">
          <Button size="sm" variant="default" className="gap-1.5 w-full sm:w-auto">
            <Send className="w-3.5 h-3.5 fill-current" />
            <span>Send Emails Now</span>
          </Button>
        </form>
      </Card>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.length === 0 ? (
          <Card className="col-span-full p-8 text-center text-xs text-text-muted">
            No campaigns configured. Run database seed to create default campaign.
          </Card>
        ) : (
          list.map((camp) => (
            <Card key={camp.id} className="flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
                <CardTitle className="text-sm font-semibold text-text-main">
                  {camp.name}
                </CardTitle>
                <Badge variant={camp.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {camp.status}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-2 text-xs text-text-secondary">
                <div className="p-3 rounded-lg bg-surface-200 border border-border/50 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Template</span>
                    <span className="text-text-main font-medium">{camp.templateName || 'Default'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Daily Limit</span>
                    <span className="font-mono text-text-main">{camp.dailyLimit} emails/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Audience Filter</span>
                    <span className="font-mono text-text-main">
                      {camp.minSubscribers?.toLocaleString()} - {camp.maxSubscribers?.toLocaleString()} subs
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-border/40">
                    <span className="text-text-muted">AI Personalization</span>
                    <span className="flex items-center space-x-1 text-primary text-[11px] font-medium">
                      <Sparkles className="w-3 h-3" />
                      <span>{camp.enableGemini ? 'Gemini 3.5' : 'Disabled'}</span>
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] text-text-muted font-mono">ID: {camp.id}</span>
                <form action={`/api/campaigns/${camp.id}/toggle`} method="POST">
                  <Button size="sm" variant="outline" className="gap-1.5 h-8">
                    {camp.status === 'ACTIVE' ? (
                      <>
                        <Pause className="w-3 h-3 text-warning" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 text-primary" />
                        <span>Activate</span>
                      </>
                    )}
                  </Button>
                </form>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

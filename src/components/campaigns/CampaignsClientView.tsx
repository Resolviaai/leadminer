'use client';

import React, { useState } from 'react';
import { Target, Sparkles, UploadCloud, Users, Layers, Play } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CampaignToggleButton } from '@/components/campaigns/CampaignToggleButton';
import { RunOutreachButton } from '@/components/campaigns/RunOutreachButton';
import { LeadImportWizard } from '@/components/campaigns/LeadImportWizard';
import { CampaignLeadsView } from '@/components/campaigns/CampaignLeadsView';

export interface CampaignItem {
  id: number;
  name: string;
  status: 'ACTIVE' | 'PAUSED';
  dailyLimit: number;
  minSubscribers: number | null;
  maxSubscribers: number | null;
  enableGemini: boolean | null;
  targetCountry: string | null;
  templateName: string | null;
}

export interface CampaignsClientViewProps {
  initialCampaigns: CampaignItem[];
}

export function CampaignsClientView({ initialCampaigns }: CampaignsClientViewProps) {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'leads'>('campaigns');
  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const [selectedCampaignForImport, setSelectedCampaignForImport] = useState<{
    id: number;
    name: string;
  }>({
    id: initialCampaigns[0]?.id || 1,
    name: initialCampaigns[0]?.name || 'Campaign',
  });

  const handleOpenImport = (campaignId: number, campaignName: string) => {
    setSelectedCampaignForImport({ id: campaignId, name: campaignName });
    setImportWizardOpen(true);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border bg-surface-100">
        <div>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary" />
            <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
              Email Campaigns
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage your outreach campaigns, lead acquisition sources, and bulk spreadsheet imports.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleOpenImport(
                initialCampaigns[0]?.id || 1,
                initialCampaigns[0]?.name || 'Default Campaign'
              )
            }
            className="text-xs gap-1.5 h-8 font-semibold shrink-0"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Import Leads</span>
          </Button>

          <RunOutreachButton />
        </div>
      </Card>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} defaultValue="campaigns">
        <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
          <TabsList className="bg-surface-200">
            <TabsTrigger value="campaigns" className="text-xs gap-1.5 data-[state=active]:bg-surface-100">
              <Layers className="w-3.5 h-3.5" />
              <span>Campaigns Overview</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="text-xs gap-1.5 data-[state=active]:bg-surface-100">
              <Users className="w-3.5 h-3.5" />
              <span>Enrolled Leads</span>
            </TabsTrigger>
          </TabsList>

          <div className="text-xs text-text-muted hidden sm:block font-mono">
            {initialCampaigns.length} Campaign(s) Configured
          </div>
        </div>

        {/* TAB 1: CAMPAIGNS GRID */}
        <TabsContent value="campaigns" className="pt-4 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initialCampaigns.length === 0 ? (
              <Card className="col-span-full p-8 text-center text-xs text-text-muted">
                No campaigns configured. Run database seed to create default campaign.
              </Card>
            ) : (
              initialCampaigns.map((camp) => (
                <Card key={camp.id} className="flex flex-col justify-between bg-surface-100 border-border">
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
                          {camp.maxSubscribers
                            ? `${camp.minSubscribers?.toLocaleString()} - ${camp.maxSubscribers?.toLocaleString()} subs`
                            : `Min ${(camp.minSubscribers || 10).toLocaleString()} subs`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Target Geography</span>
                        <span className="font-mono text-text-main">
                          {camp.targetCountry
                            ? camp.targetCountry === 'TIER1'
                              ? 'Tier 1 (17 Nations)'
                              : camp.targetCountry
                            : 'Tier 1 (17 Nations)'}
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

                  <CardFooter className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenImport(camp.id, camp.name)}
                      className="text-[11px] h-7 gap-1.5"
                    >
                      <UploadCloud className="w-3 h-3" />
                      <span>Import CSV / Excel</span>
                    </Button>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-text-muted font-mono">ID: {camp.id}</span>
                      <CampaignToggleButton campaignId={camp.id} initialStatus={camp.status} />
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* TAB 2: ENROLLED LEADS TABLE */}
        <TabsContent value="leads" className="pt-4 mt-0">
          <CampaignLeadsView
            campaigns={initialCampaigns.map((c) => ({ id: c.id, name: c.name }))}
            initialCampaignId={selectedCampaignForImport.id}
            onOpenImportWizard={handleOpenImport}
          />
        </TabsContent>
      </Tabs>

      {/* Import Wizard Modal */}
      <LeadImportWizard
        campaignId={selectedCampaignForImport.id}
        campaignName={selectedCampaignForImport.name}
        isOpen={importWizardOpen}
        onClose={() => setImportWizardOpen(false)}
        onImportComplete={() => {
          setActiveTab('leads');
        }}
      />
    </div>
  );
}

import React from 'react';
import { db } from '../../db/client';
import { leads, contacts, keywords } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { Users, ExternalLink, Play, Mail, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

export const dynamic = 'force-dynamic';

async function getLeadsData() {
  try {
    const list = await db
      .select({
        id: leads.id,
        channelId: leads.channelId,
        channelTitle: leads.channelTitle,
        channelUrl: leads.channelUrl,
        subscriberCount: leads.subscriberCount,
        qualificationStatus: leads.qualificationStatus,
        outreachStatus: leads.outreachStatus,
        discoveredAt: leads.discoveredAt,
        email: contacts.email,
        emailStatus: contacts.emailStatus,
        sourceKeyword: keywords.keyword,
        category: keywords.category,
      })
      .from(leads)
      .leftJoin(contacts, eq(leads.id, contacts.leadId))
      .leftJoin(keywords, eq(leads.sourceKeywordId, keywords.id))
      .orderBy(desc(leads.discoveredAt))
      .limit(50);

    return list;
  } catch (e) {
    return [];
  }
}

export default async function LeadsPage() {
  const list = await getLeadsData();

  const getEmailBadge = (status: string | null) => {
    switch (status) {
      case 'VALID':
        return <Badge variant="success">VALID</Badge>;
      case 'INVALID':
      case 'DISPOSABLE':
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status || 'NONE'}</Badge>;
    }
  };

  const getQualBadge = (status: string) => {
    switch (status) {
      case 'QUALIFIED':
        return <Badge variant="success">QUALIFIED</Badge>;
      case 'DISQUALIFIED':
        return <Badge variant="destructive">DISQUALIFIED</Badge>;
      default:
        return <Badge variant="secondary">UNREVIEWED</Badge>;
    }
  };

  const getOutreachBadge = (status: string) => {
    switch (status) {
      case 'REPLIED':
        return <Badge variant="warning">REPLIED</Badge>;
      case 'CONTACTED':
        return <Badge variant="default">CONTACTED</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
              Discovered Leads
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Deduplicated YouTube channels, extracted emails, verification status, and outreach qualification.
          </p>
        </div>

        <form action="/api/workers/verification" method="POST">
          <Button size="sm" variant="default" className="gap-1.5 w-full sm:w-auto">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Verify & Qualify Batch</span>
          </Button>
        </form>
      </Card>

      {/* Mobile Leads List (< md) */}
      <div className="md:hidden space-y-2.5">
        {list.length === 0 ? (
          <Card className="p-6 text-center text-xs text-text-muted">
            No leads discovered yet. Run the discovery worker from the Keywords page.
          </Card>
        ) : (
          list.map((lead) => (
            <Card key={lead.id} className="p-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-xs text-text-main">{lead.channelTitle}</span>
                    <a
                      href={lead.channelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-text-muted hover:text-text-main"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <span className="text-[11px] text-text-muted font-mono">
                    {lead.subscriberCount ? lead.subscriberCount.toLocaleString() : '0'} subscribers
                  </span>
                </div>
                {getQualBadge(lead.qualificationStatus)}
              </div>

              <div className="p-2 rounded-lg bg-surface-200 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="font-mono text-text-secondary text-[11px] truncate">
                    {lead.email || 'No email found'}
                  </span>
                </div>
                {getEmailBadge(lead.emailStatus)}
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                <span>Keyword: {lead.sourceKeyword || '—'}</span>
                {getOutreachBadge(lead.outreachStatus)}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Leads Table (md+) */}
      <Card className="hidden md:block overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Channel</TableHead>
              <TableHead className="text-right">Subscribers</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Qualification</TableHead>
              <TableHead>Outreach Status</TableHead>
              <TableHead>Source Keyword</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-text-muted">
                  No leads discovered yet.
                </TableCell>
              </TableRow>
            ) : (
              list.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-medium text-text-main">{lead.channelTitle}</span>
                      <a
                        href={lead.channelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-text-muted hover:text-text-main"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-text-secondary">
                    {lead.subscriberCount ? lead.subscriberCount.toLocaleString() : '0'}
                  </TableCell>
                  <TableCell className="font-mono text-text-main">
                    {lead.email || <span className="text-text-muted font-sans text-[11px]">None found</span>}
                  </TableCell>
                  <TableCell>{getEmailBadge(lead.emailStatus)}</TableCell>
                  <TableCell>{getQualBadge(lead.qualificationStatus)}</TableCell>
                  <TableCell>{getOutreachBadge(lead.outreachStatus)}</TableCell>
                  <TableCell className="text-text-muted text-[11px]">{lead.sourceKeyword || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

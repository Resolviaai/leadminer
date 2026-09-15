import React from 'react';
import { db } from '../../db/client';
import { replies, leads, campaigns } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { Inbox, ExternalLink } from 'lucide-react';
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

async function getRepliesData() {
  try {
    const list = await db
      .select({
        id: replies.id,
        threadId: replies.threadId,
        messageId: replies.messageId,
        senderEmail: replies.senderEmail,
        snippet: replies.snippet,
        receivedAt: replies.receivedAt,
        processed: replies.processed,
        channelTitle: leads.channelTitle,
        channelUrl: leads.channelUrl,
        campaignName: campaigns.name,
      })
      .from(replies)
      .leftJoin(leads, eq(replies.leadId, leads.id))
      .leftJoin(campaigns, eq(leads.id, campaigns.id))
      .orderBy(desc(replies.receivedAt))
      .limit(50);

    return list;
  } catch (e) {
    return [];
  }
}

export default async function RepliesPage() {
  const list = await getRepliesData();

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <Card className="p-4 sm:p-5 border-border">
        <div className="flex items-center space-x-2">
          <Inbox className="w-5 h-5 text-primary" />
          <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
            Creator Replies Inbox
          </h1>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">
          Inbound responses detected from outreach threads. High-signal replies trigger real-time notifications.
        </p>
      </Card>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden space-y-2.5">
        {list.length === 0 ? (
          <Card className="p-8 text-center text-xs text-text-muted">
            No creator replies recorded yet.
          </Card>
        ) : (
          list.map((r) => (
            <Card key={r.id} className="p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-semibold text-xs text-text-main block">
                    {r.channelTitle || 'Unknown Creator'}
                  </span>
                  <span className="font-mono text-[11px] text-text-muted">{r.senderEmail}</span>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {r.campaignName || 'General'}
                </Badge>
              </div>

              <p className="text-xs text-text-secondary italic p-2 rounded bg-surface-200 border border-border/50 line-clamp-3">
                "{r.snippet || 'No preview available'}"
              </p>

              <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                <span>{r.receivedAt ? new Date(r.receivedAt).toLocaleDateString() : 'Recent'}</span>
                <a
                  href={`https://mail.google.com/mail/u/0/#inbox/${r.threadId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1">
                    <span>Open in Gmail</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </a>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table (md+) */}
      <Card className="hidden md:block overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Channel / Sender</TableHead>
              <TableHead>Reply Message Snippet</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Received</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-text-muted">
                  No creator replies recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              list.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium text-text-main">{r.channelTitle || 'Unknown Channel'}</div>
                    <div className="text-text-muted font-mono text-[11px]">{r.senderEmail}</div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-text-secondary line-clamp-2 italic text-xs">
                      "{r.snippet || 'No preview available'}"
                    </p>
                  </TableCell>
                  <TableCell className="text-text-secondary text-xs">{r.campaignName || 'General'}</TableCell>
                  <TableCell className="text-text-muted text-[11px]">
                    {r.receivedAt ? new Date(r.receivedAt).toLocaleString() : 'Recent'}
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`https://mail.google.com/mail/u/0/#inbox/${r.threadId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                        <span>Gmail</span>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

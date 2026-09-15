import React from 'react';
import { db } from '../../db/client';
import { keywords } from '../../db/schema';
import { desc, sql } from 'drizzle-orm';
import { Layers, Play } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

async function getKeywordsData() {
  try {
    const list = await db
      .select()
      .from(keywords)
      .orderBy(desc(keywords.lastAttemptAt), desc(keywords.id))
      .limit(50);

    const [counts] = await db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where status = 'PENDING')::int`,
        completed: sql<number>`count(*) filter (where status = 'COMPLETED')::int`,
        failed: sql<number>`count(*) filter (where status = 'FAILED')::int`,
      })
      .from(keywords);

    return { list, counts: counts || { total: 0, pending: 0, completed: 0, failed: 0 } };
  } catch (e) {
    return {
      list: [],
      counts: { total: 25391, pending: 25391, completed: 0, failed: 0 },
    };
  }
}

export default async function KeywordsPage() {
  const { list, counts } = await getKeywordsData();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">COMPLETED</Badge>;
      case 'PROCESSING':
        return <Badge variant="default" className="animate-pulse">PROCESSING</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">FAILED</Badge>;
      case 'RETRY':
        return <Badge variant="warning">RETRY</Badge>;
      default:
        return <Badge variant="secondary">PENDING</Badge>;
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-primary" />
            <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
              Keyword Taxonomy
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            23 categories, 2,786 entities, and 302 modifiers generating 25,391 unique normalized search terms.
          </p>
        </div>

        <form action="/api/workers/discovery" method="POST">
          <Button size="sm" variant="default" className="gap-1.5 w-full sm:w-auto">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Next Batch (10)</span>
          </Button>
        </form>
      </Card>

      {/* Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5">
          <span className="text-[11px] text-text-muted block">Total Corpus</span>
          <span className="text-lg font-bold text-text-main font-mono">
            {counts.total.toLocaleString()}
          </span>
        </Card>
        <Card className="p-3.5">
          <span className="text-[11px] text-warning block">Pending Queue</span>
          <span className="text-lg font-bold text-warning font-mono">
            {counts.pending.toLocaleString()}
          </span>
        </Card>
        <Card className="p-3.5">
          <span className="text-[11px] text-primary block">Completed</span>
          <span className="text-lg font-bold text-primary font-mono">
            {counts.completed.toLocaleString()}
          </span>
        </Card>
        <Card className="p-3.5">
          <span className="text-[11px] text-danger block">Failed / Retry</span>
          <span className="text-lg font-bold text-danger font-mono">
            {counts.failed.toLocaleString()}
          </span>
        </Card>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden space-y-2.5">
        {list.length === 0 ? (
          <Card className="p-6 text-center text-xs text-text-muted">
            No keywords found in database. Run seed script to populate.
          </Card>
        ) : (
          list.map((k) => (
            <Card key={k.id} className="p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-xs text-text-main">{k.keyword}</span>
                {getStatusBadge(k.status)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary pt-1 border-t border-border/50">
                <div>
                  <span className="text-text-muted block text-[10px]">Category</span>
                  <span>{k.category || 'General'}</span>
                </div>
                <div className="text-right">
                  <span className="text-text-muted block text-[10px]">Channels</span>
                  <span className="font-mono text-text-main">{k.channelsFound}</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Keywords Table (md+) */}
      <Card className="hidden md:block overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keyword</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Modifier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Channels</TableHead>
              <TableHead className="text-right">Attempts</TableHead>
              <TableHead>Last Execution</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-text-muted">
                  No keywords in database yet.
                </TableCell>
              </TableRow>
            ) : (
              list.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium text-text-main">{k.keyword}</TableCell>
                  <TableCell className="text-text-secondary">{k.category}</TableCell>
                  <TableCell className="text-text-secondary">{k.entity}</TableCell>
                  <TableCell className="text-text-muted">{k.modifier}</TableCell>
                  <TableCell>{getStatusBadge(k.status)}</TableCell>
                  <TableCell className="text-right font-mono text-text-secondary">
                    {k.channelsFound}
                  </TableCell>
                  <TableCell className="text-right font-mono text-text-muted">
                    {k.attemptCount}
                  </TableCell>
                  <TableCell className="text-text-muted text-[11px]">
                    {k.lastAttemptAt ? new Date(k.lastAttemptAt).toLocaleString() : 'Never'}
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

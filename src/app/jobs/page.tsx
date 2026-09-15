import React from 'react';
import { db } from '../../db/client';
import { jobs } from '../../db/schema';
import { desc } from 'drizzle-orm';
import { Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

export const dynamic = 'force-dynamic';

async function getJobsData() {
  try {
    return await db.select().from(jobs).orderBy(desc(jobs.id)).limit(50);
  } catch (e) {
    return [];
  }
}

export default async function JobsPage() {
  const list = await getJobsData();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">COMPLETED</Badge>;
      case 'RUNNING':
        return <Badge variant="default" className="animate-pulse">RUNNING</Badge>;
      case 'STOPPED_QUOTA':
        return <Badge variant="warning">STOPPED_QUOTA</Badge>;
      default:
        return <Badge variant="destructive">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <Card className="p-4 sm:p-5 border-border">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-primary" />
          <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
            Background Worker Jobs
          </h1>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">
          Execution telemetry, progress checkpoints, and heartbeat tracking across discovery, verification, and outreach workers.
        </p>
      </Card>

      {/* Mobile Jobs List (< md) */}
      <div className="md:hidden space-y-2.5">
        {list.length === 0 ? (
          <Card className="p-8 text-center text-xs text-text-muted">
            No worker jobs logged yet.
          </Card>
        ) : (
          list.map((j) => (
            <Card key={j.id} className="p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-text-muted">#{j.id}</span>
                  <span className="font-semibold text-xs text-text-main">{j.jobType}</span>
                </div>
                {getStatusBadge(j.status)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs p-2 rounded-lg bg-surface-200 border border-border/50">
                <div>
                  <span className="text-text-muted block text-[10px]">Processed</span>
                  <span className="font-mono text-primary font-medium">{j.itemsProcessed}</span>
                </div>
                <div className="text-right">
                  <span className="text-text-muted block text-[10px]">Failed</span>
                  <span className="font-mono text-danger">{j.itemsFailed}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                <span>Started: {j.startedAt ? new Date(j.startedAt).toLocaleTimeString() : '—'}</span>
                <span>{j.completedAt ? new Date(j.completedAt).toLocaleTimeString() : 'Running'}</span>
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
              <TableHead>Job ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Items Processed</TableHead>
              <TableHead className="text-right">Items Failed</TableHead>
              <TableHead>Started At</TableHead>
              <TableHead>Completed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-text-muted">
                  No worker jobs logged yet.
                </TableCell>
              </TableRow>
            ) : (
              list.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="font-mono text-text-muted">#{j.id}</TableCell>
                  <TableCell className="font-medium text-text-main">{j.jobType}</TableCell>
                  <TableCell>{getStatusBadge(j.status)}</TableCell>
                  <TableCell className="text-right font-mono text-text-main">
                    {j.itemsProcessed}
                  </TableCell>
                  <TableCell className="text-right font-mono text-danger">
                    {j.itemsFailed}
                  </TableCell>
                  <TableCell className="text-text-secondary text-[11px]">
                    {j.startedAt ? new Date(j.startedAt).toLocaleTimeString() : '—'}
                  </TableCell>
                  <TableCell className="text-text-secondary text-[11px]">
                    {j.completedAt ? new Date(j.completedAt).toLocaleTimeString() : 'In-flight'}
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

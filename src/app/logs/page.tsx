import React from 'react';
import { db } from '../../db/client';
import { logs } from '../../db/schema';
import { desc } from 'drizzle-orm';
import { Terminal } from 'lucide-react';
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

async function getLogsData() {
  try {
    return await db.select().from(logs).orderBy(desc(logs.createdAt)).limit(100);
  } catch (e) {
    return [];
  }
}

export default async function LogsPage() {
  const list = await getLogsData();

  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case 'INFO':
        return <Badge variant="secondary" className="text-[10px]">{level}</Badge>;
      case 'WARN':
        return <Badge variant="warning" className="text-[10px]">{level}</Badge>;
      case 'ERROR':
        return <Badge variant="destructive" className="text-[10px]">{level}</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{level}</Badge>;
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <Card className="p-4 sm:p-5 border-border">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-primary" />
          <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
            System Telemetry & Audit Logs
          </h1>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">
          Real-time event stream of discoveries, verifications, message dispatches, quota alerts, and worker lifecycles.
        </p>
      </Card>

      {/* Mobile Logs Cards (< md) */}
      <div className="md:hidden space-y-2">
        {list.length === 0 ? (
          <Card className="p-8 text-center text-xs text-text-muted">
            No logs recorded yet.
          </Card>
        ) : (
          list.map((log) => (
            <Card key={log.id} className="p-3 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between font-sans">
                <span className="font-semibold text-primary text-[11px]">{log.eventType}</span>
                {getLogLevelBadge(log.level)}
              </div>
              <p className="font-sans text-xs text-text-main leading-relaxed">{log.message}</p>
              <div className="text-[10px] text-text-muted">
                {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : '—'}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table (md+) */}
      <Card className="hidden md:block overflow-hidden font-mono">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-sans">Timestamp</TableHead>
              <TableHead className="font-sans">Event Type</TableHead>
              <TableHead className="font-sans">Level</TableHead>
              <TableHead className="font-sans">Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-[11px]">
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-text-muted font-sans">
                  No logs recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              list.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-text-muted whitespace-nowrap">
                    {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : '—'}
                  </TableCell>
                  <TableCell className="font-semibold text-primary whitespace-nowrap">
                    {log.eventType}
                  </TableCell>
                  <TableCell>{getLogLevelBadge(log.level)}</TableCell>
                  <TableCell className="font-sans text-text-main text-xs">{log.message}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

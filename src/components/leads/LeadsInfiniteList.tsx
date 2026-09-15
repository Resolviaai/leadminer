"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Loader2, ExternalLink, Mail } from "lucide-react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

type Lead = {
  id: number;
  channelId: string;
  channelTitle: string;
  channelUrl: string;
  subscriberCount: number | null;
  qualificationStatus: string;
  outreachStatus: string;
  discoveredAt: string | null;
  email: string | null;
  emailStatus: string | null;
  sourceKeyword: string | null;
  category: string | null;
};

interface Props {
  initialData: Lead[];
  total: number;
}

function getEmailBadge(status: string | null) {
  switch (status) {
    case "VALID":
      return <Badge variant="success">VALID</Badge>;
    case "INVALID":
    case "DISPOSABLE":
      return <Badge variant="destructive">{status}</Badge>;
    default:
      return <Badge variant="secondary">{status || "NONE"}</Badge>;
  }
}

function getQualBadge(status: string) {
  switch (status) {
    case "QUALIFIED":
      return <Badge variant="success">QUALIFIED</Badge>;
    case "DISQUALIFIED":
      return <Badge variant="destructive">DISQUALIFIED</Badge>;
    default:
      return <Badge variant="secondary">UNREVIEWED</Badge>;
  }
}

function getOutreachBadge(status: string) {
  switch (status) {
    case "REPLIED":
      return <Badge variant="warning">REPLIED</Badge>;
    case "CONTACTED":
      return <Badge variant="default">CONTACTED</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i}>
          <div className="animate-pulse h-4 bg-surface-200 rounded-md" />
        </TableCell>
      ))}
    </TableRow>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-surface-100 border border-border rounded-lg p-3.5 space-y-2 animate-pulse">
      <div className="h-4 bg-surface-200 rounded w-40" />
      <div className="h-8 bg-surface-200 rounded" />
      <div className="h-3 bg-surface-200 rounded w-24" />
    </div>
  );
}

export function LeadsInfiniteList({ initialData, total }: Props) {
  const [items, setItems] = useState<Lead[]>(initialData);
  const [hasMore, setHasMore] = useState(initialData.length < total);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    const lastId = items.length > 0 ? items[items.length - 1].id : 0;
    abortControllerRef.current = new AbortController();
    try {
      const res = await fetch(`/api/leads?lastId=${lastId}&limit=50`, {
        signal: abortControllerRef.current.signal,
      });
      if (!res.ok) throw new Error("fetch failed");
      const data: Lead[] = await res.json();
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setItems((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          return [...prev, ...data.filter((i) => !existingIds.has(i.id))];
        });
        if (data.length < 50) setHasMore(false);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError("Failed to load more — tap to retry");
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [items, hasMore]);

  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loading && !error);
  const showSkeletons = items.length === 0 && loading;

  return (
    <div className="space-y-3">
      {/* Mobile cards */}
      <div className="md:hidden space-y-2.5">
        {showSkeletons ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : items.length === 0 ? (
          <Card className="p-6 text-center text-xs text-text-muted">
            No leads discovered yet. Run the discovery worker from the Keywords page.
          </Card>
        ) : (
          items.map((lead) => (
            <Card key={lead.id} className="p-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-xs text-text-main">{lead.channelTitle}</span>
                    <a href={lead.channelUrl} target="_blank" rel="noreferrer" className="text-text-muted hover:text-text-main">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <span className="text-[11px] text-text-muted font-mono">
                    {lead.subscriberCount ? lead.subscriberCount.toLocaleString() : "0"} subscribers
                  </span>
                </div>
                {getQualBadge(lead.qualificationStatus)}
              </div>
              <div className="p-2 rounded-lg bg-surface-200 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="font-mono text-text-secondary text-[11px] truncate">
                    {lead.email || "No email found"}
                  </span>
                </div>
                {getEmailBadge(lead.emailStatus)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                <span>Keyword: {lead.sourceKeyword || "—"}</span>
                {getOutreachBadge(lead.outreachStatus)}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-surface-200">
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
              {showSkeletons ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-text-muted">
                    No leads discovered yet.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-medium text-text-main">{lead.channelTitle}</span>
                        <a href={lead.channelUrl} target="_blank" rel="noreferrer" className="text-text-muted hover:text-text-main">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-text-secondary">
                      {lead.subscriberCount ? lead.subscriberCount.toLocaleString() : "0"}
                    </TableCell>
                    <TableCell className="font-mono text-text-main">
                      {lead.email || <span className="text-text-muted font-sans text-[11px]">None found</span>}
                    </TableCell>
                    <TableCell>{getEmailBadge(lead.emailStatus)}</TableCell>
                    <TableCell>{getQualBadge(lead.qualificationStatus)}</TableCell>
                    <TableCell>{getOutreachBadge(lead.outreachStatus)}</TableCell>
                    <TableCell className="text-text-muted text-[11px]">{lead.sourceKeyword || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div ref={sentinelRef} className="h-px" />
      {loading && !showSkeletons && (
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-text-muted">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Loading more...</span>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setError(null); loadMore(); }}
            className="text-xs text-danger border-danger/30 hover:bg-danger/5"
          >
            {error}
          </Button>
        </div>
      )}
      {!hasMore && items.length > 0 && !loading && (
        <p className="text-center text-[11px] text-text-muted py-3">
          All {total.toLocaleString()} records loaded
        </p>
      )}
    </div>
  );
}
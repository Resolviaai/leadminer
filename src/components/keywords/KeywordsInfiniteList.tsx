"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
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

type Keyword = {
  id: number;
  keyword: string;
  category: string;
  entity: string;
  modifier: string;
  status: string;
  channelsFound: number;
  attemptCount: number;
  lastAttemptAt: string | null;
};

interface Props {
  initialData: Keyword[];
  total: number;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return <Badge variant="success">COMPLETED</Badge>;
    case "PROCESSING":
      return <Badge variant="default" className="animate-pulse">PROCESSING</Badge>;
    case "FAILED":
      return <Badge variant="destructive">FAILED</Badge>;
    case "RETRY":
      return <Badge variant="warning">RETRY</Badge>;
    default:
      return <Badge variant="secondary">PENDING</Badge>;
  }
}

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 8 }).map((_, i) => (
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
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 bg-surface-200 rounded w-32" />
        <div className="h-5 bg-surface-200 rounded w-16" />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
        <div className="h-3 bg-surface-200 rounded w-20" />
        <div className="h-3 bg-surface-200 rounded w-10 ml-auto" />
      </div>
    </div>
  );
}

export function KeywordsInfiniteList({ initialData, total }: Props) {
  const [items, setItems] = useState<Keyword[]>(initialData);
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
      const res = await fetch(`/api/keywords?lastId=${lastId}&limit=50`, {
        signal: abortControllerRef.current.signal,
      });
      if (!res.ok) throw new Error("fetch failed");
      const data: Keyword[] = await res.json();
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
          <Card className="p-6 text-center text-xs text-text-muted">No keywords in database yet.</Card>
        ) : (
          items.map((k) => (
            <div key={k.id} className="bg-surface-100 border border-border rounded-lg p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-xs text-text-main">{k.keyword}</span>
                {getStatusBadge(k.status)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary pt-1 border-t border-border/50">
                <div>
                  <span className="text-text-muted block text-[10px]">Category</span>
                  <span>{k.category || "General"}</span>
                </div>
                <div className="text-right">
                  <span className="text-text-muted block text-[10px]">Channels</span>
                  <span className="font-mono text-text-main">{k.channelsFound}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-surface-200">
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
              {showSkeletons ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-text-muted">
                    No keywords in database yet.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium text-text-main">{k.keyword}</TableCell>
                    <TableCell className="text-text-secondary">{k.category}</TableCell>
                    <TableCell className="text-text-secondary">{k.entity}</TableCell>
                    <TableCell className="text-text-muted">{k.modifier}</TableCell>
                    <TableCell>{getStatusBadge(k.status)}</TableCell>
                    <TableCell className="text-right font-mono text-text-secondary">{k.channelsFound}</TableCell>
                    <TableCell className="text-right font-mono text-text-muted">{k.attemptCount}</TableCell>
                    <TableCell className="text-text-muted text-[11px]">
                      {k.lastAttemptAt ? new Date(k.lastAttemptAt).toLocaleString() : "Never"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Sentinel + status */}
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
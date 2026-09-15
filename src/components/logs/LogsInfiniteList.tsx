"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
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

type Log = {
  id: number;
  jobId: number | null;
  eventType: string;
  level: string;
  message: string;
  createdAt: Date | string | null;
};

interface Props {
  initialData: Log[];
  total: number;
}

function getLogLevelBadge(level: string) {
  switch (level) {
    case "INFO":
      return <Badge variant="secondary" className="text-[10px]">{level}</Badge>;
    case "WARN":
      return <Badge variant="warning" className="text-[10px]">{level}</Badge>;
    case "ERROR":
      return <Badge variant="destructive" className="text-[10px]">{level}</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{level}</Badge>;
  }
}

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableCell key={i}>
          <div className="animate-pulse h-4 bg-surface-200 rounded-md" />
        </TableCell>
      ))}
    </TableRow>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-surface-100 border border-border rounded-lg p-3 space-y-1.5 animate-pulse">
      <div className="flex justify-between">
        <div className="h-3 bg-surface-200 rounded w-24" />
        <div className="h-4 bg-surface-200 rounded w-12" />
      </div>
      <div className="h-4 bg-surface-200 rounded w-full" />
      <div className="h-3 bg-surface-200 rounded w-16" />
    </div>
  );
}

export function LogsInfiniteList({ initialData, total }: Props) {
  const [items, setItems] = useState<Log[]>(initialData);
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
      const res = await fetch(`/api/logs?lastId=${lastId}&limit=50`, {
        signal: abortControllerRef.current.signal,
      });
      if (!res.ok) throw new Error("fetch failed");
      const data: Log[] = await res.json();
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

  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore || loading || isLoadingRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      loadMore();
    }
  };

  useEffect(() => {
    if (!hasMore || loading) return;
    const handleWindowScroll = () => {
      if (!hasMore || loading || isLoadingRef.current) return;
      if (window.innerWidth < 768) {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300) {
          loadMore();
        }
      }
    };
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, [hasMore, loading, loadMore]);

  const showSkeletons = items.length === 0 && loading;

  return (
    <div className="space-y-3">
      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {showSkeletons ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : items.length === 0 ? (
          <Card className="p-8 text-center text-xs text-text-muted">No logs recorded yet.</Card>
        ) : (
          items.map((log) => (
            <Card key={log.id} className="p-3 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between font-sans">
                <span className="font-semibold text-primary text-[11px]">{log.eventType}</span>
                {getLogLevelBadge(log.level)}
              </div>
              <p className="font-sans text-xs text-text-main leading-relaxed">{log.message}</p>
              <div className="text-[10px] text-text-muted">
                {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : "—"}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block overflow-hidden font-mono">
        <div onScroll={handleContainerScroll} className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-surface-200">
              <TableRow>
                <TableHead className="font-sans">Timestamp</TableHead>
                <TableHead className="font-sans">Event Type</TableHead>
                <TableHead className="font-sans">Level</TableHead>
                <TableHead className="font-sans">Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-[11px]">
              {showSkeletons ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-text-muted font-sans">
                    No logs recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-text-muted whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : "—"}
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
        </div>
      </Card>

      {/* Footer controls & counters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1 py-1 text-[11px] text-text-muted">
        <span>
          Showing <span className="font-mono text-text-main">{items.length.toLocaleString()}</span> of{" "}
          <span className="font-mono text-text-main">{total.toLocaleString()}</span> logs
        </span>

        {loading && !showSkeletons && (
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Loading next 50...</span>
          </div>
        )}

        {error && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setError(null); loadMore(); }}
            className="text-xs text-danger border-danger/30 hover:bg-danger/5 h-7 px-2.5"
          >
            {error}
          </Button>
        )}

        {!hasMore && items.length > 0 && !loading && (
          <span className="text-text-muted">All records loaded</span>
        )}

        {hasMore && !loading && !error && (
          <button
            type="button"
            onClick={() => loadMore()}
            className="text-primary hover:underline font-medium cursor-pointer"
          >
            Load 50 more ↓
          </button>
        )}
      </div>
    </div>
  );
}
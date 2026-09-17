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

type Job = {
  id: number;
  jobType: string;
  status: string;
  itemsTotal: number | null;
  itemsProcessed: number | null;
  itemsFailed: number | null;
  startedAt: Date | string | null;
  completedAt: Date | string | null;
  error: string | null;
};

interface Props {
  initialData: Job[];
  total: number;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return <Badge variant="success">COMPLETED</Badge>;
    case "RUNNING":
      return <Badge variant="default" className="animate-pulse">RUNNING</Badge>;
    case "STOPPED_QUOTA":
      return <Badge variant="warning">STOPPED_QUOTA</Badge>;
    default:
      return <Badge variant="destructive">{status}</Badge>;
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
      <div className="flex items-center justify-between">
        <div className="h-4 bg-surface-200 rounded w-28" />
        <div className="h-5 bg-surface-200 rounded w-20" />
      </div>
      <div className="h-12 bg-surface-200 rounded" />
      <div className="h-3 bg-surface-200 rounded w-32" />
    </div>
  );
}

export function JobsInfiniteList({ initialData, total }: Props) {
  const [items, setItems] = useState<Job[]>(initialData);
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
      const res = await fetch(`/api/jobs?lastId=${lastId}&limit=50`, {
        signal: abortControllerRef.current.signal,
      });
      if (!res.ok) throw new Error("fetch failed");
      const data: Job[] = await res.json();
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
      <div className="md:hidden space-y-2.5">
        {showSkeletons ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : items.length === 0 ? (
          <Card className="p-8 text-center text-xs text-text-muted">No worker jobs logged yet.</Card>
        ) : (
          items.map((j) => (
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
                  <span className={`font-mono ${(j.itemsFailed ?? 0) > 0 ? "text-danger font-semibold" : "text-text-muted"}`}>
                    {j.itemsFailed ?? 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                <span>Started: {j.startedAt ? new Date(j.startedAt).toLocaleTimeString() : "—"}</span>
                <span>{j.completedAt ? new Date(j.completedAt).toLocaleTimeString() : "Running"}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block overflow-hidden">
        <div onScroll={handleContainerScroll} className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-surface-200">
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Items Processed</TableHead>
                <TableHead className="text-right">Items Failed</TableHead>
                <TableHead>Started At</TableHead>
                <TableHead>Completed At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showSkeletons ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-text-muted">
                    No worker jobs logged yet.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="font-mono text-text-muted">#{j.id}</TableCell>
                    <TableCell className="font-medium text-text-main">{j.jobType}</TableCell>
                    <TableCell>{getStatusBadge(j.status)}</TableCell>
                    <TableCell className="text-right font-mono text-text-main">{j.itemsProcessed}</TableCell>
                    <TableCell className={`text-right font-mono ${(j.itemsFailed ?? 0) > 0 ? "text-danger font-semibold" : "text-text-muted"}`}>
                      {j.itemsFailed ?? 0}
                    </TableCell>
                    <TableCell className="text-text-secondary text-[11px]">
                      {j.startedAt ? new Date(j.startedAt).toLocaleTimeString() : "—"}
                    </TableCell>
                    <TableCell className="text-text-secondary text-[11px]">
                      {j.completedAt ? new Date(j.completedAt).toLocaleTimeString() : "In-flight"}
                    </TableCell>
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
          <span className="font-mono text-text-main">{total.toLocaleString()}</span> jobs
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
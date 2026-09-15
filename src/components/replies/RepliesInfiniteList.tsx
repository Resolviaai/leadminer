"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Loader2, ExternalLink } from "lucide-react";
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

type Reply = {
  id: number;
  threadId: string;
  messageId: string;
  senderEmail: string;
  snippet: string | null;
  receivedAt: Date | string | null;
  processed: boolean;
  channelTitle: string | null;
  channelUrl: string | null;
  campaignName: string | null;
};

interface Props {
  initialData: Reply[];
  total: number;
}

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 5 }).map((_, i) => (
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
      <div className="flex justify-between">
        <div className="space-y-1">
          <div className="h-4 bg-surface-200 rounded w-32" />
          <div className="h-3 bg-surface-200 rounded w-40" />
        </div>
        <div className="h-5 bg-surface-200 rounded w-16" />
      </div>
      <div className="h-12 bg-surface-200 rounded" />
      <div className="h-3 bg-surface-200 rounded w-20" />
    </div>
  );
}

export function RepliesInfiniteList({ initialData, total }: Props) {
  const [items, setItems] = useState<Reply[]>(initialData);
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
      const res = await fetch(`/api/replies?lastId=${lastId}&limit=50`, {
        signal: abortControllerRef.current.signal,
      });
      if (!res.ok) throw new Error("fetch failed");
      const data: Reply[] = await res.json();
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
          <Card className="p-8 text-center text-xs text-text-muted">
            No creator replies recorded yet.
          </Card>
        ) : (
          items.map((r) => (
            <Card key={r.id} className="p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-semibold text-xs text-text-main block">
                    {r.channelTitle || "Unknown Creator"}
                  </span>
                  <span className="font-mono text-[11px] text-text-muted">{r.senderEmail}</span>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {r.campaignName || "General"}
                </Badge>
              </div>
              <p className="text-xs text-text-secondary italic p-2 rounded bg-surface-200 border border-border/50 line-clamp-3">
                "{r.snippet || "No preview available"}"
              </p>
              <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                <span>{r.receivedAt ? new Date(r.receivedAt).toLocaleDateString() : "Recent"}</span>
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

      {/* Desktop table */}
      <Card className="hidden md:block overflow-hidden">
        <div onScroll={handleContainerScroll} className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-surface-200">
              <TableRow>
                <TableHead>Channel & Contact</TableHead>
                <TableHead>Latest Message Snippet</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showSkeletons ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-text-muted">
                    No creator replies recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium text-text-main">{r.channelTitle || "Unknown Channel"}</div>
                      <div className="text-text-muted font-mono text-[11px]">{r.senderEmail}</div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-text-secondary line-clamp-2 italic text-xs">
                        "{r.snippet || "No preview available"}"
                      </p>
                    </TableCell>
                    <TableCell className="text-text-secondary text-xs">{r.campaignName || "General"}</TableCell>
                    <TableCell className="text-text-muted text-[11px]">
                      {r.receivedAt ? new Date(r.receivedAt).toLocaleString() : "Recent"}
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
        </div>
      </Card>

      {/* Footer controls & counters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1 py-1 text-[11px] text-text-muted">
        <span>
          Showing <span className="font-mono text-text-main">{items.length.toLocaleString()}</span> of{" "}
          <span className="font-mono text-text-main">{total.toLocaleString()}</span> replies
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
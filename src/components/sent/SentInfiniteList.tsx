"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  Loader2,
  ExternalLink,
  Mail,
  Send,
  ArrowLeft,
  X,
  Check,
  Copy,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Star,
  CheckSquare,
  Square,
  User,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type SentMessage = {
  id: number;
  recipientEmail: string;
  subject: string;
  body: string;
  sendStatus: string;
  sentAt: Date | string | null;
  messageId: string | null;
  threadId: string | null;
  error: string | null;
  personalizationStatus: string | null;
  senderEmail: string | null;
  gmailAccountId: number | null;
  channelTitle: string | null;
  channelUrl: string | null;
  subscriberCount: number | null;
  campaignName: string | null;
};

export type InboxOption = {
  id: number;
  email: string;
  status: string;
  sentToday: number;
  dailyLimit: number;
};

interface Props {
  initialData: SentMessage[];
  total: number;
  inboxes: InboxOption[];
}

function formatDate(dateVal: Date | string | null): string {
  if (!dateVal) return "Queued";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "Recent";
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "SENT":
      return <Badge variant="success" className="text-[10px] px-1.5 py-0">SENT</Badge>;
    case "SENDING":
    case "READY":
      return <Badge variant="warning" className="text-[10px] px-1.5 py-0">SENDING</Badge>;
    case "FAILED":
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">FAILED</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{status}</Badge>;
  }
}

export function SentInfiniteList({ initialData, total, inboxes }: Props) {
  const [items, setItems] = useState<SentMessage[]>(initialData);
  const [hasMore, setHasMore] = useState(initialData.length < total);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEmail, setActiveEmail] = useState<SentMessage | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    const lastId = items.length > 0 ? items[items.length - 1].id : 0;
    abortControllerRef.current = new AbortController();
    try {
      const accParam = selectedAccountId !== "ALL" ? `&accountId=${selectedAccountId}` : "";
      const res = await fetch(`/api/sent?lastId=${lastId}&limit=50${accParam}`, {
        signal: abortControllerRef.current.signal,
      });
      if (!res.ok) throw new Error("fetch failed");
      const data: SentMessage[] = await res.json();
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
  }, [items, hasMore, selectedAccountId]);

  const handleAccountChange = async (accId: string) => {
    setSelectedAccountId(accId);
    setLoading(true);
    try {
      const accParam = accId !== "ALL" ? `&accountId=${accId}` : "";
      const res = await fetch(`/api/sent?lastId=0&limit=50${accParam}`);
      if (res.ok) {
        const data: SentMessage[] = await res.json();
        setItems(data);
        setHasMore(data.length >= 50);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (m) =>
        m.recipientEmail.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        (m.channelTitle && m.channelTitle.toLowerCase().includes(q)) ||
        (m.senderEmail && m.senderEmail.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loading || activeEmail) return;
    const handleWindowScroll = () => {
      if (!hasMore || loading || isLoadingRef.current) return;
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300) {
        loadMore();
      }
    };
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, [hasMore, loading, loadMore, activeEmail]);

  const handleCopyBody = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW 2: GMAIL-STYLE EMAIL DETAIL VIEW (matches media_1789507920945.png)
  // ══════════════════════════════════════════════════════════════════════════════
  if (activeEmail) {
    const senderLetter = (activeEmail.senderEmail?.[0] || "R").toUpperCase();
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-100 border border-border">
          <button
            type="button"
            onClick={() => setActiveEmail(null)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-200 border border-border text-text-secondary hover:text-text-main hover:bg-surface-300 text-xs font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sent</span>
          </button>

          <div className="flex items-center gap-2">
            {getStatusBadge(activeEmail.sendStatus)}

            <button
              type="button"
              onClick={() => handleCopyBody(activeEmail.body)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-200 border border-border text-text-muted hover:text-text-main text-xs font-medium transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Body</span>
                </>
              )}
            </button>

            {activeEmail.threadId && (
              <a
                href={`https://mail.google.com/mail/u/0/#inbox/${activeEmail.threadId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20 text-xs font-semibold transition-all"
              >
                <span>Open in Gmail</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Email Content Container */}
        <Card className="p-6 sm:p-8 space-y-6 border-border">
          {/* Subject Line Title */}
          <div className="space-y-1 pb-4 border-b border-border/70">
            <h2 className="text-lg sm:text-xl font-bold text-text-main tracking-tight leading-snug">
              {activeEmail.subject}
            </h2>
            <div className="flex items-center gap-2 flex-wrap text-xs text-text-muted">
              <span>Campaign: {activeEmail.campaignName || "Outreach Campaign"}</span>
              {activeEmail.personalizationStatus === "CUSTOMIZED" && (
                <span className="inline-flex items-center gap-1 text-[10px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  <Sparkles className="w-3 h-3" />
                  AI Personalized with Gemini 3.5 Flash Lite
                </span>
              )}
            </div>
          </div>

          {/* Sender & Recipient Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3.5">
              {/* Avatar circle */}
              <div className="w-10 h-10 rounded-full bg-emerald-600/90 text-white font-bold text-base flex items-center justify-center shadow-sm shrink-0">
                {senderLetter}
              </div>

              <div className="space-y-0.5">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-semibold text-xs sm:text-sm text-text-main">
                    {activeEmail.senderEmail?.split("@")[0] || "Outreach Sender"}
                  </span>
                  <span className="font-mono text-xs text-text-muted">
                    &lt;{activeEmail.senderEmail || "resolviaai@gmail.com"}&gt;
                  </span>
                </div>

                <div className="text-xs text-text-secondary flex items-center gap-1.5 flex-wrap">
                  <span className="text-text-muted">to</span>
                  <span className="font-mono text-text-main font-medium">
                    {activeEmail.recipientEmail}
                  </span>
                  {activeEmail.channelTitle && (
                    <span className="text-text-muted">
                      ({activeEmail.channelTitle}
                      {activeEmail.channelUrl && (
                        <a
                          href={activeEmail.channelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center ml-1 text-primary hover:underline"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      )
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right text-xs text-text-muted font-mono">
              {activeEmail.sentAt ? new Date(activeEmail.sentAt).toLocaleString() : "Recently sent"}
            </div>
          </div>

          {/* Email Body Card */}
          <div className="p-5 sm:p-6 rounded-xl bg-surface-200/60 border border-border">
            <pre className="text-xs sm:text-sm font-sans text-text-main whitespace-pre-wrap leading-relaxed">
              {activeEmail.body}
            </pre>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/70 text-xs">
            <button
              type="button"
              onClick={() => setActiveEmail(null)}
              className="text-text-muted hover:text-text-main flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to sent list</span>
            </button>

            {activeEmail.threadId && (
              <a
                href={`https://mail.google.com/mail/u/0/#inbox/${activeEmail.threadId}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <span>View thread in Gmail</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW 1: GMAIL-STYLE SENT LIST VIEW (matches media_1789507877308.png)
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-3">
      {/* Top Toolbar: Filter by Inbox, Search, and Pagination info */}
      <Card className="p-3 border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Account Filter & Search Input */}
          <div className="flex items-center gap-2.5 flex-1 flex-wrap">
            {/* Account Selector */}
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
              <select
                value={selectedAccountId}
                onChange={(e) => handleAccountChange(e.target.value)}
                className="bg-surface-200 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Connected Accounts ({inboxes.length})</option>
                {inboxes.map((acc) => (
                  <option key={acc.id} value={acc.id.toString()}>
                    {acc.email} ({acc.sentToday}/{acc.dailyLimit} today)
                  </option>
                ))}
              </select>
            </div>

            {/* Search bar */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipient, channel, or subject..."
                className="w-full bg-surface-200 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-muted"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Counter & Refresh */}
          <div className="flex items-center gap-3 text-xs text-text-muted shrink-0 self-end md:self-auto">
            <span>
              Showing <span className="font-mono text-text-main font-semibold">{filteredItems.length}</span> of{" "}
              <span className="font-mono text-text-main font-semibold">{total.toLocaleString()}</span>
            </span>
            <button
              type="button"
              onClick={() => handleAccountChange(selectedAccountId)}
              title="Refresh"
              className="p-1.5 rounded-lg bg-surface-200 border border-border text-text-muted hover:text-text-main hover:bg-surface-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            </button>
          </div>
        </div>
      </Card>

      {/* Gmail-Style Email List Container */}
      <Card className="overflow-hidden border-border divide-y divide-border/40">
        {filteredItems.length === 0 && !loading ? (
          <div className="p-12 text-center text-xs text-text-muted space-y-2">
            <Send className="w-8 h-8 mx-auto text-text-muted/40" />
            <p className="font-semibold text-text-secondary text-sm">No sent messages found</p>
            <p className="text-[11px] text-text-muted max-w-sm mx-auto">
              Emails sent by your autonomous outreach worker will appear here in real time.
            </p>
          </div>
        ) : (
          filteredItems.map((m) => {
            const bodySnippet = m.body.replace(/\s+/g, " ").trim();
            const dateStr = formatDate(m.sentAt);

            return (
              <div
                key={m.id}
                onClick={() => setActiveEmail(m)}
                className="group flex items-center gap-3 px-3.5 py-2.5 sm:py-3 hover:bg-surface-200/80 cursor-pointer transition-colors text-xs select-none"
              >
                {/* Checkbox / Star indicators (Gmail style) */}
                <div className="flex items-center gap-2 text-text-muted group-hover:text-text-secondary shrink-0">
                  <Square className="w-3.5 h-3.5 opacity-50 hover:opacity-100 transition-opacity" />
                  <Star className="w-3.5 h-3.5 opacity-40 hover:opacity-100 transition-opacity" />
                </div>

                {/* Sender inbox pill (shows which account sent it) */}
                <div className="hidden lg:flex items-center shrink-0">
                  <span className="font-mono text-[10px] text-text-secondary bg-surface-300 border border-border/80 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                    {m.senderEmail?.split("@")[0] || "resolvia"}
                  </span>
                </div>

                {/* Recipient / Channel */}
                <div className="w-36 sm:w-44 md:w-52 shrink-0 truncate">
                  <span className="font-semibold text-text-main truncate block">
                    To: {m.channelTitle || m.recipientEmail.split("@")[0]}
                  </span>
                  <span className="font-mono text-[10px] text-text-muted truncate block">
                    {m.recipientEmail}
                  </span>
                </div>

                {/* Subject & Preview snippet (Contiguous line with truncation, identical to Gmail) */}
                <div className="flex-1 min-w-0 truncate">
                  <span className="font-medium text-text-main">
                    {m.subject}
                  </span>
                  <span className="text-text-muted mx-1.5">—</span>
                  <span className="text-text-muted font-normal text-[11px] truncate">
                    {bodySnippet}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="hidden sm:block shrink-0">
                  {getStatusBadge(m.sendStatus)}
                </div>

                {/* Date & Hover actions */}
                <div className="shrink-0 text-right min-w-[70px]">
                  <span className="font-mono text-[11px] text-text-muted group-hover:hidden">
                    {dateStr}
                  </span>
                  <div className="hidden group-hover:flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveEmail(m);
                      }}
                      title="View details"
                      className="p-1 rounded bg-surface-300 hover:bg-surface-400 text-text-main transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-primary">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading more sent mail...</span>
        </div>
      )}

      {/* Footer */}
      {!hasMore && filteredItems.length > 0 && !loading && (
        <p className="text-center text-[11px] text-text-muted py-2">
          All {total.toLocaleString()} sent records loaded
        </p>
      )}
    </div>
  );
}

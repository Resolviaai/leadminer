"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Loader2,
  ExternalLink,
  Send,
  ArrowLeft,
  X,
  Check,
  Copy,
  Sparkles,
  Search,
  RefreshCw,
  Square,
  CheckSquare,
  MinusSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

const PAGE_SIZE = 50;

export function SentInfiniteList({ initialData, total, inboxes }: Props) {
  const [items, setItems] = useState<SentMessage[]>(initialData);
  const [totalCount, setTotalCount] = useState<number>(total);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("ALL");
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeEmail, setActiveEmail] = useState<SentMessage | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close custom account dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
    }
    if (accountDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [accountDropdownOpen]);

  // Fetch a specific page of 50 items
  const fetchPage = async (
    targetPage: number,
    accId = selectedAccountId,
    query = searchQuery
  ) => {
    if (loading) return;
    setLoading(true);
    try {
      const accParam = accId !== "ALL" ? `&accountId=${accId}` : "";
      const qParam = query.trim() ? `&q=${encodeURIComponent(query.trim())}` : "";
      const res = await fetch(
        `/api/sent?page=${targetPage}&limit=${PAGE_SIZE}&paginated=true${accParam}${qParam}`
      );
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setItems(data.items || []);
      setTotalCount(typeof data.total === "number" ? data.total : (data.items || []).length);
      setPage(targetPage);
      setSelectedIds(new Set());
    } catch (e) {
      console.error("[Sent page fetch error]", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = (accId: string) => {
    setSelectedAccountId(accId);
    setAccountDropdownOpen(false);
    fetchPage(1, accId, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPage(1, selectedAccountId, searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    fetchPage(1, selectedAccountId, "");
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Selection handlers
  const allPageIds = useMemo(() => items.map((i) => i.id), [items]);
  const isAllSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const isIndeterminate = !isAllSelected && allPageIds.some((id) => selectedIds.has(id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allPageIds));
    }
  };

  const handleToggleRow = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyBody = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Pagination bounds calculation
  const startItem = totalCount > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endItem = totalCount > 0 ? Math.min(page * PAGE_SIZE, totalCount) : 0;
  const rangeLabel = totalCount > 0 ? `${startItem}–${endItem} of ${totalCount.toLocaleString()}` : "0 of 0";

  // Selected account object
  const currentAccount = inboxes.find((i) => i.id.toString() === selectedAccountId);

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW 2: GMAIL-STYLE EMAIL DETAIL VIEW
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
  // VIEW 1: GMAIL-STYLE SENT LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-3">
      {/* Top Toolbar: Master Checkbox, Refresh, Custom Account Dropdown, Search, and 50-item Pagination */}
      <Card className="p-2.5 sm:p-3 border-border bg-surface-100/90 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Left: Select, Refresh, Account Filter & Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px] flex-wrap sm:flex-nowrap">
            {/* Master Checkbox Toggle Button */}
            <button
              type="button"
              onClick={handleToggleSelectAll}
              disabled={items.length === 0}
              className={`p-1.5 rounded-md hover:bg-surface-200 transition-colors flex items-center gap-0.5 ${
                items.length === 0 ? "opacity-40 cursor-default" : "cursor-pointer text-text-muted hover:text-text-main"
              }`}
              title={isAllSelected ? "Deselect all" : "Select all on page"}
              aria-label="Select all on page"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-primary" />
              ) : isIndeterminate ? (
                <MinusSquare className="w-4 h-4 text-primary" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>

            {/* Selection count badge if any selected */}
            {selectedIds.size > 0 && (
              <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 shrink-0">
                {selectedIds.size} selected
              </span>
            )}

            {/* Refresh button */}
            <button
              type="button"
              onClick={() => fetchPage(page, selectedAccountId, searchQuery)}
              title="Refresh outbox"
              disabled={loading}
              className="p-1.5 rounded-md hover:bg-surface-200 text-text-muted hover:text-text-main transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            </button>

            <div className="h-4 w-px bg-border/80 mx-1 hidden sm:block" />

            {/* Custom Sleek Account Selector Dropdown (Replaces native OS <select>) */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-surface-200/90 border border-border/80 hover:border-border text-xs text-text-main font-medium transition-all min-w-[210px]"
                aria-haspopup="listbox"
                aria-expanded={accountDropdownOpen}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="truncate">
                    {selectedAccountId === "ALL"
                      ? `All Accounts (${inboxes.length})`
                      : currentAccount?.email || "Selected Account"}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-text-muted shrink-0 transition-transform duration-150 ${
                    accountDropdownOpen ? "rotate-180 text-text-main" : ""
                  }`}
                />
              </button>

              {accountDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-50 min-w-[260px] max-w-[340px] bg-surface-100 border border-border rounded-xl shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => handleAccountChange("ALL")}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                      selectedAccountId === "ALL"
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-text-main hover:bg-surface-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span className="truncate">All Connected Accounts</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-mono text-text-muted">({inboxes.length})</span>
                      {selectedAccountId === "ALL" && <Check className="w-3.5 h-3.5 text-primary" />}
                    </div>
                  </button>

                  {inboxes.length > 0 && <div className="my-1 border-t border-border/60" />}

                  {inboxes.map((acc) => {
                    const isSelected = selectedAccountId === acc.id.toString();
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleAccountChange(acc.id.toString())}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                          isSelected
                            ? "bg-primary/15 text-primary font-semibold"
                            : "text-text-main hover:bg-surface-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span className="truncate font-mono text-[11px]">{acc.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-200 text-text-muted">
                            {acc.sentToday}/{acc.dailyLimit}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipient, channel, or subject..."
                className="w-full bg-surface-200/80 border border-border/80 rounded-lg pl-8 pr-7 py-1.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-muted"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </form>
          </div>

          {/* Right: Working 50-per-page Pagination Controls (< > arrows) */}
          <div className="flex items-center gap-1.5 text-xs text-text-muted font-mono select-none shrink-0">
            <span className="px-1 text-[11px] sm:text-xs text-text-secondary">
              {rangeLabel}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => fetchPage(page - 1)}
                disabled={page <= 1 || loading}
                className={`p-1.5 rounded-md transition-colors ${
                  page > 1 && !loading
                    ? "text-text-secondary hover:text-text-main hover:bg-surface-200 cursor-pointer"
                    : "text-text-muted/30 cursor-default"
                }`}
                aria-label="Previous page"
                title={page > 1 ? "Previous page" : "First page"}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => fetchPage(page + 1)}
                disabled={page >= totalPages || loading}
                className={`p-1.5 rounded-md transition-colors ${
                  page < totalPages && !loading
                    ? "text-text-secondary hover:text-text-main hover:bg-surface-200 cursor-pointer"
                    : "text-text-muted/30 cursor-default"
                }`}
                aria-label="Next page"
                title={page < totalPages ? "Next page" : "Last page"}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Gmail-Style Email List Container */}
      <Card className="overflow-hidden border-border divide-y divide-border/40">
        {items.length === 0 && !loading ? (
          <div className="p-12 text-center text-xs text-text-muted space-y-2">
            <Send className="w-8 h-8 mx-auto text-text-muted/40" />
            <p className="font-semibold text-text-secondary text-sm">No sent messages found</p>
            <p className="text-[11px] text-text-muted max-w-sm mx-auto">
              Emails sent by your autonomous outreach worker will appear here in real time.
            </p>
          </div>
        ) : (
          items.map((m) => {
            const bodySnippet = m.body.replace(/\s+/g, " ").trim();
            const dateStr = formatDate(m.sentAt);
            const isSelected = selectedIds.has(m.id);

            return (
              <div
                key={m.id}
                onClick={() => setActiveEmail(m)}
                className={`group flex items-center gap-3 px-3.5 py-2.5 sm:py-3 cursor-pointer transition-colors text-xs select-none min-h-[44px] ${
                  isSelected ? "bg-primary/[0.08] hover:bg-primary/[0.12]" : "hover:bg-surface-200/70"
                }`}
              >
                {/* Checkbox button (Star completely removed as requested) */}
                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleToggleRow(m.id, e)}
                    aria-label={isSelected ? "Deselect row" : "Select row"}
                    className="p-1 -m-1 rounded hover:bg-surface-300/50 transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-text-muted/60 group-hover:text-text-secondary hover:text-text-main transition-colors" />
                    )}
                  </button>
                </div>

                {/* Recipient — clean single line, identical to Gmail */}
                <div className="w-36 sm:w-44 md:w-52 shrink-0 truncate">
                  <span className="font-medium text-text-main truncate block">
                    To: {m.channelTitle || m.recipientEmail.split("@")[0]}
                  </span>
                </div>

                {/* Subject & Preview snippet (Contiguous single line with truncation, identical to Gmail) */}
                <div className="flex-1 min-w-0 flex items-center truncate">
                  <span className="font-semibold text-text-main shrink-0">
                    {m.subject}
                  </span>
                  <span className="text-text-muted mx-1.5 shrink-0">—</span>
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
          <span>Loading sent messages...</span>
        </div>
      )}

      {/* Pagination Footer Indicator */}
      {totalCount > 0 && !loading && (
        <div className="flex items-center justify-between text-[11px] text-text-muted px-2 py-1">
          <span>
            Showing page {page} of {totalPages} (50 per page)
          </span>
          <span>
            Total {totalCount.toLocaleString()} sent record{totalCount === 1 ? "" : "s"}
          </span>
        </div>
      )}
    </div>
  );
}

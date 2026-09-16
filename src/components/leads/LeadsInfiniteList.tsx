"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Loader2,
  ExternalLink,
  Mail,
  Globe,
  Phone,
  RefreshCw,
  CheckCircle2,
  MoreVertical,
  Edit3,
  Trash2,
  Ban,
  Search,
  X,
  CheckSquare,
  Square,
  ShieldAlert,
} from "lucide-react";
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

export type Lead = {
  id: number;
  channelId: string;
  channelTitle: string;
  channelUrl: string;
  subscriberCount: number | null;
  qualificationStatus: string;
  outreachStatus: string;
  suppressionStatus?: boolean;
  website?: string | null;
  phone?: string | null;
  contactPageUrl?: string | null;
  country?: string | null;
  discoveredAt: Date | string | null;
  email: string | null;
  emailStatus: string | null;
  sourceKeyword: string | null;
  category: string | null;
  additionalEmails?: string[];
  socialLinks?: { type: string; value: string }[];
};

interface Props {
  initialData: Lead[];
  total: number;
}

type FilterTab = "ALL" | "EMAIL_FOUND" | "NO_EMAIL" | "VERIFIED" | "FAILED" | "CONTACTED";

function getEmailBadge(status: string | null) {
  switch (status) {
    case "VALID":
    case "DOMAIN_VALID":
    case "MAILBOX_VERIFIED":
      return <Badge variant="success">{status}</Badge>;
    case "INVALID":
    case "DISPOSABLE":
      return <Badge variant="destructive">{status}</Badge>;
    case "RISKY":
      return <Badge variant="warning">RISKY</Badge>;
    default:
      return <Badge variant="secondary">{status || "NONE"}</Badge>;
  }
}

function getQualBadge(status: string, suppressed?: boolean) {
  if (suppressed) {
    return (
      <Badge variant="destructive" className="gap-1 bg-danger/10 text-danger border-danger/30">
        <Ban className="w-3 h-3" />
        <span>SUPPRESSED</span>
      </Badge>
    );
  }
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

export function LeadsInfiniteList({ initialData, total: initialTotal }: Props) {
  const [items, setItems] = useState<Lead[]>(initialData);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(initialData.length < initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  // Edit Lead Modal
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close menu on outside click/tap
  useEffect(() => {
    if (menuOpenId === null) return;
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-lead-menu="true"]')) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleGlobalClick);
    document.addEventListener("touchstart", handleGlobalClick);
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
      document.removeEventListener("touchstart", handleGlobalClick);
    };
  }, [menuOpenId]);

  const fetchLeads = useCallback(
    async (isReset = false) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const lastId = isReset ? 0 : items.length > 0 ? items[items.length - 1].id : 0;
      const params = new URLSearchParams();
      if (lastId > 0) params.set("lastId", lastId.toString());
      params.set("limit", "50");
      if (activeTab !== "ALL") params.set("filter", activeTab);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      try {
        const res = await fetch(`/api/leads?${params.toString()}`, {
          signal: abortControllerRef.current.signal,
        });
        if (!res.ok) throw new Error("Fetch failed");
        const data: Lead[] = await res.json();

        if (isReset) {
          setItems(data);
          setHasMore(data.length >= 50);
        } else {
          if (data.length === 0) {
            setHasMore(false);
          } else {
            setItems((prev) => {
              const existing = new Set(prev.map((i) => i.id));
              return [...prev, ...data.filter((i) => !existing.has(i.id))];
            });
            if (data.length < 50) setHasMore(false);
          }
        }
      } catch (e: any) {
        if (e.name === "AbortError") return;
        setError("Failed to load records");
      } finally {
        isLoadingRef.current = false;
        setLoading(false);
      }
    },
    [items, activeTab, searchQuery]
  );

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setSelectedIds(new Set());
    setTimeout(() => fetchLeads(true), 0);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore || loading || isLoadingRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      fetchLeads(false);
    }
  };

  // Reprocess Single Lead
  const handleReprocess = async (id: number) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/leads/${id}/reprocess`, { method: "POST" });
      if (res.ok) {
        const result = await res.json();
        setItems((prev) =>
          prev.map((l) => {
            if (l.id === id) {
              return {
                ...l,
                email: result.primaryEmail || l.email,
                emailStatus: result.primaryEmailStatus || l.emailStatus,
                phone: result.phone || l.phone,
                contactPageUrl: result.contactPageUrl || l.contactPageUrl,
                qualificationStatus: result.qualificationStatus || l.qualificationStatus,
                website: result.lead?.website || l.website,
              };
            }
            return l;
          })
        );
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Verify Single Lead
  const handleVerify = async (id: number) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/leads/${id}/verify`, { method: "POST" });
      if (res.ok) {
        const result = await res.json();
        setItems((prev) =>
          prev.map((l) => {
            if (l.id === id) {
              return {
                ...l,
                emailStatus: result.status,
                qualificationStatus: result.qualificationStatus,
              };
            }
            return l;
          })
        );
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Suppress Single Lead
  const handleSuppress = async (id: number) => {
    setActionLoadingId(id);
    setMenuOpenId(null);
    try {
      const res = await fetch(`/api/leads/${id}/suppress`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setItems((prev) =>
          prev.map((l) =>
            l.id === id
              ? {
                  ...l,
                  suppressionStatus: updated.suppressionStatus,
                  qualificationStatus: updated.qualificationStatus,
                }
              : l
          )
        );
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Single Lead
  const handleDelete = async (id: number) => {
    if (!confirm("Remove this lead from LeadMiner?")) return;
    setActionLoadingId(id);
    setMenuOpenId(null);
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((l) => l.id !== id));
        setTotalCount((t) => Math.max(0, t - 1));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Batch actions
  const handleBatchAction = async (action: "reprocess" | "verify" | "suppress" | "delete") => {
    if (selectedIds.size === 0) return;
    if (action === "delete" && !confirm(`Delete ${selectedIds.size} selected lead(s)?`)) return;

    setBatchLoading(true);
    const ids = Array.from(selectedIds);
    try {
      const res = await fetch(`/api/leads/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });
      if (res.ok) {
        if (action === "delete") {
          setItems((prev) => prev.filter((l) => !selectedIds.has(l.id)));
          setTotalCount((t) => Math.max(0, t - ids.length));
        } else if (action === "suppress") {
          setItems((prev) =>
            prev.map((l) =>
              selectedIds.has(l.id)
                ? { ...l, suppressionStatus: true, qualificationStatus: "DISQUALIFIED" }
                : l
            )
          );
        } else {
          await fetchLeads(true);
        }
        setSelectedIds(new Set());
      }
    } finally {
      setBatchLoading(false);
    }
  };

  // Selection
  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((k) => k.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Edit Lead Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLead) return;
    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/leads/${editLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: editEmail.trim() || undefined,
          phone: editPhone.trim() || undefined,
          website: editWebsite.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) =>
          prev.map((l) =>
            l.id === editLead.id
              ? {
                  ...l,
                  email: data.email || l.email,
                  emailStatus: data.emailStatus || l.emailStatus,
                  phone: editPhone.trim() || l.phone,
                  website: editWebsite.trim() || l.website,
                  qualificationStatus: data.lead?.qualificationStatus || l.qualificationStatus,
                }
              : l
          )
        );
        setEditLead(null);
      }
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  return (
    <div className="space-y-2.5 flex-1 min-h-0 flex flex-col">
      {/* Top Filter Tabs & Search Bar (Pinned at top of list) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 shrink-0">
        {/* Filter Tabs (Clean Rounded Corners) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none no-scrollbar -mx-1 px-1">
          {[
            { key: "ALL", label: "All Leads" },
            { key: "EMAIL_FOUND", label: "Email Found" },
            { key: "NO_EMAIL", label: "No Email" },
            { key: "VERIFIED", label: "Verified" },
            { key: "FAILED", label: "Failed" },
            { key: "CONTACTED", label: "Contacted" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key as FilterTab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap min-h-[34px] md:min-h-0 cursor-pointer active:scale-98 ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "bg-surface-200 text-text-secondary hover:text-text-main hover:bg-surface-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 md:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search channels or emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-100 border border-border rounded-md pl-8 pr-8 py-1.5 text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary h-8.5"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main p-0.5 cursor-pointer flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 bg-surface-200 border border-primary/30 p-2.5 rounded-lg text-xs animate-in fade-in slide-in-from-top-2 shrink-0">
          <div className="flex items-center gap-2 font-medium text-text-main">
            <span className="font-mono bg-primary/20 text-primary px-2 py-0.5 rounded">
              {selectedIds.size}
            </span>
            <span>selected</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              disabled={batchLoading}
              onClick={() => handleBatchAction("reprocess")}
              className="gap-1 h-7 px-2 text-xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reprocess</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={batchLoading}
              onClick={() => handleBatchAction("verify")}
              className="gap-1 h-7 px-2 text-xs"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Verify</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={batchLoading}
              onClick={() => handleBatchAction("suppress")}
              className="gap-1 h-7 px-2 text-xs"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Suppress</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={batchLoading}
              onClick={() => handleBatchAction("delete")}
              className="gap-1 h-7 px-2 text-xs"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </Button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-text-muted hover:text-text-main ml-1 p-1 cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Cards (Native Mobile App Experience) */}
      <div className="md:hidden space-y-3 overflow-y-auto pb-4">
        {loading && items.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted">Loading leads...</div>
        ) : items.length === 0 ? (
          <Card className="p-6 text-center text-xs text-text-muted">
            No leads found matching this filter.
          </Card>
        ) : (
          items.map((lead) => (
            <div
              key={lead.id}
              className={`bg-surface-100 border rounded-xl p-4 space-y-3 transition-all ${
                selectedIds.has(lead.id) ? "border-primary/50 bg-primary/[0.02]" : "border-border shadow-sm"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleSelect(lead.id)}
                    className="text-text-muted hover:text-primary mt-0.5 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center -ml-1.5"
                    aria-label={selectedIds.has(lead.id) ? "Deselect lead" : "Select lead"}
                  >
                    {selectedIds.has(lead.id) ? (
                      <CheckSquare className="w-4.5 h-4.5 text-primary" />
                    ) : (
                      <Square className="w-4.5 h-4.5" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-text-main leading-tight truncate">
                        {lead.channelTitle}
                      </span>
                      {lead.country && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 uppercase font-mono text-text-muted">
                          {lead.country}
                        </Badge>
                      )}
                      <a
                        href={lead.channelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-text-muted hover:text-text-main inline-flex items-center justify-center p-1 rounded min-w-[28px] min-h-[28px]"
                        aria-label={`Open ${lead.channelTitle} on YouTube`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted">
                      <span className="font-mono tabular-nums">
                        {lead.subscriberCount ? lead.subscriberCount.toLocaleString() : "0"} subscribers
                      </span>
                      {lead.sourceKeyword && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[130px]">kw: {lead.sourceKeyword}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 pt-0.5">
                  {getQualBadge(lead.qualificationStatus, lead.suppressionStatus)}
                </div>
              </div>

              {/* Contact Area (Recessed Layer 2) */}
              <div className="p-3 rounded-lg bg-surface-200/70 border border-border/40 space-y-2 text-xs">
                {lead.email ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span className="font-mono text-text-main text-[11px] font-medium truncate">
                        {lead.email}
                      </span>
                    </div>
                    <div className="shrink-0">
                      {getEmailBadge(lead.emailStatus)}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleReprocess(lead.id)}
                    disabled={actionLoadingId === lead.id}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-primary/10 border border-primary/25 hover:bg-primary/20 active:scale-[0.98] text-primary font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${actionLoadingId === lead.id ? "animate-spin" : ""}`} />
                    <span>No email found yet → Tap to Reprocess</span>
                  </button>
                )}

                {/* Additional Contacts Row: Website, Phone */}
                {(lead.website || lead.phone || lead.contactPageUrl) && (
                  <div className="flex items-center gap-3 pt-1.5 border-t border-border/40 text-[11px]">
                    {(lead.website || lead.contactPageUrl) && (
                      <a
                        href={lead.contactPageUrl || lead.website || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-primary hover:underline truncate max-w-[160px] font-medium"
                      >
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{lead.contactPageUrl ? "Contact Page" : "Website"}</span>
                      </a>
                    )}

                    {lead.phone && (
                      <div className="inline-flex items-center gap-1.5 text-text-secondary font-mono text-[11px]">
                        <Phone className="w-3 h-3 shrink-0 text-text-muted" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Social links */}
              {lead.socialLinks && lead.socialLinks.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {lead.socialLinks.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-surface-200 border border-border/50 text-text-secondary text-[10px]"
                    >
                      {s.type.replace("_X", "")}: <span className="font-mono text-text-main">{s.value}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Mobile Action Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50 gap-2">
                <div className="text-[11px] text-text-muted shrink-0">
                  {getOutreachBadge(lead.outreachStatus)}
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionLoadingId === lead.id}
                    onClick={() => handleReprocess(lead.id)}
                    className="min-h-[40px] px-3 text-xs gap-1.5 active:scale-95 transition-transform"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${actionLoadingId === lead.id ? "animate-spin" : ""}`} />
                    <span>Reprocess</span>
                  </Button>

                  {lead.email && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoadingId === lead.id}
                      onClick={() => handleVerify(lead.id)}
                      className="min-h-[40px] px-2.5 text-xs gap-1 active:scale-95 transition-transform"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      <span>Verify</span>
                    </Button>
                  )}

                  <div className="relative inline-block text-left" data-lead-menu="true">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setMenuOpenId(menuOpenId === lead.id ? null : lead.id)}
                      className="min-h-[40px] min-w-[40px] p-0 active:scale-95"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>

                    {menuOpenId === lead.id && (
                      <>
                        <div
                          className="fixed inset-0 z-30 cursor-default"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(null);
                          }}
                        />
                        <div className="absolute right-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 w-40 bg-surface-100 border border-border rounded-xl shadow-xl py-1 z-40 text-xs animate-in fade-in zoom-in-95">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenId(null);
                              setEditLead(lead);
                              setEditEmail(lead.email || "");
                              setEditPhone(lead.phone || "");
                              setEditWebsite(lead.website || "");
                            }}
                            className="w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-surface-200 text-text-main cursor-pointer min-h-[40px]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Contacts</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSuppress(lead.id)}
                            className="w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-surface-200 text-text-main cursor-pointer min-h-[40px]"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>{lead.suppressionStatus ? "Unsuppress" : "Suppress Lead"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(lead.id)}
                            className="w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-danger/10 text-danger cursor-pointer min-h-[40px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Lead</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (Takes Remaining Screen Height and Scrolls Internally) */}
      <Card className="hidden md:flex flex-1 min-h-0 flex-col overflow-hidden border-border">
        <div onScroll={handleContainerScroll} className="flex-1 min-h-0 overflow-y-auto overflow-x-auto relative">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-surface-200 shadow-sm">
              <TableRow>
                <TableHead className="w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-text-muted hover:text-primary cursor-pointer p-1"
                  >
                    {items.length > 0 && selectedIds.size === items.length ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Subscribers</TableHead>
                <TableHead>Discovered Contacts</TableHead>
                <TableHead>Deliverability</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Outreach</TableHead>
                <TableHead className="text-right w-44">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-text-muted">
                    Loading leads...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-text-muted">
                    No leads discovered matching this filter.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className={`transition-colors ${selectedIds.has(lead.id) ? "bg-primary/[0.03]" : ""}`}
                  >
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => toggleSelect(lead.id)}
                        className="text-text-muted hover:text-primary cursor-pointer p-1"
                      >
                        {selectedIds.has(lead.id) ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </TableCell>

                    {/* Channel Column */}
                    <TableCell>
                      <div className="flex items-center space-x-1.5 max-w-[220px]">
                        <span className="font-medium text-text-main truncate" title={`${lead.channelTitle} (${lead.sourceKeyword ? `kw: ${lead.sourceKeyword}` : 'autonomous'})`}>
                          {lead.channelTitle}
                        </span>
                        {lead.country && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 uppercase font-mono text-text-muted shrink-0">
                            {lead.country}
                          </Badge>
                        )}
                        <a
                          href={lead.channelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-text-muted hover:text-text-main shrink-0"
                          title={`Open ${lead.channelTitle} on YouTube`}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </TableCell>

                    {/* Subscribers */}
                    <TableCell className="text-right font-mono text-text-secondary tabular-nums">
                      {lead.subscriberCount ? lead.subscriberCount.toLocaleString() : "0"}
                    </TableCell>

                    {/* Discovered Contacts Column */}
                    <TableCell>
                      <div className="flex items-center space-x-2 max-w-[260px]">
                        {lead.email ? (
                          <span className="font-mono text-text-main text-[11px] truncate" title={lead.email}>
                            {lead.email}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleReprocess(lead.id)}
                            disabled={actionLoadingId === lead.id}
                            className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer bg-primary/10 px-1.5 py-0.5 rounded shrink-0"
                            title="No email found yet — tap to reprocess website & contact info"
                          >
                            <RefreshCw className={`w-2.5 h-2.5 ${actionLoadingId === lead.id ? "animate-spin" : ""}`} />
                            <span>No email yet → Reprocess</span>
                          </button>
                        )}

                        {(lead.website || lead.contactPageUrl) && (
                          <a
                            href={lead.contactPageUrl || lead.website || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="text-text-secondary hover:text-primary transition-colors shrink-0"
                            title={lead.contactPageUrl ? `Contact Page: ${lead.contactPageUrl}` : `Website: ${lead.website}`}
                          >
                            <Globe className="w-3 h-3" />
                          </a>
                        )}

                        {lead.phone && (
                          <span className="text-text-muted shrink-0" title={`Phone: ${lead.phone}`}>
                            <Phone className="w-2.5 h-2.5" />
                          </span>
                        )}

                        {lead.socialLinks && lead.socialLinks.length > 0 && (
                          <span
                            className="text-[9px] px-1 py-0.2 rounded bg-surface-200 text-text-muted border border-border/50 shrink-0 font-mono"
                            title={lead.socialLinks.map((s) => `${s.type}: ${s.value}`).join(", ")}
                          >
                            {lead.socialLinks.length}s
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Verification */}
                    <TableCell>{getEmailBadge(lead.emailStatus)}</TableCell>

                    {/* Qualification */}
                    <TableCell>{getQualBadge(lead.qualificationStatus, lead.suppressionStatus)}</TableCell>

                    {/* Outreach Status */}
                    <TableCell>{getOutreachBadge(lead.outreachStatus)}</TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Reprocess website & contacts"
                          disabled={actionLoadingId === lead.id}
                          onClick={() => handleReprocess(lead.id)}
                          className="h-7 px-2 text-[11px] gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${actionLoadingId === lead.id ? "animate-spin" : ""}`} />
                          <span>Reprocess</span>
                        </Button>

                        {lead.email && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Verify email"
                            disabled={actionLoadingId === lead.id}
                            onClick={() => handleVerify(lead.id)}
                            className="h-7 w-7 p-0"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {/* More menu with Backdrop Dismiss */}
                        <div className="relative inline-block text-left" data-lead-menu="true">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setMenuOpenId(menuOpenId === lead.id ? null : lead.id)}
                            className="h-7 w-7 p-0"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>

                          {menuOpenId === lead.id && (
                            <>
                              <div
                                className="fixed inset-0 z-30 cursor-default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenId(null);
                                }}
                              />
                              <div className="absolute right-0 mt-1 w-36 bg-surface-100 border border-border rounded-md shadow-lg py-1 z-40 text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    setEditLead(lead);
                                    setEditEmail(lead.email || "");
                                    setEditPhone(lead.phone || "");
                                    setEditWebsite(lead.website || "");
                                  }}
                                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-surface-200 text-text-main cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit Contacts</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSuppress(lead.id)}
                                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-surface-200 text-text-main cursor-pointer"
                                >
                                  <Ban className="w-3 h-3" />
                                  <span>{lead.suppressionStatus ? "Unsuppress" : "Suppress"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(lead.id)}
                                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-danger/10 text-danger cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Footer controls & counters (Pinned at bottom of list) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1 py-1 text-[11px] text-text-muted shrink-0">
        <span>
          Showing <span className="font-mono text-text-main">{items.length.toLocaleString()}</span> of{" "}
          <span className="font-mono text-text-main">{totalCount.toLocaleString()}</span> leads
        </span>

        {loading && (
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Loading...</span>
          </div>
        )}

        {error && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLeads(false)}
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
            onClick={() => fetchLeads(false)}
            className="text-primary hover:underline font-medium cursor-pointer min-h-[44px] px-3 flex items-center active:scale-95 transition-transform"
          >
            Load 50 more ↓
          </button>
        )}
      </div>

      {/* Modal: Edit Lead Contacts */}
      {editLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-100 border border-border rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-text-main">Edit Contact Details</h2>
                <p className="text-xs text-text-muted">{editLead.channelTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditLead(null)}
                className="text-text-muted hover:text-text-main cursor-pointer p-1 min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-text-secondary font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="creator@domain.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-surface-200 border border-border rounded-md px-3 py-2 text-text-main focus:outline-none focus:ring-1 focus:ring-primary min-h-[38px]"
                />
                <span className="text-[10px] text-text-muted mt-0.5 block">
                  Entering an email will automatically trigger deliverability verification.
                </span>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Phone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+1 (555) 123-4567"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-surface-200 border border-border rounded-md px-3 py-2 text-text-main focus:outline-none focus:ring-1 focus:ring-primary min-h-[38px]"
                />
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Website URL</label>
                <input
                  type="text"
                  placeholder="https://creatorportfolio.com"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  className="w-full bg-surface-200 border border-border rounded-md px-3 py-2 text-text-main focus:outline-none focus:ring-1 focus:ring-primary min-h-[38px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditLead(null)}
                  className="min-h-[38px]"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmittingEdit} className="gap-1.5 min-h-[38px]">
                  {isSubmittingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
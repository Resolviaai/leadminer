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
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Check,
  Instagram,
  Twitter,
  Linkedin,
  Share2,
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
import { LeadInspectorDrawer } from "./LeadInspectorDrawer";

export type Lead = {
  id: number;
  channelId: string;
  channelTitle: string;
  channelUrl: string;
  customUrl?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  subscriberCount: number | null;
  videoCount?: number | null;
  viewCount?: number | null;
  publishedAt?: Date | string | null;
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

  // Inspector Drawer & Sorting / Filtering State
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<Lead | null>(null);
  const [sortBy, setSortBy] = useState<"id" | "subscribers" | "discoveredAt" | "title" | "videos">("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showSortPopover, setShowSortPopover] = useState(false);

  // Pareto 80/20 Filtering State
  const [filterMinSubs, setFilterMinSubs] = useState<number>(0);
  const [filterCountryUs, setFilterCountryUs] = useState(false);
  const [filterDeliverableOnly, setFilterDeliverableOnly] = useState(false);
  const [filterUncontactedOnly, setFilterUncontactedOnly] = useState(false);
  const [filterWebsite, setFilterWebsite] = useState(false);
  const [filterPhone, setFilterPhone] = useState(false);
  const [showFilterPopover, setShowFilterPopover] = useState(false);

  const activeFilterCount =
    (filterMinSubs > 0 ? 1 : 0) +
    (filterCountryUs ? 1 : 0) +
    (filterDeliverableOnly ? 1 : 0) +
    (filterUncontactedOnly ? 1 : 0) +
    (filterWebsite ? 1 : 0) +
    (filterPhone ? 1 : 0);

  const handleSort = (column: "id" | "subscribers" | "discoveredAt" | "title" | "videos") => {
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("desc");
    }
  };

  const getSortIcon = (column: "id" | "subscribers" | "discoveredAt" | "title" | "videos") => {
    if (sortBy === column) {
      return sortDir === "asc" ? (
        <ArrowUp className="w-3.5 h-3.5 text-primary" />
      ) : (
        <ArrowDown className="w-3.5 h-3.5 text-primary" />
      );
    }
    return <ArrowUpDown className="w-3 h-3 text-text-muted/40 group-hover:text-text-muted transition-colors" />;
  };

  const getSortLabel = () => {
    if (sortBy === "subscribers") return sortDir === "asc" ? "Least Subs" : "Most Subs";
    if (sortBy === "discoveredAt") return "Newest";
    if (sortBy === "title") return sortDir === "asc" ? "Name (A-Z)" : "Name (Z-A)";
    if (sortBy === "videos") return "Most Videos";
    return "Default";
  };

  const resetAllFilters = () => {
    setFilterMinSubs(0);
    setFilterCountryUs(false);
    setFilterDeliverableOnly(false);
    setFilterUncontactedOnly(false);
    setFilterWebsite(false);
    setFilterPhone(false);
  };

  // Edit Lead Modal
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close menus on outside click/tap
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (menuOpenId !== null && !target.closest('[data-lead-menu="true"]')) {
        setMenuOpenId(null);
      }
      if (showSortPopover && !target.closest('[data-sort-popover="true"]')) {
        setShowSortPopover(false);
      }
      if (showFilterPopover && !target.closest('[data-filter-popover="true"]')) {
        setShowFilterPopover(false);
      }
    };
    document.addEventListener("mousedown", handleGlobalClick);
    document.addEventListener("touchstart", handleGlobalClick);
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
      document.removeEventListener("touchstart", handleGlobalClick);
    };
  }, [menuOpenId, showSortPopover, showFilterPopover]);

  const fetchLeads = useCallback(
    async (isReset = false) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const params = new URLSearchParams();
      if (sortBy === "id" && sortDir === "desc") {
        const lastId = isReset ? 0 : items.length > 0 ? items[items.length - 1].id : 0;
        if (lastId > 0) params.set("lastId", lastId.toString());
      } else {
        const offset = isReset ? 0 : items.length;
        if (offset > 0) params.set("offset", offset.toString());
      }
      params.set("limit", "50");
      if (activeTab !== "ALL") params.set("filter", activeTab);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (sortBy !== "id") params.set("sortBy", sortBy);
      if (sortDir !== "desc") params.set("sortDir", sortDir);
      if (filterMinSubs > 0) params.set("minSubs", filterMinSubs.toString());
      if (filterCountryUs) params.set("country", "US");
      if (filterDeliverableOnly) params.set("deliverableOnly", "true");
      if (filterUncontactedOnly) params.set("uncontactedOnly", "true");
      if (filterWebsite) params.set("hasWebsite", "true");
      if (filterPhone) params.set("hasPhone", "true");

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
    [
      items,
      activeTab,
      searchQuery,
      sortBy,
      sortDir,
      filterMinSubs,
      filterCountryUs,
      filterDeliverableOnly,
      filterUncontactedOnly,
      filterWebsite,
      filterPhone,
    ]
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
  }, [
    searchQuery,
    activeTab,
    sortBy,
    sortDir,
    filterMinSubs,
    filterCountryUs,
    filterDeliverableOnly,
    filterUncontactedOnly,
    filterWebsite,
    filterPhone,
  ]);

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
              className={`h-9 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap inline-flex items-center justify-center cursor-pointer active:scale-[0.98] ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "bg-surface-200 text-text-secondary hover:text-text-main hover:bg-surface-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search channels or emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-100 border border-border rounded-md pl-8 pr-8 text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary h-9"
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

          {/* Pareto Sort Dropdown */}
          <div className="relative" data-sort-popover="true">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSortPopover(!showSortPopover)}
              className="h-9 px-2.5 sm:px-3 text-xs gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-transform border-border bg-surface-100"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
              <span className="hidden sm:inline text-text-secondary">Sort:</span>
              <span className="font-medium text-text-main truncate max-w-[95px]">{getSortLabel()}</span>
              <ChevronDown className="w-3 h-3 text-text-muted opacity-60 ml-0.5" />
            </Button>

            {showSortPopover && (
              <>
                <div
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => setShowSortPopover(false)}
                />
                <div className="absolute right-0 mt-1.5 w-56 bg-surface-100 border border-border rounded-xl shadow-xl p-1.5 z-40 text-xs space-y-0.5 animate-in fade-in zoom-in-95">
                  {[
                    { label: "Default (Discovered)", col: "id" as const, dir: "desc" as const },
                    { label: "Most Subscribers", col: "subscribers" as const, dir: "desc" as const },
                    { label: "Least Subscribers", col: "subscribers" as const, dir: "asc" as const },
                    { label: "Newest Discovered", col: "discoveredAt" as const, dir: "desc" as const },
                    { label: "Channel Name (A → Z)", col: "title" as const, dir: "asc" as const },
                    { label: "Most Videos", col: "videos" as const, dir: "desc" as const },
                  ].map((opt) => {
                    const isSelected = sortBy === opt.col && sortDir === opt.dir;
                    return (
                      <button
                        key={`${opt.col}_${opt.dir}`}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.col);
                          setSortDir(opt.dir);
                          setShowSortPopover(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-text-main hover:bg-surface-200"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Pareto Filter Popover Button */}
          <div className="relative" data-filter-popover="true">
            <Button
              type="button"
              variant={activeFilterCount > 0 ? "default" : "outline"}
              onClick={() => setShowFilterPopover(!showFilterPopover)}
              className="h-9 px-2.5 sm:px-3 text-xs gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-primary-foreground text-primary font-mono text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {showFilterPopover && (
              <>
                <div
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => setShowFilterPopover(false)}
                />
                <div className="absolute right-0 mt-1.5 w-64 sm:w-72 bg-surface-100 border border-border rounded-xl shadow-2xl p-3 z-40 text-xs space-y-2 animate-in fade-in zoom-in-95 max-h-[calc(100vh-180px)] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <div className="flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                      <span className="font-semibold text-text-main text-xs">Filter Leads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="text-[10px] text-primary hover:underline cursor-pointer font-medium"
                        >
                          Reset
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowFilterPopover(false)}
                        className="text-text-muted hover:text-text-main p-0.5 cursor-pointer rounded"
                        title="Close"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 1. Audience Size (Pareto Preset Pills) */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted block">
                      Audience Size
                    </span>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { label: "Any", val: 0 },
                        { label: "10K+", val: 10000 },
                        { label: "50K+", val: 50000 },
                        { label: "100K+", val: 100000 },
                      ].map((tier) => (
                        <button
                          key={tier.val}
                          type="button"
                          onClick={() => setFilterMinSubs(tier.val)}
                          className={`py-1 px-1 rounded-md text-[11px] font-medium border text-center transition-all cursor-pointer ${
                            filterMinSubs === tier.val
                              ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                              : "bg-surface-200/80 border-border/60 text-text-secondary hover:text-text-main hover:bg-surface-300"
                          }`}
                        >
                          {tier.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Core Filters (Slim Single-Line Rows) */}
                  <div className="space-y-1 pt-1.5 border-t border-border/60">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted block">
                      Targeting & Outreach
                    </span>

                    <div
                      onClick={() => setFilterCountryUs(!filterCountryUs)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border transition-all cursor-pointer select-none text-xs ${
                        filterCountryUs
                          ? "bg-primary/[0.08] border-primary/40 text-text-main font-medium"
                          : "bg-surface-200/50 border-border/60 text-text-secondary hover:bg-surface-200 hover:text-text-main"
                      }`}
                    >
                      <span>US Creators Only</span>
                      <div
                        className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-all shrink-0 ${
                          filterCountryUs
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-surface-300 border-border/80"
                        }`}
                      >
                        {filterCountryUs && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                      </div>
                    </div>

                    <div
                      onClick={() => setFilterDeliverableOnly(!filterDeliverableOnly)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border transition-all cursor-pointer select-none text-xs ${
                        filterDeliverableOnly
                          ? "bg-primary/[0.08] border-primary/40 text-text-main font-medium"
                          : "bg-surface-200/50 border-border/60 text-text-secondary hover:bg-surface-200 hover:text-text-main"
                      }`}
                    >
                      <span>Deliverable Email Only</span>
                      <div
                        className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-all shrink-0 ${
                          filterDeliverableOnly
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-surface-300 border-border/80"
                        }`}
                      >
                        {filterDeliverableOnly && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                      </div>
                    </div>

                    <div
                      onClick={() => setFilterUncontactedOnly(!filterUncontactedOnly)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border transition-all cursor-pointer select-none text-xs ${
                        filterUncontactedOnly
                          ? "bg-primary/[0.08] border-primary/40 text-text-main font-medium"
                          : "bg-surface-200/50 border-border/60 text-text-secondary hover:bg-surface-200 hover:text-text-main"
                      }`}
                    >
                      <span>Uncontacted Leads Only</span>
                      <div
                        className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-all shrink-0 ${
                          filterUncontactedOnly
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-surface-300 border-border/80"
                        }`}
                      >
                        {filterUncontactedOnly && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                      </div>
                    </div>
                  </div>

                  {/* 3. Multi-Channel Enablers (Compact 2-col) */}
                  <div className="space-y-1 pt-1.5 border-t border-border/60">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted block">
                      Other Channels
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div
                        onClick={() => setFilterPhone(!filterPhone)}
                        className={`flex items-center justify-between px-2 py-1 rounded-md border transition-all cursor-pointer select-none text-xs ${
                          filterPhone
                            ? "bg-primary/[0.08] border-primary/40 text-text-main font-medium"
                            : "bg-surface-200/50 border-border/60 text-text-secondary hover:bg-surface-200 hover:text-text-main"
                        }`}
                      >
                        <span className="truncate text-[11px]">Phone/WA</span>
                        <div
                          className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-all shrink-0 ml-1 ${
                            filterPhone
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-surface-300 border-border/80"
                          }`}
                        >
                          {filterPhone && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                        </div>
                      </div>

                      <div
                        onClick={() => setFilterWebsite(!filterWebsite)}
                        className={`flex items-center justify-between px-2 py-1 rounded-md border transition-all cursor-pointer select-none text-xs ${
                          filterWebsite
                            ? "bg-primary/[0.08] border-primary/40 text-text-main font-medium"
                            : "bg-surface-200/50 border-border/60 text-text-secondary hover:bg-surface-200 hover:text-text-main"
                        }`}
                      >
                        <span className="truncate text-[11px]">Website</span>
                        <div
                          className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-all shrink-0 ml-1 ${
                            filterWebsite
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-surface-300 border-border/80"
                          }`}
                        >
                          {filterWebsite && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-border/60">
                    <Button
                      size="sm"
                      onClick={() => setShowFilterPopover(false)}
                      className="w-full h-7 text-xs"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Chips Bar (Pareto Instant Visibility & Dismissal) */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5 animate-in fade-in slide-in-from-top-1 text-xs shrink-0">
          <span className="text-[11px] text-text-muted">Active Filters:</span>
          {filterMinSubs > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium">
              {filterMinSubs >= 1000 ? `${filterMinSubs / 1000}K+ Subs` : `${filterMinSubs}+ Subs`}
              <button
                type="button"
                onClick={() => setFilterMinSubs(0)}
                className="hover:text-primary/70 cursor-pointer ml-0.5"
                title="Remove filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterCountryUs && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium">
              US Only
              <button
                type="button"
                onClick={() => setFilterCountryUs(false)}
                className="hover:text-primary/70 cursor-pointer ml-0.5"
                title="Remove filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterDeliverableOnly && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium">
              Deliverable Email
              <button
                type="button"
                onClick={() => setFilterDeliverableOnly(false)}
                className="hover:text-primary/70 cursor-pointer ml-0.5"
                title="Remove filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterUncontactedOnly && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium">
              Uncontacted
              <button
                type="button"
                onClick={() => setFilterUncontactedOnly(false)}
                className="hover:text-primary/70 cursor-pointer ml-0.5"
                title="Remove filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterPhone && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium">
              Phone / WhatsApp
              <button
                type="button"
                onClick={() => setFilterPhone(false)}
                className="hover:text-primary/70 cursor-pointer ml-0.5"
                title="Remove filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterWebsite && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium">
              Has Website
              <button
                type="button"
                onClick={() => setFilterWebsite(false)}
                className="hover:text-primary/70 cursor-pointer ml-0.5"
                title="Remove filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={resetAllFilters}
            className="text-[11px] text-text-muted hover:text-primary hover:underline ml-1 cursor-pointer font-medium"
          >
            Clear all
          </button>
        </div>
      )}

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
              onClick={() => setSelectedLeadForDetail(lead)}
              className={`bg-surface-100 border rounded-xl p-4 space-y-3 transition-all cursor-pointer active:scale-[0.99] ${
                selectedIds.has(lead.id) ? "border-primary/50 bg-primary/[0.02]" : "border-border shadow-sm"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(lead.id);
                    }}
                    className="text-text-muted hover:text-primary mt-0.5 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center -ml-1.5"
                    aria-label={selectedIds.has(lead.id) ? "Deselect lead" : "Select lead"}
                  >
                    {selectedIds.has(lead.id) ? (
                      <CheckSquare className="w-4.5 h-4.5 text-primary" />
                    ) : (
                      <Square className="w-4.5 h-4.5" />
                    )}
                  </button>

                  {lead.thumbnailUrl ? (
                    <img
                      src={lead.thumbnailUrl}
                      alt={lead.channelTitle}
                      className="w-9 h-9 rounded-lg object-cover border border-border shrink-0 bg-surface-200 mt-0.5"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 mt-0.5">
                      {lead.channelTitle.charAt(0).toUpperCase()}
                    </div>
                  )}

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
                        onClick={(e) => e.stopPropagation()}
                        className="text-text-muted hover:text-text-main inline-flex items-center justify-center p-1 rounded min-w-[28px] min-h-[28px]"
                        aria-label={`Open ${lead.channelTitle} on YouTube`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted flex-wrap">
                      {lead.customUrl && <span className="text-primary font-medium">{lead.customUrl}</span>}
                      <span className="font-mono tabular-nums">
                        {lead.subscriberCount ? lead.subscriberCount.toLocaleString() : "0"} subs
                      </span>
                      {lead.videoCount != null && lead.videoCount > 0 && (
                        <span>• {lead.videoCount.toLocaleString()} vids</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReprocess(lead.id);
                    }}
                    disabled={actionLoadingId === lead.id}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-primary/10 border border-primary/25 hover:bg-primary/20 active:scale-[0.98] text-primary font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${actionLoadingId === lead.id ? "animate-spin" : ""}`} />
                    <span>No email found yet → Tap to Reprocess</span>
                  </button>
                )}

                {/* Additional Contacts Row: Website, Phone, Socials */}
                <div className="flex items-center gap-2.5 pt-1.5 border-t border-border/40 text-[11px] flex-wrap">
                  {(lead.website || lead.contactPageUrl) && (
                    <a
                      href={lead.contactPageUrl || lead.website || "#"}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                    >
                      <Globe className="w-3 h-3 shrink-0" />
                      <span>{lead.contactPageUrl ? "Contact Page" : "Website"}</span>
                    </a>
                  )}

                  {lead.phone && (
                    <div className="inline-flex items-center gap-1 text-text-secondary font-mono">
                      <Phone className="w-3 h-3 shrink-0 text-text-muted" />
                      <span>{lead.phone}</span>
                    </div>
                  )}

                  {lead.socialLinks && lead.socialLinks.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-100 border border-border/50 text-[10px] text-text-secondary"
                    >
                      <Share2 className="w-2.5 h-2.5" />
                      <span>{s.type.replace("_X", "")}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Mobile Action Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50 gap-2" onClick={(e) => e.stopPropagation()}>
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
                <TableHead>
                  <button
                    type="button"
                    onClick={() => handleSort("title")}
                    className="group inline-flex items-center gap-1.5 hover:text-text-main font-semibold transition-colors cursor-pointer select-none"
                  >
                    <span>Channel</span>
                    {getSortIcon("title")}
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    type="button"
                    onClick={() => handleSort("subscribers")}
                    className="group inline-flex items-center gap-1.5 hover:text-text-main font-semibold transition-colors cursor-pointer select-none ml-auto"
                  >
                    <span>Subscribers</span>
                    {getSortIcon("subscribers")}
                  </button>
                </TableHead>
                <TableHead>Discovered Contacts</TableHead>
                <TableHead>Deliverability</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Outreach</TableHead>
                <TableHead className="text-right w-36">Actions</TableHead>
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
                    onClick={() => setSelectedLeadForDetail(lead)}
                    className={`transition-colors cursor-pointer hover:bg-surface-200/50 ${
                      selectedIds.has(lead.id) ? "bg-primary/[0.04]" : ""
                    }`}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
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

                    {/* Channel Column with Avatar & Handle */}
                    <TableCell>
                      <div className="flex items-center gap-2.5 max-w-[260px]">
                        {lead.thumbnailUrl ? (
                          <img
                            src={lead.thumbnailUrl}
                            alt={lead.channelTitle}
                            className="w-7 h-7 rounded-md object-cover border border-border shrink-0 bg-surface-200"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-[11px] shrink-0">
                            {lead.channelTitle.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="font-medium text-text-main truncate text-xs"
                              title={`${lead.channelTitle} (${lead.sourceKeyword ? `kw: ${lead.sourceKeyword}` : 'autonomous'})`}
                            >
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
                              onClick={(e) => e.stopPropagation()}
                              className="text-text-muted hover:text-text-main shrink-0 p-0.5"
                              title={`Open ${lead.channelTitle} on YouTube`}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          {lead.customUrl && (
                            <span className="text-[10px] text-text-muted block truncate font-mono">
                              {lead.customUrl}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Subscribers & Videos */}
                    <TableCell className="text-right tabular-nums">
                      <div className="font-mono text-xs font-semibold text-text-main">
                        {lead.subscriberCount ? lead.subscriberCount.toLocaleString() : "0"}
                      </div>
                      {lead.videoCount != null && lead.videoCount > 0 && (
                        <div className="text-[10px] text-text-muted font-mono">
                          {lead.videoCount.toLocaleString()} vids
                        </div>
                      )}
                    </TableCell>

                    {/* Discovered Contacts Column */}
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-[280px]">
                        {lead.email ? (
                          <span className="font-mono text-text-main text-[11px] truncate font-medium" title={lead.email}>
                            {lead.email}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReprocess(lead.id);
                            }}
                            disabled={actionLoadingId === lead.id}
                            className="text-[10px] text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer bg-primary/10 px-1.5 py-0.5 rounded shrink-0"
                            title="No email found yet — tap to reprocess website & contact info"
                          >
                            <RefreshCw className={`w-2.5 h-2.5 ${actionLoadingId === lead.id ? "animate-spin" : ""}`} />
                            <span>Reprocess</span>
                          </button>
                        )}

                        {/* Website mini icon */}
                        {(lead.website || lead.contactPageUrl) && (
                          <a
                            href={lead.contactPageUrl || lead.website || "#"}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-text-muted hover:text-primary transition-colors shrink-0 p-1"
                            title={lead.contactPageUrl ? `Contact Page: ${lead.contactPageUrl}` : `Website: ${lead.website}`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Phone mini icon */}
                        {lead.phone && (
                          <span className="text-text-muted shrink-0 p-0.5" title={`Phone: ${lead.phone}`}>
                            <Phone className="w-3 h-3" />
                          </span>
                        )}

                        {/* Social link icons */}
                        {lead.socialLinks && lead.socialLinks.length > 0 && (
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {lead.socialLinks.slice(0, 3).map((s, idx) => {
                              const type = s.type.toUpperCase();
                              const isIg = type.includes("INSTA");
                              const isTw = type.includes("TWITTER") || type.includes("X");
                              const isLi = type.includes("LINKEDIN");
                              const IconComp = isIg ? Instagram : isTw ? Twitter : isLi ? Linkedin : Share2;
                              return (
                                <a
                                  key={idx}
                                  href={s.value.startsWith("http") ? s.value : `https://${s.value}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-text-muted hover:text-primary p-0.5"
                                  title={`${s.type}: ${s.value}`}
                                >
                                  <IconComp className="w-3 h-3" />
                                </a>
                              );
                            })}
                            {lead.socialLinks.length > 3 && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-surface-200 text-text-muted border border-border/50 font-mono">
                                +{lead.socialLinks.length - 3}
                              </span>
                            )}
                          </div>
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
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Reprocess website & contacts"
                          disabled={actionLoadingId === lead.id}
                          onClick={() => handleReprocess(lead.id)}
                          className="h-7 w-7 p-0"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${actionLoadingId === lead.id ? "animate-spin" : ""}`} />
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
            className="text-primary hover:underline font-medium cursor-pointer"
          >
            Load 50 more ↓
          </button>
        )}
      </div>

      {/* Slide-over Lead Inspector Drawer */}
      <LeadInspectorDrawer
        lead={selectedLeadForDetail}
        onClose={() => setSelectedLeadForDetail(null)}
        onVerify={handleVerify}
        onReprocess={handleReprocess}
        onEdit={(l) => {
          setEditLead(l as any);
          setEditEmail(l.email || "");
          setEditPhone(l.phone || "");
          setEditWebsite(l.website || "");
        }}
        onSuppress={handleSuppress}
        actionLoadingId={actionLoadingId}
      />

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
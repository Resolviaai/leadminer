"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Loader2,
  Plus,
  Search,
  RotateCcw,
  Pause,
  Play,
  MoreVertical,
  Edit3,
  Trash2,
  CheckSquare,
  Square,
  X,
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

type Keyword = {
  id: number;
  keyword: string;
  category: string;
  entity: string;
  modifier: string;
  status: string;
  channelsFound: number;
  attemptCount: number;
  priorityScore: number;
  lastAttemptAt: Date | string | null;
};

interface Props {
  initialData: Keyword[];
  total: number;
}

type FilterTab = "ALL" | "PENDING" | "COMPLETED" | "PAUSED" | "FAILED";

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
    case "PAUSED":
      return <Badge variant="outline" className="border-border text-text-muted">PAUSED</Badge>;
    default:
      return <Badge variant="secondary">PENDING</Badge>;
  }
}

export function KeywordsInfiniteList({ initialData, total: initialTotal }: Props) {
  const [items, setItems] = useState<Keyword[]>(initialData);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(initialData.length < initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [addKeywordText, setAddKeywordText] = useState("");
  const [addCategory, setAddCategory] = useState("General");
  const [addEntity, setAddEntity] = useState("");
  const [addModifier, setAddModifier] = useState("");
  const [addPriority, setAddPriority] = useState(50);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  const [editKeywordItem, setEditKeywordItem] = useState<Keyword | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close dropdown on outside click or tap
  useEffect(() => {
    if (menuOpenId === null) return;
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-keyword-menu="true"]')) {
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

  // Refetch when tab or search changes
  const fetchKeywords = useCallback(async (isReset = false) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const lastId = isReset ? 0 : (items.length > 0 ? items[items.length - 1].id : 0);
    const params = new URLSearchParams();
    if (lastId > 0) params.set("lastId", lastId.toString());
    params.set("limit", "50");
    if (activeTab !== "ALL") params.set("status", activeTab);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());

    try {
      const res = await fetch(`/api/keywords?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      });
      if (!res.ok) throw new Error("Fetch failed");
      const data: Keyword[] = await res.json();

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
  }, [items, activeTab, searchQuery]);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setSelectedIds(new Set());
    setTimeout(() => {
      fetchKeywords(true);
    }, 0);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchKeywords(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore || loading || isLoadingRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      fetchKeywords(false);
    }
  };

  // Single Actions
  const handleRetry = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/keywords/${id}/retry`, { method: "POST" });
      if (res.ok) {
        setItems((prev) =>
          prev.map((k) => (k.id === id ? { ...k, status: "PENDING", attemptCount: 0 } : k))
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggle = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/keywords/${id}/toggle`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setItems((prev) =>
          prev.map((k) => (k.id === id ? { ...k, status: updated.status } : k))
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this keyword?")) return;
    setActionLoading(id);
    setMenuOpenId(null);
    try {
      const res = await fetch(`/api/keywords/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((k) => k.id !== id));
        setTotalCount((t) => Math.max(0, t - 1));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Batch actions
  const handleBatchAction = async (action: "retry" | "pause" | "resume" | "delete") => {
    if (selectedIds.size === 0) return;
    if (action === "delete" && !confirm(`Delete ${selectedIds.size} selected keyword(s)?`)) return;

    setBatchLoading(true);
    const ids = Array.from(selectedIds);
    try {
      const res = await fetch(`/api/keywords/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });
      if (res.ok) {
        if (action === "delete") {
          setItems((prev) => prev.filter((k) => !selectedIds.has(k.id)));
          setTotalCount((t) => Math.max(0, t - ids.length));
        } else if (action === "retry") {
          setItems((prev) =>
            prev.map((k) => (selectedIds.has(k.id) ? { ...k, status: "PENDING", attemptCount: 0 } : k))
          );
        } else if (action === "pause") {
          setItems((prev) =>
            prev.map((k) => (selectedIds.has(k.id) ? { ...k, status: "PAUSED" } : k))
          );
        } else if (action === "resume") {
          setItems((prev) =>
            prev.map((k) => (selectedIds.has(k.id) ? { ...k, status: "PENDING" } : k))
          );
        }
        setSelectedIds(new Set());
      }
    } finally {
      setBatchLoading(false);
    }
  };

  // Selection helpers
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

  // Add Keyword Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addKeywordText.trim()) return;
    setIsSubmittingAdd(true);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: addKeywordText.trim(),
          category: addCategory.trim(),
          entity: addEntity.trim() || addKeywordText.trim(),
          modifier: addModifier.trim(),
          priorityScore: addPriority,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setItems((prev) => [created, ...prev]);
        setTotalCount((t) => t + 1);
        setShowAddModal(false);
        setAddKeywordText("");
        setAddEntity("");
        setAddModifier("");
      }
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Edit Keyword Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editKeywordItem) return;
    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/keywords/${editKeywordItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: editKeywordItem.keyword,
          category: editKeywordItem.category,
          entity: editKeywordItem.entity,
          modifier: editKeywordItem.modifier,
          priorityScore: editKeywordItem.priorityScore,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setItems((prev) => prev.map((k) => (k.id === updated.id ? updated : k)));
        setEditKeywordItem(null);
      }
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  return (
    <div className="space-y-3.5 flex-1 min-h-0 flex flex-col">
      {/* Top Controls: Search, Tabs & Add Button (Pinned at top of list) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none no-scrollbar -mx-1 px-1">
          {(["ALL", "PENDING", "COMPLETED", "PAUSED", "FAILED"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap min-h-[38px] cursor-pointer active:scale-95 touch-manipulation ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "bg-surface-200 text-text-secondary hover:text-text-main hover:bg-surface-300"
              }`}
            >
              {tab === "ALL" ? "All Keywords" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Filter keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-100 border border-border rounded-lg pl-9 pr-8 py-2 text-xs sm:text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary min-h-[42px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main p-1 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Add Keyword Button */}
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="gap-1.5 min-h-[42px] px-3.5 shrink-0 active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
            <span>Add Keyword</span>
          </Button>
        </div>
      </div>

      {/* Floating/Docked Bulk Action Toolbar */}
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
              onClick={() => handleBatchAction("retry")}
              className="gap-1 h-7 px-2 text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={batchLoading}
              onClick={() => handleBatchAction("pause")}
              className="gap-1 h-7 px-2 text-xs"
            >
              <Pause className="w-3 h-3" />
              <span>Pause</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={batchLoading}
              onClick={() => handleBatchAction("resume")}
              className="gap-1 h-7 px-2 text-xs"
            >
              <Play className="w-3 h-3" />
              <span>Resume</span>
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
          <div className="p-8 text-center text-xs text-text-muted">Loading keywords...</div>
        ) : items.length === 0 ? (
          <Card className="p-6 text-center text-xs text-text-muted">
            No keywords found matching this filter.
          </Card>
        ) : (
          items.map((k) => (
            <div
              key={k.id}
              className={`bg-surface-100 border rounded-xl p-4 space-y-3 transition-all ${
                selectedIds.has(k.id) ? "border-primary/50 bg-primary/[0.02]" : "border-border shadow-sm"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleSelect(k.id)}
                    className="text-text-muted hover:text-primary mt-0.5 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center -ml-1.5"
                    aria-label={selectedIds.has(k.id) ? "Deselect keyword" : "Select keyword"}
                  >
                    {selectedIds.has(k.id) ? (
                      <CheckSquare className="w-4.5 h-4.5 text-primary" />
                    ) : (
                      <Square className="w-4.5 h-4.5" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-text-main leading-tight block truncate">
                      {k.keyword}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-text-muted flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-surface-200 text-text-secondary text-[10px]">
                        {k.category || "General"}
                      </span>
                      {k.entity && (
                        <span className="px-1.5 py-0.5 rounded bg-surface-200 text-text-secondary text-[10px]">
                          {k.entity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 pt-0.5">
                  {getStatusBadge(k.status)}
                </div>
              </div>

              {/* Metrics Box (Layer 2) */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-surface-200/70 border border-border/40 text-center text-xs">
                <div>
                  <span className="text-[10px] text-text-muted block">Channels</span>
                  <span className="font-mono font-bold text-text-main text-xs">{k.channelsFound}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">Attempts</span>
                  <span className="font-mono text-text-muted text-xs">{k.attemptCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">Priority</span>
                  <span className="font-mono text-primary text-xs font-semibold">{k.priorityScore || 50}</span>
                </div>
              </div>

              {/* Mobile Action Bar with 44px Hit Targets */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="text-[10px] text-text-muted truncate max-w-[130px]">
                  {k.lastAttemptAt ? new Date(k.lastAttemptAt).toLocaleDateString() : "Never run"}
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionLoading === k.id}
                    onClick={() => handleRetry(k.id)}
                    className="min-h-[40px] px-3 text-xs gap-1.5 active:scale-95 transition-transform"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionLoading === k.id}
                    onClick={() => handleToggle(k.id)}
                    className="min-h-[40px] px-3 text-xs gap-1.5 active:scale-95 transition-transform"
                  >
                    {k.status === "PAUSED" ? (
                      <Play className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Pause className="w-3.5 h-3.5" />
                    )}
                    <span>{k.status === "PAUSED" ? "Resume" : "Pause"}</span>
                  </Button>

                  <div className="relative inline-block text-left" data-keyword-menu="true">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setMenuOpenId(menuOpenId === k.id ? null : k.id)}
                      className="min-h-[40px] min-w-[40px] p-0 active:scale-95"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>

                    {menuOpenId === k.id && (
                      <>
                        <div
                          className="fixed inset-0 z-30 cursor-default"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(null);
                          }}
                        />
                        <div className="absolute right-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 w-36 bg-surface-100 border border-border rounded-xl shadow-xl py-1 z-40 text-xs animate-in fade-in zoom-in-95">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenId(null);
                              setEditKeywordItem(k);
                            }}
                            className="w-full text-left px-3.5 py-2.5 flex items-center gap-2 hover:bg-surface-200 text-text-main cursor-pointer min-h-[40px]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(k.id)}
                            className="w-full text-left px-3.5 py-2.5 flex items-center gap-2 hover:bg-danger/10 text-danger cursor-pointer min-h-[40px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
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
        <div onScroll={handleContainerScroll} className="flex-1 min-h-0 overflow-y-auto overflow-x-auto relative pb-16">
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
                <TableHead>Keyword</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Channels</TableHead>
                <TableHead className="text-right">Attempts</TableHead>
                <TableHead>Last Execution</TableHead>
                <TableHead className="text-right w-36">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-text-muted">
                    Loading keywords...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-text-muted">
                    No keywords in database matching this filter.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((k) => (
                  <TableRow
                    key={k.id}
                    className={`transition-colors ${selectedIds.has(k.id) ? "bg-primary/[0.03]" : ""}`}
                  >
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => toggleSelect(k.id)}
                        className="text-text-muted hover:text-primary cursor-pointer p-1"
                      >
                        {selectedIds.has(k.id) ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium text-text-main max-w-[220px] truncate" title={k.keyword}>
                      {k.keyword}
                    </TableCell>
                    <TableCell className="text-text-secondary">{k.category}</TableCell>
                    <TableCell className="text-text-secondary">{k.entity || "—"}</TableCell>
                    <TableCell>{getStatusBadge(k.status)}</TableCell>
                    <TableCell className="text-right font-mono text-text-secondary">{k.channelsFound}</TableCell>
                    <TableCell className="text-right font-mono text-text-muted">{k.attemptCount}</TableCell>
                    <TableCell className="text-text-muted text-[11px]">
                      {k.lastAttemptAt ? new Date(k.lastAttemptAt).toLocaleString() : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Retry keyword"
                          disabled={actionLoading === k.id}
                          onClick={() => handleRetry(k.id)}
                          className="h-7 w-7 p-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title={k.status === "PAUSED" ? "Resume keyword" : "Pause keyword"}
                          disabled={actionLoading === k.id}
                          onClick={() => handleToggle(k.id)}
                          className="h-7 w-7 p-0"
                        >
                          {k.status === "PAUSED" ? (
                            <Play className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <Pause className="w-3.5 h-3.5" />
                          )}
                        </Button>

                        {/* More menu with Backdrop Dismiss */}
                        <div className="relative inline-block text-left" data-keyword-menu="true">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setMenuOpenId(menuOpenId === k.id ? null : k.id)}
                            className="h-7 w-7 p-0"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>

                          {menuOpenId === k.id && (
                            <>
                              <div
                                className="fixed inset-0 z-30 cursor-default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenId(null);
                                }}
                              />
                              <div className="absolute right-0 mt-1 w-32 bg-surface-100 border border-border rounded-md shadow-lg py-1 z-40 text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    setEditKeywordItem(k);
                                  }}
                                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-surface-200 text-text-main cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(k.id)}
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
          <span className="font-mono text-text-main">{totalCount.toLocaleString()}</span> keywords
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
            onClick={() => fetchKeywords(false)}
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
            onClick={() => fetchKeywords(false)}
            className="text-primary hover:underline font-medium cursor-pointer"
          >
            Load 50 more ↓
          </button>
        )}
      </div>

      {/* Modal: Add Keyword */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-100 border border-border rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-main">Add New Search Keyword</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-text-muted hover:text-text-main cursor-pointer p-1 min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  Keyword Query <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI automation workflows"
                  value={addKeywordText}
                  onChange={(e) => setAddKeywordText(e.target.value)}
                  className="w-full bg-surface-200 border border-border rounded-md px-3 py-2 text-text-main placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. AI Tech"
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value)}
                    className="w-full bg-surface-200 border border-border rounded-md px-3 py-2 text-text-main placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Entity</label>
                  <input
                    type="text"
                    placeholder="e.g. Creator"
                    value={addEntity}
                    onChange={(e) => setAddEntity(e.target.value)}
                    className="w-full bg-surface-200 border border-border rounded-md px-3 py-2 text-text-main placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Modifier</label>
                  <input
                    type="text"
                    placeholder="e.g. tutorial"
                    value={addModifier}
                    onChange={(e) => setAddModifier(e.target.value)}
                    className="w-full bg-surface-200 border border-border rounded-md px-3 py-2 text-text-main placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Priority (1-100)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={addPriority}
                    onChange={(e) => setAddPriority(parseInt(e.target.value, 10) || 50)}
                    className="w-full bg-surface-200 border border-border rounded-md px-3 py-2 text-text-main focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[40px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingAdd || !addKeywordText.trim()}
                  className="gap-1.5 min-h-[40px]"
                >
                  {isSubmittingAdd && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Keyword</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Keyword */}
      {editKeywordItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-100 border border-border rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-main">Edit Keyword</h2>
              <button
                type="button"
                onClick={() => setEditKeywordItem(null)}
                className="text-text-muted hover:text-text-main cursor-pointer p-1 min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-text-secondary font-medium mb-1">Keyword</label>
                <input
                  type="text"
                  required
                  value={editKeywordItem.keyword}
                  onChange={(e) =>
                    setEditKeywordItem({ ...editKeywordItem, keyword: e.target.value })
                  }
                  className="w-full bg-surface-200 border border-border rounded-md px-3 py-2 text-text-main focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Category</label>
                  <input
                    type="text"
                    value={editKeywordItem.category}
                    onChange={(e) =>
                      setEditKeywordItem({ ...editKeywordItem, category: e.target.value })
                    }
                    className="w-full bg-surface-200 border border-border rounded-md px-3 py-2 text-text-main focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Entity</label>
                  <input
                    type="text"
                    value={editKeywordItem.entity}
                    onChange={(e) =>
                      setEditKeywordItem({ ...editKeywordItem, entity: e.target.value })
                    }
                    className="w-full bg-surface-200 border border-border rounded-md px-3 py-2 text-text-main focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Priority Score (1-100)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={editKeywordItem.priorityScore || 50}
                  onChange={(e) =>
                    setEditKeywordItem({
                      ...editKeywordItem,
                      priorityScore: parseInt(e.target.value, 10) || 50,
                    })
                  }
                  className="w-full bg-surface-200 border border-border rounded-md px-3 py-2 text-text-main focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditKeywordItem(null)}
                  className="min-h-[40px]"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmittingEdit} className="gap-1.5 min-h-[40px]">
                  {isSubmittingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Keyword</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
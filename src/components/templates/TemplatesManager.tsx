"use client";

import React, { useState, useRef, useCallback, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  X,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Layers,
  AlertCircle,
  CheckSquare,
  Square,
  Power,
  Trash2,
  Sparkles,
  Shuffle,
  Eye,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TemplateEditor } from "@/components/TemplateEditor";
import { TemplateInsertMenu } from "@/components/templates/TemplateInsertMenu";
import {
  renderTemplatePreview,
} from "@/components/templates/spintax-presets";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Template {
  id: number;
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function subjectLengthColor(len: number) {
  if (len <= 50) return "text-emerald-400";
  if (len <= 70) return "text-amber-400";
  return "text-rose-400";
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TemplatesManager({
  initialTemplates,
  showPageHeader = true,
}: {
  initialTemplates: Template[];
  showPageHeader?: boolean;
}) {
  const router = useRouter();

  // Multi-select state (button is icon-only, no text written)
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchMsg, setBatchMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Multi-select Handlers
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = () => {
    if (selectedIds.size === initialTemplates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(initialTemplates.map((t) => t.id)));
    }
  };

  const handleBatchAction = async (
    action: "activate" | "deactivate" | "delete"
  ) => {
    if (selectedIds.size === 0 || batchLoading) return;

    if (
      action === "delete" &&
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.size} template(s)?`
      )
    ) {
      return;
    }

    setBatchLoading(true);
    setBatchMsg(null);

    try {
      const res = await fetch("/api/templates/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ids: Array.from(selectedIds),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to perform bulk action");
      }

      if (action === "delete" && data.blockedCount > 0) {
        setBatchMsg({
          type: "error",
          text: `Deleted ${data.deletedCount} template(s). ${data.blockedCount} could not be deleted because they are assigned to active campaigns.`,
        });
      } else {
        setBatchMsg({
          type: "success",
          text: `Successfully ${
            action === "delete"
              ? "deleted"
              : action === "activate"
              ? "activated"
              : "deactivated"
          } ${selectedIds.size} template(s).`,
        });
      }

      setSelectedIds(new Set());
      if (action === "delete") {
        setMultiSelectMode(false);
      }
      router.refresh();
      setTimeout(() => setBatchMsg(null), 4000);
    } catch (err: unknown) {
      setBatchMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Batch operation failed",
      });
    } finally {
      setBatchLoading(false);
    }
  };

  // New Template Modal state
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [savingNew, setSavingNew] = useState(false);
  const [newErrors, setNewErrors] = useState<Record<string, string>>({});
  const [newServerError, setNewServerError] = useState<string | null>(null);
  const [showNewPreview, setShowNewPreview] = useState(true);
  const [previewSeed, setPreviewSeed] = useState(0);

  const newSubjectRef = useRef<HTMLInputElement>(null);
  const newBodyRef = useRef<HTMLTextAreaElement>(null);
  const lastFocusedField = useRef<"subject" | "body">("body");
  const abortRef = useRef<AbortController | null>(null);

  const activeCount = initialTemplates.filter((t) => t.isActive).length;

  // Deferred values for preview performance
  const deferredNewSubject = useDeferredValue(subject);
  const deferredNewBody = useDeferredValue(body);
  const newHasSpintax =
    /\{([^{}]*?\|[^{}]*?)\}/.test(subject) || /\{([^{}]*?\|[^{}]*?)\}/.test(body);
  const previewNewSubject = renderTemplatePreview(deferredNewSubject, previewSeed);
  const previewNewBody = renderTemplatePreview(deferredNewBody, previewSeed);
  const newWordCount = countWords(body);

  // ── New Template Creation ──
  const insertVariableIntoNew = (token: string, targetField?: "subject" | "body") => {
    const field = targetField ?? lastFocusedField.current;
    if (field === "subject") {
      const el = newSubjectRef.current;
      if (!el) {
        setSubject((p) => p + token);
        return;
      }
      const start = el.selectionStart ?? subject.length;
      const end = el.selectionEnd ?? subject.length;
      const updated = subject.slice(0, start) + token + subject.slice(end);
      setSubject(updated);
      setNewErrors((p) => ({ ...p, subject: "" }));
      requestAnimationFrame(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + token.length;
      });
    } else {
      const el = newBodyRef.current;
      if (!el) {
        setBody((p) => p + token);
        return;
      }
      const start = el.selectionStart ?? body.length;
      const end = el.selectionEnd ?? body.length;
      const updated = body.slice(0, start) + token + body.slice(end);
      setBody(updated);
      setNewErrors((p) => ({ ...p, body: "" }));
      requestAnimationFrame(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + token.length;
      });
    }
  };

  const handleCreateTemplate = async () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Template name is required";
    if (!subject.trim()) errs.subject = "Subject line is required";
    if (!body.trim()) errs.body = "Email body is required";

    if (Object.keys(errs).length > 0) {
      setNewErrors(errs);
      return;
    }

    if (savingNew) return;
    setSavingNew(true);
    setNewServerError(null);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subject: subject.trim(),
          body: body.trim(),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create template");
      }

      setName("");
      setSubject("");
      setBody("");
      setNewErrors({});
      setIsCreating(false);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setNewServerError(
        err instanceof Error ? err.message : "Failed to create template"
      );
    } finally {
      setSavingNew(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto w-full">
      {/* ── Page Header or Compact Action Toolbar Card ── */}
      {showPageHeader ? (
        <Card className="p-4 sm:p-5 border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
                  Outreach Email Templates
                </h1>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Create and manage outreach sequences. Merge tags personalize each
                email with verified channel data.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full sm:w-auto">
              {/* Quick Stats */}
              <div className="px-3 py-1.5 rounded-lg bg-surface-200 border border-border text-xs flex items-center justify-between sm:justify-start gap-2">
                <span className="text-text-muted">Templates:</span>
                <span className="font-mono font-semibold text-text-main">
                  {initialTemplates.length} total
                </span>
                <span className="text-border">|</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {activeCount} active
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Selection Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    setMultiSelectMode((v) => !v);
                    setSelectedIds(new Set());
                  }}
                  title={multiSelectMode ? "Cancel selection" : "Select multiple templates"}
                  aria-label={multiSelectMode ? "Cancel selection" : "Select multiple templates"}
                  className={`p-2.5 rounded-lg text-xs font-medium border transition-all active:scale-95 min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0 ${
                    multiSelectMode
                      ? "bg-primary/15 border-primary/40 text-primary font-semibold"
                      : "bg-surface-200 border-border text-text-secondary hover:text-text-main hover:bg-surface-300"
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                </button>

                {/* + New Template Button */}
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-brand-hover active:scale-95 shadow-sm transition-all min-h-[40px] flex-1 sm:flex-initial"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>New Template</span>
                </button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-3 sm:p-4 border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Quick Stats */}
            <div className="px-3 py-1.5 rounded-lg bg-surface-200 border border-border text-xs flex items-center justify-between sm:justify-start gap-2">
              <span className="text-text-muted">Templates:</span>
              <span className="font-mono font-semibold text-text-main">
                {initialTemplates.length} total
              </span>
              <span className="text-border">|</span>
              <span className="font-mono font-semibold text-emerald-400">
                {activeCount} active
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Selection Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  setMultiSelectMode((v) => !v);
                  setSelectedIds(new Set());
                }}
                title={multiSelectMode ? "Cancel selection" : "Select multiple templates"}
                aria-label={multiSelectMode ? "Cancel selection" : "Select multiple templates"}
                className={`p-2 rounded-lg text-xs font-medium border transition-all active:scale-95 min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0 ${
                  multiSelectMode
                    ? "bg-primary/15 border-primary/40 text-primary font-semibold"
                    : "bg-surface-200 border-border text-text-secondary hover:text-text-main hover:bg-surface-300"
                }`}
              >
                <CheckSquare className="w-4 h-4" />
              </button>

              {/* + New Template Button */}
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-brand-hover active:scale-95 shadow-sm transition-all min-h-[36px] flex-1 sm:flex-initial"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Template</span>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* ── Batch Notification Message ── */}
      {batchMsg && (
        <div
          className={`flex items-center gap-2 text-xs rounded-lg px-3.5 py-2.5 border ${
            batchMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{batchMsg.text}</span>
          <button
            onClick={() => setBatchMsg(null)}
            className="ml-auto text-text-muted hover:text-text-main"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Bulk Action Bar (Floating pill above bottom nav on mobile, top sticky on desktop) ── */}
      {multiSelectMode && (
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] inset-x-3 sm:static sm:inset-auto sm:top-16 z-30 p-3 rounded-2xl sm:rounded-xl bg-surface-100/95 backdrop-blur-md border border-primary/40 shadow-2xl flex items-center justify-between gap-2.5 flex-wrap animate-in fade-in slide-in-from-bottom-3 sm:slide-in-from-top-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-main font-medium min-h-[38px] px-2 rounded-lg hover:bg-surface-200 active:scale-95 transition-all"
            >
              {selectedIds.size === initialTemplates.length ? (
                <CheckSquare className="w-4 h-4 text-primary" />
              ) : (
                <Square className="w-4 h-4 text-text-muted" />
              )}
              <span>
                {selectedIds.size === initialTemplates.length
                  ? "Deselect All"
                  : "Select All"}
              </span>
            </button>

            <span className="text-xs text-text-muted">|</span>

            <span className="text-xs font-semibold text-text-main">
              {selectedIds.size} of {initialTemplates.length} selected
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => handleBatchAction("activate")}
              disabled={selectedIds.size === 0 || batchLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-200 border border-border text-emerald-400 text-xs font-medium hover:bg-surface-300 disabled:opacity-40 min-h-[38px] active:scale-95 transition-all"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Activate</span>
            </button>

            <button
              onClick={() => handleBatchAction("deactivate")}
              disabled={selectedIds.size === 0 || batchLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-200 border border-border text-warning text-xs font-medium hover:bg-surface-300 disabled:opacity-40 min-h-[38px] active:scale-95 transition-all"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Deactivate</span>
            </button>

            <button
              onClick={() => handleBatchAction("delete")}
              disabled={selectedIds.size === 0 || batchLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/15 border border-destructive/30 text-danger text-xs font-semibold hover:bg-destructive/25 disabled:opacity-40 min-h-[38px] active:scale-95 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* ── New Template Modal Dialog ── */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCreating(false)}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-4xl bg-surface-100 border border-border rounded-2xl shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-text-main">
                    Create New Template
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    Configure subject and message body with merge tags.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewPreview((v) => !v)}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-200 border border-border text-text-muted hover:text-text-main text-xs transition-colors"
                >
                  {showNewPreview ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {newServerError && (
              <div className="mb-4 flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{newServerError}</span>
              </div>
            )}

            {/* Layout: Composer on Left, Live Gmail-style Preview on Right */}
            <div className={`grid grid-cols-1 ${showNewPreview ? "lg:grid-cols-12" : ""} gap-5`}>
              {/* Left Column: Composer */}
              <div className={`${showNewPreview ? "lg:col-span-7" : "w-full"} space-y-4`}>
                {/* Template Name */}
                <div className="rounded-xl border border-border/80 bg-surface-100 p-3.5 space-y-1.5">
                  <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider block">
                    Template Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setNewErrors((p) => ({ ...p, name: "" }));
                    }}
                    placeholder="e.g. Creator Collab Offer v1"
                    maxLength={100}
                    className={`w-full bg-surface-200 border rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-muted transition-all ${
                      newErrors.name ? "border-rose-500/60" : "border-border/80"
                    }`}
                  />
                  {newErrors.name && (
                    <p className="text-[11px] text-rose-400">{newErrors.name}</p>
                  )}
                </div>

                {/* Subject Line */}
                <div className="rounded-xl border border-border/80 bg-surface-100 p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">
                      Subject Line
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-medium ${subjectLengthColor(
                          subject.length
                        )}`}
                      >
                        {subject.length}/70 chars
                      </span>
                      {/* Contextual Insert Menu */}
                      <TemplateInsertMenu
                        targetName="subject"
                        onInsert={(token) => insertVariableIntoNew(token, "subject")}
                      />
                    </div>
                  </div>
                  <input
                    ref={newSubjectRef}
                    value={subject}
                    onFocus={() => {
                      lastFocusedField.current = "subject";
                    }}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      setNewErrors((p) => ({ ...p, subject: "" }));
                    }}
                    placeholder="e.g. Quick question about {{channel_name}} clips"
                    maxLength={200}
                    className={`w-full bg-surface-200 border rounded-lg px-3 py-2 text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-muted transition-all ${
                      newErrors.subject ? "border-rose-500/60" : "border-border/80"
                    }`}
                  />
                  {newErrors.subject && (
                    <p className="text-[11px] text-rose-400">{newErrors.subject}</p>
                  )}
                </div>

                {/* Email Body */}
                <div className="rounded-xl border border-border/80 bg-surface-100 p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">
                        Email Body
                      </label>
                      <span className="text-[10px] text-text-muted font-mono">
                        {newWordCount} words
                      </span>
                    </div>
                    {/* Contextual Insert Menu */}
                    <TemplateInsertMenu
                      targetName="body"
                      onInsert={(token) => insertVariableIntoNew(token, "body")}
                    />
                  </div>
                  <textarea
                    ref={newBodyRef}
                    value={body}
                    onFocus={() => {
                      lastFocusedField.current = "body";
                    }}
                    onChange={(e) => {
                      setBody(e.target.value);
                      setNewErrors((p) => ({ ...p, body: "" }));
                    }}
                    rows={11}
                    placeholder={"Hi {{first_name}},\n\n{|Hello|Hi|Good morning|}\n\n{{custom_line}}\n\nI noticed your channel {{channel_name}} has reached {{subscriber_count}} subscribers.\n\nCould I send over 2 sample clips we edited from your recent upload for free?\n\n{|Best|Cheers|Talk soon|},\nLeadMiner Team"}
                    className={`w-full bg-surface-200 border rounded-lg p-3 text-xs leading-relaxed font-sans text-text-main resize-y focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-muted transition-all ${
                      newErrors.body ? "border-rose-500/60" : "border-border/80"
                    }`}
                  />
                  {newErrors.body && (
                    <p className="text-[11px] text-rose-400">{newErrors.body}</p>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    disabled={savingNew}
                    className="px-4 py-2 rounded-lg border border-border text-text-secondary text-xs font-medium hover:text-text-main hover:bg-surface-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateTemplate}
                    disabled={savingNew}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-brand-hover active:scale-95 shadow-sm transition-all disabled:opacity-60"
                  >
                    {savingNew ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{savingNew ? "Creating…" : "Save Template"}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Live Email Card Preview */}
              {showNewPreview && (
                <div className="lg:col-span-5">
                  <div className="rounded-xl border border-border/80 bg-surface-100 overflow-hidden shadow-xs sticky top-4">
                    {/* Header */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-surface-200/70 border-b border-border/50">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold text-text-main">
                          Live Email Preview
                        </span>
                        {newHasSpintax && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            <Sparkles className="w-2.5 h-2.5" />
                            Spintax
                          </span>
                        )}
                      </div>

                      {newHasSpintax && (
                        <button
                          type="button"
                          onClick={() => setPreviewSeed((s) => s + 1)}
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-300 text-text-secondary hover:text-emerald-400 hover:bg-emerald-500/10 border border-border transition-all active:scale-95"
                          title="Generate another variation"
                        >
                          <Shuffle className="w-3 h-3 text-emerald-400" />
                          <span>Shuffle</span>
                        </button>
                      )}
                    </div>

                    {/* Email Card Body */}
                    <div className="p-4 space-y-3 bg-surface-100/50">
                      {/* Meta */}
                      <div className="space-y-1.5 pb-3 border-b border-border/40 text-xs">
                        <div className="flex items-center gap-2 text-text-muted">
                          <User className="w-3 h-3 text-primary shrink-0" />
                          <span className="font-medium text-text-secondary">To:</span>
                          <span className="text-text-main font-medium truncate">
                            Joe &lt;joe@youtube-creator.com&gt;
                          </span>
                          <span className="text-[10px] text-text-muted hidden sm:inline">
                            (850K subscribers)
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-text-muted font-medium shrink-0 pt-0.5">
                            Subject:
                          </span>
                          <span className="font-semibold text-text-main leading-relaxed">
                            {previewNewSubject || (
                              <span className="italic text-text-muted font-normal">
                                Subject line preview…
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="text-xs text-text-secondary leading-relaxed font-sans whitespace-pre-wrap max-h-[340px] overflow-y-auto pr-2">
                        {previewNewBody || (
                          <span className="italic text-text-muted">
                            Email body preview will appear here as you type…
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Templates List ── */}
      <div className="space-y-4">
        {initialTemplates.length === 0 ? (
          <Card className="p-12 text-center text-xs text-text-muted space-y-3">
            <Layers className="w-8 h-8 text-text-muted mx-auto opacity-40" />
            <p className="font-semibold text-text-secondary text-sm">
              No email templates configured
            </p>
            <p className="text-text-muted max-w-sm mx-auto">
              Click &quot;New Template&quot; in the header above to create your
              first outreach email.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-brand-hover active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Template</span>
            </button>
          </Card>
        ) : (
          initialTemplates.map((tmpl) => (
            <Card
              key={tmpl.id}
              className={`p-4 sm:p-5 transition-colors ${
                selectedIds.has(tmpl.id)
                  ? "border-primary/50 bg-surface-100/90 shadow-sm"
                  : "hover:border-border/80"
              }`}
            >
              <TemplateEditor
                template={tmpl}
                selectable={multiSelectMode}
                selected={selectedIds.has(tmpl.id)}
                onToggleSelect={toggleSelect}
              />
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
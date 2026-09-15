"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Info,
  Plus,
  CheckSquare,
  Square,
  Power,
  Trash2,
  X,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Layers,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TemplateEditor } from "@/components/TemplateEditor";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Template {
  id: number;
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
}

const VARIABLES = [
  { label: "first_name", token: "{{first_name}}" },
  { label: "channel_name", token: "{{channel_name}}" },
  { label: "channel_url", token: "{{channel_url}}" },
  { label: "subscriber_count", token: "{{subscriber_count}}" },
  { label: "custom_line", token: "{{custom_line}}" },
];

const SAMPLE: Record<string, string> = {
  "{{first_name}}": "Joe",
  "{{channel_name}}": "The Rogan Clips",
  "{{channel_url}}": "https://youtube.com/c/theroganclips",
  "{{subscriber_count}}": "850,000",
  "{{custom_line}}": "Loved your recent breakdown — the pacing was spot-on.",
};

function renderPreview(text: string) {
  return Object.entries(SAMPLE).reduce(
    (acc, [token, val]) => acc.replaceAll(token, val),
    text
  );
}

function subjectLengthColor(len: number) {
  if (len <= 50) return "text-emerald-400";
  if (len <= 70) return "text-warning";
  return "text-danger";
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TemplatesManager({
  initialTemplates,
}: {
  initialTemplates: Template[];
}) {
  const router = useRouter();

  // Multi-select state
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchMsg, setBatchMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // New Template Modal state
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [savingNew, setSavingNew] = useState(false);
  const [newErrors, setNewErrors] = useState<Record<string, string>>({});
  const [newServerError, setNewServerError] = useState<string | null>(null);
  const [showNewPreview, setShowNewPreview] = useState(true);

  const newBodyRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeCount = initialTemplates.filter((t) => t.isActive).length;

  // ── Multi-select Handlers ──
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

  // ── New Template Creation ──
  const insertVariableIntoNew = (token: string) => {
    const el = newBodyRef.current;
    if (!el) {
      setBody((p) => p + token);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const updated = body.slice(0, start) + token + body.slice(end);
    setBody(updated);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + token.length;
      el.focus();
    });
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
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ── Page Header Card ── */}
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

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Quick Stats */}
            <div className="px-3 py-1.5 rounded-lg bg-surface-200 border border-border text-xs flex items-center gap-2">
              <span className="text-text-muted">Total:</span>
              <span className="font-mono font-semibold text-text-main">
                {initialTemplates.length}
              </span>
              <span className="text-border">|</span>
              <span className="text-text-muted">Active:</span>
              <span className="font-mono font-semibold text-emerald-400">
                {activeCount}
              </span>
            </div>

            {/* Multi-Select Toggle Button */}
            <button
              onClick={() => {
                setMultiSelectMode((v) => !v);
                setSelectedIds(new Set());
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 min-h-[36px] ${
                multiSelectMode
                  ? "bg-primary/15 border-primary/40 text-primary font-semibold"
                  : "bg-surface-200 border-border text-text-secondary hover:text-text-main hover:bg-surface-300"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{multiSelectMode ? "Cancel Selection" : "Multi-select"}</span>
            </button>

            {/* + New Template Button (Sleek solid primary button — NO dashed box) */}
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-brand-hover active:scale-95 shadow-sm transition-all min-h-[36px]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Template</span>
            </button>
          </div>
        </div>
      </Card>

      {/* ── Merge Tags Reference Card ── */}
      <Card className="p-4 border-border bg-surface-100">
        <div className="flex items-center gap-2 mb-2.5">
          <Info className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Available Merge Tags
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {VARIABLES.map((v) => (
            <code
              key={v.token}
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-brand-soft border border-primary/20 text-brand-accent"
            >
              {v.token}
            </code>
          ))}
        </div>
        <p className="text-[11px] text-text-muted mt-2">
          <span className="font-medium text-text-secondary">custom_line</span>{" "}
          is generated by Gemini AI — a tailored opening hook based on recent
          channel activity.
        </p>
      </Card>

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

      {/* ── Sticky Bulk Action Bar (Visible when templates selected) ── */}
      {multiSelectMode && (
        <div className="sticky top-16 z-30 p-3 rounded-xl bg-surface-100/95 backdrop-blur border border-primary/30 shadow-xl flex items-center justify-between gap-3 flex-wrap animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-main font-medium"
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBatchAction("activate")}
              disabled={selectedIds.size === 0 || batchLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-200 border border-border text-emerald-400 text-xs font-medium hover:bg-surface-300 disabled:opacity-40 transition-colors"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Activate</span>
            </button>

            <button
              onClick={() => handleBatchAction("deactivate")}
              disabled={selectedIds.size === 0 || batchLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-200 border border-border text-warning text-xs font-medium hover:bg-surface-300 disabled:opacity-40 transition-colors"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Deactivate</span>
            </button>

            <button
              onClick={() => handleBatchAction("delete")}
              disabled={selectedIds.size === 0 || batchLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/15 border border-destructive/30 text-danger text-xs font-semibold hover:bg-destructive/25 disabled:opacity-40 transition-colors"
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column: Form Fields */}
              <div className="space-y-3.5">
                <div className="space-y-1">
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
                    maxLength={255}
                    className={`w-full bg-surface-200 border rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-muted ${
                      newErrors.name ? "border-rose-500/60" : "border-border"
                    }`}
                  />
                  {newErrors.name && (
                    <p className="text-[11px] text-rose-400">{newErrors.name}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">
                      Subject Line
                    </label>
                    <span
                      className={`text-[10px] font-mono font-medium ${subjectLengthColor(
                        subject.length
                      )}`}
                    >
                      {subject.length}/70 chars
                    </span>
                  </div>
                  <input
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      setNewErrors((p) => ({ ...p, subject: "" }));
                    }}
                    placeholder="e.g. Quick question for {{channel_name}}"
                    maxLength={500}
                    className={`w-full bg-surface-200 border rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-muted ${
                      newErrors.subject ? "border-rose-500/60" : "border-border"
                    }`}
                  />
                  {newErrors.subject && (
                    <p className="text-[11px] text-rose-400">
                      {newErrors.subject}
                    </p>
                  )}
                </div>

                {/* Variable insertion toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-brand-soft border border-primary/20">
                  <span className="text-[10px] text-brand-accent font-semibold uppercase tracking-wider mr-1">
                    Insert:
                  </span>
                  {VARIABLES.map((v) => (
                    <button
                      key={v.token}
                      type="button"
                      onClick={() => insertVariableIntoNew(v.token)}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-surface-300 border border-border text-brand-accent hover:bg-primary/10 hover:border-primary/30 active:scale-95 transition-all"
                    >
                      {v.token}
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">
                      Email Body
                    </label>
                    <span className="text-[10px] text-text-muted font-mono">
                      {body.trim() ? body.trim().split(/\s+/).length : 0} words
                    </span>
                  </div>
                  <textarea
                    ref={newBodyRef}
                    value={body}
                    onChange={(e) => {
                      setBody(e.target.value);
                      setNewErrors((p) => ({ ...p, body: "" }));
                    }}
                    rows={10}
                    placeholder={"Hi {{first_name}},\n\n{{custom_line}}\n\nI noticed your channel {{channel_name}} has reached {{subscriber_count}} subscribers..."}
                    className={`w-full bg-surface-200 border rounded-lg px-3 py-2 text-[11px] font-mono text-text-main leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-muted ${
                      newErrors.body ? "border-rose-500/60" : "border-border"
                    }`}
                  />
                  {newErrors.body && (
                    <p className="text-[11px] text-rose-400">{newErrors.body}</p>
                  )}
                </div>

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

              {/* Right Column: Live Mock Preview */}
              {showNewPreview && (
                <div className="space-y-3 p-4 rounded-xl bg-surface-200 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                      Live Preview
                    </span>
                    <span className="text-[10px] text-text-muted">
                      sample lead data
                    </span>
                  </div>


                  <div className="space-y-2 pt-1">
                    <div className="pb-2 border-b border-border/50">
                      <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
                        Subject
                      </span>
                      <p className="text-xs font-medium text-text-main">
                        {renderPreview(subject) || (
                          <span className="italic text-text-muted">Empty</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
                        Body
                      </span>
                      <div className="text-[11px] text-text-secondary whitespace-pre-wrap leading-relaxed max-h-[260px] overflow-y-auto">
                        {renderPreview(body) || (
                          <span className="italic text-text-muted">Empty</span>
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
                  : ""
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
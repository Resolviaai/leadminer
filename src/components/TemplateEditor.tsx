"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useDeferredValue,
} from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  X,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Keyboard,
  AlertCircle,
  Trash2,
  Power,
  CheckSquare,
  Square,
  Sparkles,
  Shuffle,
  Eye,
  Code2,
  Mail,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TemplateInsertMenu } from "@/components/templates/TemplateInsertMenu";
import {
  renderTemplatePreview,
  spinText,
} from "@/components/templates/spintax-presets";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Template {
  id: number;
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
}

type SaveState = "idle" | "saving" | "saved" | "error";

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function subjectLengthColor(len: number) {
  if (len <= 50) return "text-emerald-400";
  if (len <= 70) return "text-amber-400";
  return "text-rose-400";
}

// Auto-resize textarea hook
function useAutoResize(ref: React.RefObject<HTMLTextAreaElement>, value: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(160, el.scrollHeight)}px`;
  }, [ref, value]);
}

interface TemplateEditorProps {
  template: Template;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
}

export function TemplateEditor({
  template,
  selectable = false,
  selected = false,
  onToggleSelect,
}: TemplateEditorProps) {
  const router = useRouter();

  // ── State ──
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(template.name);
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [isActive, setIsActive] = useState(template.isActive);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [previewSeed, setPreviewSeed] = useState(0);
  const [viewTab, setViewTab] = useState<"preview" | "source">("preview");

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Deferred preview for performance
  const deferredSubject = useDeferredValue(subject);
  const deferredBody = useDeferredValue(body);

  // Refs
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const lastFocusedField = useRef<"subject" | "body">("body");
  const abortRef = useRef<AbortController | null>(null);

  useAutoResize(bodyRef, body);

  // Mark dirty
  useEffect(() => {
    if (editing) {
      const dirty =
        name !== template.name ||
        subject !== template.subject ||
        body !== template.body ||
        isActive !== template.isActive;
      setIsDirty(dirty);
    }
  }, [name, subject, body, isActive, editing, template]);

  // Unsaved changes warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Keyboard shortcut Ctrl/Cmd + S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s" && editing) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, name, subject, body, isActive]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // Insert variable or spintax at cursor
  const insertVariable = useCallback(
    (token: string, targetField?: "subject" | "body") => {
      const field = targetField ?? lastFocusedField.current;
      if (field === "subject") {
        const el = subjectRef.current;
        if (!el) {
          setSubject((prev) => prev + token);
          return;
        }
        const start = el.selectionStart ?? subject.length;
        const end = el.selectionEnd ?? subject.length;
        const updated = subject.slice(0, start) + token + subject.slice(end);
        setSubject(updated);
        requestAnimationFrame(() => {
          el.focus();
          el.selectionStart = el.selectionEnd = start + token.length;
        });
      } else {
        const el = bodyRef.current;
        if (!el) {
          setBody((prev) => prev + token);
          return;
        }
        const start = el.selectionStart ?? body.length;
        const end = el.selectionEnd ?? body.length;
        const updated = body.slice(0, start) + token + body.slice(end);
        setBody(updated);
        requestAnimationFrame(() => {
          el.focus();
          el.selectionStart = el.selectionEnd = start + token.length;
        });
      }
    },
    [body, subject]
  );

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (saveState === "saving") return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setSaveState("saving");
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subject: subject.trim(),
          body: body.trim(),
          isActive,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      setSaveState("saved");
      setIsDirty(false);
      setEditing(false);
      router.refresh();
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setSaveState("error");
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
    }
  }, [saveState, name, subject, body, isActive, template.id, router]);

  // ── Toggle Active Status ──
  const handleToggleActive = async () => {
    const nextState = !isActive;
    setIsActive(nextState);
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextState }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setIsActive(!nextState);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    setDeleting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to delete template");
      }
      setConfirmDelete(false);
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to delete template");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  // ── Cancel ──
  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setName(template.name);
    setSubject(template.subject);
    setBody(template.body);
    setIsActive(template.isActive);
    setEditing(false);
    setIsDirty(false);
    setErrorMsg(null);
    setSaveState("idle");
  }, [template]);

  // ── Computed ──
  const subjectLen = subject.length;
  const wordCount = countWords(body);
  const previewSubject = React.useMemo(
    () => renderTemplatePreview(deferredSubject, previewSeed),
    [deferredSubject, previewSeed]
  );
  const previewBody = React.useMemo(
    () => renderTemplatePreview(deferredBody, previewSeed),
    [deferredBody, previewSeed]
  );
  const hasSpintax =
    /\{([^{}]*?\|[^{}]*?)\}/.test(subject) ||
    /\{([^{}]*?\|[^{}]*?)\}/.test(body);

  return (
    <div className="space-y-3.5">
      {/* ── Header Row (View Mode & Edit Mode) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectable && (
            <button
              type="button"
              onClick={() => onToggleSelect?.(template.id)}
              className="p-1 -ml-1 text-text-muted hover:text-primary transition-colors shrink-0"
              aria-label={selected ? "Deselect template" : "Select template"}
            >
              {selected ? (
                <CheckSquare className="w-4 h-4 text-primary" />
              ) : (
                <Square className="w-4 h-4 text-text-muted" />
              )}
            </button>
          )}

          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors shrink-0 ${
              isActive
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-surface-300 text-text-muted border border-border"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isActive ? "bg-emerald-400" : "bg-text-muted"
              }`}
            />
            {isActive ? "Active" : "Inactive"}
          </span>

          {/* Name Display or Input */}
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface-200 border border-border rounded-lg px-2.5 py-1 text-sm font-semibold text-text-main focus:outline-none focus:ring-1 focus:ring-primary transition-all max-w-sm w-full"
              placeholder="Template name…"
              maxLength={100}
            />
          ) : (
            <div
              className="min-w-0 cursor-pointer group select-none flex items-center gap-2"
              onClick={() => setExpanded((v) => !v)}
            >
              <h2 className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors truncate">
                {template.name}
              </h2>
              <span className="text-[11px] text-text-muted font-normal hidden md:inline">
                • {wordCount} words
              </span>
            </div>
          )}

          {saveState === "saved" && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium shrink-0 animate-in fade-in">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
          {isDirty && saveState === "idle" && (
            <span className="text-[10px] text-amber-400 font-medium shrink-0">
              Unsaved
            </span>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          {!editing ? (
            <>
              {/* Edit Button */}
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setExpanded(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-200 border border-border text-xs font-medium text-text-secondary hover:text-text-main hover:bg-surface-300 transition-all active:scale-95"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit</span>
              </button>

              {/* Toggle Active Quick Action */}
              <button
                type="button"
                onClick={handleToggleActive}
                className={`p-1.5 rounded-lg border transition-all active:scale-95 ${
                  isActive
                    ? "text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
                    : "text-text-muted hover:text-text-main bg-surface-200 border-border hover:bg-surface-300"
                }`}
                title={isActive ? "Deactivate template" : "Activate template"}
                aria-label={isActive ? "Deactivate template" : "Activate template"}
              >
                <Power className="w-3.5 h-3.5" />
              </button>

              {/* Delete with Confirmation */}
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all active:scale-95"
                  title="Delete template"
                  aria-label="Delete template"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-surface-300 border border-rose-500/30 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-2 py-1 rounded text-[10px] font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                  >
                    {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="p-1 text-text-muted hover:text-text-main"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Expand / Collapse Chevron */}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-200 transition-all"
                aria-label={expanded ? "Collapse template" : "Expand template"}
              >
                {expanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </>
          ) : (
            /* Editing Controls */
            <>
              <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer mr-2 select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-border bg-surface-300 text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span>Active</span>
              </label>

              <span className="hidden sm:flex items-center gap-1 text-[10px] text-text-muted mr-1">
                <Keyboard className="w-3 h-3" />
                <kbd className="font-mono">Ctrl+S</kbd>
              </span>

              <button
                type="button"
                onClick={handleCancel}
                disabled={saveState === "saving"}
                className="px-3 py-1.5 rounded-lg bg-surface-200 border border-border text-xs font-medium text-text-secondary hover:text-text-main hover:bg-surface-300 transition-all disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saveState === "saving" || !isDirty}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-brand-hover active:scale-95 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveState === "saving" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{saveState === "saving" ? "Saving…" : "Save"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Error Banner ── */}
      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-300 hover:text-rose-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── VIEW MODE (Collapsed summary or Expanded Clean Email Card) ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {!editing && (
        <div>
          {/* Quick collapsed line */}
          {!expanded ? (
            <div
              className="flex items-center justify-between text-xs text-text-secondary cursor-pointer select-none py-0.5 group"
              onClick={() => setExpanded(true)}
            >
              <div className="min-w-0 flex-1 pr-4">
                <span className="text-text-muted font-medium mr-1.5">Subject:</span>
                <span className="text-text-main group-hover:text-primary transition-colors truncate">
                  {template.subject}
                </span>
              </div>
              <span className="text-[11px] text-text-muted font-mono shrink-0">
                Click to view email
              </span>
            </div>
          ) : (
            /* Expanded Clean Gmail-Style Card */
            <div className="rounded-xl border border-border/70 bg-surface-100/70 overflow-hidden shadow-xs">
              {/* Card Header with View Switcher & Shuffle */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-surface-200/60 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-text-main">
                    Email Preview
                  </span>
                  {hasSpintax && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                      <Sparkles className="w-2.5 h-2.5" />
                      Spintax Active
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex items-center p-0.5 rounded-lg bg-surface-300/80 border border-border/50 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setViewTab("preview")}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                        viewTab === "preview"
                          ? "bg-surface-100 text-text-main font-semibold shadow-xs"
                          : "text-text-muted hover:text-text-main"
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>Live Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewTab("source")}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                        viewTab === "source"
                          ? "bg-surface-100 text-text-main font-semibold shadow-xs"
                          : "text-text-muted hover:text-text-main"
                      }`}
                    >
                      <Code2 className="w-3 h-3" />
                      <span>Template Source</span>
                    </button>
                  </div>

                  {/* Shuffle Button */}
                  {hasSpintax && viewTab === "preview" && (
                    <button
                      type="button"
                      onClick={() => setPreviewSeed((s) => s + 1)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-surface-200 text-text-secondary hover:text-emerald-400 hover:bg-emerald-500/10 border border-border transition-all active:scale-95"
                      title="Shuffle Spintax variation with sample lead data"
                    >
                      <Shuffle className="w-3 h-3 text-emerald-400" />
                      <span>Shuffle</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Email Content Area */}
              <div className="p-4 sm:p-5 space-y-4">
                {/* Meta header (Recipient & Subject) */}
                <div className="space-y-2 pb-3.5 border-b border-border/40 text-xs">
                  {viewTab === "preview" && (
                    <div className="flex items-center gap-2 text-text-muted">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium text-text-secondary">To:</span>
                      <span className="font-medium text-text-main">
                        Joe &lt;creator@theroganclips.com&gt;
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">
                        (850K subscribers)
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <span className="text-text-muted font-medium shrink-0 pt-0.5">
                      Subject:
                    </span>
                    <span className="font-semibold text-text-main leading-relaxed">
                      {viewTab === "preview" ? previewSubject : template.subject}
                    </span>
                  </div>
                </div>

                {/* Email Body */}
                <div className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans whitespace-pre-wrap max-h-[380px] overflow-y-auto pr-2">
                  {viewTab === "preview" ? previewBody : template.body}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── EDIT MODE (Instantly & ManyReach Inspired Clean Composer) ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {editing && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
          {/* LEFT: Clean Editor (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Subject Input Box */}
            <div className="rounded-xl border border-border/80 bg-surface-100 p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  Subject Line
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-medium ${subjectLengthColor(
                      subjectLen
                    )}`}
                  >
                    {subjectLen}/70
                  </span>
                  {/* Contextual Insert Menu */}
                  <TemplateInsertMenu
                    targetName="subject"
                    onInsert={(token) => insertVariable(token, "subject")}
                  />
                </div>
              </div>

              <input
                ref={subjectRef}
                value={subject}
                onFocus={() => {
                  lastFocusedField.current = "subject";
                }}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Quick question about {{channel_name}} clips"
                className="w-full bg-surface-200 border border-border/80 rounded-lg px-3 py-2 text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-muted transition-all"
                maxLength={200}
              />
            </div>

            {/* Body Textarea Box */}
            <div className="rounded-xl border border-border/80 bg-surface-100 p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    Email Body
                  </label>
                  <span className="text-[10px] text-text-muted font-mono">
                    {wordCount} words
                  </span>
                </div>
                {/* Contextual Insert Menu */}
                <TemplateInsertMenu
                  targetName="body"
                  onInsert={(token) => insertVariable(token, "body")}
                />
              </div>

              <textarea
                ref={bodyRef}
                value={body}
                onFocus={() => {
                  lastFocusedField.current = "body";
                }}
                onChange={(e) => setBody(e.target.value)}
                placeholder={"Hi {{first_name}},\n\n{|Hello|Hi|Good morning|}\n\n{{custom_line}}\n\nCould I send over 2 sample clips we edited from your recent upload for free?\n\n{|Best|Cheers|Talk soon|},\nLeadMiner Team"}
                className="w-full min-h-[220px] bg-surface-200 border border-border/80 rounded-lg p-3 text-xs leading-relaxed font-sans text-text-main focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-muted transition-all resize-y"
              />
            </div>
          </div>

          {/* RIGHT: Live Preview (5 cols on lg) */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-border/80 bg-surface-100 overflow-hidden shadow-xs sticky top-4">
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-surface-200/70 border-b border-border/50">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-text-main">
                    Live Preview
                  </span>
                </div>

                {hasSpintax && (
                  <button
                    type="button"
                    onClick={() => setPreviewSeed((s) => s + 1)}
                    className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-300 text-text-secondary hover:text-emerald-400 hover:bg-emerald-500/10 border border-border transition-all active:scale-95"
                    title="Generate another variation"
                  >
                    <Shuffle className="w-3 h-3 text-emerald-400" />
                    <span>Shuffle Variation</span>
                  </button>
                )}
              </div>

              <div className="p-3.5 space-y-3">
                {/* Recipient info */}
                <div className="pb-2 border-b border-border/40 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 text-text-muted">
                    <span className="font-medium text-text-secondary">To:</span>
                    <span className="text-text-main font-medium truncate">
                      Joe &lt;creator@theroganclips.com&gt;
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-medium text-text-secondary shrink-0">
                      Subject:
                    </span>
                    <span className="text-text-main font-medium break-words">
                      {previewSubject || (
                        <span className="italic text-text-muted">No subject</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Body Preview */}
                <div className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto pr-1">
                  {previewBody || (
                    <span className="italic text-text-muted">
                      Start writing in the editor to see your email live preview…
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
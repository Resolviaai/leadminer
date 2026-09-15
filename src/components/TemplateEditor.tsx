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
  GripVertical,
  Tag,
  ArrowDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Template {
  id: number;
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
}

type SaveState = "idle" | "saving" | "saved" | "error";

// ─── Constants ────────────────────────────────────────────────────────────────
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
  "{{custom_line}}":
    "Loved your recent breakdown — the pacing was spot-on.",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function renderPreview(text: string) {
  return Object.entries(SAMPLE).reduce(
    (acc, [token, val]) => acc.replaceAll(token, val),
    text
  );
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function subjectLengthColor(len: number) {
  if (len <= 50) return "text-emerald-400";
  if (len <= 70) return "text-warning";
  return "text-danger";
}

// ─── Auto-resize textarea hook ────────────────────────────────────────────────
function useAutoResize(ref: React.RefObject<HTMLTextAreaElement>, value: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [ref, value]);
}

interface TemplateEditorProps {
  template: Template;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────
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

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Deferred preview — doesn't block typing
  const deferredSubject = useDeferredValue(subject);
  const deferredBody = useDeferredValue(body);

  // ── Refs ──
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const lastFocusedField = useRef<"subject" | "body">("body");
  const [draggingToken, setDraggingToken] = useState<string | null>(null);
  const [isSubjectOver, setIsSubjectOver] = useState(false);
  const [isBodyOver, setIsBodyOver] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  useAutoResize(bodyRef, body);

  // ── Mark dirty whenever editing fields change ──
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

  // ── Unsaved changes warning on tab/window close ──
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

  // ── Keyboard shortcut Ctrl/Cmd + S ──
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

  // ── Cancel in-flight request on unmount ──
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // ── Insert variable at cursor ──
  const insertVariable = useCallback((token: string, targetField?: "subject" | "body") => {
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
  }, [body, subject]);

  const handleSubjectDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsSubjectOver(false);
    setDraggingToken(null);

    const token =
      e.dataTransfer.getData("application/x-mergetag") ||
      e.dataTransfer.getData("text/plain") ||
      e.dataTransfer.getData("text");
    if (!token) return;

    const input = subjectRef.current;
    if (!input) {
      setSubject((prev) => prev + token);
      return;
    }

    let insertPos = input.selectionStart ?? input.value.length;
    try {
      if (typeof (document as any).caretPositionFromPoint === "function") {
        const pos = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
        if (pos && typeof pos.offset === "number" && (pos.offsetNode === input || input.contains(pos.offsetNode))) {
          insertPos = pos.offset;
        }
      } else if (typeof document.caretRangeFromPoint === "function") {
        const range = document.caretRangeFromPoint(e.clientX, e.clientY);
        if (range && typeof range.startOffset === "number" && (range.startContainer === input || input.contains(range.startContainer))) {
          insertPos = range.startOffset;
        }
      }
    } catch {}

    insertPos = Math.max(0, Math.min(insertPos, input.value.length));
    const nextVal = input.value.slice(0, insertPos) + token + input.value.slice(insertPos);
    setSubject(nextVal);
    lastFocusedField.current = "subject";

    requestAnimationFrame(() => {
      input.focus();
      try {
        input.setSelectionRange(insertPos + token.length, insertPos + token.length);
      } catch {}
    });
  };

  const handleBodyDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsBodyOver(false);
    setDraggingToken(null);

    const token =
      e.dataTransfer.getData("application/x-mergetag") ||
      e.dataTransfer.getData("text/plain") ||
      e.dataTransfer.getData("text");
    if (!token) return;

    const textarea = bodyRef.current;
    if (!textarea) {
      setBody((prev) => prev + token);
      return;
    }

    let insertPos = textarea.selectionStart ?? textarea.value.length;
    try {
      if (typeof (document as any).caretPositionFromPoint === "function") {
        const pos = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
        if (pos && typeof pos.offset === "number" && (pos.offsetNode === textarea || textarea.contains(pos.offsetNode))) {
          insertPos = pos.offset;
        }
      } else if (typeof document.caretRangeFromPoint === "function") {
        const range = document.caretRangeFromPoint(e.clientX, e.clientY);
        if (range && typeof range.startOffset === "number" && (range.startContainer === textarea || textarea.contains(range.startContainer))) {
          insertPos = range.startOffset;
        }
      }
    } catch {}

    insertPos = Math.max(0, Math.min(insertPos, textarea.value.length));
    const nextVal = textarea.value.slice(0, insertPos) + token + textarea.value.slice(insertPos);
    setBody(nextVal);
    lastFocusedField.current = "body";

    requestAnimationFrame(() => {
      textarea.focus();
      try {
        textarea.setSelectionRange(insertPos + token.length, insertPos + token.length);
      } catch {}
    });
  };

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
      setIsActive(!nextState); // rollback
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
  const previewSubject = renderPreview(deferredSubject);
  const previewBody = renderPreview(deferredBody);

  return (
    <div className="space-y-4">
      {/* ── Top Bar with ID, Status badge, and Controls ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-border/50 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant={isActive ? "success" : "secondary"} className="font-mono text-[10px]">
            {isActive ? "Active" : "Inactive"}
          </Badge>
          <Badge variant="secondary" className="font-mono text-[10px]">
            ID #{template.id}
          </Badge>

          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface-300 border border-border rounded-md px-2.5 py-1 text-sm font-semibold text-text-main focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
              placeholder="Template name..."
              maxLength={100}
            />
          ) : (
            <h2 className="text-sm font-semibold text-text-main truncate ml-1">{template.name}</h2>
          )}

          {/* Save state indicator */}
          {saveState === "saved" && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium shrink-0">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
          {isDirty && saveState === "idle" && (
            <span className="text-[10px] text-warning font-medium shrink-0">unsaved</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!editing ? (
            <>
              {/* Toggle active state */}
              <button
                onClick={handleToggleActive}
                title={isActive ? "Deactivate template" : "Activate template"}
                className={`p-1.5 rounded-md border text-xs transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center ${
                  isActive
                    ? "bg-surface-200 border-border text-text-secondary hover:text-warning"
                    : "bg-surface-200 border-border text-text-muted hover:text-emerald-400"
                }`}
              >
                <Power className="w-3.5 h-3.5" />
              </button>

              {/* Edit button */}
              <button
                onClick={() => { setEditing(true); setExpanded(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/25 text-primary text-xs font-medium hover:bg-primary/20 active:scale-95 transition-all min-h-[34px]"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>

              {/* Delete button */}
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  title="Delete template"
                  className="p-1.5 rounded-md bg-surface-200 border border-border text-text-muted hover:text-danger hover:bg-destructive/10 hover:border-destructive/30 transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-destructive/10 border border-destructive/30 rounded-md p-0.5">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-2 py-1 text-[11px] font-semibold text-danger hover:bg-destructive/20 rounded transition-colors"
                  >
                    {deleting ? "Deleting…" : "Confirm Delete"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="p-1 text-text-muted hover:text-text-main rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Expand / Collapse */}
              <button
                onClick={() => setExpanded((v) => !v)}
                className="p-1.5 rounded-md bg-surface-200 border border-border text-text-muted hover:text-text-main transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
                aria-label={expanded ? "Collapse" : "Expand"}
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </>
          ) : (
            <>
              {/* Active Toggle in edit mode */}
              <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer mr-2 select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-border bg-surface-300 text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span>Active</span>
              </label>

              {/* Keyboard shortcut hint */}
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-text-muted">
                <Keyboard className="w-3 h-3" />
                <kbd className="font-mono">Ctrl+S</kbd>
              </span>

              <button
                onClick={handleCancel}
                disabled={saveState === "saving"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-200 border border-border text-text-secondary text-xs font-medium hover:text-text-main active:scale-95 transition-all min-h-[34px] disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saveState === "saving" || !isDirty}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:bg-brand-hover active:scale-95 transition-all min-h-[34px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveState === "saving" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                {saveState === "saving" ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Error banner ── */}
      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="ml-auto text-rose-300 hover:text-rose-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Variable insertion toolbar with drag & drop (editing only) ── */}
      {editing && (
        <div className="p-3 rounded-xl bg-surface-200/90 border border-border space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary tracking-wide uppercase">
              <Tag className="w-3.5 h-3.5 text-primary" />
              <span>Available Merge Tags</span>
            </div>
            <span className="text-[10px] text-text-muted">
              {draggingToken ? (
                <span className="text-primary font-medium flex items-center gap-1 animate-pulse">
                  <ArrowDown className="w-3 h-3" /> Drop into Subject or Body
                </span>
              ) : (
                "Drag & drop or click to insert"
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {VARIABLES.map((v) => (
              <div
                key={v.token}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", v.token);
                  e.dataTransfer.setData("text", v.token);
                  e.dataTransfer.setData("application/x-mergetag", v.token);
                  e.dataTransfer.effectAllowed = "copy";
                  setDraggingToken(v.token);
                }}
                onDragEnd={() => {
                  setDraggingToken(null);
                  setIsSubjectOver(false);
                  setIsBodyOver(false);
                }}
                onClick={() => insertVariable(v.token)}
                title={`Drag into Subject or Body, or click to insert ${v.token}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-300 border border-border/80 text-primary hover:text-white hover:bg-primary/20 hover:border-primary/50 cursor-grab active:cursor-grabbing hover:scale-[1.03] active:scale-[0.97] transition-all shadow-sm select-none group text-xs font-mono"
              >
                <GripVertical className="w-3 h-3 text-text-muted group-hover:text-primary transition-colors shrink-0" />
                <span>{v.token}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Editor / Preview panel ── */}
      {(editing || expanded) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT — Editor */}
          <div className="space-y-3 p-4 rounded-xl bg-surface-200 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                {editing ? "Editor" : "Template Source"}
              </span>
            </div>

            {/* Subject field with Drop Target */}
            <div
              onDragOver={(e) => {
                if (!editing) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
                if (!isSubjectOver) setIsSubjectOver(true);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsSubjectOver(false);
                }
              }}
              onDrop={(e) => editing && handleSubjectDrop(e)}
              className={`space-y-1.5 p-2 rounded-xl transition-all ${
                editing && isSubjectOver
                  ? "ring-2 ring-primary border border-primary bg-primary/[0.05]"
                  : editing && draggingToken
                  ? "ring-1 ring-primary/40 border border-dashed border-primary/50 bg-primary/[0.02]"
                  : "border border-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider flex items-center gap-1.5">
                  <span>Subject Line</span>
                  {editing && draggingToken && (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                        isSubjectOver
                          ? "bg-primary text-white font-medium"
                          : "text-primary font-medium"
                      }`}
                    >
                      <ArrowDown className="w-2.5 h-2.5" />
                      {isSubjectOver ? "Release to drop" : "Drop target"}
                    </span>
                  )}
                </label>
                {editing && (
                  <span className={`text-[10px] font-mono font-medium ${subjectLengthColor(subjectLen)}`}>
                    {subjectLen}/70 chars
                    {subjectLen > 50 && subjectLen <= 70 && " — getting long"}
                    {subjectLen > 70 && " — too long"}
                    {subjectLen <= 50 && " — optimal"}
                  </span>
                )}
              </div>
              {editing ? (
                <input
                  ref={subjectRef}
                  value={subject}
                  onFocus={() => {
                    lastFocusedField.current = "subject";
                  }}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-surface-300 border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-muted transition-shadow"
                  placeholder="Your subject line…"
                  maxLength={200}
                />
              ) : (
                <p className="font-mono text-xs text-text-main break-words">{template.subject}</p>
              )}
            </div>

            {/* Body field with Drop Target */}
            <div
              onDragOver={(e) => {
                if (!editing) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
                if (!isBodyOver) setIsBodyOver(true);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsBodyOver(false);
                }
              }}
              onDrop={(e) => editing && handleBodyDrop(e)}
              className={`space-y-1.5 p-2 rounded-xl transition-all pt-2 border-t border-border/50 ${
                editing && isBodyOver
                  ? "ring-2 ring-primary border border-primary bg-primary/[0.05]"
                  : editing && draggingToken
                  ? "ring-1 ring-primary/40 border border-dashed border-primary/50 bg-primary/[0.02]"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider flex items-center gap-1.5">
                  <span>Email Body</span>
                  {editing && draggingToken && (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                        isBodyOver
                          ? "bg-primary text-white font-medium"
                          : "text-primary font-medium"
                      }`}
                    >
                      <ArrowDown className="w-2.5 h-2.5" />
                      {isBodyOver ? "Release to drop" : "Drop target"}
                    </span>
                  )}
                </label>
                {editing && (
                  <span className="text-[10px] text-text-muted font-mono">
                    {wordCount} words
                  </span>
                )}
              </div>
              {editing ? (
                <textarea
                  ref={bodyRef}
                  value={body}
                  onFocus={() => {
                    lastFocusedField.current = "body";
                  }}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full min-h-[240px] bg-surface-300 border border-border rounded-lg px-3 py-2.5 text-[11px] font-mono text-text-main leading-relaxed resize-none overflow-hidden focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-muted transition-shadow"
                  placeholder="Write your email body… use {{variable}} syntax for personalization"
                />
              ) : (
                <pre className="font-mono text-[11px] text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {template.body}
                </pre>
              )}
            </div>
          </div>

          {/* RIGHT — Live Preview */}
          <div className="space-y-3 p-4 rounded-xl bg-surface-200 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                Live Preview
              </span>
              <span className="text-[10px] text-text-muted">sample data</span>
            </div>



            {/* Full body preview */}
            <div className="space-y-2 pt-1">
              <div className="pb-2 border-b border-border/50">
                <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
                  Subject
                </span>
                <p className="text-xs font-medium text-text-main">
                  {previewSubject || <span className="italic text-text-muted">Empty</span>}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
                  Body
                </span>
                <div className="text-[11px] text-text-secondary whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {previewBody || <span className="italic text-text-muted">Empty</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
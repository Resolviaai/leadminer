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
} from "lucide-react";

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

// ─── Main Component ───────────────────────────────────────────────────────────
export function TemplateEditor({ template }: { template: Template }) {
  const router = useRouter();

  // ── State ──
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(template.name);
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Deferred preview — doesn't block typing
  const deferredSubject = useDeferredValue(subject);
  const deferredBody = useDeferredValue(body);

  // ── Refs ──
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  useAutoResize(bodyRef, body);

  // ── Mark dirty whenever editing fields change ──
  useEffect(() => {
    if (editing) {
      const dirty =
        name !== template.name ||
        subject !== template.subject ||
        body !== template.body;
      setIsDirty(dirty);
    }
  }, [name, subject, body, editing, template]);

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
  }, [editing, name, subject, body]);

  // ── Cancel in-flight request on unmount ──
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // ── Insert variable at cursor ──
  const insertVariable = useCallback((token: string) => {
    const el = bodyRef.current;
    if (!el) {
      setBody((prev) => prev + token);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const updated = body.slice(0, start) + token + body.slice(end);
    setBody(updated);
    // Restore cursor after React re-renders
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + token.length;
      el.focus();
    });
  }, [body]);

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
        body: JSON.stringify({ name: name.trim(), subject: subject.trim(), body: body.trim() }),
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
      // Reset to idle after 3s
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setSaveState("error");
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
    }
  }, [saveState, name, subject, body, template.id, router]);

  // ── Cancel ──
  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setName(template.name);
    setSubject(template.subject);
    setBody(template.body);
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
      {/* ── Header row ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface-300 border border-border rounded-md px-2.5 py-1 text-sm font-semibold text-text-main focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
              placeholder="Template name..."
              maxLength={100}
            />
          ) : (
            <h2 className="text-sm font-semibold text-text-main truncate">{template.name}</h2>
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
              <button
                onClick={() => { setEditing(true); setExpanded(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/25 text-primary text-xs font-medium hover:bg-primary/20 active:scale-95 transition-all min-h-[34px]"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
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
      {saveState === "error" && errorMsg && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
          <button
            onClick={handleSave}
            className="ml-auto text-rose-300 underline underline-offset-2 hover:text-rose-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Variable insertion toolbar (editing only) ── */}
      {editing && (
        <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-lg bg-brand-soft border border-primary/20">
          <span className="text-[10px] text-brand-accent font-semibold uppercase tracking-wider mr-1">
            Insert:
          </span>
          {VARIABLES.map((v) => (
            <button
              key={v.token}
              type="button"
              onClick={() => insertVariable(v.token)}
              className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-surface-300 border border-border text-brand-accent hover:bg-primary/10 hover:border-primary/30 active:scale-95 transition-all"
            >
              {`{{${v.label}}}`}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-text-muted hidden sm:block">
            Click to insert at cursor
          </span>
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

            {/* Subject field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">
                  Subject Line
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
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-surface-300 border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-muted transition-shadow"
                  placeholder="Your subject line…"
                  maxLength={200}
                />
              ) : (
                <p className="font-mono text-xs text-text-main break-words">{template.subject}</p>
              )}
            </div>

            {/* Body field */}
            <div className="space-y-1.5 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">
                  Email Body
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

            {/* Mock Gmail inbox row */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-surface-300 px-3 py-1.5 border-b border-border">
                <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                  Inbox Preview
                </p>
              </div>
              <div className="px-3 py-2.5 flex items-start gap-3 bg-surface-300/50">
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-[10px] font-bold shrink-0 mt-0.5">
                  Y
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-text-main truncate">You</span>
                    <span className="text-[10px] text-text-muted shrink-0">Just now</span>
                  </div>
                  <p className="text-xs text-text-main font-medium truncate mt-0.5">
                    {previewSubject || <span className="text-text-muted italic">No subject</span>}
                  </p>
                  <p className="text-[11px] text-text-muted truncate mt-0.5">
                    {previewBody.slice(0, 80)}…
                  </p>
                </div>
              </div>
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
"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Check, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";

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

export function NewTemplateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-resize textarea
  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  // Insert variable at cursor in body
  const insertVariable = useCallback((token: string) => {
    const el = bodyRef.current;
    if (!el) { setBody((p) => p + token); return; }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const updated = body.slice(0, start) + token + body.slice(end);
    setBody(updated);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + token.length;
      el.focus();
    });
  }, [body]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Template name is required";
    if (!subject.trim()) e.subject = "Subject line is required";
    if (!body.trim()) e.body = "Email body is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (saving) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setSaving(true);
    setServerError(null);

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), subject: subject.trim(), body: body.trim() }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      // Reset form and close
      setName(""); setSubject(""); setBody("");
      setErrors({});
      setOpen(false);
      router.refresh(); // re-fetch server component data
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setServerError(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setOpen(false);
    setName(""); setSubject(""); setBody("");
    setErrors({}); setServerError(null);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-brand-soft text-text-muted hover:text-primary text-sm font-medium transition-all active:scale-[0.99] group"
      >
        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
        New Template
      </button>
    );
  }

  return (
    <Card className="p-4 sm:p-5 border-primary/30 bg-surface-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-text-main">New Template</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-200 border border-border text-text-muted hover:text-text-main text-[11px] transition-colors"
          >
            {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Preview
          </button>
          <button
            onClick={handleCancel}
            className="p-1.5 rounded-md text-text-muted hover:text-text-main hover:bg-surface-200 transition-colors"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {serverError && (
        <div className="mb-4 flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2.5">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT — Form fields */}
        <div className="space-y-3">
          {/* Template Name */}
          <div className="space-y-1">
            <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider block">
              Template Name
            </label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
              placeholder="e.g. Cold Outreach v2"
              maxLength={255}
              className={`w-full bg-surface-300 border rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary transition-shadow placeholder:text-text-muted ${errors.name ? "border-rose-500/60" : "border-border"}`}
            />
            {errors.name && <p className="text-[11px] text-rose-400">{errors.name}</p>}
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">
                Subject Line
              </label>
              <span className={`text-[10px] font-mono font-medium ${subjectLengthColor(subject.length)}`}>
                {subject.length}/70
              </span>
            </div>
            <input
              value={subject}
              onChange={(e) => { setSubject(e.target.value); setErrors((p) => ({ ...p, subject: "" })); }}
              placeholder="e.g. Quick question about {{channel_name}}"
              maxLength={500}
              className={`w-full bg-surface-300 border rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none focus:ring-1 focus:ring-primary transition-shadow placeholder:text-text-muted ${errors.subject ? "border-rose-500/60" : "border-border"}`}
            />
            {errors.subject && <p className="text-[11px] text-rose-400">{errors.subject}</p>}
          </div>

          {/* Variable chips */}
          <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-lg bg-brand-soft border border-primary/20">
            <span className="text-[10px] text-brand-accent font-semibold uppercase tracking-wider mr-1">Insert:</span>
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
          </div>

          {/* Body */}
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
              ref={bodyRef}
              value={body}
              onChange={(e) => { handleBodyChange(e); setErrors((p) => ({ ...p, body: "" })); }}
              placeholder={"Hi {{first_name}},\n\n{{custom_line}}\n\nI noticed your channel {{channel_name}} has grown to {{subscriber_count}} subscribers — impressive work!\n\n..."}
              className={`w-full min-h-[200px] bg-surface-300 border rounded-lg px-3 py-2.5 text-[11px] font-mono text-text-main leading-relaxed resize-none overflow-hidden focus:outline-none focus:ring-1 focus:ring-primary transition-shadow placeholder:text-text-muted ${errors.body ? "border-rose-500/60" : "border-border"}`}
            />
            {errors.body && <p className="text-[11px] text-rose-400">{errors.body}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 px-3 py-2 rounded-lg border border-border text-text-secondary text-xs font-medium hover:text-text-main hover:bg-surface-200 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-brand-hover active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {saving ? "Creating…" : "Create Template"}
            </button>
          </div>
        </div>

        {/* RIGHT — Live preview */}
        {showPreview && (
          <div className="hidden sm:block space-y-3 p-4 rounded-xl bg-surface-200 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Live Preview</span>
              <span className="text-[10px] text-text-muted">sample data</span>
            </div>

            {/* Mock inbox row */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-surface-300 px-3 py-1.5 border-b border-border">
                <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Inbox Preview</p>
              </div>
              <div className="px-3 py-2.5 flex items-start gap-3 bg-surface-300/50">
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-[10px] font-bold shrink-0 mt-0.5">Y</div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-main truncate">
                    {renderPreview(subject) || <span className="text-text-muted italic">No subject yet…</span>}
                  </p>
                  <p className="text-[11px] text-text-muted truncate mt-0.5">
                    {renderPreview(body).slice(0, 80) || <span className="italic">No body yet…</span>}
                    {body.length > 80 ? "…" : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Full preview */}
            <div className="space-y-2 pt-1">
              <div className="pb-2 border-b border-border/50">
                <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Subject</span>
                <p className="text-xs font-medium text-text-main">
                  {renderPreview(subject) || <span className="italic text-text-muted">Empty</span>}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">Body</span>
                <div className="text-[11px] text-text-secondary whitespace-pre-wrap leading-relaxed max-h-[260px] overflow-y-auto">
                  {renderPreview(body) || <span className="italic text-text-muted">Empty</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
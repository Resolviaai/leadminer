"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Check,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  CornerDownRight,
  Minus,
  Sparkles,
  Shuffle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TemplateOption {
  id: number;
  name: string;
  subject: string;
  body: string;
}

interface StepItem {
  id?: number;
  stepNumber: number;
  templateId: number;
  delayDays: number;
  delayHours: number;
  templateName?: string;
  templateSubject?: string;
  templateBody?: string;
  isExpanded?: boolean;
}

interface SequenceMetrics {
  phi: number;
  equilibriumNewRatio: number;
  equilibriumFollowUpRatio: number;
  stepCount: number;
}

function countWords(text?: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

export function SequenceBuilder() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sequenceId, setSequenceId] = useState<number | null>(null);
  const [name, setName] = useState("Creator Outreach Sequence");
  const [weekendPolicy, setWeekendPolicy] = useState<"SKIP_WEEKENDS" | "SEND_7_DAYS">("SKIP_WEEKENDS");
  const [capacityBias, setCapacityBias] = useState<number>(0);
  const [steps, setSteps] = useState<StepItem[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [metrics, setMetrics] = useState<SequenceMetrics | null>(null);

  const bodyRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const fetchSequence = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sequences");
      if (!res.ok) throw new Error("Failed to load sequence configuration");
      const data = await res.json();

      if (data.sequence) {
        setSequenceId(data.sequence.id);
        setName(data.sequence.name || "Creator Outreach Sequence");
        setWeekendPolicy(data.sequence.weekendPolicy || "SKIP_WEEKENDS");
        setCapacityBias(parseFloat(data.sequence.capacityBias || "0"));
      }

      const rawTemplates: TemplateOption[] = data.templates || [];
      setTemplates(rawTemplates);

      if (data.steps && data.steps.length > 0) {
        setSteps(
          data.steps.map((s: any) => {
            const matchedTpl = rawTemplates.find((t) => t.id === s.templateId);
            return {
              ...s,
              templateSubject: s.templateSubject ?? matchedTpl?.subject ?? "",
              templateBody: s.templateBody ?? matchedTpl?.body ?? "",
              isExpanded: true,
            };
          })
        );
      } else {
        const defaultTpl = rawTemplates[0] || {
          id: 1,
          name: "Initial Pitch",
          subject: "A 30-sec video concept for {{channel_name}}",
          body: "Hey {{channel_name}},\n\nLoved your recent video! We help creators scale their views with high-retention short-form clips.\n\nCould I send over a quick 30-second concept for your channel, completely free?\n\nBest,\nTeam LeadMiner",
        };

        setSteps([
          {
            stepNumber: 1,
            templateId: defaultTpl.id,
            templateName: defaultTpl.name,
            templateSubject: defaultTpl.subject,
            templateBody: defaultTpl.body,
            delayDays: 0,
            delayHours: 0,
            isExpanded: true,
          },
          {
            stepNumber: 2,
            templateId: 0,
            templateName: "Follow-Up #1",
            templateSubject: "",
            templateBody: "Hey {{channel_name}},\n\nJust wanted to bump this to the top of your inbox in case it got buried. Did you have a quick moment to check out my previous note?\n\nBest,\nTeam LeadMiner",
            delayDays: 2,
            delayHours: 0,
            isExpanded: true,
          },
        ]);
      }

      setMetrics(data.metrics || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSequence();
  }, []);

  // Compute live expansion factor based on current UI step count
  const stepCount = steps.length;
  let simulatedPhi = 1.0;
  let prevS = 1.0;
  for (let i = 2; i <= stepCount; i++) {
    prevS = prevS * 0.93; // ~7% exit rate
    simulatedPhi += prevS;
  }
  const baseNewRatio = Math.round((1.0 / simulatedPhi) * 100);

  const effectiveNewRatio = Math.max(15, Math.min(85, Math.round(baseNewRatio + capacityBias * 100)));
  const effectiveFuRatio = 100 - effectiveNewRatio;

  // Add Step (Instantly.ai pattern: appends step with dedicated message editor)
  const handleAddStep = () => {
    const nextStepNum = steps.length + 1;
    setSteps([
      ...steps,
      {
        stepNumber: nextStepNum,
        templateId: 0,
        templateName: `Follow-Up #${nextStepNum - 1}`,
        templateSubject: "",
        templateBody: `Hey {{channel_name}},\n\nJust following up on my previous message. Are you open to taking a look at the concept?\n\nBest,\nTeam LeadMiner`,
        delayDays: 2,
        delayHours: 0,
        isExpanded: true,
      },
    ]);
  };

  // Remove Step
  const handleRemoveStep = (indexToRemove: number) => {
    if (steps.length <= 1) return;
    const filtered = steps.filter((_, idx) => idx !== indexToRemove);
    const renumbered = filtered.map((s, idx) => ({
      ...s,
      stepNumber: idx + 1,
      delayDays: idx === 0 ? 0 : s.delayDays || 2,
    }));
    setSteps(renumbered);
  };

  // Update step field
  const handleStepChange = (index: number, field: keyof StepItem, val: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: val };
    setSteps(updated);
  };

  // Populate step from an existing template dropdown
  const handleApplyTemplate = (index: number, templateIdStr: string) => {
    const tId = parseInt(templateIdStr, 10);
    const selected = templates.find((t) => t.id === tId);
    if (!selected) return;

    const updated = [...steps];
    updated[index] = {
      ...updated[index],
      templateId: selected.id,
      templateName: selected.name,
      templateSubject: selected.subject,
      templateBody: selected.body,
    };
    setSteps(updated);
  };

  // Insert variable or spintax token into textarea
  const insertTokenIntoBody = (index: number, token: string) => {
    const el = bodyRefs.current[index];
    const currentBody = steps[index].templateBody || "";
    if (!el) {
      handleStepChange(index, "templateBody", currentBody + token);
      return;
    }

    const start = el.selectionStart ?? currentBody.length;
    const end = el.selectionEnd ?? currentBody.length;
    const updated = currentBody.slice(0, start) + token + currentBody.slice(end);

    handleStepChange(index, "templateBody", updated);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + token.length;
    });
  };

  // Save changes
  const handleSave = async () => {
    if (!sequenceId) return;
    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const res = await fetch("/api/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sequenceId,
          name,
          weekendPolicy,
          capacityBias,
          steps,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save sequence");
      }

      const resData = await res.json();
      setMetrics(resData.metrics);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-primary" />
        <span className="text-xs">Loading sequence pipeline...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl mx-auto w-full pb-8 sm:pb-0">
      {/* ── Action Toolbar Card (Sticky on mobile for thumb accessibility) ── */}
      <Card className="sticky top-0 z-20 p-3 sm:p-4 border-border bg-surface-100/95 backdrop-blur-md shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] sm:text-xs text-text-muted font-medium">Pipeline:</span>
          <Badge variant="outline" className="font-mono text-[10px] sm:text-[11px] border-border bg-surface-200 text-text-main px-2 py-0.5">
            {steps.length} {steps.length === 1 ? "Step" : "Steps"} Active
          </Badge>
          <span className="text-border">|</span>
          <Badge variant="outline" className="font-mono text-[10px] sm:text-[11px] border-border bg-surface-200 text-text-secondary px-2 py-0.5">
            {weekendPolicy === "SKIP_WEEKENDS" ? "Mon–Fri Dispatch" : "7 Days Continuous"}
          </Badge>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {saveSuccess ? (
            <Badge variant="success" className="text-xs flex items-center gap-1 py-1.5 px-2.5">
              <Check className="w-3.5 h-3.5" />
              Saved to Database
            </Badge>
          ) : (
            <div className="hidden sm:block" />
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 rounded-xl sm:rounded-lg bg-primary text-white text-xs font-semibold hover:bg-brand-hover active:scale-[0.98] shadow-sm transition-all min-h-[44px] sm:min-h-[38px] disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 sm:w-3.5 sm:h-3.5 animate-spin" /> : <Check className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
            <span>Save Sequence</span>
          </button>
        </div>
      </Card>

      {error && (
        <div className="p-3.5 bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Main Single Column on Mobile, Two Columns on Desktop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* Left Column: Instantly.ai Style Connected Timeline with Full Message Editors (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-text-main">Sequence Timeline &amp; Follow-Up Copy</h3>
              <span className="text-xs text-text-muted font-mono">
                ({steps.length} {steps.length === 1 ? "step" : "steps"})
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddStep}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-200 text-text-secondary hover:text-text-main hover:bg-surface-300 text-xs font-medium active:scale-95 transition-all min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>Add Follow-Up</span>
            </button>
          </div>

          {/* Connected Timeline Container */}
          <div className="relative">
            {steps.map((step, idx) => {
              const isInitial = idx === 0;
              const parentStep = idx > 0 ? steps[idx - 1] : null;
              const wordCount = countWords(step.templateBody);
              const hasSpintax = /\{([^{}]*?\|[^{}]*?)\}/.test(step.templateBody || "") || /\{([^{}]*?\|[^{}]*?)\}/.test(step.templateSubject || "");

              return (
                <div key={idx}>
                  {/* Instantly.ai Style Delay Connector between Steps */}
                  {!isInitial && (
                    <div className="relative py-2.5 sm:py-3 flex items-center justify-center">
                      {/* Vertical line running through the center */}
                      <div className="absolute inset-y-0 w-0.5 bg-border -z-0" />

                      {/* Native-Feel Touch Stepper Delay Pill */}
                      <div className="relative z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-surface-200 border border-border text-xs text-text-secondary shadow-md">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-[11px] text-text-muted font-medium">Wait</span>

                        <div className="flex items-center bg-surface-300 border border-border/80 rounded-md overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleStepChange(idx, "delayDays", Math.max(1, step.delayDays - 1))}
                            aria-label="Decrease delay days"
                            className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-surface-200 active:scale-90 transition-all font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={step.delayDays}
                            onChange={(e) =>
                              handleStepChange(idx, "delayDays", Math.max(1, parseInt(e.target.value) || 1))
                            }
                            className="w-7 bg-transparent text-center font-mono font-semibold text-text-main outline-none text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleStepChange(idx, "delayDays", Math.min(30, step.delayDays + 1))}
                            aria-label="Increase delay days"
                            className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-surface-200 active:scale-90 transition-all font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-[11px] text-text-main font-medium">
                          {step.delayDays === 1 ? "Day" : "Days"}
                        </span>
                        <span className="text-text-muted text-[10px] hidden xs:inline">
                          ({weekendPolicy === "SKIP_WEEKENDS" ? "business" : "calendar"})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Step Card with Full Inline Message Editor */}
                  <Card className="p-3.5 sm:p-4 border-border bg-surface-100 hover:border-studio-border-strong transition-all space-y-3 relative z-10 rounded-xl shadow-sm">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg sm:rounded-md bg-surface-200 border border-border text-text-main font-mono font-semibold text-xs flex items-center justify-center shrink-0">
                          {step.stepNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-semibold text-text-main">
                              {isInitial ? "Step 1: Initial Cold Pitch" : `Step ${step.stepNumber}: Follow-Up #${step.stepNumber - 1}`}
                            </span>
                            {!isInitial && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] font-mono border-border text-text-muted px-1.5 py-0"
                              >
                                In-Thread Bump (Re:)
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-text-muted mt-0.5 leading-normal">
                            {isInitial
                              ? "Dispatched upon lead qualification during US Eastern business hours."
                              : `Sent ${step.delayDays} ${
                                  weekendPolicy === "SKIP_WEEKENDS" ? "business" : "calendar"
                                } day(s) after Step ${step.stepNumber - 1} if creator hasn't replied.`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {!isInitial && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            className="min-h-[38px] min-w-[38px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center rounded-lg text-text-muted hover:text-destructive hover:bg-surface-200 active:scale-95 transition-all"
                            title="Remove this follow-up step"
                            aria-label="Remove this follow-up step"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Pre-fill Template Helper */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs">
                      <span className="text-[11px] text-text-muted">Start from existing template:</span>
                      <select
                        value={step.templateId || ""}
                        onChange={(e) => handleApplyTemplate(idx, e.target.value)}
                        className="bg-surface-200 border border-border text-[11px] text-text-secondary rounded-md px-2 py-1 outline-none focus:border-primary max-w-[200px] truncate"
                      >
                        <option value="">Load template...</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id} className="bg-surface-200 text-text-main">
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 1. Subject Line Input Box */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                          {isInitial ? "Email Subject Line" : "Follow-Up Subject Line"}
                        </label>
                        {!isInitial && (
                          <span className="text-[10px] text-text-muted">
                            Leave empty for in-thread <code className="text-text-secondary">Re: [Original]</code>
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={step.templateSubject || ""}
                        onChange={(e) => handleStepChange(idx, "templateSubject", e.target.value)}
                        placeholder={
                          isInitial
                            ? "e.g. A 30-sec concept for {{channel_name}}"
                            : "Leave blank to keep inside original email thread (Recommended)"
                        }
                        className="w-full bg-surface-200 border border-border text-xs text-text-main rounded-lg px-3 py-2.5 sm:py-2 outline-none focus:border-primary font-mono placeholder:text-text-muted min-h-[40px] sm:min-h-0"
                      />
                    </div>

                    {/* 2. Message Body Input Box (Textarea) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                          {isInitial ? "Email Message Body" : "Follow-Up Message Copy"}
                        </label>
                        <div className="flex items-center gap-2 font-mono text-[10px] text-text-muted">
                          {hasSpintax && (
                            <span className="text-primary flex items-center gap-1">
                              <Shuffle className="w-3 h-3" />
                              Spintax Active
                            </span>
                          )}
                          <span>{wordCount} words</span>
                        </div>
                      </div>

                      <textarea
                        ref={(el) => {
                          bodyRefs.current[idx] = el;
                        }}
                        rows={6}
                        value={step.templateBody || ""}
                        onChange={(e) => handleStepChange(idx, "templateBody", e.target.value)}
                        placeholder={
                          isInitial
                            ? "Hey {{channel_name}},\n\nSaw your video on {{video_title}}..."
                            : "Hey {{channel_name}},\n\nJust wanted to float my previous email to the top of your inbox in case it got buried. Are you open to taking a look?\n\nBest,\n[Your Name]"
                        }
                        className="w-full bg-surface-200 border border-border text-xs text-text-main rounded-lg p-3 outline-none focus:border-primary font-sans leading-relaxed resize-y placeholder:text-text-muted"
                      />

                      {/* Merge Tag & Spintax Insert Bar */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] text-text-muted shrink-0 mr-1">Insert:</span>
                        <button
                          type="button"
                          onClick={() => insertTokenIntoBody(idx, "{{channel_name}}")}
                          className="text-[10px] font-mono px-2 py-1 rounded bg-surface-300 hover:bg-surface-200 text-text-secondary hover:text-text-main border border-border/80 active:scale-95 transition-all"
                        >
                          + {"{{channel_name}}"}
                        </button>
                        <button
                          type="button"
                          onClick={() => insertTokenIntoBody(idx, "{{first_name}}")}
                          className="text-[10px] font-mono px-2 py-1 rounded bg-surface-300 hover:bg-surface-200 text-text-secondary hover:text-text-main border border-border/80 active:scale-95 transition-all"
                        >
                          + {"{{first_name}}"}
                        </button>
                        <button
                          type="button"
                          onClick={() => insertTokenIntoBody(idx, "{{subscriber_count}}")}
                          className="text-[10px] font-mono px-2 py-1 rounded bg-surface-300 hover:bg-surface-200 text-text-secondary hover:text-text-main border border-border/80 active:scale-95 transition-all"
                        >
                          + {"{{subscriber_count}}"}
                        </button>
                        <button
                          type="button"
                          onClick={() => insertTokenIntoBody(idx, "{Hi|Hey|Hello}")}
                          className="text-[10px] font-mono px-2 py-1 rounded bg-surface-300 hover:bg-surface-200 text-primary border border-border/80 active:scale-95 transition-all flex items-center gap-1"
                        >
                          <Shuffle className="w-2.5 h-2.5" />
                          <span>{"{Hi|Hey|Hello}"}</span>
                        </button>
                      </div>
                    </div>

                    {/* In-Thread Continuity Notice for Follow-Ups */}
                    {!isInitial && (
                      <div className="px-3 py-2 rounded-lg bg-surface-200/40 border border-border/30 text-[10px] text-text-muted flex items-start gap-1.5">
                        <CornerDownRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                        <span>
                          Dispatched from the exact same connected Gmail account with RFC 5322 In-Reply-To headers, bumping the existing conversation naturally.
                        </span>
                      </div>
                    )}
                  </Card>
                </div>
              );
            })}

            {/* Timeline Bottom Add Step Button */}
            <div className="relative pt-4 flex flex-col items-center">
              <div className="absolute top-0 w-0.5 h-4 bg-border -z-0" />
              <button
                type="button"
                onClick={handleAddStep}
                className="w-full sm:w-auto relative z-10 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-dashed border-border bg-surface-100 hover:bg-surface-200 text-text-secondary hover:text-text-main text-xs font-semibold active:scale-[0.98] transition-all min-h-[44px]"
              >
                <Plus className="w-4 h-4 text-primary" />
                <span>Add Follow-Up Step</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Capacity Governor & Calendar Policy (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Dynamic Capacity Allocation Card */}
          <Card className="p-4 sm:p-5 border-border bg-surface-100 space-y-4 rounded-xl shadow-sm">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-text-main">Dynamic Capacity Allocation</h3>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Based on sequence expansion factor{" "}
              <span className="font-mono text-text-main font-semibold">Φ = {simulatedPhi.toFixed(2)}</span>, the
              mathematical steady-state equilibrium for your {stepCount}-step sequence balances outreach quota:
            </p>

            {/* Ratio Visualizer Bar (Strict Layer 3 Colors: Brand Orange vs Charcoal Slate) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-main font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span>New Leads:</span>
                  <span className="font-mono font-semibold text-text-main">{effectiveNewRatio}%</span>
                </span>
                <span className="text-text-secondary font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-surface-300 border border-border" />
                  <span>Follow-Ups:</span>
                  <span className="font-mono font-semibold text-text-secondary">{effectiveFuRatio}%</span>
                </span>
              </div>
              <div className="w-full h-3 bg-surface-200 rounded-full overflow-hidden flex border border-border">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${effectiveNewRatio}%` }}
                />
                <div
                  className="bg-surface-300 h-full transition-all duration-300"
                  style={{ width: `${effectiveFuRatio}%` }}
                />
              </div>
            </div>

            {/* Quota Targets Breakdown Wells (Layer 2) */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="bg-surface-200 p-3 rounded-lg border border-border/50">
                <span className="text-[10px] text-text-muted uppercase tracking-wider block">New Outreach</span>
                <div className="text-base font-semibold font-mono text-text-main mt-0.5">
                  ~{Math.round(effectiveNewRatio * 0.25)}{" "}
                  <span className="text-xs font-normal text-text-muted">/ day / inbox</span>
                </div>
                <span className="text-[11px] text-primary font-mono block mt-0.5">
                  ~{effectiveNewRatio} / day (4 inboxes)
                </span>
              </div>

              <div className="bg-surface-200 p-3 rounded-lg border border-border/50">
                <span className="text-[10px] text-text-muted uppercase tracking-wider block">Follow-Up Bumps</span>
                <div className="text-base font-semibold font-mono text-text-main mt-0.5">
                  ~{Math.round(effectiveFuRatio * 0.25)}{" "}
                  <span className="text-xs font-normal text-text-muted">/ day / inbox</span>
                </div>
                <span className="text-[11px] text-text-secondary font-mono block mt-0.5">
                  ~{effectiveFuRatio} / day (4 inboxes)
                </span>
              </div>
            </div>

            {/* Equilibrium Slider (Touch Friendly Hit-Area) */}
            <div className="space-y-2.5 pt-2 border-t border-border/50">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary font-medium">Equilibrium Bias</span>
                <span className="font-mono text-text-main text-xs font-semibold">
                  {capacityBias > 0
                    ? `+${Math.round(capacityBias * 100)}% New`
                    : capacityBias < 0
                    ? `${Math.round(capacityBias * 100)}% Follow-Up`
                    : "Exact Equilibrium"}
                </span>
              </div>
              <div className="py-2">
                <input
                  type="range"
                  min={-0.15}
                  max={0.15}
                  step={0.01}
                  value={capacityBias}
                  onChange={(e) => setCapacityBias(parseFloat(e.target.value))}
                  className="w-full accent-primary bg-surface-200 h-2 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>More Follow-Ups (-15%)</span>
                <span>Balanced (0%)</span>
                <span>More New (+15%)</span>
              </div>
            </div>

            {/* Fluid Spillover Note */}
            <div className="p-3 rounded-lg bg-surface-200 border border-border/50 flex items-start gap-2.5 text-xs text-text-secondary">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong className="text-text-main">Fluid Spillover Guarantee:</strong> If fewer follow-ups are due
                on any day, unused quota automatically rolls into new leads. Inboxes always send at their safe
                ceiling.
              </p>
            </div>
          </Card>

          {/* Calendar & Weekend Policy Card */}
          <Card className="p-4 sm:p-5 border-border bg-surface-100 space-y-3 rounded-xl shadow-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-text-main">Calendar & Weekend Policy</h3>
            </div>

            <div className="space-y-2.5">
              <label
                className={cn(
                  "flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all min-h-[52px]",
                  weekendPolicy === "SKIP_WEEKENDS"
                    ? "bg-surface-200 border-primary/50 text-text-main shadow-sm"
                    : "bg-surface-100 border-border text-text-secondary hover:bg-surface-200/50"
                )}
              >
                <input
                  type="radio"
                  name="weekendPolicy"
                  value="SKIP_WEEKENDS"
                  checked={weekendPolicy === "SKIP_WEEKENDS"}
                  onChange={() => setWeekendPolicy("SKIP_WEEKENDS")}
                  className="mt-1 accent-primary w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold block text-text-main">Skip Weekends (Recommended)</span>
                  <span className="text-[11px] text-text-muted block mt-0.5 leading-relaxed">
                    Follow-ups dispatch Monday through Friday during US Eastern business hours (9:00 AM – 5:00 PM).
                  </span>
                </div>
              </label>

              <label
                className={cn(
                  "flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all min-h-[52px]",
                  weekendPolicy === "SEND_7_DAYS"
                    ? "bg-surface-200 border-primary/50 text-text-main shadow-sm"
                    : "bg-surface-100 border-border text-text-secondary hover:bg-surface-200/50"
                )}
              >
                <input
                  type="radio"
                  name="weekendPolicy"
                  value="SEND_7_DAYS"
                  checked={weekendPolicy === "SEND_7_DAYS"}
                  onChange={() => setWeekendPolicy("SEND_7_DAYS")}
                  className="mt-1 accent-primary w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold block text-text-main">Send 7 Days a Week</span>
                  <span className="text-[11px] text-text-muted block mt-0.5 leading-relaxed">
                    Continuous scheduling across Saturdays and Sundays without calendar pause.
                  </span>
                </div>
              </label>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

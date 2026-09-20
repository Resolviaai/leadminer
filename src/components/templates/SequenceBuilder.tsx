"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Calendar,
  Sliders,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Mail,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
}

interface SequenceMetrics {
  phi: number;
  equilibriumNewRatio: number;
  equilibriumFollowUpRatio: number;
  stepCount: number;
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

      setSteps(
        data.steps && data.steps.length > 0
          ? data.steps
          : [
              { stepNumber: 1, templateId: data.templates[0]?.id || 1, delayDays: 0, delayHours: 0 },
              { stepNumber: 2, templateId: data.templates[0]?.id || 1, delayDays: 2, delayHours: 0 },
            ]
      );
      setTemplates(data.templates || []);
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
  // Cold-start prior simulation for live UI calculation
  let simulatedPhi = 1.0;
  let prevS = 1.0;
  for (let i = 2; i <= stepCount; i++) {
    prevS = prevS * 0.93; // ~7% exit rate
    simulatedPhi += prevS;
  }
  const baseNewRatio = Math.round((1.0 / simulatedPhi) * 100);
  const baseFuRatio = 100 - baseNewRatio;

  const effectiveNewRatio = Math.max(15, Math.min(85, Math.round(baseNewRatio + capacityBias * 100)));
  const effectiveFuRatio = 100 - effectiveNewRatio;

  // Add Step
  const handleAddStep = () => {
    const nextStepNum = steps.length + 1;
    const defaultTemplateId = templates[0]?.id || 1;
    setSteps([
      ...steps,
      {
        stepNumber: nextStepNum,
        templateId: defaultTemplateId,
        delayDays: 2,
        delayHours: 0,
      },
    ]);
  };

  // Remove Step
  const handleRemoveStep = (indexToRemove: number) => {
    if (steps.length <= 1) return;
    const filtered = steps.filter((_, idx) => idx !== indexToRemove);
    // Renumber steps
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
      <div className="flex items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span>Loading sequence configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/60 border border-white/10 p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium text-white tracking-tight">Sequence v2 Architecture</h2>
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-xs">
              Stateful Multi-Step
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ordered outreach state machine with cryptographic RFC 5322 in-thread bumping and dynamic quota balancing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center text-xs text-emerald-400 gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition active:scale-95 flex items-center gap-1.5"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save Sequence
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Left = Steps Builder, Right = Dynamic Equilibrium & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sequence Steps Builder (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-medium text-white">Outreach Steps ({steps.length})</h3>
            </div>
            <button
              onClick={handleAddStep}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" /> Add Follow-Up Step
            </button>
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => {
              const isInitial = idx === 0;
              const selectedTemplate = templates.find((t) => t.id === step.templateId);

              return (
                <Card
                  key={idx}
                  className="bg-slate-900/40 border border-white/10 p-4 rounded-xl relative hover:border-white/20 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                          isInitial
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        }`}
                      >
                        {step.stepNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white">
                            {isInitial ? "Initial Cold Outreach" : `Follow-Up #${step.stepNumber - 1}`}
                          </span>
                          {!isInitial && (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-cyan-400 border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0"
                            >
                              In-Thread Bump (Re:)
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {isInitial
                            ? "Sent upon lead qualification during US business hours."
                            : `Sent ${step.delayDays} ${
                                weekendPolicy === "SKIP_WEEKENDS" ? "business" : "calendar"
                              } day(s) after Step ${step.stepNumber - 1} if no reply.`}
                        </p>
                      </div>
                    </div>

                    {!isInitial && (
                      <button
                        onClick={() => handleRemoveStep(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                        title="Delete this follow-up step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Delay & Template Settings */}
                  <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {!isInitial && (
                      <div className="sm:col-span-4">
                        <label className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
                          Delay (Days)
                        </label>
                        <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={step.delayDays}
                            onChange={(e) =>
                              handleStepChange(idx, "delayDays", Math.max(1, parseInt(e.target.value) || 1))
                            }
                            className="bg-transparent text-xs text-white w-full outline-none focus:text-emerald-400"
                          />
                          <span className="text-[10px] text-slate-400">days</span>
                        </div>
                      </div>
                    )}

                    <div className={isInitial ? "sm:col-span-12" : "sm:col-span-8"}>
                      <label className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
                        Assigned Email Template
                      </label>
                      <select
                        value={step.templateId}
                        onChange={(e) => handleStepChange(idx, "templateId", parseInt(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500/50"
                      >
                        {templates.map((t) => (
                          <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                            {t.name} — {t.subject.slice(0, 35)}...
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedTemplate && (
                    <div className="mt-2 bg-black/30 p-2 rounded-lg text-[11px] border border-white/5 text-slate-400 truncate">
                      <span className="text-slate-300 font-medium mr-1">Subject Preview:</span>
                      {selectedTemplate.subject}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right: Dynamic Phi Equilibrium & Sequence Settings (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Dynamic Phi Capacity Card */}
          <Card className="bg-slate-900/60 border border-white/10 p-5 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-medium text-white">Dynamic Capacity Equilibrium</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Based on the <strong>Sequence Expansion Factor (Φ = {simulatedPhi.toFixed(2)})</strong>, the mathematical
              steady-state equilibrium for your {stepCount}-step sequence is:
            </p>

            {/* Split Visualizer Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-emerald-400">{effectiveNewRatio}% New Leads</span>
                <span className="text-cyan-400">{effectiveFuRatio}% Follow-Ups</span>
              </div>
              <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden flex border border-white/10">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${effectiveNewRatio}%` }}
                />
                <div
                  className="bg-cyan-500 h-full transition-all duration-300"
                  style={{ width: `${effectiveFuRatio}%` }}
                />
              </div>
            </div>

            {/* Quota Projection */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
              <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">New Outreach Target</span>
                <span className="text-sm font-semibold text-white font-mono mt-0.5 block">
                  ~{Math.round(effectiveNewRatio * 0.25)} / day / inbox
                </span>
                <span className="text-[10px] text-emerald-400/80 mt-0.5 block">
                  ~{effectiveNewRatio} / day (4 inboxes)
                </span>
              </div>
              <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Follow-Up Target</span>
                <span className="text-sm font-semibold text-white font-mono mt-0.5 block">
                  ~{Math.round(effectiveFuRatio * 0.25)} / day / inbox
                </span>
                <span className="text-[10px] text-cyan-400/80 mt-0.5 block">
                  ~{effectiveFuRatio} / day (4 inboxes)
                </span>
              </div>
            </div>

            {/* Deviation Slider */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Equilibrium Adjustment</span>
                <span className="font-mono text-emerald-400">
                  {capacityBias > 0 ? `+${Math.round(capacityBias * 100)}% New` : capacityBias < 0 ? `${Math.round(capacityBias * 100)}% Follow-Up` : "Exact Equilibrium"}
                </span>
              </div>
              <input
                type="range"
                min={-0.15}
                max={0.15}
                step={0.01}
                value={capacityBias}
                onChange={(e) => setCapacityBias(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>More Follow-Ups (-15%)</span>
                <span>Balanced (0%)</span>
                <span>More New Leads (+15%)</span>
              </div>
            </div>

            {/* Zero Wasted Quota Rule */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg text-xs text-slate-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Fluid Spillover Guarantee:</strong> If fewer follow-ups are due on any day, unused slots
                automatically convert to new leads. Your inboxes always send at their safe ceiling.
              </p>
            </div>
          </Card>

          {/* Calendar & Weekend Policy */}
          <Card className="bg-slate-900/60 border border-white/10 p-5 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-medium text-white">Calendar & Weekend Policy</h3>
            </div>

            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  weekendPolicy === "SKIP_WEEKENDS"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                    : "bg-black/30 border-white/5 text-slate-400 hover:border-white/10"
                }`}
              >
                <input
                  type="radio"
                  name="weekendPolicy"
                  value="SKIP_WEEKENDS"
                  checked={weekendPolicy === "SKIP_WEEKENDS"}
                  onChange={() => setWeekendPolicy("SKIP_WEEKENDS")}
                  className="mt-1 accent-emerald-500"
                />
                <div>
                  <span className="text-xs font-medium block">Skip Weekends (Recommended)</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Follow-ups only dispatch Monday through Friday during US Eastern business hours (9:00 AM – 5:00 PM).
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  weekendPolicy === "SEND_7_DAYS"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                    : "bg-black/30 border-white/5 text-slate-400 hover:border-white/10"
                }`}
              >
                <input
                  type="radio"
                  name="weekendPolicy"
                  value="SEND_7_DAYS"
                  checked={weekendPolicy === "SEND_7_DAYS"}
                  onChange={() => setWeekendPolicy("SEND_7_DAYS")}
                  className="mt-1 accent-emerald-500"
                />
                <div>
                  <span className="text-xs font-medium block">Send 7 Days a Week</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
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

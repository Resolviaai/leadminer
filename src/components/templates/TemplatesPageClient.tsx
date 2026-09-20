"use client";

import React, { useState } from "react";
import { FileText, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TemplatesManager } from "@/components/templates/TemplatesManager";
import { SequenceBuilder } from "@/components/templates/SequenceBuilder";

interface TemplateItem {
  id: number;
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
}

export function TemplatesPageClient({
  initialTemplates,
}: {
  initialTemplates: TemplateItem[];
}) {
  const [activeTab, setActiveTab] = useState<"templates" | "sequences">("templates");

  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl mx-auto w-full">
      {/* ── Top Unified Header Card with Native-Feel Segmented Tab Switcher ── */}
      <Card className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 border-border bg-surface-100">
        <div>
          <div className="flex items-center space-x-2">
            {activeTab === "templates" ? (
              <FileText className="w-5 h-5 text-primary shrink-0" />
            ) : (
              <Layers className="w-5 h-5 text-primary shrink-0" />
            )}
            <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
              {activeTab === "templates" ? "Email Templates" : "Follow-Up Sequences"}
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
            {activeTab === "templates"
              ? "Create and manage Spintax outreach templates. Merge tags personalize each email with verified channel data."
              : "Stateful multi-step follow-up sequences governed by the dynamic capacity equilibrium model."}
          </p>
        </div>

        {/* Segmented Control - Full width with 44px touch targets on mobile */}
        <div className="flex items-center p-1 bg-surface-200 border border-border rounded-xl w-full sm:w-auto shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={cn(
              "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.98] min-h-[42px] sm:min-h-0",
              activeTab === "templates"
                ? "bg-surface-100 text-text-main shadow-sm border border-border/80 font-semibold"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Templates</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-300 text-text-secondary">
              {initialTemplates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sequences")}
            className={cn(
              "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.98] min-h-[42px] sm:min-h-0",
              activeTab === "sequences"
                ? "bg-surface-100 text-text-main shadow-sm border border-border/80 font-semibold"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Sequences</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-semibold">
              v2
            </span>
          </button>
        </div>
      </Card>

      {/* ── Active Tab View ── */}
      {activeTab === "templates" ? (
        <TemplatesManager initialTemplates={initialTemplates} showPageHeader={false} />
      ) : (
        <SequenceBuilder />
      )}
    </div>
  );
}

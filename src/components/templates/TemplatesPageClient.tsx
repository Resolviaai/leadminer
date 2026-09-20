"use client";

import React, { useState } from "react";
import { FileText, Layers, Sparkles } from "lucide-react";
import { TemplatesManager } from "@/components/templates/TemplatesManager";
import { SequenceBuilder } from "@/components/templates/SequenceBuilder";

interface TemplateItem {
  id: number;
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
}

export function TemplatesPageClient({ initialTemplates }: { initialTemplates: TemplateItem[] }) {
  const [activeTab, setActiveTab] = useState<"templates" | "sequences">("templates");

  return (
    <div className="space-y-6">
      {/* Top Tab Switcher */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Outreach & Copy Intelligence</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage Spintax message templates and multi-step creator follow-up sequences.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === "templates"
                ? "bg-slate-800 text-white shadow-sm border border-white/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Email Templates</span>
          </button>

          <button
            onClick={() => setActiveTab("sequences")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === "sequences"
                ? "bg-slate-800 text-white shadow-sm border border-white/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Follow-Up Sequences</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "templates" ? (
        <TemplatesManager initialTemplates={initialTemplates} />
      ) : (
        <SequenceBuilder />
      )}
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Tag,
  Sparkles,
  ChevronDown,
  X,
  Split,
  MessageSquare,
  Flame,
  Check,
} from "lucide-react";
import {
  VARIABLES,
  SPINTAX_PRESETS,
  SPINTAX_CATEGORIES,
  SpintaxPreset,
} from "./spintax-presets";

interface TemplateInsertMenuProps {
  onInsert: (token: string) => void;
  targetName?: string;
  className?: string;
}

export function TemplateInsertMenu({
  onInsert,
  targetName,
  className = "",
}: TemplateInsertMenuProps) {
  const [openMenu, setOpenMenu] = useState<"variable" | "spin" | null>(null);
  const [selectedSpinCat, setSelectedSpinCat] = useState<string>("All");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenMenu(null);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenMenu(null);
      }
    }
    if (openMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [openMenu]);

  const handleSelect = (token: string) => {
    onInsert(token);
    setCopiedToken(token);
    setTimeout(() => {
      setCopiedToken(null);
      setOpenMenu(null);
    }, 150);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center gap-1 text-xs select-none ${className}`}
    >
      {/* ── <> Variable Button ── */}
      <button
        type="button"
        onClick={() => setOpenMenu((curr) => (curr === "variable" ? null : "variable"))}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all active:scale-95 ${
          openMenu === "variable"
            ? "bg-primary/20 text-primary border border-primary/40 font-semibold"
            : "text-text-muted hover:text-text-main hover:bg-surface-300 border border-transparent hover:border-border"
        }`}
        title={`Insert personalized variable into ${targetName || "field"}`}
      >
        <Tag className="w-3 h-3 text-primary shrink-0" />
        <span className="font-mono text-[10px]">&lt;&gt;</span>
        <span>Variable</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-150 ${
            openMenu === "variable" ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* ── <> Spin Button ── */}
      <button
        type="button"
        onClick={() => setOpenMenu((curr) => (curr === "spin" ? null : "spin"))}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all active:scale-95 ${
          openMenu === "spin"
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold"
            : "text-text-muted hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20"
        }`}
        title={`Insert Spintax word rotation or A/B test into ${targetName || "field"}`}
      >
        <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
        <span className="font-mono text-[10px]">&lt;&gt;</span>
        <span>Spin</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-150 ${
            openMenu === "spin" ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── Dropdown Popover: Variables ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {openMenu === "variable" && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-72 sm:w-80 rounded-xl bg-surface-100 border border-border/90 shadow-2xl p-2.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-border/50 px-1">
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-text-main uppercase tracking-wider">
                Insert Merge Tag
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpenMenu(null)}
              className="p-1 rounded text-text-muted hover:text-text-main hover:bg-surface-300"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1">
            {VARIABLES.map((v) => (
              <button
                key={v.token}
                type="button"
                onClick={() => handleSelect(v.token)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-surface-200 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] font-mono font-semibold text-primary group-hover:text-brand-accent">
                      {v.token}
                    </code>
                    <span className="text-[10px] text-text-muted truncate">
                      {v.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-secondary mt-0.5 truncate">
                    {v.desc}
                  </p>
                </div>
                {copiedToken === v.token ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <span className="text-[10px] text-text-muted font-mono opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    Insert
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── Dropdown Popover: Spintax & A/B Tests ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {openMenu === "spin" && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-80 sm:w-96 rounded-xl bg-surface-100 border border-border/90 shadow-2xl p-2.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50 px-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold text-text-main uppercase tracking-wider">
                Insert Spintax &amp; A/B
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpenMenu(null)}
              className="p-1 rounded text-text-muted hover:text-text-main hover:bg-surface-300"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface-300/80 border border-border/50 mb-2 overflow-x-auto no-scrollbar">
            {SPINTAX_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedSpinCat(cat)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all shrink-0 ${
                  selectedSpinCat === cat
                    ? "bg-emerald-500 text-white font-semibold shadow-xs"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Presets List */}
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {SPINTAX_PRESETS.filter(
              (p) => selectedSpinCat === "All" || p.category === selectedSpinCat
            ).map((s: SpintaxPreset) => {
              const isAB = s.category === "AB Test";
              const isOpening = s.category === "Opening";
              const isClosing = s.category === "Closing";
              return (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handleSelect(s.token)}
                  className={`w-full text-left p-2 rounded-lg border transition-all flex flex-col gap-1 group cursor-pointer ${
                    isAB
                      ? "bg-amber-500/5 hover:bg-amber-500/15 border-amber-500/20 hover:border-amber-500/40"
                      : isOpening
                      ? "bg-emerald-500/5 hover:bg-emerald-500/15 border-emerald-500/20 hover:border-emerald-500/40"
                      : isClosing
                      ? "bg-blue-500/5 hover:bg-blue-500/15 border-blue-500/20 hover:border-blue-500/40"
                      : "bg-surface-200/80 hover:bg-surface-300 border-border/60 hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[11px] font-semibold truncate ${
                        isAB
                          ? "text-amber-300"
                          : isOpening
                          ? "text-emerald-400"
                          : isClosing
                          ? "text-blue-400"
                          : "text-text-main"
                      }`}
                    >
                      {s.label}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1 py-0.2 rounded shrink-0 uppercase font-medium ${
                        isAB
                          ? "bg-amber-500/20 text-amber-300"
                          : isOpening
                          ? "bg-emerald-500/20 text-emerald-400"
                          : isClosing
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-surface-300 text-text-muted"
                      }`}
                    >
                      {s.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-secondary leading-tight line-clamp-1">
                    {s.description}
                  </p>
                  <code className="text-[9px] font-mono text-text-muted truncate w-full block group-hover:text-text-main transition-colors">
                    {s.token}
                  </code>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

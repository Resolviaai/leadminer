"use client";

import React, { useEffect } from "react";
import {
  X,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  Copy,
  Check,
  RotateCcw,
  CheckCircle2,
  Edit3,
  Ban,
  Share2,
  Film,
  Eye,
  Users,
  MessageSquare,
  Instagram,
  Twitter,
  Linkedin,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCountryDisplayName } from "@/config/countries";

export interface SocialLink {
  type: string;
  value: string;
}

export interface LeadEmailItem {
  id?: number;
  email: string;
  isPrimary?: boolean;
  emailStatus: string | null;
  role?: string;
  opportunityTier?: string | null;
  priorityScore?: number | null;
  verificationReason?: string | null;
  source?: string;
}

export interface InspectorLead {
  id: number;
  channelId: string;
  channelTitle: string;
  channelUrl: string;
  customUrl?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  subscriberCount: number | null;
  videoCount?: number | null;
  viewCount?: number | null;
  publishedAt?: Date | string | null;
  qualificationStatus: string;
  outreachStatus: string;
  suppressionStatus?: boolean;
  email: string | null;
  emailStatus: string | null;
  emailRole?: string | null;
  opportunityTier?: string | null;
  priorityScore?: number | null;
  phone?: string | null;
  website?: string | null;
  contactPageUrl?: string | null;
  country?: string | null;
  discoveredAt?: Date | string | null;
  sourceKeyword?: string | null;
  category?: string | null;
  additionalEmails?: string[];
  allEmails?: LeadEmailItem[];
  socialLinks?: SocialLink[];
}

interface Props {
  lead: InspectorLead | null;
  onClose: () => void;
  onVerify?: (id: number) => void;
  onReprocess?: (id: number) => void;
  onEdit?: (lead: InspectorLead) => void;
  onSuppress?: (id: number) => void;
  onSetPrimary?: (leadId: number, email: string, contactId?: number) => Promise<void> | void;
  actionLoadingId?: number | null;
}

export function LeadInspectorDrawer({
  lead,
  onClose,
  onVerify,
  onReprocess,
  onEdit,
  onSuppress,
  onSetPrimary,
  actionLoadingId,
}: Props) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = React.useState<number | string | null>(null);

  const handleSetPrimaryClick = async (email: string, contactId?: number) => {
    if (!onSetPrimary || !lead) return;
    const key = contactId ?? email;
    setSettingPrimaryId(key);
    try {
      await onSetPrimary(lead.id, email, contactId);
    } catch (err) {
      console.error("Failed to set primary email", err);
    } finally {
      setSettingPrimaryId(null);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!lead) return null;

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatNumber = (num?: number | null) => {
    if (num == null) return "0";
    return num.toLocaleString();
  };

  const formatCompact = (num?: number | null) => {
    if (num == null) return "0";
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getEmailBadge = (status: string | null) => {
    switch (status) {
      case "VALID":
      case "DOMAIN_VALID":
      case "MAILBOX_VERIFIED":
        return <Badge variant="success">VERIFIED</Badge>;
      case "DISPOSABLE":
      case "INVALID":
        return <Badge variant="destructive">INVALID</Badge>;
      case "RISKY":
        return <Badge variant="warning">RISKY</Badge>;
      default:
        return <Badge variant="secondary">UNVERIFIED</Badge>;
    }
  };

  const getEmailRoleBadge = (role?: string | null) => {
    if (!role) return null;
    const r = role.toUpperCase();
    switch (r) {
      case "BUSINESS":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            BUSINESS
          </span>
        );
      case "MANAGEMENT":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            MGMT
          </span>
        );
      case "DIRECT":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            DIRECT
          </span>
        );
      case "SALES":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            SALES
          </span>
        );
      case "PRESS":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20">
            PRESS
          </span>
        );
      case "SUPPORT":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            SUPPORT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-slate-300 border border-white/10">
            {r}
          </span>
        );
    }
  };

  const getOpportunityTierBadge = (tier?: string | null, score?: number | null) => {
    if (!tier) return null;
    const t = tier.toUpperCase();
    const label = score !== undefined && score !== null ? `${t} (${score} pts)` : t;
    switch (t) {
      case "A1":
        return (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            title="Tier A1: Top opportunity — scheduled first"
          >
            {label}
          </span>
        );
      case "A2":
        return (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30"
            title="Tier A2: Strong opportunity — scheduled when A1 pool depleted"
          >
            {label}
          </span>
        );
      case "A3":
        return (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30"
            title="Tier A3: Good usable opportunity — fallback when A1+A2 depleted"
          >
            {label}
          </span>
        );
      case "A4":
        return (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
            title="Tier A4: Acceptable fallback opportunity"
          >
            {label}
          </span>
        );
      case "A5":
        return (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30"
            title="Tier A5: Reserve / uncertain — preserved for future verification"
          >
            {label}
          </span>
        );
      case "A6":
        return (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30"
            title="Tier A6: Hard negative — permanently excluded"
          >
            {label}
          </span>
        );
      default:
        return null;
    }
  };

  const getSocialIcon = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes("INSTA")) return <Instagram className="w-3.5 h-3.5" />;
    if (t.includes("TWIT") || t.includes("X")) return <Twitter className="w-3.5 h-3.5" />;
    if (t.includes("LINKED")) return <Linkedin className="w-3.5 h-3.5" />;
    if (t.includes("DISCORD")) return <MessageSquare className="w-3.5 h-3.5" />;
    return <Share2 className="w-3.5 h-3.5" />;
  };

  const getSocialUrl = (type: string, value: string) => {
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    const clean = value.replace(/^@/, "");
    const t = type.toUpperCase();
    if (t.includes("INSTA")) return `https://instagram.com/${clean}`;
    if (t.includes("TWIT") || t.includes("X")) return `https://x.com/${clean}`;
    if (t.includes("TIKTOK")) return `https://tiktok.com/@${clean}`;
    if (t.includes("LINKED")) return `https://linkedin.com/in/${clean}`;
    return value;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container (Desktop: Slide-over right, Mobile: Bottom Sheet / Full screen) */}
      <aside
        className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md md:max-w-lg bg-surface-100 border-l border-border shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200 ease-out"
        role="dialog"
        aria-label={`Lead details for ${lead.channelTitle}`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-start justify-between gap-3 bg-surface-200/50 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            {lead.thumbnailUrl ? (
              <img
                src={lead.thumbnailUrl}
                alt={lead.channelTitle}
                className="w-12 h-12 rounded-xl object-cover border border-border shrink-0 bg-surface-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-base shrink-0">
                {lead.channelTitle.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-base font-semibold text-text-main truncate">
                  {lead.channelTitle}
                </h2>
                {lead.country && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 font-mono text-text-muted gap-1">
                    {getCountryDisplayName(lead.country)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
                {lead.customUrl && <span className="text-primary font-medium">{lead.customUrl}</span>}
                <a
                  href={lead.channelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-text-main transition-colors"
                >
                  <span>YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-main p-1.5 rounded-lg hover:bg-surface-200 cursor-pointer transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Pipeline Lifecycle Stepper */}
          {(() => {
            const isEnriched = Boolean(
              lead.email ||
                (lead.allEmails && lead.allEmails.length > 0) ||
                lead.phone ||
                lead.website ||
                lead.contactPageUrl
            );
            const isVerified = Boolean(
              ["VALID", "DOMAIN_VALID", "MAILBOX_VERIFIED"].includes(lead.emailStatus || "") ||
                (lead.allEmails &&
                  lead.allEmails.some((e) =>
                    ["VALID", "DOMAIN_VALID", "MAILBOX_VERIFIED"].includes(e.emailStatus || "")
                  ))
            );
            const isQualified = lead.qualificationStatus === "QUALIFIED";
            const isDisqualified = lead.qualificationStatus === "DISQUALIFIED";
            const isContacted = ["CONTACTED", "REPLIED", "BOUNCED"].includes(lead.outreachStatus);
            const isReady =
              isQualified &&
              !lead.suppressionStatus &&
              (lead.outreachStatus === "QUEUED" || isContacted || isVerified);

            const stages = [
              { key: "discovered", label: "Discovered", completed: true, active: false, failed: false },
              { key: "enriched", label: "Enriched", completed: isEnriched, active: !isEnriched, failed: false },
              { key: "verified", label: "Verified", completed: isVerified, active: isEnriched && !isVerified, failed: false },
              {
                key: "qualified",
                label: isDisqualified ? "Disqualified" : "Qualified",
                completed: isQualified,
                active: isVerified && !isQualified && !isDisqualified,
                failed: isDisqualified,
              },
              { key: "ready", label: "Ready", completed: isReady, active: isQualified && !isReady, failed: false },
              { key: "contacted", label: "Contacted", completed: isContacted, active: isReady && !isContacted, failed: false },
            ];

            return (
              <div className="p-3 rounded-xl bg-surface-200/60 border border-border/60">
                <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                  <span>Pipeline Lifecycle</span>
                  <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-4.5">
                    {lead.outreachStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-1 overflow-x-auto pb-0.5">
                  {stages.map((stage, idx) => (
                    <React.Fragment key={stage.key}>
                      <div className="flex flex-col items-center gap-1 shrink-0 min-w-[46px] text-center">
                        <div
                          className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                            stage.failed
                              ? "bg-rose-500/15 border-rose-500/40 text-rose-400"
                              : stage.completed
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                              : stage.active
                              ? "bg-primary/20 border-primary text-primary shadow-xs ring-2 ring-primary/20"
                              : "bg-surface-100 border-border/80 text-text-muted"
                          }`}
                        >
                          {stage.failed ? (
                            <X className="w-2.5 h-2.5 stroke-[2.5]" />
                          ) : stage.completed ? (
                            <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                          ) : (
                            <span className="text-[9px]">{idx + 1}</span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-medium leading-none ${
                            stage.failed
                              ? "text-rose-400"
                              : stage.completed
                              ? "text-text-main font-semibold"
                              : stage.active
                              ? "text-primary font-semibold"
                              : "text-text-muted"
                          }`}
                        >
                          {stage.label}
                        </span>
                      </div>
                      {idx < stages.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 min-w-[8px] rounded-full self-start mt-2.5 transition-colors ${
                            stage.completed && stages[idx + 1].completed
                              ? "bg-emerald-500/40"
                              : stage.completed
                              ? "bg-primary/40"
                              : "bg-border/60"
                          }`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Quick Metrics (Layer 2 recessed cards) */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl bg-surface-200/80 border border-border/50 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-text-muted mb-0.5">
                <Users className="w-3 h-3" />
                <span>Subscribers</span>
              </div>
              <span className="font-mono text-sm font-bold text-text-main tabular-nums">
                {formatCompact(lead.subscriberCount)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-200/80 border border-border/50 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-text-muted mb-0.5">
                <Film className="w-3 h-3" />
                <span>Videos</span>
              </div>
              <span className="font-mono text-sm font-bold text-text-main tabular-nums">
                {formatNumber(lead.videoCount)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-200/80 border border-border/50 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-text-muted mb-0.5">
                <Eye className="w-3 h-3" />
                <span>Total Views</span>
              </div>
              <span className="font-mono text-sm font-bold text-text-main tabular-nums">
                {formatCompact(lead.viewCount)}
              </span>
            </div>
          </div>

          {/* Contact Matrix */}
          <div className="p-3.5 rounded-xl bg-surface-200/60 border border-border/60 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                Contact & Social Channels
              </span>
              {lead.contactPageUrl && (
                <a
                  href={lead.contactPageUrl.startsWith("http") ? lead.contactPageUrl : `https://${lead.contactPageUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                  title="Direct contact form detected"
                >
                  <Globe className="w-3 h-3 shrink-0" />
                  <span>Contact Form Available</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                </a>
              )}
            </div>

            {/* Email Inboxes Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted text-[11px] font-medium">Discovered Inboxes</span>
                {lead.allEmails && lead.allEmails.length > 0 && (
                  <span className="text-[10px] text-text-muted font-mono">{lead.allEmails.length} found</span>
                )}
              </div>

              {lead.allEmails && lead.allEmails.length > 0 ? (
                <div className="space-y-1.5">
                  {lead.allEmails.map((item, idx) => (
                    <div
                      key={item.id ?? idx}
                      className={`p-2.5 rounded-lg border text-xs transition-colors ${
                        item.isPrimary
                          ? "bg-surface-100 border-primary/30 shadow-xs"
                          : "bg-surface-100/60 border-border/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.isPrimary ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/15 text-primary border border-primary/25 tracking-wide">
                              PRIMARY
                            </span>
                          ) : onSetPrimary ? (
                            <button
                              type="button"
                              disabled={settingPrimaryId === (item.id ?? item.email)}
                              onClick={() => handleSetPrimaryClick(item.email, item.id)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-surface-200/90 hover:bg-primary/15 hover:text-primary border border-border/80 text-text-muted transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                              title="Set as primary outreach inbox"
                            >
                              {settingPrimaryId === (item.id ?? item.email) ? (
                                <RotateCcw className="w-2.5 h-2.5 animate-spin" />
                              ) : (
                                <Star className="w-2.5 h-2.5 text-amber-400" />
                              )}
                              <span>Set Primary</span>
                            </button>
                          ) : null}
                          {item.opportunityTier && getOpportunityTierBadge(item.opportunityTier, item.priorityScore)}
                          {getEmailRoleBadge(item.role)}
                          {item.source && (
                            <span className="text-[9px] text-text-muted font-mono bg-white/5 px-1 py-0.5 rounded border border-white/5">
                              src: {item.source}
                            </span>
                          )}
                        </div>
                        <div className="shrink-0">{getEmailBadge(item.emailStatus)}</div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Mail className="w-3.5 h-3.5 text-text-muted shrink-0" />
                          <span className="font-mono text-xs text-text-main truncate select-all">{item.email}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.email, `email_${idx}`)}
                          className="text-text-muted hover:text-text-main p-1 rounded cursor-pointer shrink-0 transition-colors"
                          title="Copy email"
                        >
                          {copiedField === `email_${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {item.verificationReason && (
                        <div className="mt-1 text-[10px] text-text-muted/70 truncate font-mono" title={item.verificationReason}>
                          {item.verificationReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : lead.email ? (
                <div className="space-y-1.5">
                  <div className="p-2.5 rounded-lg bg-surface-100 border border-primary/30 text-xs">
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/15 text-primary border border-primary/25">
                          PRIMARY
                        </span>
                        {getEmailRoleBadge(lead.emailRole)}
                      </div>
                      <div className="shrink-0">{getEmailBadge(lead.emailStatus)}</div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-text-muted shrink-0" />
                        <span className="font-mono text-xs text-text-main truncate select-all">{lead.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(lead.email!, "email_primary")}
                        className="text-text-muted hover:text-text-main p-1 rounded cursor-pointer shrink-0 transition-colors"
                        title="Copy email"
                      >
                        {copiedField === "email_primary" ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {lead.additionalEmails && lead.additionalEmails.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-border/50">
                      <span className="text-[10px] text-text-muted">Secondary Emails</span>
                      {lead.additionalEmails.map((email, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-1.5 rounded bg-surface-100 text-xs border border-border/60"
                        >
                          <span className="font-mono text-[11px] text-text-secondary truncate">{email}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {onSetPrimary && (
                              <button
                                type="button"
                                disabled={settingPrimaryId === email}
                                onClick={() => handleSetPrimaryClick(email)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-surface-200/90 hover:bg-primary/15 hover:text-primary border border-border/80 text-text-muted transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                title="Set as primary outreach inbox"
                              >
                                {settingPrimaryId === email ? (
                                  <RotateCcw className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <Star className="w-2.5 h-2.5 text-amber-400" />
                                )}
                                <span>Set Primary</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => copyToClipboard(email, `email_sec_${idx}`)}
                              className="text-text-muted hover:text-text-main p-0.5 cursor-pointer"
                            >
                              {copiedField === `email_sec_${idx}` ? (
                                <Check className="w-3 h-3 text-success" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-surface-100 border border-dashed border-border text-center text-xs text-text-muted">
                  No email address discovered yet
                </div>
              )}
            </div>

            {/* Website & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/50">
              {/* Website */}
              <div>
                <span className="text-[10px] text-text-muted block mb-0.5">Website</span>
                {lead.website || lead.contactPageUrl ? (
                  <div className="space-y-1">
                    {lead.website && (
                      <a
                        href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate"
                      >
                        <Globe className="w-3 h-3 shrink-0" />
                        <span className="truncate">{lead.website}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    )}
                    {lead.contactPageUrl && (
                      <a
                        href={lead.contactPageUrl.startsWith("http") ? lead.contactPageUrl : `https://${lead.contactPageUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline truncate"
                      >
                        <Globe className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">Contact Form</span>
                        <ExternalLink className="w-2 h-2 shrink-0" />
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-text-muted">None detected</span>
                )}
              </div>

              {/* Phone */}
              <div>
                <span className="text-[10px] text-text-muted block mb-0.5">Phone / WhatsApp</span>
                {lead.phone ? (
                  <div className="flex items-center justify-between gap-1 text-xs">
                    <span className="font-mono text-text-main">{lead.phone}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(lead.phone!, "phone")}
                      className="text-text-muted hover:text-text-main p-0.5 cursor-pointer"
                    >
                      {copiedField === "phone" ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-text-muted">None detected</span>
                )}
              </div>
            </div>

            {/* Social Links Chips */}
            {lead.socialLinks && lead.socialLinks.length > 0 && (
              <div className="pt-2 border-t border-border/50">
                <span className="text-[10px] text-text-muted block mb-1.5">Social Profiles</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {lead.socialLinks.map((s, idx) => (
                    <a
                      key={idx}
                      href={getSocialUrl(s.type, s.value)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-100 hover:bg-surface-300 border border-border text-xs text-text-main transition-colors cursor-pointer"
                    >
                      {getSocialIcon(s.type)}
                      <span className="capitalize">{s.type.toLowerCase()}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-text-muted" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Full Channel Description / Bio */}
          <div className="p-3.5 rounded-xl bg-surface-200/60 border border-border/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                Channel Description & Bio
              </span>
              {lead.description && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(lead.description!, "bio")}
                  className="text-xs text-text-muted hover:text-text-main inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === "bio" ? (
                    <>
                      <Check className="w-3 h-3 text-success" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {lead.description ? (
              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto pr-2 rounded bg-surface-100/60 p-2.5 border border-border/40 scrollbar-thin">
                {lead.description}
              </p>
            ) : (
              <p className="text-xs text-text-muted italic">No bio or description provided by creator.</p>
            )}
          </div>

          {/* Discovery Provenance */}
          <div className="p-3.5 rounded-xl bg-surface-200/60 border border-border/60 space-y-2 text-xs">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
              Discovery Metadata
            </span>
            <div className="grid grid-cols-2 gap-2 text-text-secondary">
              <div>
                <span className="text-[10px] text-text-muted block">Source Keyword</span>
                <span className="font-medium text-text-main">{lead.sourceKeyword || "Autonomous"}</span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block">Category</span>
                <span>{lead.category || "General"}</span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block">Discovered</span>
                <span>{lead.discoveredAt ? new Date(lead.discoveredAt).toLocaleDateString() : "Unknown"}</span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block">Pipeline Status</span>
                <span className="font-medium text-text-main">{lead.qualificationStatus}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-border/40 flex items-center justify-between">
                <span className="text-[10px] text-text-muted">Target Location / Country</span>
                <span className="font-medium text-text-main text-[11px] font-mono">
                  {lead.country ? getCountryDisplayName(lead.country) : "Global / Not Specified"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-border bg-surface-200/70 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {onReprocess && (
              <Button
                size="sm"
                variant="outline"
                disabled={actionLoadingId === lead.id}
                onClick={() => onReprocess(lead.id)}
                className="h-8 px-2.5 text-xs gap-1.5 active:scale-95 transition-transform"
                title="Reprocess website & contacts"
              >
                <RotateCcw className={`w-3 h-3 ${actionLoadingId === lead.id ? "animate-spin" : ""}`} />
                <span>Reprocess</span>
              </Button>
            )}

            {lead.email && onVerify && (
              <Button
                size="sm"
                variant="outline"
                disabled={actionLoadingId === lead.id}
                onClick={() => onVerify(lead.id)}
                className="h-8 px-2.5 text-xs gap-1.5 active:scale-95 transition-transform"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Verify</span>
              </Button>
            )}

            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(lead)}
                className="h-8 px-2.5 text-xs gap-1.5 active:scale-95 transition-transform"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </Button>
            )}
          </div>

          {onSuppress && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSuppress(lead.id)}
              className="h-8 px-2.5 text-xs text-text-muted hover:text-danger gap-1"
            >
              <Ban className="w-3 h-3" />
              <span>{lead.suppressionStatus ? "Unsuppress" : "Suppress"}</span>
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}

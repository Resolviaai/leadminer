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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCountryDisplayName } from "@/config/countries";

export interface SocialLink {
  type: string;
  value: string;
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
  phone?: string | null;
  website?: string | null;
  contactPageUrl?: string | null;
  country?: string | null;
  discoveredAt?: Date | string | null;
  sourceKeyword?: string | null;
  category?: string | null;
  additionalEmails?: string[];
  socialLinks?: SocialLink[];
}

interface Props {
  lead: InspectorLead | null;
  onClose: () => void;
  onVerify?: (id: number) => void;
  onReprocess?: (id: number) => void;
  onEdit?: (lead: InspectorLead) => void;
  onSuppress?: (id: number) => void;
  actionLoadingId?: number | null;
}

export function LeadInspectorDrawer({
  lead,
  onClose,
  onVerify,
  onReprocess,
  onEdit,
  onSuppress,
  actionLoadingId,
}: Props) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

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
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
              Contact & Social Channels
            </span>

            {/* Primary Email */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted text-[11px]">Primary Email</span>
                {getEmailBadge(lead.emailStatus)}
              </div>
              {lead.email ? (
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-100 border border-border">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-mono text-xs text-text-main truncate select-all">{lead.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(lead.email!, "email")}
                    className="text-text-muted hover:text-text-main p-1 rounded cursor-pointer shrink-0"
                    title="Copy email"
                  >
                    {copiedField === "email" ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-surface-100 border border-dashed border-border text-center text-xs text-text-muted">
                  No email address discovered yet
                </div>
              )}
            </div>

            {/* Additional Emails */}
            {lead.additionalEmails && lead.additionalEmails.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-border/50">
                <span className="text-[10px] text-text-muted">Secondary Emails</span>
                <div className="space-y-1">
                  {lead.additionalEmails.map((email, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-1.5 rounded bg-surface-100 text-xs border border-border/60"
                    >
                      <span className="font-mono text-[11px] text-text-secondary truncate">{email}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(email, `email_${idx}`)}
                        className="text-text-muted hover:text-text-main p-0.5 cursor-pointer"
                      >
                        {copiedField === `email_${idx}` ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Website & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/50">
              {/* Website */}
              <div>
                <span className="text-[10px] text-text-muted block mb-0.5">Website</span>
                {lead.website || lead.contactPageUrl ? (
                  <a
                    href={lead.website || lead.contactPageUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate"
                  >
                    <Globe className="w-3 h-3 shrink-0" />
                    <span className="truncate">{lead.website || lead.contactPageUrl}</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  </a>
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

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Plus,
  Clock,
  CheckCircle2,
  Unlink,
  RotateCw,
  Trash2,
  ShieldAlert,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface GmailAccountItem {
  id: number;
  email: string;
  status: "ACTIVE" | "PAUSED" | "QUOTA_EXCEEDED" | "AUTH_ERROR" | "DISABLED" | "DISCONNECTED";
  dailyLimit: number;
  sentToday: number;
  lastSendAt: string | Date | null;
  createdAt: string | Date;
}

interface Props {
  initialAccounts: GmailAccountItem[];
  googleClientId: string;
  googleRedirectUri: string;
}

export function GmailAccountsClient({
  initialAccounts,
  googleClientId,
  googleRedirectUri,
}: Props) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<GmailAccountItem[]>(initialAccounts);
  const [modalAccount, setModalAccount] = useState<GmailAccountItem | null>(null);
  const [isPermanent, setIsPermanent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeCount = accounts.filter((a) => a.status === "ACTIVE").length;
  const totalSentToday = accounts.reduce((sum, acc) => sum + (acc.sentToday || 0), 0);
  const totalCapacity = accounts.reduce((sum, acc) => sum + (acc.dailyLimit || 0), 0);

  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${
    googleClientId || "PENDING"
  }&redirect_uri=${encodeURIComponent(
    googleRedirectUri
  )}&response_type=code&scope=https://www.googleapis.com/auth/gmail.send%20https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent`;

  const handleOpenDisconnectModal = (account: GmailAccountItem, permanentDefault = false) => {
    setModalAccount(account);
    setIsPermanent(permanentDefault);
    setErrorMessage(null);
  };

  const handleConfirmDisconnect = async () => {
    if (!modalAccount) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/gmail/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: modalAccount.id,
          permanent: isPermanent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to disconnect Gmail account");
      }

      if (data.action === "DELETED") {
        setAccounts((prev) => prev.filter((a) => a.id !== modalAccount.id));
      } else {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === modalAccount.id ? { ...a, status: "DISCONNECTED" as const } : a
          )
        );
      }

      setModalAccount(null);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header Card */}
      <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border">
        <div>
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-primary" />
            <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
              Connected Gmail Inboxes
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage sending inboxes, daily quotas, rotation health, and disconnect or remove OAuth authorizations.
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <a href={oauthUrl} className="block w-full sm:w-auto">
            <Button
              size="sm"
              variant="default"
              className="gap-2 w-full sm:w-auto h-11 px-4 text-xs font-semibold active:scale-[0.98] transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Connect Gmail Inbox</span>
            </Button>
          </a>
        </div>
      </Card>

      {/* Summary Chips */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
          <Card className="p-2.5 sm:p-3.5 text-center">
            <span className="text-[9px] sm:text-xs text-text-muted block">Inboxes</span>
            <span className="text-sm sm:text-lg font-bold font-mono text-text-main">
              {activeCount}{" "}
              <span className="text-[9px] sm:text-[10px] text-emerald-400 font-normal">active</span>
            </span>
          </Card>
          <Card className="p-2.5 sm:p-3.5 text-center">
            <span className="text-[9px] sm:text-xs text-text-muted block">Sent Today</span>
            <span className="text-sm sm:text-lg font-bold font-mono text-primary tabular-nums">
              {totalSentToday}
            </span>
          </Card>
          <Card className="p-2.5 sm:p-3.5 text-center">
            <span className="text-[9px] sm:text-xs text-text-muted block">Daily Capacity</span>
            <span className="text-sm sm:text-lg font-bold font-mono text-text-main tabular-nums">
              {totalCapacity}
            </span>
          </Card>
        </div>
      )}

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {accounts.length === 0 ? (
          <Card className="col-span-full p-10 text-center text-xs text-text-muted space-y-3">
            <Mail className="w-8 h-8 text-text-muted mx-auto opacity-40" />
            <p className="font-semibold text-text-secondary text-sm">No Gmail accounts connected</p>
            <p className="text-[11px] text-text-muted max-w-sm mx-auto">
              Connect an inbox via Google OAuth to enable live outreach.
            </p>
          </Card>
        ) : (
          accounts.map((acc) => {
            const isDisconnected = acc.status === "DISCONNECTED";
            const todayTarget = acc.dailyLimit || 25;
            const remaining = Math.max(0, todayTarget - (acc.sentToday || 0));
            const letter = (acc.email[0] || "G").toUpperCase();

            return (
              <Card
                key={acc.id}
                className={`p-4 sm:p-5 space-y-4 transition-colors ${
                  isDisconnected
                    ? "opacity-60 border-border/50 bg-surface-100/50"
                    : "hover:border-primary/40"
                }`}
              >
                {/* Account Header */}
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0 ${
                        isDisconnected ? "bg-slate-700 text-slate-300" : "bg-emerald-600/90"
                      }`}
                    >
                      {letter}
                    </div>
                    <div className="min-w-0">
                      <h2
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          isDisconnected ? "text-text-muted line-through" : "text-text-main"
                        }`}
                        title={acc.email}
                      >
                        {acc.email}
                      </h2>
                      <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                        {isDisconnected ? (
                          <span className="text-text-muted">OAuth Revoked</span>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>OAuth 2.0 Connected</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={
                        acc.status === "ACTIVE"
                          ? "success"
                          : acc.status === "DISCONNECTED"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-[10px] font-mono uppercase"
                    >
                      {acc.status}
                    </Badge>
                  </div>
                </div>

                {/* Quota Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-text-secondary">
                    <span>Today&apos;s Quota Progress</span>
                    <span className="font-mono tabular-nums font-medium text-text-main">
                      {acc.sentToday} / {todayTarget} emails
                    </span>
                  </div>
                  <Progress value={acc.sentToday} max={todayTarget} className="h-2" />
                </div>

                {/* 3 Metric Chips */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-surface-200 border border-border/60">
                    <span className="text-[9px] sm:text-[10px] text-text-muted block">Sent Today</span>
                    <span className="text-xs font-mono font-bold text-primary tabular-nums">
                      {acc.sentToday}
                    </span>
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-lg bg-surface-200 border border-border/60">
                    <span className="text-[9px] sm:text-[10px] text-text-muted block">Remaining</span>
                    <span className="text-xs font-mono font-bold text-text-main tabular-nums">
                      {remaining}
                    </span>
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-lg bg-surface-200 border border-border/60">
                    <span className="text-[9px] sm:text-[10px] text-text-muted block">Daily Limit</span>
                    <span className="text-xs font-mono font-bold text-text-muted tabular-nums">
                      {acc.dailyLimit}
                    </span>
                  </div>
                </div>

                {/* Footer: Last Dispatch & Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border/60 text-[11px]">
                  <div className="flex items-center gap-1 text-text-muted">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {acc.lastSendAt ? new Date(acc.lastSendAt).toLocaleDateString() : "Never"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isDisconnected ? (
                      <>
                        <a href={oauthUrl}>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 px-2.5 text-[11px] gap-1.5 active:scale-95"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>Reconnect</span>
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDisconnectModal(acc, true)}
                          className="h-8 px-2 text-[11px] text-danger hover:text-danger hover:bg-danger/10 active:scale-95"
                          title="Permanently remove record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDisconnectModal(acc, false)}
                        className="h-8 px-2.5 text-[11px] gap-1.5 text-text-secondary hover:text-danger hover:bg-danger/10 active:scale-95 transition-colors"
                      >
                        <Unlink className="w-3.5 h-3.5 text-danger" />
                        <span>Disconnect</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Disconnect / Remove Confirmation Modal */}
      {modalAccount && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-100 border border-border rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 text-text-main font-semibold text-sm">
                <div className="w-8 h-8 rounded-lg bg-danger/10 border border-danger/20 flex items-center justify-center text-danger shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-main">
                    {isPermanent ? "Permanently Remove Inbox" : "Disconnect Gmail Inbox"}
                  </h3>
                  <p className="text-[11px] font-mono text-text-secondary truncate max-w-[280px]">
                    {modalAccount.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalAccount(null)}
                disabled={isLoading}
                className="text-text-muted hover:text-text-main p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="text-xs text-text-secondary space-y-2.5 leading-relaxed bg-surface-200/50 p-3.5 rounded-lg border border-border/50">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-text-main">
                    {isPermanent
                      ? "This will delete the account entry from LeadMiner."
                      : "This will revoke Google OAuth credentials on Google servers."}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    Outbound outreach from this inbox will stop immediately. Historical sent messages and audit logs will remain safely preserved in the database.
                  </p>
                </div>
              </div>

              {modalAccount.sentToday === 0 && (
                <label className="flex items-center gap-2 pt-2 border-t border-border/40 cursor-pointer select-none text-[11px] text-text-main">
                  <input
                    type="checkbox"
                    checked={isPermanent}
                    onChange={(e) => setIsPermanent(e.target.checked)}
                    className="rounded border-border bg-surface-100 text-primary focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>Permanently remove inbox from list</span>
                </label>
              )}
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-md bg-danger/10 border border-danger/20 text-danger text-[11px]">
                {errorMessage}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalAccount(null)}
                disabled={isLoading}
                className="h-9 px-3 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDisconnect}
                disabled={isLoading}
                className="h-9 px-4 text-xs font-semibold gap-1.5 shadow-sm active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Unlink className="w-3.5 h-3.5" />
                    <span>{isPermanent ? "Delete Permanently" : "Disconnect Inbox"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

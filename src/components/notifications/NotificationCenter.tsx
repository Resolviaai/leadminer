"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  Inbox,
  Activity,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  X,
  Smartphone,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: "reply" | "job" | "alert" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);

  // Check push permission on client
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  const unreadCount = notifications.filter(
    (n) => !n.read && !readIds.has(n.id)
  ).length;

  const markAllAsRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const showPushNotification = (title: string, body: string, url = "/") => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.showNotification(title, {
            body,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            data: { url },
          });
        })
        .catch(() => {
          new Notification(title, { body, icon: "/icon-192.png" });
        });
    } else {
      new Notification(title, { body, icon: "/icon-192.png" });
    }
  };

  const requestPush = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === "granted") {
        showPushNotification(
          "LeadMiner Alerts Enabled",
          "You will now receive alerts for incoming lead replies and system events!"
        );
      }
    }
  };

  const sendTestNotification = () => {
    if (typeof window !== "undefined" && "Notification" in window && pushPermission === "granted") {
      showPushNotification(
        "LeadMiner: Prospect Replied!",
        "The Rogan Clips replied to your outreach email. Tap to view message.",
        "/replies"
      );
    }
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "reply":
        return <Inbox className="w-4 h-4 text-emerald-400" />;
      case "job":
        return <Activity className="w-4 h-4 text-primary" />;
      case "alert":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return <Bell className="w-4 h-4 text-text-muted" />;
    }
  };

  return (
    <div className="relative z-50" ref={containerRef}>
      {/* ── Bell Trigger Button ── */}
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) fetchNotifications();
        }}
        className="relative p-2.5 rounded-lg text-text-secondary hover:text-text-main hover:bg-surface-200 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
        aria-label="System Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
        )}
      </button>

      {/* ── Popover Panel ── */}
      {open && (
        <div className="fixed inset-x-3 top-[calc(3.75rem+env(safe-area-inset-top,0px))] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 bg-surface-100 border border-border rounded-2xl sm:rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-[calc(100vh-6rem)] sm:max-h-[550px] flex flex-col">
          {/* Header */}
          <div className="p-3.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-main">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-mono font-bold">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-text-muted hover:text-text-main flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  <span>Mark read</span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-text-muted hover:text-text-main p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Web Push Banner */}
          <div className="p-3 bg-surface-200/70 border-b border-border text-[11px] space-y-2">
            <div className="flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-text-main">
                  Push Notifications (Mobile & Laptop)
                </p>
                <p className="text-text-muted text-[10px] leading-relaxed">
                  Get notified for prospect replies even when the browser or app is closed.
                </p>
              </div>
            </div>

            {pushPermission !== "granted" ? (
              <button
                onClick={requestPush}
                className="w-full py-1.5 px-2.5 rounded-md bg-primary text-white font-semibold text-[11px] hover:bg-brand-hover active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Enable Desktop & Mobile Push</span>
              </button>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-medium">
                  <Check className="w-3 h-3" /> Push alerts enabled
                </span>
                <button
                  onClick={sendTestNotification}
                  className="text-[10px] text-primary hover:underline"
                >
                  Send test push
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[320px] overflow-y-auto divide-y divide-border/50">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-muted">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted space-y-1">
                <Bell className="w-5 h-5 text-text-muted mx-auto opacity-40 mb-1" />
                <p className="font-medium text-text-secondary">No notifications yet</p>
                <p className="text-[11px]">System events and lead responses will appear here.</p>
              </div>
            ) : (
              notifications.map((item) => {
                const isRead = item.read || readIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-3 text-xs transition-colors flex items-start gap-2.5 ${
                      !isRead ? "bg-surface-200/40" : "hover:bg-surface-200/20"
                    }`}
                  >
                    <div className="p-1 rounded-md bg-surface-300 shrink-0 mt-0.5">
                      {getIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-text-main truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-text-muted shrink-0">
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary line-clamp-2">
                        {item.message}
                      </p>
                      {item.link && (
                        <Link
                          href={item.link}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline pt-0.5"
                        >
                          <span>View details</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-surface-200/40 border-t border-border flex items-center justify-between text-[10px] text-text-muted px-3">
            <span>LeadMiner Telemetry Engine</span>
            <Link
              href="/logs"
              onClick={() => setOpen(false)}
              className="text-text-secondary hover:text-text-main underline"
            >
              Full Audit Logs
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
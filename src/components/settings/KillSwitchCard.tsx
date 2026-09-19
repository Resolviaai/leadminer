'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Play, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SlideToConfirm } from '@/components/ui/SlideToConfirm';

interface Props {
  initialActive: boolean;
}

export function KillSwitchCard({ initialActive }: Props) {
  const router = useRouter();
  const [isActive, setIsActive] = useState<boolean>(initialActive);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleToggle = async () => {
    const nextState = !isActive;
    setIsSyncing(true);
    setErrorMsg(null);

    // Allow the slide-to-confirm morph animation to complete smoothly
    await new Promise((resolve) => setTimeout(resolve, 450));

    // 1. Instant optimistic state update after confirm animation
    setIsActive(nextState);

    try {
      const res = await fetch('/api/kill-switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ enabled: nextState }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Server rejected the change');
      }

      // 2. Refresh server context quietly in the background
      router.refresh();
    } catch (err: any) {
      // 3. Rollback state on error
      console.error('[KillSwitch Toggle Error]', err);
      setIsActive(!nextState);
      setErrorMsg(err.message || 'Failed to sync with server. Reverted to previous state.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-2">
      <Card
        className={`p-4 sm:p-6 transition-colors duration-200 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isActive
            ? 'bg-amber-500/[0.04] border-amber-500/40'
            : 'bg-surface-100 border-danger/30'
        }`}
      >
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`flex items-center space-x-1.5 font-semibold text-xs sm:text-sm ${
                isActive ? 'text-amber-500' : 'text-danger'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="tracking-tight uppercase">
                {isActive ? 'Outreach Paused (Kill Switch Armed)' : 'Emergency Pause (Stop All Emails)'}
              </span>
            </div>

            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                OUTREACH PAUSED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                SYSTEM ACTIVE
              </span>
            )}
          </div>

          <p className="text-[11px] sm:text-xs text-text-secondary max-w-2xl leading-relaxed">
            {isActive
              ? 'All outbound emails are currently halted. YouTube discovery and contact verification continue safely in the background.'
              : 'When paused, all outbound emails stop immediately. Finding channels and verifying emails will continue safely in the background.'}
          </p>
        </div>

        <div className="shrink-0 flex items-center justify-center sm:justify-end">
          <SlideToConfirm
            key={isActive ? 'armed' : 'active'}
            label={isActive ? 'Slide to resume outreach' : 'Slide to stop outreach'}
            confirmedLabel={isActive ? 'Outreach Resumed' : 'Outreach Paused'}
            variant={isActive ? 'warning' : 'danger'}
            corner={12}
            width={260}
            disabled={isSyncing}
            onConfirm={handleToggle}
          />
        </div>
      </Card>

      {errorMsg && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-danger/10 border border-danger/30 text-xs text-danger animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RunOutreachButton() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClick = async () => {
    if (status === 'running') return;
    setStatus('running');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/workers/outreach', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Outreach failed');
      }

      setStatus('success');
      router.refresh();
      setTimeout(() => {
        setStatus('idle');
      }, 2500);
    } catch (err: any) {
      console.error('[RunOutreach Error]', err);
      setStatus('error');
      setErrorMsg(err.message || 'Failed to dispatch emails');
      setTimeout(() => {
        setStatus('idle');
        setErrorMsg(null);
      }, 3000);
    }
  };

  return (
    <Button
      size="sm"
      variant={status === 'error' ? 'destructive' : 'default'}
      onClick={handleClick}
      disabled={status === 'running'}
      className="gap-1.5 w-full sm:w-auto text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer shadow-sm select-none"
    >
      {status === 'running' ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Sending Batch...</span>
        </>
      ) : status === 'success' ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
          <span>Batch Sent!</span>
        </>
      ) : status === 'error' ? (
        <>
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{errorMsg || 'Failed'}</span>
        </>
      ) : (
        <>
          <Send className="w-3.5 h-3.5 fill-current" />
          <span>Send Emails Now</span>
        </>
      )}
    </Button>
  );
}
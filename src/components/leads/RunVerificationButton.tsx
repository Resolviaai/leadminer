'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RunVerificationButton() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClick = async () => {
    if (status === 'running') return;
    setStatus('running');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/actions/verification', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Verification failed');
      }

      setStatus('success');
      router.refresh();
      setTimeout(() => {
        setStatus('idle');
      }, 2500);
    } catch (err: any) {
      console.error('[RunVerification Error]', err);
      setStatus('error');
      setErrorMsg(err.message || 'Failed to verify contacts');
      setTimeout(() => {
        setStatus('idle');
        setErrorMsg(null);
      }, 3000);
    }
  };

  return (
    <Button
      variant={status === 'error' ? 'destructive' : 'default'}
      onClick={handleClick}
      disabled={status === 'running'}
      className="gap-1.5 w-full sm:w-auto h-9 px-4 text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer shadow-sm select-none"
    >
      {status === 'running' ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Verifying Emails...</span>
        </>
      ) : status === 'success' ? (
        <>
          <CheckCircle2 className="w-3 h-3 text-emerald-300" />
          <span>Verification Done!</span>
        </>
      ) : status === 'error' ? (
        <>
          <AlertCircle className="w-3 h-3" />
          <span>{errorMsg || 'Failed'}</span>
        </>
      ) : (
        <>
          <Play className="w-3 h-3 fill-current" />
          <span>Verify Pending Emails</span>
        </>
      )}
    </Button>
  );
}
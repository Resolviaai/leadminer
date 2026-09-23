'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RunDiscoveryButton() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClick = async () => {
    if (status === 'running') return;
    setStatus('running');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/actions/discovery', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Discovery failed');
      }

      setStatus('success');
      router.refresh();
      setTimeout(() => {
        setStatus('idle');
      }, 2500);
    } catch (err: any) {
      console.error('[RunDiscovery Error]', err);
      setStatus('error');
      setErrorMsg(err.message || 'Failed to run discovery');
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
          <span>Discovering Creators...</span>
        </>
      ) : status === 'success' ? (
        <>
          <CheckCircle2 className="w-3 h-3 text-emerald-300" />
          <span>Batch Finished!</span>
        </>
      ) : status === 'error' ? (
        <>
          <AlertCircle className="w-3 h-3" />
          <span>{errorMsg || 'Failed'}</span>
        </>
      ) : (
        <>
          <Play className="w-3 h-3 fill-current" />
          <span>Find Creators Now</span>
        </>
      )}
    </Button>
  );
}
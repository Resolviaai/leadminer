'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  campaignId: number;
  initialStatus: string;
}

export function CampaignToggleButton({ campaignId, initialStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(initialStatus);
  const [isPending, setIsPending] = useState<boolean>(false);

  const handleToggle = async () => {
    const nextStatus = status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    // Optimistic update
    setStatus(nextStatus);
    setIsPending(true);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Toggle failed');
      }

      router.refresh();
    } catch (err) {
      console.error('[Campaign Toggle Error]', err);
      // Rollback on error
      setStatus(status);
    } finally {
      setIsPending(false);
    }
  };

  const isActive = status === 'ACTIVE';

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleToggle}
      className="gap-1.5 min-h-[38px] sm:h-8 px-3 text-xs active:scale-[0.98] transition-all cursor-pointer select-none"
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : isActive ? (
        <Pause className="w-3 h-3 text-warning" />
      ) : (
        <Play className="w-3 h-3 text-primary" />
      )}
      <span>{isActive ? 'Pause' : 'Activate'}</span>
    </Button>
  );
}
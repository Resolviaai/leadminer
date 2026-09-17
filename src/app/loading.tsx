import React from 'react';
import { Card } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="space-y-5 max-w-7xl mx-auto w-full animate-pulse">
      {/* Header Skeleton */}
      <Card className="p-4 sm:p-5 border-border bg-surface-100/60">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 rounded bg-surface-300" />
          <div className="h-5 w-48 rounded bg-surface-300" />
        </div>
        <div className="h-3.5 w-72 rounded bg-surface-200 mt-2.5" />
      </Card>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-3.5 bg-surface-100/60">
            <div className="h-3 w-20 rounded bg-surface-200 mb-2" />
            <div className="h-6 w-16 rounded bg-surface-300" />
          </Card>
        ))}
      </div>

      {/* Content / Table Skeleton */}
      <Card className="overflow-hidden border-border bg-surface-100/60">
        <div className="h-10 border-b border-border bg-surface-200/50 flex items-center px-4 space-x-4">
          <div className="h-3.5 w-24 rounded bg-surface-300" />
          <div className="h-3.5 w-32 rounded bg-surface-300 hidden sm:block" />
          <div className="h-3.5 w-20 rounded bg-surface-300 hidden md:block" />
          <div className="h-3.5 w-16 rounded bg-surface-300 ml-auto" />
        </div>
        <div className="divide-y divide-border/40 p-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-12 flex items-center px-4 space-x-4">
              <div className="h-3.5 w-36 rounded bg-surface-200" />
              <div className="h-3 w-24 rounded bg-surface-200 hidden sm:block" />
              <div className="h-3 w-16 rounded bg-surface-200 hidden md:block" />
              <div className="h-3 w-12 rounded bg-surface-200 ml-auto" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

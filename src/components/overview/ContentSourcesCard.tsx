'use client';

import React from 'react';
import {
  Youtube,
  PlaySquare,
  Link as LinkIcon,
  Twitter,
  Globe,
} from 'lucide-react';
import { ContentSourceItem } from '@/services/analytics/overview-analytics.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ContentSourcesCardProps {
  sources: ContentSourceItem[];
}

export function ContentSourcesCard({ sources }: ContentSourcesCardProps) {
  const getIcon = (type: ContentSourceItem['iconType']) => {
    switch (type) {
      case 'youtube':
        return (
          <div className="w-5 h-5 rounded bg-[#FF0000]/15 text-[#FF0000] flex items-center justify-center shrink-0">
            <Youtube className="w-3.5 h-3.5" />
          </div>
        );
      case 'video':
        return (
          <div className="w-5 h-5 rounded bg-surface-200 text-text-muted flex items-center justify-center shrink-0">
            <PlaySquare className="w-3.5 h-3.5" />
          </div>
        );
      case 'website':
        return (
          <div className="w-5 h-5 rounded bg-surface-200 text-text-muted flex items-center justify-center shrink-0">
            <LinkIcon className="w-3.5 h-3.5" />
          </div>
        );
      case 'social':
        return (
          <div className="w-5 h-5 rounded bg-[#1DA1F2]/15 text-[#1DA1F2] flex items-center justify-center shrink-0">
            <Twitter className="w-3.5 h-3.5" />
          </div>
        );
      default:
        return (
          <div className="w-5 h-5 rounded bg-surface-200 text-text-muted flex items-center justify-center shrink-0">
            <Globe className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between border border-border bg-surface-100">
      <div>
        <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold text-text-main">
            Content Sources
          </CardTitle>
        </CardHeader>

        {/* Sources List */}
        <div className="space-y-3.5 pt-1">
          {sources.map((item) => (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {getIcon(item.iconType)}
                  <span className="text-text-secondary truncate font-medium">{item.label}</span>
                </div>

                <div className="flex items-center gap-3 font-mono shrink-0">
                  <span className="font-semibold text-text-main tabular-nums">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="text-text-muted text-[11px] min-w-[38px] text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar (Bold, rounded capsule matching reference design) */}
              <div className="w-full h-2.5 bg-surface-200/80 rounded-full overflow-hidden border border-studio-border-subtle/50">
                <div
                  className="h-full bg-gradient-to-r from-[#E55A2B] to-[#F06536] rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.max(2, item.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

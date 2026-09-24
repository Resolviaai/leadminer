'use client';

import React from 'react';
import {
  Youtube,
  PlaySquare,
  Link as LinkIcon,
  Twitter,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { ContentSourceItem } from '@/services/analytics/overview-analytics.service';

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
          <div className="w-5 h-5 rounded bg-[#21262D] text-[#8B949E] flex items-center justify-center shrink-0">
            <PlaySquare className="w-3.5 h-3.5" />
          </div>
        );
      case 'website':
        return (
          <div className="w-5 h-5 rounded bg-[#21262D] text-[#8B949E] flex items-center justify-center shrink-0">
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
          <div className="w-5 h-5 rounded bg-[#21262D] text-[#8B949E] flex items-center justify-center shrink-0">
            <Globe className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4 sm:p-5 flex flex-col justify-between h-full">
      <div>
        <div className="pb-3 flex flex-row items-center justify-between border-b border-[#30363D]/60">
          <h2 className="text-sm font-semibold text-[#F0F6FC]">
            Content Sources
          </h2>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#21262D] border border-[#30363D] text-xs text-[#8B949E] hover:text-[#C9D1D9] transition-colors cursor-pointer select-none">
            <span>Email sources</span>
            <ChevronDown className="w-3 h-3 text-[#8B949E]" />
          </div>
        </div>

        {/* Sources List matching Image 1 & 2 */}
        <div className="space-y-2.5 pt-3">
          {sources.map((item) => (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {getIcon(item.iconType)}
                  <span className="text-[#C9D1D9] text-xs truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-2.5 font-mono shrink-0">
                  <span className="font-semibold text-[#F0F6FC] tabular-nums">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="text-[#8B949E] text-[11px] min-w-[38px] text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[#21262D] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F06536] rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(2, item.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

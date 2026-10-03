'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowRight,
  Check,
  RotateCcw,
} from 'lucide-react';

interface CustomDateRangeModalProps {
  initialStart: string; // YYYY-MM-DD
  initialEnd: string;   // YYYY-MM-DD
  onClose: () => void;
  onApply: (startDate: string, endDate: string) => void;
}

// Timezone-safe date helper
function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

function formatDateString(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return 'Select date';
  const { year, month, day } = parseDateParts(dateStr);
  const date = new Date(year, month, day, 12, 0, 0);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getTodayString(): string {
  const now = new Date();
  return formatDateString(now.getFullYear(), now.getMonth(), now.getDate());
}

interface PresetOption {
  label: string;
  getRange: () => { start: string; end: string };
}

const PRESETS: PresetOption[] = [
  {
    label: 'Today',
    getRange: () => {
      const today = getTodayString();
      return { start: today, end: today };
    },
  },
  {
    label: 'Yesterday',
    getRange: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const s = formatDateString(d.getFullYear(), d.getMonth(), d.getDate());
      return { start: s, end: s };
    },
  },
  {
    label: 'Last 7 Days',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return {
        start: formatDateString(start.getFullYear(), start.getMonth(), start.getDate()),
        end: formatDateString(end.getFullYear(), end.getMonth(), end.getDate()),
      };
    },
  },
  {
    label: 'Last 14 Days',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 13);
      return {
        start: formatDateString(start.getFullYear(), start.getMonth(), start.getDate()),
        end: formatDateString(end.getFullYear(), end.getMonth(), end.getDate()),
      };
    },
  },
  {
    label: 'Last 30 Days',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      return {
        start: formatDateString(start.getFullYear(), start.getMonth(), start.getDate()),
        end: formatDateString(end.getFullYear(), end.getMonth(), end.getDate()),
      };
    },
  },
  {
    label: 'This Month',
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        start: formatDateString(start.getFullYear(), start.getMonth(), 1),
        end: formatDateString(now.getFullYear(), now.getMonth(), now.getDate()),
      };
    },
  },
  {
    label: 'Previous Month',
    getRange: () => {
      const now = new Date();
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        start: formatDateString(prevMonthStart.getFullYear(), prevMonthStart.getMonth(), 1),
        end: formatDateString(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), prevMonthEnd.getDate()),
      };
    },
  },
];

const WEEKDAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function CustomDateRangeModal({
  initialStart,
  initialEnd,
  onClose,
  onApply,
}: CustomDateRangeModalProps) {
  const [selectedStart, setSelectedStart] = useState<string>(initialStart || getTodayString());
  const [selectedEnd, setSelectedEnd] = useState<string>(initialEnd || getTodayString());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Month navigation based on initial selectedStart or current date
  const initialParsed = parseDateParts(selectedStart || getTodayString());
  const [currentYear, setCurrentYear] = useState<number>(initialParsed.year);
  const [currentMonth, setCurrentMonth] = useState<number>(initialParsed.month);

  const todayStr = useMemo(() => getTodayString(), []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  // Build calendar matrix for currentMonth & currentYear
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Monday = 0
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({
        dateStr: formatDateString(prevY, prevM, d),
        dayNumber: d,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDateString(currentYear, currentMonth, d);
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding (complete grid to 35 or 42 cells)
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      days.push({
        dateStr: formatDateString(nextY, nextM, d),
        dayNumber: d,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [currentYear, currentMonth, todayStr]);

  // Day click logic for range selection
  const handleDayClick = (dateStr: string) => {
    if (!selectedStart || (selectedStart && selectedEnd)) {
      // Start a fresh range
      setSelectedStart(dateStr);
      setSelectedEnd('');
    } else if (selectedStart && !selectedEnd) {
      if (dateStr < selectedStart) {
        // Clicked date is earlier than start -> swap/start over
        setSelectedStart(dateStr);
        setSelectedEnd('');
      } else {
        // Complete the range
        setSelectedEnd(dateStr);
      }
    }
  };

  const handleApplyPreset = (preset: PresetOption) => {
    const { start, end } = preset.getRange();
    setSelectedStart(start);
    setSelectedEnd(end);

    // Jump calendar view to end month
    const { year, month } = parseDateParts(end);
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  // Determine active prospective range for styling
  const effectiveEnd = selectedEnd || (hoveredDate && hoveredDate >= selectedStart ? hoveredDate : selectedStart);

  // Compute number of days in selected range
  const daysCount = useMemo(() => {
    if (!selectedStart) return 0;
    const end = selectedEnd || selectedStart;
    const startD = new Date(selectedStart + 'T12:00:00Z');
    const endD = new Date(end + 'T12:00:00Z');
    const diff = Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  }, [selectedStart, selectedEnd]);

  const handleApply = () => {
    if (!selectedStart) return;
    const finalEnd = selectedEnd || selectedStart;
    onApply(selectedStart, finalEnd);
  };

  const monthLabel = new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="rounded-2xl border border-studio-border-strong bg-[#161616] p-0 max-w-2xl w-full shadow-2xl shadow-black/90 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-studio-border bg-surface-100/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-main">Custom Date Filter</h3>
              <p className="text-[11px] text-text-secondary">
                Select a specific time range for overview metrics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-200 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left Presets + Right Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-studio-border">
          {/* Left Column: Quick Presets */}
          <div className="md:col-span-4 p-3.5 space-y-1 bg-surface-100/30">
            <span className="text-[10px] font-semibold tracking-wider text-text-muted uppercase px-2 mb-1.5 block">
              Quick Presets
            </span>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-1">
              {PRESETS.map((preset) => {
                const { start, end } = preset.getRange();
                const isSelected = selectedStart === start && selectedEnd === end;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary/15 text-primary border border-primary/30 font-semibold'
                        : 'text-text-secondary hover:text-text-main hover:bg-surface-200/70 border border-transparent'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Month Navigator & Interactive Calendar Grid */}
          <div className="md:col-span-8 p-4 flex flex-col justify-between">
            <div>
              {/* Calendar Month Navigation */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-sm font-semibold text-text-main tracking-tight">
                  {monthLabel}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleJumpToToday}
                    className="px-2 py-1 rounded text-[11px] font-medium text-text-muted hover:text-text-main hover:bg-surface-200 transition-colors mr-1"
                    title="Jump to current month"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg border border-studio-border hover:bg-surface-200 text-text-secondary hover:text-text-main transition-colors"
                    title="Previous month"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg border border-studio-border hover:bg-surface-200 text-text-secondary hover:text-text-main transition-colors"
                    title="Next month"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                {WEEKDAY_NAMES.map((name) => (
                  <div
                    key={name}
                    className="text-[11px] font-medium text-text-muted py-1"
                  >
                    {name}
                  </div>
                ))}
              </div>

              {/* Day Tiles Grid */}
              <div className="grid grid-cols-7 gap-y-1 gap-x-0">
                {calendarDays.map((day) => {
                  const { dateStr, dayNumber, isCurrentMonth, isToday } = day;
                  const isStart = dateStr === selectedStart;
                  const isEnd = dateStr === selectedEnd;
                  const isInRange =
                    selectedStart &&
                    effectiveEnd &&
                    dateStr > selectedStart &&
                    dateStr < effectiveEnd;
                  const isSingleSelected = isStart && (selectedEnd === selectedStart || !selectedEnd);

                  return (
                    <div
                      key={dateStr}
                      className={`relative py-0.5 flex items-center justify-center ${
                        isInRange ? 'bg-primary/15' : ''
                      } ${isStart && selectedEnd && selectedEnd !== selectedStart ? 'bg-gradient-to-r from-transparent to-primary/15 rounded-l-lg' : ''} ${
                        isEnd && selectedStart && selectedEnd !== selectedStart ? 'bg-gradient-to-l from-transparent to-primary/15 rounded-r-lg' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleDayClick(dateStr)}
                        onMouseEnter={() => setHoveredDate(dateStr)}
                        onMouseLeave={() => setHoveredDate(null)}
                        className={`w-8 h-8 rounded-lg text-xs font-mono transition-all flex items-center justify-center relative ${
                          isSingleSelected
                            ? 'bg-primary text-white font-bold shadow-md shadow-primary/30 z-10 scale-105'
                            : isStart
                            ? 'bg-primary text-white font-bold shadow-sm z-10 rounded-r-none'
                            : isEnd
                            ? 'bg-primary text-white font-bold shadow-sm z-10 rounded-l-none'
                            : isInRange
                            ? 'text-primary font-medium hover:bg-primary/25 rounded-none'
                            : isCurrentMonth
                            ? 'text-text-main hover:bg-surface-200'
                            : 'text-text-muted/30 hover:bg-surface-200/40'
                        } ${isToday && !isStart && !isEnd ? 'border border-primary/50 font-bold' : ''}`}
                      >
                        {dayNumber}
                        {isToday && !isStart && !isEnd && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Range Preview Bar */}
            <div className="mt-4 pt-3 border-t border-studio-border flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 bg-surface-200/80 px-2.5 py-1.5 rounded-lg border border-studio-border">
                <span className="text-text-secondary text-[11px]">From:</span>
                <span className="font-mono text-text-main font-semibold">
                  {formatDisplayDate(selectedStart)}
                </span>
                <ArrowRight className="w-3 h-3 text-text-muted" />
                <span className="text-text-secondary text-[11px]">To:</span>
                <span className="font-mono text-text-main font-semibold">
                  {formatDisplayDate(selectedEnd || selectedStart)}
                </span>
              </div>

              {daysCount > 0 && (
                <span className="text-[11px] px-2 py-1 rounded bg-primary/10 text-primary font-semibold border border-primary/20 shrink-0">
                  {daysCount} {daysCount === 1 ? 'day' : 'days'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-studio-border bg-surface-100/50">
          <button
            type="button"
            onClick={() => {
              const today = getTodayString();
              setSelectedStart(today);
              setSelectedEnd(today);
            }}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main transition-colors px-2 py-1 rounded hover:bg-surface-200"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Today</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-main hover:bg-surface-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!selectedStart}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:bg-brand-hover text-white shadow-md shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Filter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

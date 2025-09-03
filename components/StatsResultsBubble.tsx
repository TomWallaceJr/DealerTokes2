// ============================================================================
'use client';

import React from 'react';
import { money, num } from '@/lib/format';

export type StatsResultsBubbleProps = {
  label: React.ReactNode;
  total?: number;
  hourly?: number;
  perDown?: number;
  count?: number;
  loading?: boolean;
  error?: string | null;
  showCount?: boolean;
};

export default function StatsResultsBubble({
  label,
  total = 0,
  hourly = 0,
  perDown = 0,
  count = 0,
  loading,
  error,
  showCount,
}: StatsResultsBubbleProps) {
  return (
    <div className="mt-3 rounded-2xl border border-emerald-200/60 bg-white/70 p-3 text-sm shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
      {error ? (
        <span className="text-rose-600">{error}</span>
      ) : loading ? (
        <span className="text-slate-600">Loading…</span>
      ) : (
        <div className="flex flex-col gap-y-1 sm:flex-row sm:flex-wrap sm:items-center">
          {/* xs mobile: two lines, no shifts */}
          <div className="flex items-center gap-x-3 sm:hidden">
            <span className="text-slate-500">{label}</span>
            <span className="text-slate-400">•</span>
            <span className="font-medium text-slate-900">{money(total)}</span>
          </div>
          <div className="flex items-center gap-x-3 sm:hidden">
            <span className="font-medium text-slate-800">${num(hourly)} / h</span>
            <span className="text-slate-400">•</span>
            <span className="font-medium text-slate-800">${num(perDown)} / down</span>
          </div>

          {/* sm+ desktop: one line with optional count */}
          <div className="hidden flex-wrap items-center gap-x-3 sm:flex">
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-900">{money(total)}</span>
            <span className="text-slate-400">•</span>
            <span className="font-medium text-slate-800">${num(hourly)} / h</span>
            <span className="text-slate-400">•</span>
            <span className="font-medium text-slate-800">${num(perDown)} / down</span>
            {showCount ? (
              <>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">{count} shifts</span>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

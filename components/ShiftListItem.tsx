// components/ShiftListItem.tsx
'use client';

import Link from 'next/link';
import { dateUTC } from '@/lib/date';
import { money, num } from '@/lib/format';
import type { Shift } from '@/hooks/useShiftList';

export default function ShiftListItem({
  shift,
  onDelete,
  deleting,
}: {
  shift: Shift;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}) {
  const total = shift.tokesCash ?? 0;
  const perHour = shift.hours > 0 ? total / shift.hours : 0;
  // const perDown = shift.downs > 0 ? total / shift.downs : 0;

  // Incomplete tournament data detection (match Calendar)
  const tDowns = Number(shift.tournamentDowns ?? 0);
  const tRate = Number(shift.tournamentRate ?? 0);
  const needsTourney = (tDowns > 0 && tRate <= 0) || (tRate > 0 && tDowns <= 0);
  const tooltip = needsTourney
    ? tDowns > 0 && tRate <= 0
      ? 'Tournament $/down missing — tap to edit'
      : 'Tournament downs missing — tap to edit'
    : undefined;

  return (
    <div className="relative">
      {/* Card → edit page */}
      <Link href={`/shifts/${shift.id}`} className="group block" prefetch={false} title={tooltip}>
        <div
          className={[
            'card pr-12 transition hover:shadow-md',
            needsTourney
              ? 'border-rose-400 ring-1 ring-rose-300'
              : 'hover:ring-1 hover:ring-emerald-300/50',
          ].join(' ')}
        >
          <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
            <div>
              <div className="flex items-center gap-2 font-medium text-slate-900">
                <span>{dateUTC(shift.date)}</span>
                <span className="text-slate-400">•</span>
                <span>{shift.casino}</span>
              </div>
              <div className="mt-0.5 text-slate-600">
                {num(shift.hours, 2)}h <span className="mx-2 text-slate-400">•</span>
                <span>{money(total)} total</span> <span className="mx-2 text-slate-400">•</span>
                <span>${num(perHour)} / h</span>
              </div>
            </div>
            {shift.notes ? (
              <div className="max-w-sm text-xs text-slate-600">{shift.notes}</div>
            ) : null}
          </div>
          {needsTourney ? (
            <div className="pointer-events-none absolute -top-1 -right-1">
              <span className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-500 text-[7px] font-bold leading-none text-white ring-1 ring-rose-300">!</span>
            </div>
          ) : null}
        </div>
      </Link>
    </div>
  );
}

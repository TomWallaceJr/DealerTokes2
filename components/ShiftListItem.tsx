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

  return (
    <div className="relative">
      {/* Card → edit page */}
      <Link href={`/shifts/${shift.id}`} className="group block" prefetch={false}>
        <div className="card pr-12 transition hover:shadow-md hover:ring-1 hover:ring-emerald-300/50">
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
        </div>
      </Link>
    </div>
  );
}

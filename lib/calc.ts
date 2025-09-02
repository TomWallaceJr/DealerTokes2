// ============================================================================
// File: /lib/calc.ts
// Purpose: Pure, tested-friendly calculations for shifts & summaries
// ============================================================================
export type Money = number; // cents or dollars — this app uses dollars

export interface ShiftLike {
  id?: string;
  date: string; // ISO yyyy-mm-dd
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  tipsCash?: Money;
  tipsCredit?: Money;
  tokesOther?: Money;
  hours?: number; // optional; derived if absent
}

/**
 * Converts HH:mm to minutes since midnight (0–1439). Empty returns null.
 */
export function hhmmToMinutes(hhmm: string | null | undefined): number | null {
  if (!hhmm) return null;
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/**
 * Computes hours from start & end. Handles overnight by assuming end next day if end < start.
 */
export function computeHours(startHHMM: string, endHHMM: string): number {
  const s = hhmmToMinutes(startHHMM);
  const e = hhmmToMinutes(endHHMM);
  if (s == null || e == null) return 0;
  const minutes = e >= s ? e - s : e + 1440 - s;
  return Math.round((minutes / 60) * 100) / 100;
}

export function shiftTotal(shift: ShiftLike): Money {
  const cash = shift.tipsCash ?? 0;
  const credit = shift.tipsCredit ?? 0;
  const other = shift.tokesOther ?? 0;
  return cash + credit + other;
}

export function shiftHourly(shift: ShiftLike): number {
  const hrs = shift.hours ?? computeHours(shift.startTime, shift.endTime);
  if (!hrs) return 0;
  return Math.round((shiftTotal(shift) / hrs) * 100) / 100;
}

export function sumTotals(shifts: ShiftLike[]): { total: Money; hours: number; hourly: number } {
  const total = shifts.reduce((acc, s) => acc + shiftTotal(s), 0);
  const hours =
    Math.round(
      shifts.reduce((acc, s) => acc + (s.hours ?? computeHours(s.startTime, s.endTime)), 0) * 100,
    ) / 100;
  const hourly = hours ? Math.round((total / hours) * 100) / 100 : 0;
  return { total, hours, hourly };
}

// --- Schema-aligned helpers (no time-of-day) ---
/** Rounds up to the nearest 0.25 increment. */
export function roundQuarterUp(n: number): number {
  return Math.ceil(n * 4) / 4;
}

/** Coerces a "YYYY-MM-DD" string to a Date at UTC midnight. */
export function ymdToUtcDate(ymd: string): Date {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(ymd);
  if (!m) throw new Error('Invalid date format; expected YYYY-MM-DD');
  const y = Number(m[1]);
  const mm = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Date(Date.UTC(y, mm, d, 0, 0, 0, 0));
}

/** Computes dollars per hour. */
export function hourly(total: Money, hours: number): number {
  if (!hours) return 0;
  return Math.round((total / hours) * 100) / 100;
}

// ============================================================================
// File: /components/NewShiftForm.tsx
// Purpose: Create-shift form aligned to API (POST /api/shifts), accepts initialDate
// ============================================================================
'use client';

import { money, num } from '@/lib/format';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type NewShift = {
  date: string; // YYYY-MM-DD
  casino: string;
  hours: number; // quarter increments
  downs: number; // quarter increments
  tokesCash: number; // whole dollars
  notes?: string | null;
  tournamentDowns?: number;
  tournamentRate?: number;
  hourlyRate?: number;
};

function parseLocalYmd(ymd: string) {
  const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10));
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}
function nextDayYmd(ymd: string): string {
  const d = parseLocalYmd(ymd);
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---- numeric UX helpers
const ceilQuarter = (n: number) => Math.ceil(n * 4) / 4;
const parseNum = (v: string) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const cleanDecimal = (s: string) => {
  const only = s.replace(/[^\d.]/g, '');
  const [head, ...rest] = only.split('.');
  return head + (rest.length ? '.' + rest.join('').replace(/\./g, '') : '');
};
const fmtNum = (n: number) => String(parseFloat(n.toFixed(2)));

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function NewShiftForm({ initialDate }: { initialDate?: string }) {
  const router = useRouter();

  // fields
  const [date, setDate] = useState<string>(initialDate ?? todayYmd());
  const [casino, setCasino] = useState<string>('');
  const [hoursStr, setHoursStr] = useState<string>('0');
  const [downsStr, setDownsStr] = useState<string>('0');
  const [cashoutStr, setCashoutStr] = useState<string>('0'); // whole $
  const [notes, setNotes] = useState<string>('');
  const [rooms, setRooms] = useState<string[]>([]);

  // Optional sections toggles
  const [includeHourly, setIncludeHourly] = useState<boolean>(false);
  const [includeTourney, setIncludeTourney] = useState<boolean>(false);

  // New fields: Hourly rate and tournament metrics
  const [hourlyRateStr, setHourlyRateStr] = useState<string>('0');
  const [tourneyDownsStr, setTourneyDownsStr] = useState<string>('0');
  const [tourneyRateStr, setTourneyRateStr] = useState<string>('0');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictId, setConflictId] = useState<string | null>(null);

  // derived values
  const hours = useMemo(() => parseNum(hoursStr), [hoursStr]);
  const downs = useMemo(() => parseNum(downsStr), [downsStr]);
  const tokesCash = useMemo(() => Math.max(0, Math.ceil(parseNum(cashoutStr))), [cashoutStr]);

  const perHour = hours > 0 ? tokesCash / hours : 0;
  const perDown = downs > 0 ? tokesCash / downs : 0;

  // datalist rooms
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/rooms', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.rooms)) setRooms(data.rooms);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  // prefill last used room & hourly
  useEffect(() => {
    try {
      const last = localStorage.getItem('lastRoom');
      if (last && !casino) setCasino(last);
      const lastHr = localStorage.getItem('lastHourlyRate');
      if (lastHr && hourlyRateStr === '0') setHourlyRateStr(lastHr);
    } catch {
      /* ignore */
    }
    // mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create() {
    setError(null);
    setConflictId(null);
    if (!casino.trim() || hours <= 0) {
      setError('Please enter a room and a positive number of hours.');
      return;
    }
    setSaving(true);
    try {
      const body: NewShift = {
        date,
        casino: casino.trim(),
        hours: ceilQuarter(hours),
        downs: Math.max(0, ceilQuarter(downs)),
        tokesCash, // whole dollars
        notes: notes ? notes : undefined,
      };
      if (includeTourney) {
        body.tournamentDowns = Math.max(0, parseNum(tourneyDownsStr));
        body.tournamentRate = Math.max(0, parseNum(tourneyRateStr));
      }
      if (includeHourly) {
        body.hourlyRate = Math.max(0, parseNum(hourlyRateStr));
      }

      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 409) {
        // A shift for this date already exists — try to locate it to let user edit
        setError('A shift for this date already exists.');
        try {
          const from = date;
          const to = nextDayYmd(date);
          const r = await fetch(`/api/shifts?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=1`, { cache: 'no-store' });
          if (r.ok) {
            const j = await r.json();
            const id = j?.items?.[0]?.id as string | undefined;
            if (id) setConflictId(id);
          }
        } catch {
          /* ignore */
        }
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        let msg = 'Create failed';
        try {
          const j = JSON.parse(text);
          msg = typeof j.error === 'string' ? j.error : JSON.stringify(j.error);
        } catch {
          msg = text || msg;
        }
        throw new Error(msg);
      }

      try {
        localStorage.setItem('lastRoom', body.casino);
        if (hourlyRateStr) localStorage.setItem('lastHourlyRate', hourlyRateStr);
      } catch {
        /* ignore */
      }

      router.push('/');
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to create shift.');
    } finally {
      setSaving(false);
    }
  }

  function clearForm() {
    setDate(initialDate ?? todayYmd());
    setCasino('');
    setHoursStr('0');
    setDownsStr('0');
    setCashoutStr('0');
    setNotes('');
    setError(null);
  }

  // stat bubble
  const day = parseLocalYmd(date);
  const dayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(day);
  const resultsLabel = `${dayLabel} • ${casino || 'Room'}`;
  const tourneyDowns = useMemo(() => parseNum(tourneyDownsStr), [tourneyDownsStr]);
  const tourneyRate = useMemo(() => parseNum(tourneyRateStr), [tourneyRateStr]);
  const hourlyRate = useMemo(() => parseNum(hourlyRateStr), [hourlyRateStr]);
  const tournamentTokes = includeTourney ? Math.max(0, tourneyDowns * tourneyRate) : 0;
  const totalForHourly = tokesCash + (includeHourly ? hourlyRate * hours : 0) + tournamentTokes;
  const hoursForCalc = hours > 0 ? hours : downs > 0 ? downs * 0.5 : 0; // 1 down = 0.5 hours fallback
  const effectivePerHour = hoursForCalc > 0 ? totalForHourly / hoursForCalc : 0;
  const perTDown = includeTourney && tourneyDowns > 0 ? tournamentTokes / tourneyDowns : 0;

  return (
    <div className="card relative space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">Log Shift</h2>
        </div>
        <span className="hidden sm:block" />
      </div>

      {/* Options */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            checked={includeHourly}
            onChange={(e) => setIncludeHourly(e.target.checked)}
          />
          Include Hourly Rate
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            checked={includeTourney}
            onChange={(e) => setIncludeTourney(e.target.checked)}
          />
          Include Tournament Downs
        </label>
      </div>

      {/* Results bubble */}
      <div className="m-5 mb-0 rounded-2xl border border-emerald-300/70 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
        {error ? (
          <div className="flex flex-wrap items-center gap-3 text-[13px]">
            <span className="text-rose-600">{error}</span>
            {conflictId ? (
              <button
                type="button"
                className="underline decoration-rose-400 underline-offset-2 text-rose-700 hover:text-rose-800"
                onClick={() => router.push(`/shifts/${conflictId}`)}
              >
                Edit existing shift
              </button>
            ) : null}
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="flex flex-col gap-1 sm:hidden">
              {/* Line 1: Date • Casino */}
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-slate-600">{resultsLabel}</span>
              </div>
              {/* Line 2: Total - TotalMade • ($/h) */}
              <div className="flex items-center gap-2 text-[12px]">
                <span className="font-semibold text-slate-900">Total - {money(totalForHourly)}</span>
                <span className="text-slate-400">•</span>
                <span className="font-medium text-slate-800">({`$${num(effectivePerHour)}/h`})</span>
              </div>
              {/* Line 3: Cash Tokes - Cashout • $/cd */}
              <div className="flex items-center gap-2 text-[12px]">
                <span className="font-medium text-slate-800">Cash Tokes - {money(tokesCash)}</span>
                <span className="text-slate-400">•</span>
                <span className="font-medium text-slate-800">{`$${num(perDown)}/cd`}</span>
              </div>
              {/* Line 4: Tournament Tokes - Tournament total • $/td */}
              {includeTourney ? (
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="font-medium text-slate-800">Tournament Tokes - {money(tournamentTokes)}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-medium text-slate-800">{`$${num(perTDown)}/td`}</span>
                </div>
              ) : null}
            </div>

            {/* Desktop */}
            <div className="hidden sm:block">
              {!includeTourney ? (
                <div className="flex items-center gap-3 text-[14px] whitespace-nowrap">
                  <span className="text-slate-600">{resultsLabel}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-semibold text-slate-900">Total - {money(totalForHourly)}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-medium text-slate-800">({`$${num(effectivePerHour)}/h`})</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-medium text-slate-800">Cash Tokes - {money(tokesCash)}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-medium text-slate-800">{`$${num(perDown)}/cd`}</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {/* Line 1: Date • Casino */}
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">{resultsLabel}</span>
                  </div>
                  {/* Line 2: Total - TotalMade • ($/h) */}
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900">Total - {money(totalForHourly)}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-medium text-slate-800">({`$${num(effectivePerHour)}/h`})</span>
                  </div>
                  {/* Line 3: Cash Tokes - Cashout • $/d */}
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-800">Cash Tokes - {money(tokesCash)}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-medium text-slate-800">{`$${num(perDown)}/d`}</span>
                  </div>
                  {/* Line 4: Tournament Tokes - Tournament total • $/td */}
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-800">Tournament Tokes - {money(tournamentTokes)}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-medium text-slate-800">{`$${num(perTDown)}/td`}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Date + Casino */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-slate-600">Date</label>
          <input
            className="input h-10"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">Casino / Room</label>
          <input
            list="rooms"
            className="input h-10"
            value={casino}
            onChange={(e) => setCasino(e.target.value)}
            placeholder="Wind Creek"
          />
          <datalist id="rooms">
            {rooms.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Hourly Rate (conditional) */}
      {includeHourly && (
        <div>
          <label className="text-xs text-slate-600">Hourly Rate</label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
              $
            </span>
            <input
              className="input w-28 pl-6"
              type="text"
              inputMode="decimal"
              value={hourlyRateStr}
              onFocus={() => hourlyRateStr === '0' && setHourlyRateStr('')}
              onChange={(e) => setHourlyRateStr(cleanDecimal(e.target.value))}
              onBlur={(e) => {
                const n = parseNum(e.target.value);
                setHourlyRateStr(fmtNum(Math.max(0, n)));
              }}
              placeholder="0"
            />
          </div>
        </div>
      )}

      {/* Hours / Downs / Cashout */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="text-xs text-slate-600">Hours Worked</label>
          <input
            className="input"
            type="text"
            inputMode="decimal"
            value={hoursStr}
            onFocus={() => hoursStr === '0' && setHoursStr('')}
            onChange={(e) => setHoursStr(cleanDecimal(e.target.value))}
            onBlur={(e) => {
              const n = parseNum(e.target.value);
              if (n <= 0) setHoursStr('0');
              else setHoursStr(fmtNum(Math.max(0.25, ceilQuarter(n))));
            }}
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">Cash Downs Dealt</label>
          <input
            className="input"
            type="text"
            inputMode="decimal"
            value={downsStr}
            onFocus={() => downsStr === '0' && setDownsStr('')}
            onChange={(e) => setDownsStr(cleanDecimal(e.target.value))}
            onBlur={(e) => {
              const n = parseNum(e.target.value);
              if (n < 0) setDownsStr('0');
              else setDownsStr(fmtNum(Math.max(0, ceilQuarter(n))));
            }}
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">Cashout (no tournament)</label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
              $
            </span>
            <input
              className="input pl-6"
              type="text"
              inputMode="numeric"
              value={cashoutStr}
              onFocus={() => cashoutStr === '0' && setCashoutStr('')}
              onChange={(e) => setCashoutStr(e.target.value.replace(/[^\d]/g, ''))}
              onBlur={(e) =>
                setCashoutStr(String(Math.max(0, Math.ceil(parseNum(e.target.value)))))
              }
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Tournament fields (conditional) */}
      {includeTourney && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs text-slate-600">Tournament Downs</label>
            <input
              className="input"
              type="text"
              inputMode="decimal"
              value={tourneyDownsStr}
              onFocus={() => tourneyDownsStr === '0' && setTourneyDownsStr('')}
              onChange={(e) => setTourneyDownsStr(cleanDecimal(e.target.value))}
              onBlur={(e) => {
                const n = parseNum(e.target.value);
                setTourneyDownsStr(fmtNum(Math.max(0, n)));
              }}
              placeholder="0"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Tournament $/down</label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
                $
              </span>
              <input
                className="input w-28 pl-6"
                type="text"
                inputMode="decimal"
                value={tourneyRateStr}
                onFocus={() => tourneyRateStr === '0' && setTourneyRateStr('')}
                onChange={(e) => setTourneyRateStr(cleanDecimal(e.target.value))}
                onBlur={(e) => {
                  const n = parseNum(e.target.value);
                  setTourneyRateStr(fmtNum(Math.max(0, n)));
                }}
                placeholder="0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="text-xs text-slate-600">Notes</label>
        <textarea
          className="textarea"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional"
        />
      </div>

      {/* Actions: Enter (left) | Clear + Cancel (right) */}
      <div className="flex items-center justify-between gap-2">
        <button className="btn btn-primary" onClick={create} disabled={saving}>
          {saving ? 'Creating…' : 'Enter'}
        </button>
        <div className="flex items-center gap-2">
          <button className="btn" type="button" onClick={clearForm} aria-label="Clear form">
            Clear
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => router.push('/')}
            aria-label="Cancel and go home"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

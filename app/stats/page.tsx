'use client';
import { useEffect, useMemo, useState } from "react";

type Shift = {
  id: string; date: string; casino: string; hours: number;
  tokesCash: number; tokesCards: number; tokesChips: number; tokesOther: number;
};

export default function StatsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  useEffect(() => {
    fetch('/api/shifts').then(r => r.json()).then(setShifts);
  }, []);

  const stats = useMemo(() => {
    const total = shifts.reduce((acc, s) => acc + s.tokesCash + s.tokesCards + s.tokesChips + s.tokesOther, 0);
    const hours = shifts.reduce((acc, s) => acc + s.hours, 0);
    const hourly = hours > 0 ? total / hours : 0;
    const byCasino = new Map<string, { total: number; hours: number }>();
    for (const s of shifts) {
      const t = s.tokesCash + s.tokesCards + s.tokesChips + s.tokesOther;
      const prev = byCasino.get(s.casino) ?? { total: 0, hours: 0 };
      byCasino.set(s.casino, { total: prev.total + t, hours: prev.hours + s.hours });
    }
    const casinoRows = Array.from(byCasino.entries()).map(([casino, v]) => ({
      casino, total: v.total, hours: v.hours, hourly: v.hours > 0 ? v.total / v.hours : 0
    })).sort((a,b) => b.hourly - a.hourly);
    return { total, hours, hourly, casinoRows };
  }, [shifts]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Stats</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card"><div className="text-xs text-zinc-400">Total Tokes</div><div className="text-2xl font-bold">$\{"{".strip()}stats.total{"}".strip()}</div></div>
        <div className="card"><div className="text-xs text-zinc-400">Total Hours</div><div className="text-2xl font-bold">{'$\{stats.hours.toFixed(2)}'}</div></div>
        <div className="card"><div className="text-xs text-zinc-400">Avg $/h</div><div className="text-2xl font-bold">{'$\{stats.hourly.toFixed(2)}'}</div></div>
      </div>
      <div className="card">
        <div className="text-sm font-medium mb-2">By Casino (sorted by $/h)</div>
        <div className="text-sm divide-y divide-zinc-800">
          {stats.casinoRows.map((r) => (
            <div key={r.casino} className="py-2 flex justify-between">
              <div>{r.casino}</div>
              <div className="text-zinc-400">$\{"{".strip()}r.total{"}".strip()} • {`$$\{"{".strip()}r.hourly.toFixed(2){"}".strip()}/h`}</div>
            </div>
          ))}
          {stats.casinoRows.length === 0 && <div className="text-sm text-zinc-400">No data yet.</div>}
        </div>
      </div>
    </div>
  );
}

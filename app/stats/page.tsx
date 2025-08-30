"use client";
import { useEffect, useMemo, useState } from "react";

type Shift = {
  id: string;
  date: string;
  casino: string;
  hours: number;
  tokesCash: number;
  downs: number;
};

export default function StatsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    fetch("/api/shifts").then((r) => r.json()).then(setShifts);
  }, []);

  const stats = useMemo(() => {
    const total = shifts.reduce((acc, s) => acc + s.tokesCash, 0);
    const hours = shifts.reduce((acc, s) => acc + s.hours, 0);
    const downs = shifts.reduce((acc, s) => acc + s.downs, 0);
    const hourly = hours > 0 ? total / hours : 0;
    const perDown = downs > 0 ? total / downs : 0;

    const byCasino = new Map<string, { total: number; hours: number; downs: number }>();
    for (const s of shifts) {
      const prev = byCasino.get(s.casino) ?? { total: 0, hours: 0, downs: 0 };
      byCasino.set(s.casino, {
        total: prev.total + s.tokesCash,
        hours: prev.hours + s.hours,
        downs: prev.downs + s.downs,
      });
    }
    const casinoRows = Array.from(byCasino.entries()).map(([casino, v]) => ({
      casino,
      total: v.total,
      hours: v.hours,
      downs: v.downs,
      hourly: v.hours > 0 ? v.total / v.hours : 0,
      perDown: v.downs > 0 ? v.total / v.downs : 0,
    })).sort((a, b) => b.hourly - a.hourly);

    return { total, hours, downs, hourly, perDown, casinoRows };
  }, [shifts]);

  const money = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-center sm:text-left">Stats</h2>

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <div className="text-xs text-zinc-400">Total Tokes</div>
          <div className="text-2xl font-bold">${money(stats.total)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-zinc-400">Total Hours</div>
          <div className="text-2xl font-bold">{stats.hours.toFixed(2)}</div>
          <div className="text-xs text-zinc-500 mt-1">Downs: {stats.downs}</div>
        </div>
        <div className="card">
          <div className="text-xs text-zinc-400">Avg $/h</div>
          <div className="text-2xl font-bold">{stats.hourly.toFixed(2)}</div>
          <div className="text-xs text-zinc-500 mt-1">$/down: {stats.perDown.toFixed(2)}</div>
        </div>
      </div>

      {/* By Casino with bordered rows */}
      <div className="card">
        <div className="text-sm font-medium mb-2">By Casino (sorted by $/h)</div>
        <div className="grid gap-2">
          {stats.casinoRows.length === 0 && (
            <div className="text-sm text-zinc-400">No data yet.</div>
          )}
          {stats.casinoRows.map((r) => (
            <div
              key={r.casino}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
            >
              <div className="font-medium">{r.casino}</div>
              <div className="text-zinc-400 text-sm">
                ${money(r.total)} • ${r.hourly.toFixed(2)}/h • ${r.perDown.toFixed(2)}/down
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

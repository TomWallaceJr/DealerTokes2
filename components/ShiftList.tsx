// components/ShiftList.tsx
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Shift = {
  id: string;
  date: string;      // ISO string
  casino: string;
  hours: number;
  tokesCash: number;
  downs: number;
  notes?: string | null;
  // Optional (present if your API returns them)
  clockIn?: string;
  clockOut?: string;
};

export default function ShiftList() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/shifts", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setShifts(data);
    } catch (e) {
      setError("Failed to load shifts. Try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-medium">Shifts</h2>
        <button className="btn" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="mb-2 text-sm text-red-400">{error}</div>}

      <div className="space-y-2">
        {loading && shifts.length === 0 && (
          <div className="text-sm text-zinc-400">Loading…</div>
        )}

        {shifts.map((s) => {
          const total = s.tokesCash;
          const perHour = s.hours > 0 ? total / s.hours : 0;
          const perDown = s.downs > 0 ? total / s.downs : 0;

          return (
            <Link
              key={s.id}
              href={`/shifts/${s.id}`}
              className="block rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 transition hover:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
                <div>
                  <div className="font-medium">
                    {new Date(s.date).toLocaleDateString()} • {s.casino}
                  </div>
                  <div className="text-zinc-400">
                    {s.hours}h, {s.downs} downs • ${total} total • $
                    {perHour.toFixed(2)}/h • ${perDown.toFixed(2)}/down
                  </div>
                </div>

                {s.notes ? (
                  <div className="max-w-sm text-xs text-zinc-400">{s.notes}</div>
                ) : (
                  <span
                    aria-hidden
                    className="ml-auto text-zinc-500 sm:ml-0"
                    title="Edit"
                  >
                    →
                  </span>
                )}
              </div>
            </Link>
          );
        })}

        {shifts.length === 0 && !loading && !error && (
          <div className="text-sm text-zinc-400">
            No shifts yet. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
}

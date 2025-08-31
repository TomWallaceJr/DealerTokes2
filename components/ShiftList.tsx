// components/ShiftList.tsx
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Shift = {
  id: string;
  date: string; // ISO
  casino: string;
  hours: number;
  tokesCash: number;
  downs: number;
  notes?: string | null;
};

type PageResp = {
  items: Shift[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
};

const PAGE_SIZE = 20;

export default function ShiftList() {
  const router = useRouter();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchPage(nextOffset: number, append = false) {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(nextOffset) });
    const res = await fetch(`/api/shifts?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: PageResp = await res.json();
    setHasMore(data.hasMore);
    setOffset(data.offset + data.items.length);
    setShifts((prev) => (append ? [...prev, ...data.items] : data.items));
  }

  async function initialLoad() {
    try {
      setLoading(true);
      setError(null);
      await fetchPage(0, false);
    } catch {
      setError('Failed to load shifts. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    try {
      setLoadingMore(true);
      await fetchPage(offset, true);
    } catch {
      setError('Failed to load more shifts.');
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    initialLoad();
  }, []);

  async function removeShift(id: string) {
    if (!confirm('Delete this shift? This cannot be undone.')) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setShifts((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert('Failed to delete shift.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-medium">Shifts</h2>
        <div className="flex gap-2">
          <button className="btn" onClick={initialLoad} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="btn" onClick={() => router.back()}>
            Back
          </button>
        </div>
      </div>

      {error && <div className="mb-2 text-sm text-red-400">{error}</div>}

      <div className="space-y-2">
        {loading && shifts.length === 0 && <div className="text-sm text-zinc-400">Loading…</div>}

        {shifts.map((s) => {
          const total = s.tokesCash;
          const perHour = s.hours > 0 ? total / s.hours : 0;
          const perDown = s.downs > 0 ? total / s.downs : 0;

          return (
            <div
              key={s.id}
              className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30 transition hover:bg-zinc-900/50"
            >
              {/* Delete */}
              <button
                className="absolute top-2 right-2 rounded p-1 text-zinc-400 hover:bg-red-900/20 hover:text-red-400 focus:ring-2 focus:ring-red-500 focus:outline-none"
                title="Delete shift"
                aria-label="Delete shift"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeShift(s.id);
                }}
                disabled={deletingId === s.id}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>

              {/* Clickable content → Edit page */}
              <Link href={`/shifts/${s.id}`} className="block p-3 pr-10">
                <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
                  <div>
                    <div className="font-medium">
                      {new Date(s.date).toLocaleDateString()} • {s.casino}
                    </div>
                    <div className="text-zinc-400">
                      {s.hours}h, {s.downs} downs • ${total} total • ${perHour.toFixed(2)}/h • $
                      {perDown.toFixed(2)}/down
                    </div>
                  </div>
                  {s.notes ? <div className="max-w-sm text-xs text-zinc-400">{s.notes}</div> : null}
                </div>
              </Link>
            </div>
          );
        })}

        {shifts.length === 0 && !loading && !error && (
          <div className="text-sm text-zinc-400">No shifts yet. Add one to get started.</div>
        )}
      </div>

      {/* Bottom-right "more…" */}
      <div className="mt-3 flex justify-end">
        {hasMore && (
          <button
            onClick={loadMore}
            className="text-sm text-slate-300 hover:underline disabled:opacity-50"
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading…' : 'more…'}
          </button>
        )}
      </div>
    </div>
  );
}

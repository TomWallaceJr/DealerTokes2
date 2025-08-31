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

// formatters
const money = (n: number) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

const num = (n: number, digits = 2) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recent Shifts</h2>
          <p className="mt-0.5 text-xs text-slate-600">Select a shift to edit or delete.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button className="btn" onClick={initialLoad} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link href="/" className="btn btn-outline">
            Back
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {loading && shifts.length === 0 && <div className="text-sm text-slate-600">Loading…</div>}

        {shifts.map((s) => {
          const total = s.tokesCash ?? 0;
          const perHour = s.hours > 0 ? total / s.hours : 0;
          const perDown = s.downs > 0 ? total / s.downs : 0;

          return (
            <div key={s.id} className="relative">
              {/* Delete button */}
              <button
                className="absolute top-2 right-2 rounded-full p-2 text-rose-600 ring-1 ring-rose-200/70 hover:bg-rose-50 focus:ring-2 focus:ring-rose-500 focus:outline-none disabled:opacity-50"
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
                  aria-hidden="true"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>

              {/* Clickable card → Edit page */}
              <Link href={`/shifts/${s.id}`} className="block" prefetch={false}>
                <div className="card pr-12 transition hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
                    <div>
                      <div className="font-medium text-slate-900">
                        {new Date(s.date).toLocaleDateString()} • {s.casino}
                      </div>
                      <div className="text-slate-600">
                        {num(s.hours, 2)}h, {s.downs} downs • {money(total)} total • ${num(perHour)}
                        /h • ${num(perDown)}/down
                      </div>
                    </div>
                    {s.notes ? (
                      <div className="max-w-sm text-xs text-slate-600">{s.notes}</div>
                    ) : null}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}

        {shifts.length === 0 && !loading && !error && (
          <div className="text-sm text-slate-600">No shifts yet. Log one to get started.</div>
        )}
      </div>

      {/* Bottom-right "more…" */}
      <div className="mt-3 flex justify-end">
        {hasMore && (
          <button
            onClick={loadMore}
            className="chip hover:underline disabled:opacity-50"
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading…' : 'more…'}
          </button>
        )}
      </div>
    </div>
  );
}

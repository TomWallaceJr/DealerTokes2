// ============================================================================
// File: /components/ShiftList.tsx
// Purpose: Client list view; robust to both PageResp and array API shapes
// - Fetches /api/shifts?limit&offset
// - Shows newest first (API already sorted desc)
// ============================================================================
'use client';

import { dateUTC } from '@/lib/date';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import BackButton from './BackButton';

type Shift = {
  id: string;
  date: string; // YYYY-MM-DD
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

function normalizeItems(json: any): {
  items: Shift[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
} {
  if (json && Array.isArray(json.items)) {
    return {
      items: json.items as Shift[],
      total: Number(json.total ?? json.items.length),
      hasMore: Boolean(json.hasMore ?? false),
      limit: Number(json.limit ?? PAGE_SIZE),
      offset: Number(json.offset ?? 0),
    };
  }
  if (Array.isArray(json)) {
    return {
      items: json as Shift[],
      total: json.length,
      hasMore: false,
      limit: PAGE_SIZE,
      offset: 0,
    };
  }
  return { items: [], total: 0, hasMore: false, limit: PAGE_SIZE, offset: 0 };
}

export default function ShiftList() {
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
    const raw = await res.json();
    const page = normalizeItems(raw);

    setHasMore(page.hasMore);
    setOffset(page.offset + page.items.length);
    setShifts((prev) => (append ? [...prev, ...page.items] : page.items));
  }

  async function initialLoad() {
    try {
      setLoading(true);
      setError(null);
      await fetchPage(0, false);
    } catch (e) {
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
    initialLoad(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
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
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Logged Shifts</h2>
          <span className="stat hidden sm:inline-flex">Newest first</span>
        </div>
        <div className="flex shrink-0 gap-2">
          <button className="btn" onClick={initialLoad} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <BackButton title="Back" aria-label="Go back" />
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
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
                className="absolute top-2 right-2 rounded-full p-2 text-rose-600 ring-1 ring-rose-200/70 transition hover:bg-rose-50 focus:ring-2 focus:ring-rose-500 focus:outline-none disabled:opacity-50"
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
              <Link href={`/shifts/${s.id}`} className="group block" prefetch={false}>
                <div className="card pr-12 transition hover:shadow-md hover:ring-1 hover:ring-emerald-300/50">
                  <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
                    <div>
                      <div className="flex items-center gap-2 font-medium text-slate-900">
                        <span>{dateUTC(s.date)}</span>
                        <span className="text-slate-400">•</span>
                        <span>{s.casino}</span>
                      </div>
                      <div className="mt-0.5 text-slate-600">
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
          <div className="rounded-xl border border-slate-200 bg-white/70 p-4 text-center text-sm text-slate-600">
            No shifts yet. Log one to get started.
          </div>
        )}
      </div>

      {/* Bottom "more…" */}
      <div className="mt-4 flex justify-center">
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

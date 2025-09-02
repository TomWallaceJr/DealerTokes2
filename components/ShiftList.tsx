// ============================================================================
// File: /components/ShiftList.tsx
// Purpose: Client list view; robust to both PageResp and array API shapes
// - Fetches /api/shifts?limit&offset
// - Shows newest first (API already sorted desc)
// ============================================================================
'use client';

import BackButton from './BackButton';
import ShiftListItem from './ShiftListItem';
import { useShiftList } from '@/hooks/useShiftList';

export default function ShiftList() {
  const { items, hasMore, loading, loadingMore, error, refresh, loadMore } = useShiftList();

  return (
    <div className="card mt-3 sm:mt-0">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Recent Shifts</h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Select a shift to view, edit, or delete
            </p>
          </div>
          <span className="stat hidden sm:inline-flex">Newest first</span>
        </div>
        <div className="flex shrink-0 gap-2">
          <button className="btn" onClick={refresh} disabled={loading}>
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
        {loading && items.length === 0 && <div className="text-sm text-slate-600">Loading…</div>}

        {items.map((s) => (
          <ShiftListItem key={s.id} shift={s} onDelete={() => {}} deleting={false} />
        ))}

        {items.length === 0 && !loading && !error && (
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

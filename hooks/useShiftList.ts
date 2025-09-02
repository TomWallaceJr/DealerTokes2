// hooks/useShiftList.ts
'use client';

import { useCallback, useEffect, useState } from 'react';

export type Shift = {
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

function normalize(json: any): PageResp {
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
    return { items: json as Shift[], total: json.length, hasMore: false, limit: PAGE_SIZE, offset: 0 };
  }
  return { items: [], total: 0, hasMore: false, limit: PAGE_SIZE, offset: 0 };
}

export function useShiftList() {
  const [items, setItems] = useState<Shift[]>();
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPage = useCallback(async (nextOffset: number, append = false) => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(nextOffset) });
    const res = await fetch(`/api/shifts?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    const page = normalize(raw);
    setHasMore(page.hasMore);
    setOffset(page.offset + page.items.length);
    setItems((prev) => (append && prev ? [...prev, ...page.items] : page.items));
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchPage(0, false);
    } catch (e) {
      setError('Failed to load shifts. Try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    try {
      setLoadingMore(true);
      await fetchPage(offset, true);
    } catch {
      setError('Failed to load more shifts.');
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, offset]);

  const remove = useCallback(async (id: string) => {
    if (!confirm('Delete this shift? This cannot be undone.')) return false;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setItems((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
      return true;
    } catch {
      alert('Failed to delete shift.');
      return false;
    } finally {
      setDeletingId(null);
    }
  }, []);

  useEffect(() => {
    // initial load
    refresh();
  }, [refresh]);

  return { items: items ?? [], hasMore, loading, loadingMore, error, deletingId, refresh, loadMore, remove };
}


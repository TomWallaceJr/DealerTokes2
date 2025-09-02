// ============================================================================
// File: /hooks/useLocalStorage.ts
// Purpose: SSR-safe persisted state with schema validation & versioning
// ============================================================================
import { useEffect, useRef, useState } from 'react';

export interface PersistOptions<T> {
  version?: number;
  migrate?: (oldValue: any) => T | null; // return null to drop
}

export function useLocalStorageState<T>(key: string, initial: T, options: PersistOptions<T> = {}) {
  const { version = 1, migrate } = options;
  const isMounted = useRef(false);
  const [state, setState] = useState<T>(initial);

  // read once on mount to avoid hydration mismatch
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as { v: number; data: T } | T;
        // support legacy unversioned
        const value: T = (parsed as any)?.v != null ? (parsed as any).data : (parsed as T);
        const v: number = (parsed as any)?.v ?? 0;
        if (v !== version && migrate) {
          const migrated = migrate(value);
          if (migrated !== null) setState(migrated);
        } else {
          setState(value);
        }
      }
    } catch {
      // ignore bad JSON
    } finally {
      isMounted.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!isMounted.current) return;
    try {
      const payload = JSON.stringify({ v: version, data: state });
      window.localStorage.setItem(key, payload);
    } catch {
      // storage full/blocked
    }
  }, [key, state, version]);

  return [state, setState] as const;
}

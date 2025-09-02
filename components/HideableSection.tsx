// ============================================================================
// File: /components/HideableSection.tsx
// Purpose: Consistent, accessible hide/show sections with persisted state
// ============================================================================
'use client';
import { useLocalStorageState } from '@/hooks/useLocalStorage';
import { Eye, EyeOff, MoreHorizontal } from 'lucide-react';
import { useId } from 'react';

export interface HideableSectionProps {
  id: string; // stable id
  title: string;
  children: React.ReactNode;
  defaultHidden?: boolean;
}

export function HideableSection({
  id,
  title,
  children,
  defaultHidden = false,
}: HideableSectionProps) {
  const [hiddenMap, setHiddenMap] = useLocalStorageState<Record<string, boolean>>(
    'ui.hidden.sections',
    {},
    {
      version: 1,
      migrate: (old) => (typeof old === 'object' && old ? old : {}),
    },
  );
  const sectionHidden = hiddenMap[id] ?? defaultHidden;
  const labelId = useId();

  function toggleHidden(next?: boolean) {
    const value = next ?? !sectionHidden;
    setHiddenMap({ ...hiddenMap, [id]: value });
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-2 p-3">
        <h3 id={labelId} className="text-base font-semibold">
          {title}
        </h3>
        <div className="flex items-center gap-1">
          <button
            className="rounded-lg p-2 hover:bg-gray-100"
            aria-pressed={sectionHidden}
            aria-label={sectionHidden ? 'Show section' : 'Hide section'}
            onClick={() => toggleHidden()}
            title={sectionHidden ? 'Show' : 'Hide'}
          >
            {sectionHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button
            className="rounded-lg p-2 hover:bg-gray-100"
            aria-label="Section options"
            title="Options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>
      <div
        aria-labelledby={labelId}
        className={
          'grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-in-out ' +
          (sectionHidden ? '' : 'grid-rows-[1fr]')
        }
      >
        <div className="overflow-hidden p-3">{children}</div>
      </div>
    </section>
  );
}

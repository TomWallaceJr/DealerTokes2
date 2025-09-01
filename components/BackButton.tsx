// components/BackButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export default function BackButton({ className = '' }: { className?: string }) {
  const router = useRouter();
  const goBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/');
  }, [router]);

  return (
    <button
      type="button"
      onClick={goBack}
      className={[
        // compact on mobile, full on sm+
        'btn btn-ghost h-9 w-9 shrink-0 justify-center gap-0 px-0',
        'sm:h-auto sm:w-auto sm:gap-2 sm:px-3.5',
        className,
      ].join(' ')}
      title="Back"
      aria-label="Go back"
    >
      {/* chevron-left icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </svg>
      <span className="hidden sm:inline">Back</span>
    </button>
  );
}

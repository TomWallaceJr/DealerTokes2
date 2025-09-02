// ============================================================================
// File: /components/BackButton.tsx
// Purpose: Accept standard <button> props (title, aria-*, etc.) & forward them
// ============================================================================
'use client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

export type BackButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function BackButton({ className, children, onClick, ...rest }: BackButtonProps) {
  const router = useRouter();
  return (
    <button
      type="button"
      {...rest}
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        router.back();
      }}
    >
      {children ?? <ArrowLeft className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}

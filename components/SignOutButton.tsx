// components/SignOutButton.tsx
'use client';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

export default function SignOutButton() {
  const [submitting, setSubmitting] = useState(false);

  return (
    <button
      className="btn btn-ghost"
      aria-label="Sign out"
      onClick={async () => {
        if (submitting) return;
        setSubmitting(true);
        await signOut({ callbackUrl: '/' });
      }}
      disabled={submitting}
    >
      {/* door icon */}
      <svg
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
        <path d="M3 21h18" />
        <path d="M14 21V3a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18" />
        <path d="M20 14l2-2-2-2" />
        <path d="M14 12h8" />
      </svg>
      <span>{submitting ? 'Signing out…' : 'Sign out'}</span>
    </button>
  );
}

// components/HeaderRight.tsx
'use client';

import SignOutButton from '@/components/SignOutButton';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

function SignOutIconButton() {
  return (
    <button
      type="button"
      onClick={() => signOut()}
      className="btn btn-ghost h-9 w-9 shrink-0 justify-center px-0 sm:hidden"
      title="Sign out"
      aria-label="Sign out"
    >
      {/* log-out icon */}
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
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
    </button>
  );
}

function SignInIconLink() {
  return (
    <Link
      href="/auth/signin"
      className="btn btn-ghost h-9 w-9 shrink-0 justify-center px-0 sm:hidden"
      title="Sign in"
      aria-label="Sign in"
    >
      {/* log-in icon */}
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
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
      </svg>
    </Link>
  );
}

export default function HeaderRight() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {loading ? null : session ? (
        <>
          <SignOutIconButton />
          {/* Full button on sm+ */}
          <div className="hidden sm:inline-flex">
            <SignOutButton />
          </div>
        </>
      ) : (
        <>
          {/* Icon-only sign in on mobile */}
          <SignInIconLink />
          {/* Full button on sm+ */}
          <Link href="/auth/signin" className="btn btn-outline hidden sm:inline-flex">
            Sign in
          </Link>
        </>
      )}
    </div>
  );
}

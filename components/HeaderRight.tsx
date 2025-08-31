// components/HeaderRight.tsx
'use client';

import SignOutButton from '@/components/SignOutButton';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function HeaderRight() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  return (
    <div className="flex items-center gap-2">
      {loading ? null : session ? (
        <SignOutButton />
      ) : (
        <Link href="/auth/signin" className="btn btn-outline">
          Sign in
        </Link>
      )}
    </div>
  );
}

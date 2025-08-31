// components/DemoSignInButton.tsx
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

const DEMO_EMAIL = 'example@example.com';
const DEMO_PASSWORD = 'Demo123!';

export default function DemoSignInButton() {
  const [loading, setLoading] = useState(false);

  return (
    <button
      className="btn btn-ghost w-full sm:w-auto"
      onClick={async () => {
        if (loading) return;
        setLoading(true);
        await signIn('credentials', {
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          callbackUrl: '/',
          redirect: true,
        });
        setLoading(false);
      }}
      disabled={loading}
      aria-label="Use demo account"
      title={`Sign in as ${DEMO_EMAIL}`}
    >
      {loading ? 'Signing in…' : 'Use demo account'}
    </button>
  );
}

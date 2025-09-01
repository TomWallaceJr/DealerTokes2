// app/auth/signin/page.tsx
'use client';

import BackButton from '@/components/BackButton';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

export default function SignInPage() {
  const q = useSearchParams();
  const callbackUrl = q.get('callbackUrl') || '/';
  const errorParam = q.get('error');

  const errorMsg = useMemo(() => {
    if (!errorParam) return null;
    // Map NextAuth error codes to user-friendly text
    if (errorParam === 'CredentialsSignin') return 'Invalid email or password.';
    return 'Sign in failed. Please try again.';
  }, [errorParam]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Redirect handled by NextAuth
    await signIn('credentials', { email, password, callbackUrl, redirect: true });
    // If credentials are wrong, NextAuth redirects back with ?error=...
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-md">
      <div className="card relative">
        {/* Back top-right */}
        <div className="absolute top-3 right-3">
          <BackButton />
        </div>

        {/* Header */}
        <header className="mb-4 pr-12">
          <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-600">
            Welcome back. Enter your details to continue.
          </p>
        </header>

        {/* Error */}
        {errorMsg && (
          <div
            role="alert"
            className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form className="space-y-3" onSubmit={onSubmit} noValidate>
          <div>
            <label htmlFor="email" className="text-xs text-slate-600">
              Email
            </label>
            <input
              id="email"
              className="input h-11"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              aria-invalid={!!errorMsg || undefined}
            />
          </div>

          <div>
            <label htmlFor="password" className="text-xs text-slate-600">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                className="input h-11 pr-10"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                aria-invalid={!!errorMsg || undefined}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute inset-y-0 right-0 my-1 mr-1 inline-flex items-center justify-center rounded-lg px-2 text-slate-500 hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {/* eye / eye-off */}
                {showPw ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.74-1.7 1.82-3.26 3.2-4.57M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a11.7 11.7 0 0 1-2.06 3.34M1 1l22 22" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            className="btn btn-primary h-11 w-full"
            disabled={loading}
            type="submit"
            aria-busy={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Footer actions */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
          <span>
            No account?{' '}
            <Link className="link" href="/auth/signup">
              Create one
            </Link>
          </span>
          {/* Optional placeholder for "Forgot password?" if/when you add it */}
          <Link
            href="#"
            aria-disabled="true"
            tabIndex={-1}
            className="link pointer-events-none cursor-not-allowed opacity-60"
            title="Coming soon"
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </main>
  );
}

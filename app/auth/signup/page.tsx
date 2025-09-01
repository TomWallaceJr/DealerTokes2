// app/auth/signup/page.tsx
'use client';

import BackButton from '@/components/BackButton';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const SIGNUP_ENDPOINT = '/api/signup';

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pwOk = pw.length >= 8; // keep 8+ client-side
  const match = pw === pw2;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!name.trim() || !email.trim()) {
      setErr('Please provide your name and email.');
      return;
    }
    if (!pwOk) {
      setErr('Password must be at least 8 characters.');
      return;
    }
    if (!match) {
      setErr('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(SIGNUP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password: pw }),
      });

      if (!res.ok) {
        // API may return {error: "..."} or {error: {fieldErrors: ...}}
        let msg = `Sign up failed (HTTP ${res.status})`;
        try {
          const data = await res.json();
          if (typeof data?.error === 'string') msg = data.error;
        } catch {}
        throw new Error(msg);
      }

      // Optional: auto sign-in after signup using Credentials
      const signInRes = await signIn('credentials', {
        email,
        password: pw,
        redirect: false,
      });

      if (signInRes?.error) {
        // If credentials provider isn’t set up, send them to Sign In
        router.push('/auth/signin');
      } else {
        router.push('/');
      }
    } catch (e: any) {
      setErr(e?.message || 'Sign up failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md">
      <div className="card space-y-4">
        <header className="mb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
              <p className="mt-1 text-sm text-slate-600">
                One minute to set up. You can edit everything later.
              </p>
            </div>

            {/* Right-aligned Back */}
            <div className="-mt-1 shrink-0">
              <BackButton />
            </div>
          </div>
        </header>

        {err && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-600">Name</label>
            <input
              className="input mt-1"
              type="text"
              autoComplete="name"
              placeholder="Jane Dealer"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Email</label>
            <input
              className="input mt-1"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Password</label>
            <div className="relative mt-1">
              <input
                className="input pr-10"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
              <button
                type="button"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded px-2 text-slate-500 hover:text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">At least 8 characters.</p>
          </div>

          <div>
            <label className="text-xs text-slate-600">Re-enter password</label>
            <div className="relative mt-1">
              <input
                className={`input pr-10 ${pw2 && !match ? 'ring-2 ring-rose-500' : ''}`}
                type={showPw2 ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
              />
              <button
                type="button"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded px-2 text-slate-500 hover:text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                onClick={() => setShowPw2((s) => !s)}
                aria-label={showPw2 ? 'Hide password' : 'Show password'}
              >
                {showPw2 ? 'Hide' : 'Show'}
              </button>
            </div>
            {!match && pw2.length > 0 && (
              <p className="mt-1 text-[11px] text-rose-600">Passwords do not match.</p>
            )}
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/auth/signin" className="link">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}

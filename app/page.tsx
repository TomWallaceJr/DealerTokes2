// app/page.tsx
import HomeQuickActions from '@/components/HomeQuickActions';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import Link from 'next/link';

function displayName(name?: string | null, email?: string | null) {
  const n = (name ?? '').trim();
  if (n) return n.split(/\s+/)[0];
  if (email) return email.split('@')[0];
  return 'there';
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const userName = displayName(session?.user?.name, session?.user?.email);

  if (!session) {
    return (
      <main className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome</h1>
        <div className="card space-y-3">
          <p className="text-sm text-slate-600">
            Track downs and cash tokes with a clean, fast workflow. Create an account or sign in to
            get started.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/auth/signup" className="btn btn-primary w-full sm:w-auto">
              Create Account
            </Link>
            <Link href="/auth/signin" className="btn w-full sm:w-auto">
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Welcome Back {userName}</h1>
      <HomeQuickActions />
    </main>
  );
}

// app/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function displayName(name?: string | null, email?: string | null) {
  const n = (name ?? "").trim();
  if (n) return n.split(/\s+/)[0];
  if (email) return email.split("@")[0];
  return "there";
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const userName = displayName(session?.user?.name, session?.user?.email);

  if (!session) {
    return (
      <main className="space-y-6">
        <h1 className="text-2xl font-semibold">Welcome</h1>
        <div className="card space-y-3">
          <p className="text-sm text-slate-300">
            Track your downs, cash tokes, and more. Create an account or sign in to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/auth/signup" className="btn w-full sm:w-auto">Create Account</Link>
            <Link href="/auth/signin" className="btn w-full sm:w-auto">Sign In</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Welcome Back {userName}</h1>

      {/* Action cards in requested order */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* 1) New Shift */}
        <Link href="/shifts/new" className="card hover:bg-slate-800/70 transition">
          <div className="text-sm text-slate-400">Log</div>
          <div className="text-lg font-medium">New Shift</div>
        </Link>

        {/* 2) Recent Shifts */}
        <Link href="/shifts" className="card hover:bg-slate-800/70 transition">
          <div className="text-sm text-slate-400">View/Edit</div>
          <div className="text-lg font-medium">Recent Shifts</div>
        </Link>

        {/* 3) Income Stats */}
        <Link href="/stats" className="card hover:bg-slate-800/70 transition">
          <div className="text-sm text-slate-400">View</div>
          <div className="text-lg font-medium">Income Stats</div>
        </Link>
      </div>
    </main>
  );
}

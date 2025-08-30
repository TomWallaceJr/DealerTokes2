// app/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="space-y-4">
        <div className="card">
          <h2 className="text-lg font-medium mb-2">Welcome to DealerTokes</h2>
          <p className="text-sm text-zinc-300">Create an account or sign in to get started.</p>
          <div className="mt-4 flex gap-3">
            <Link href="/auth/signin" className="btn">Sign in</Link>
            <Link href="/auth/signup" className="btn">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-lg font-medium mb-2">Welcome back</h2>
        <div className="mt-4 flex gap-3">
          <Link href="/shifts/new" className="btn">Log a Shift</Link>
          <Link href="/shifts" className="btn">View Shifts</Link>
          <Link href="/stats" className="btn">Stats</Link>
        </div>
      </div>
    </div>
  );
}

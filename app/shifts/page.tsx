// app/shifts/page.tsx
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import ShiftList from '@/components/ShiftList';
import { authOptions } from '@/lib/auth';

export default async function ShiftsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/signin');

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Recent Shifts</h1>
          <p className="mt-1 text-sm text-slate-600">Select a shift to edit or delete.</p>
        </div>
        <Link href="/" className="btn btn-outline">
          Home
        </Link>
      </div>

      <ShiftList />
    </main>
  );
}

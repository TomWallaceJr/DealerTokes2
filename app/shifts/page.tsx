// app/shifts/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import ShiftList from '@/components/ShiftList';
import { authOptions } from '@/lib/auth';

export default async function ShiftsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/signin');

  return (
    <main className="space-y-4">
      <ShiftList />
    </main>
  );
}

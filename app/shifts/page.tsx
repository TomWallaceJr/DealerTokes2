// ============================================================================
// File: /app/shifts/page.tsx
// Purpose: Server wrapper that requires auth and renders client ShiftList
// ============================================================================
import ShiftList from '@/components/ShiftList';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function ShiftsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/signin');
  return (
    <main className="space-y-4">
      <ShiftList />
    </main>
  );
}

// app/shifts/new/page.tsx
import ShiftForm from '@/components/ShiftForm';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

type SP = Record<string, string | string[] | undefined>;

const isYmd = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

export default async function NewShiftPage({ searchParams }: { searchParams: Promise<SP> }) {
  // Require auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/signin');

  // Next 15: searchParams is a Promise
  const sp = await searchParams;
  const raw = sp?.date;
  const dateParam = Array.isArray(raw) ? raw[0] : raw;
  const initialDate = isYmd(dateParam) ? dateParam : undefined;

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Log a Shift</h1>
      <ShiftForm initialDate={initialDate} />
    </main>
  );
}

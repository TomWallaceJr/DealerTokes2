// ============================================================================
// File: /app/shifts/new/page.tsx
// Purpose: Robust to Next 14/15 searchParams (object or Promise), passes initialDate
// ============================================================================
import ShiftForm from '@/components/ShiftForm';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

type SP = Record<string, string | string[] | undefined>;
const isYmd = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

export default async function NewShiftPage(props: { searchParams?: SP | Promise<SP> }) {
  // Require auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/signin');

  // Next 14: object / Next 15: Promise
  const sp =
    props.searchParams instanceof Promise ? await props.searchParams : (props.searchParams ?? {});
  const raw = sp?.date;
  const dateParam = Array.isArray(raw) ? raw[0] : raw;
  const initialDate = isYmd(dateParam) ? dateParam : undefined;

  return (
    <main className="space-y-4">
      <ShiftForm initialDate={initialDate} />
    </main>
  );
}

// app/shifts/new/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ShiftForm from "@/components/ShiftForm";

export default async function NewShiftPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin?callbackUrl=/shifts/new");
  }

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Input Shift</h1>
      <ShiftForm />
    </main>
  );
}

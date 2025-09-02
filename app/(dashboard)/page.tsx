// ============================================================================
// File: /app/(dashboard)/page.tsx  (example integration)
// Purpose: Demonstrates onboarding + hideable sections + empty state
// ============================================================================
import ClientOnly from '@/components/ClientOnly';
import { EmptyState } from '@/components/EmptyState';
import { HideableSection } from '@/components/HideableSection';
import Onboarding from '@/components/Onboarding';

export default async function DashboardPage() {
  // server component – fetch summary from DB if desired
  const initialHasShifts = true; // TODO: replace with DB check

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <ClientOnly>
        <Onboarding />
      </ClientOnly>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <HideableSection id="totals" title="Totals">
          {initialHasShifts ? (
            <div className="text-sm text-gray-700">Monthly totals will appear here…</div>
          ) : (
            <EmptyState />
          )}
        </HideableSection>
        <HideableSection id="hourly" title="Hourly">
          <div className="text-sm text-gray-700">Hourly chart placeholder…</div>
        </HideableSection>
        <HideableSection id="rooms" title="By Room">
          <div className="text-sm text-gray-700">Room breakdown placeholder…</div>
        </HideableSection>
      </div>
    </div>
  );
}

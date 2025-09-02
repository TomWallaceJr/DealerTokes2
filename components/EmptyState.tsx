// ============================================================================
// File: /components/EmptyState.tsx
// Purpose: Friendly empty state for first-time users
// ============================================================================
export function EmptyState({
  title = 'No shifts yet',
  cta,
  hint = "Click 'Add Shift' to create your first entry.",
}: {
  title?: string;
  hint?: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center">
      <p className="mb-2 text-lg font-medium">{title}</p>
      <p className="mb-4 text-sm text-gray-600">{hint}</p>
      {cta}
    </div>
  );
}

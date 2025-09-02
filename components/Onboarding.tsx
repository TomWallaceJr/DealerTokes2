// ============================================================================
// File: /components/Onboarding.tsx
// Purpose: First-visit guide modal; dismiss persists in localStorage
// ============================================================================
'use client';
import { useLocalStorageState } from '@/hooks/useLocalStorage';
import { X } from 'lucide-react';

export default function Onboarding() {
  const [seen, setSeen] = useLocalStorageState<boolean>('onboarding_seen', false, { version: 1 });
  if (seen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <button
          aria-label="Close"
          onClick={() => setSeen(true)}
          className="absolute top-3 right-3 rounded-full p-1 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="mb-2 text-xl font-semibold">Welcome to DownCount 👋</h2>
        <p className="mb-4 text-sm text-gray-600">
          Log shifts, track tokes, and see your hourly at a glance. Start by clicking{' '}
          <strong>Add Shift</strong>. Use the eye icons to show/hide dashboard cards. The calendar
          filters your view.
        </p>
        <ul className="mb-6 list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>Tap the dashboard sections’ ⋯ menu to hide/show.</li>
          <li>The Stat Bubble updates as you type in the Shift Editor.</li>
          <li>Your layout and preferences are remembered on this device.</li>
        </ul>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setSeen(true)}
            className="rounded-xl px-3 py-2 text-sm font-medium hover:underline"
          >
            Maybe later
          </button>
          <button
            onClick={() => setSeen(true)}
            className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow hover:bg-gray-800"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

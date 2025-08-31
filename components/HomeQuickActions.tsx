// components/HomeQuickActions.tsx
'use client';

import Link from 'next/link';

type CardProps = {
  href: string;
  title: string;
  subtitle: string;
  accent?: 'emerald' | 'sky' | 'indigo';
  icon?: React.ReactNode;
};

function ActionCard({ href, title, subtitle, accent = 'emerald', icon }: CardProps) {
  const accentRing =
    accent === 'emerald'
      ? 'ring-emerald-300/60 hover:ring-emerald-400/70'
      : accent === 'sky'
        ? 'ring-sky-300/60 hover:ring-sky-400/70'
        : 'ring-indigo-300/60 hover:ring-indigo-400/70';

  const blob =
    accent === 'emerald'
      ? 'from-emerald-300/40 to-emerald-400/30'
      : accent === 'sky'
        ? 'from-sky-300/40 to-sky-400/30'
        : 'from-indigo-300/40 to-indigo-400/30';

  return (
    <Link
      href={href}
      prefetch={false}
      className={[
        'relative block rounded-2xl bg-white/70 backdrop-blur',
        'border border-white/60 ring-1', // base ring
        accentRing, // colored ring
        'shadow-[0_8px_30px_rgba(0,0,0,0.06)]',
        'transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:ring-2 focus:outline-none',
        'p-4',
      ].join(' ')}
      aria-label={title}
    >
      {/* soft accent blob */}
      <div
        className={[
          'pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl',
          `bg-gradient-to-br ${blob}`,
        ].join(' ')}
      />
      <div className="relative z-10 flex items-start gap-3">
        {/* icon circle */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 ring-1 ring-slate-200">
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="text-xs text-slate-600">{subtitle}</div>
        </div>
      </div>
    </Link>
  );
}

export default function HomeQuickActions() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <ActionCard
        href="/shifts/new" // ← adjust if your route differs
        title="New Shift"
        subtitle="Log a shift now"
        accent="emerald"
        icon={
          // plus icon
          <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none">
            <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
          </svg>
        }
      />
      <ActionCard
        href="/shifts"
        title="Recent Shifts"
        subtitle="View / edit your last entries"
        accent="sky"
        icon={
          // list icon
          <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none">
            <path
              d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        }
      />
      <ActionCard
        href="/stats"
        title="Income Stats"
        subtitle="Totals, $/h and $/down"
        accent="indigo"
        icon={
          // chart icon
          <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none">
            <path d="M3 3v18h18" strokeWidth="2" strokeLinecap="round" />
            <path d="M7 15l4-4 3 3 5-6" strokeWidth="2" strokeLinecap="round" />
          </svg>
        }
      />
    </div>
  );
}

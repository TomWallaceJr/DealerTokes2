'use client';

import { signIn } from 'next-auth/react';
import * as React from 'react';

type DemoSignInButtonProps = React.PropsWithChildren<{
  className?: string;
  /** Render like a text link instead of a button */
  asLink?: boolean;
  /** Visual variant; default is amber outline to match warning label */
  variant?: 'default' | 'amber-outline';
}>;

const DemoSignInButton: React.FC<DemoSignInButtonProps> = ({ className, asLink, children, variant = 'amber-outline' }) => {
  const handleClick = async () => {
    await signIn('credentials', {
      // You can swap these to NEXT_PUBLIC_* envs if you prefer
      email: process.env.NEXT_PUBLIC_DEMO_EMAIL ?? 'example@example.com',
      password: process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? 'Demo123!',
      callbackUrl: '/',
      redirect: true,
    });
  };

  if (asLink) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={['link', className].filter(Boolean).join(' ')}
        aria-label="Try the demo"
      >
        {children ?? 'demo'}
      </button>
    );
  }

  const amberOutline =
    'inline-flex items-center justify-center gap-2 rounded-2xl bg-transparent px-3.5 py-2 text-sm font-medium text-amber-700 shadow-sm ring-1 ring-amber-300/70 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 active:bg-amber-600 active:text-white';
  const defaultBtn = 'btn';
  const cls = [variant === 'amber-outline' ? amberOutline : defaultBtn, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" onClick={handleClick} className={cls}>
      {children ?? 'Try Demo'}
    </button>
  );
};

export default DemoSignInButton;

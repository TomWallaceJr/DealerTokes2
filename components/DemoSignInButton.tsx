'use client';

import { signIn } from 'next-auth/react';
import * as React from 'react';

type DemoSignInButtonProps = React.PropsWithChildren<{
  className?: string;
  /** Render like a text link instead of a button */
  asLink?: boolean;
}>;

const DemoSignInButton: React.FC<DemoSignInButtonProps> = ({ className, asLink, children }) => {
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

  return (
    <button
      type="button"
      onClick={handleClick}
      className={['btn', className].filter(Boolean).join(' ')}
    >
      {children ?? 'Try Demo'}
    </button>
  );
};

export default DemoSignInButton;

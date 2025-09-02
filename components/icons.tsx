// ============================================================================
// File: /components/icons.tsx
// Purpose: Lightweight inline SVG icons to avoid external deps
// ============================================================================
import * as React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

function SvgBase(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export const X = (props: IconProps) => (
  <SvgBase {...props}>
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </SvgBase>
);

export const Eye = (props: IconProps) => (
  <SvgBase {...props}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </SvgBase>
);

export const EyeOff = (props: IconProps) => (
  <SvgBase {...props}>
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-5.94" />
    <path d="M10.58 10.58A3 3 0 0 0 9 12a3 3 0 0 0 3 3 3 3 0 0 0 2.42-1.17" />
    <path d="M1 1l22 22" />
  </SvgBase>
);

export const MoreHorizontal = (props: IconProps) => (
  <SvgBase {...props}>
    <circle cx="6" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="18" cy="12" r="1" />
  </SvgBase>
);

export const ArrowLeft = (props: IconProps) => (
  <SvgBase {...props}>
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </SvgBase>
);

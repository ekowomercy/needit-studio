import type { HTMLAttributes } from 'react';

export type BadgeVariant = 'verified' | 'availability' | 'neutral';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANTS: Record<BadgeVariant, string> = {
  verified: 'badge-verified',
  availability: 'badge-availability',
  neutral: 'badge-neutral',
};

export function Badge({ variant = 'neutral', className = '', ...rest }: BadgeProps) {
  const classes = ['badge', VARIANTS[variant], className].filter(Boolean).join(' ');
  return <span className={classes} {...rest} />;
}
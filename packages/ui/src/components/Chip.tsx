import type { ButtonHTMLAttributes } from 'react';

export type ChipVariant = 'default' | 'active' | 'category';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ChipVariant;
}

const VARIANTS: Record<ChipVariant, string> = {
  default: '',
  active: 'chip-active',
  category: 'chip-cat',
};

export function Chip({ variant = 'default', className = '', type = 'button', ...rest }: ChipProps) {
  const classes = ['chip', VARIANTS[variant], className].filter(Boolean).join(' ');
  return <button type={type} className={classes} {...rest} />;
}
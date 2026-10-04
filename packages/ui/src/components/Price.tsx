import { formatNaira } from '@needit/shared';
import type { HTMLAttributes } from 'react';

export interface PriceProps extends HTMLAttributes<HTMLSpanElement> {
  /** Price in minor units (kobo). */
  kobo: number;
  size?: 'md' | 'lg';
  suffix?: string;
}

export function Price({ kobo, size = 'md', suffix, className, ...rest }: PriceProps) {
  const classes = ['price', size === 'lg' ? 'price-lg' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <span className={classes} {...rest}>
      {formatNaira(kobo)}
      {suffix ? <small> {suffix}</small> : null}
    </span>
  );
}
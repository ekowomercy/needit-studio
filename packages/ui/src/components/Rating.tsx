import type { HTMLAttributes } from 'react';

export interface RatingProps extends HTMLAttributes<HTMLSpanElement> {
  value: number;
  count?: number;
}

function starsFor(value: number): string {
  const rounded = Math.round(value);
  return '★★★★★'.slice(0, rounded) + '☆☆☆☆☆'.slice(0, 5 - rounded);
}

export function Rating({ value, count, ...rest }: RatingProps) {
  return (
    <span className="rating" {...rest}>
      <span className="stars" role="img" aria-label={`${value} out of 5 stars`}>
        {starsFor(value)}
      </span>
      {value.toFixed(1)}
      {typeof count === 'number' ? <span>({count})</span> : null}
    </span>
  );
}
'use client';

import { Avatar, EmptyState, Rating } from '@needit/ui';
import type { Review } from '@/lib/types';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon="&#11088;"
        title="No reviews yet"
        description="Reviews appear here after completed bookings."
      />
    );
  }
  return (
    <div className="card">
      {reviews.map((review) => (
        <div key={review.id} className="review">
          <div className="review-head">
            <Avatar name={review.authorName ?? 'User'} />
            <div style={{ flex: 1 }}>
              <div className="text-title-sm">{review.authorName ?? 'User'}</div>
              <div className="text-caption">{formatDate(review.createdAt)}</div>
            </div>
            <Rating value={review.rating} />
          </div>
          {review.comment ? (
            <p className="text-body-sm" style={{ marginTop: 8 }}>
              {review.comment}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

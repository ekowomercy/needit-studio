'use client';

import Link from 'next/link';
import { Avatar, Badge, Price, Rating } from '@needit/ui';
import { SaveButton } from '@/components/save-button';
import type { ScoredMatch } from '@/lib/types';

interface ResultCardProps {
  match: ScoredMatch;
  needId?: string;
}

function matchPct(score: number): number {
  return Math.round(Math.min(1, score) * 100);
}

export function ResultCard({ match, needId }: ResultCardProps) {
  const { listing, score, reasons } = match;
  const provider = listing.provider;
  const isProduct = listing.listingType === 'product';
  const baseHref = isProduct ? `/listings/${listing.id}` : `/providers/${provider.id}`;
  const href = needId ? `${baseHref}?need=${needId}` : baseHref;
  const savedItem = {
    id: isProduct ? `listing:${listing.id}` : `provider:${provider.id}`,
    kind: isProduct ? ('listing' as const) : ('provider' as const),
    title: isProduct ? listing.title : provider.displayName ?? 'Provider',
    subtitle: listing.locationCity ?? provider.locationCity ?? 'Nigeria',
    priceKobo: listing.priceKobo,
    href,
  };

  return (
    <div className="card result-card">
      <Link href={href} className="result-card-link" aria-label={savedItem.title}>
        {isProduct ? (
          <div className="result-media" aria-hidden="true">
            {listing.title.slice(0, 1)}
          </div>
        ) : (
          <div className="result-avatar">
            <Avatar
              name={provider.displayName ?? 'Provider'}
              size="lg"
              verified={provider.verificationStatus === 'verified'}
            />
          </div>
        )}
        <div className="result-body">
          <div className="result-head">
            <span className="text-title-sm result-title">
              {isProduct ? listing.title : provider.displayName ?? listing.title}
            </span>
            <span className="match-score" title="Match score">
              {matchPct(score)}%
            </span>
          </div>
          <div className="text-caption result-sub">
            {listing.categoryName ? `${listing.categoryName} \u00b7 ` : ''}
            {listing.locationCity ?? provider.locationCity ?? 'Location not set'}
          </div>
          {isProduct ? (
            <div className="text-body-sm result-desc">{listing.description}</div>
          ) : (
            <div className="text-body-sm result-desc">
              {listing.title}
              {listing.description ? ` \u2014 ${listing.description}` : ''}
            </div>
          )}

          <div className="result-meta">
            {provider.reviewCount > 0 ? (
              <Rating value={provider.ratingAvg} count={provider.reviewCount} />
            ) : (
              <span className="text-caption">New provider</span>
            )}
            {isProduct && listing.condition && listing.condition !== 'any' ? (
              <Badge variant="neutral">
                {listing.condition === 'used' ? 'Used' : 'New'}
              </Badge>
            ) : null}
            {provider.verificationStatus === 'verified' ? (
              <Badge variant="verified">Verified</Badge>
            ) : null}
          </div>

          {reasons.length > 0 ? (
            <div className="result-reasons">
              {reasons.slice(0, 3).map((reason) => (
                <span key={reason} className="result-reason">
                  {reason}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </Link>

      <div className="result-actions">
        {listing.priceKobo != null ? (
          <Price
            kobo={listing.priceKobo}
            suffix={listing.priceType === 'starting' ? 'starting' : listing.priceType === 'quote' ? 'quote' : undefined}
          />
        ) : (
          <span className="text-caption">Price on request</span>
        )}
        <div className="result-actions-buttons">
          <SaveButton item={savedItem} />
          <Link href={href} className="btn btn-primary btn-sm">
            {isProduct ? 'View item' : 'View profile'}
          </Link>
        </div>
      </div>
    </div>
  );
}

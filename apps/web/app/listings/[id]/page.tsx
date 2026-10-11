'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, Badge, EmptyState, Price, Rating, Skeleton } from '@needit/ui';
import { ContactButton } from '@/components/contact-button';
import { BookingButton } from '@/components/booking-button';
import { SaveButton } from '@/components/save-button';
import { ReviewList } from '@/components/review-list';
import { api, ApiError } from '@/lib/api';
import { formatNaira } from '@needit/shared';
import type { ListingDetail, Review } from '@/lib/types';

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const listingId = params.id;
  const router = useRouter();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [needId, setNeedId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setNeedId(search.get('need') ?? undefined);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api<ListingDetail>(`/listings/${listingId}`)
      .then((data) => {
        if (!active) return;
        setListing(data);
        return api<{ items: Review[] }>(`/providers/${data.providerId}/reviews`).then((r) => {
          if (active) setReviews(r.items);
        });
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 404) setError('This listing is no longer available.');
        else setError(err instanceof Error ? err.message : 'Could not load listing');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [listingId]);

  if (loading) {
    return (
      <main className="page page-narrow">
        <div className="card stack">
          <Skeleton style={{ height: 180, width: '100%' }} />
          <Skeleton style={{ height: 20, width: '60%' }} />
          <Skeleton style={{ height: 16, width: '90%' }} />
        </div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="page page-narrow">
        <EmptyState
          icon="&#128533;"
          title="Listing unavailable"
          description={error ?? 'We could not find this listing.'}
          action={
            <Link href="/" className="btn btn-primary">
              Back home
            </Link>
          }
        />
      </main>
    );
  }

  const provider = listing.provider;
  const providerName = provider?.displayName ?? 'Provider';
  const isProduct = listing.listingType === 'product';
  const priceSuffix =
    listing.priceType === 'starting' ? 'starting' : listing.priceType === 'quote' ? 'quote' : undefined;

  return (
    <main className="page page-narrow">
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ marginBottom: 16 }}>
        &larr; Back
      </button>

      <div className="detail-hero">
        {isProduct ? (
          <div className="detail-media" aria-hidden="true">
            {listing.title.slice(0, 1)}
          </div>
        ) : (
          <div className="card" style={{ minWidth: 240 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Avatar name={providerName} size="lg" verified={provider?.verificationStatus === 'verified'} />
              <div>
                <div className="text-title-sm">{providerName}</div>
                <div className="text-caption">{listing.locationCity ?? 'Nigeria'}</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 260 }}>
          <h1 className="text-title-lg" style={{ margin: 0 }}>
            {listing.title}
          </h1>
          <div className="row-wrap" style={{ marginTop: 8 }}>
            {listing.categoryId ? <Badge variant="neutral">{isProduct ? 'Product' : 'Service'}</Badge> : null}
            {listing.condition && listing.condition !== 'any' ? (
              <Badge variant="neutral">{listing.condition === 'used' ? 'Used' : 'New'}</Badge>
            ) : null}
            {provider?.verificationStatus === 'verified' ? <Badge variant="verified">Verified</Badge> : null}
          </div>

          <div style={{ marginTop: 14 }}>
            {listing.priceKobo != null ? (
              <Price kobo={listing.priceKobo} size="lg" suffix={priceSuffix} />
            ) : (
              <span className="text-body">Price on request</span>
            )}
            {provider && provider.reviewCount > 0 ? (
              <div style={{ marginTop: 8 }}>
                <Rating value={provider.ratingAvg} count={provider.reviewCount} />
              </div>
            ) : null}
          </div>

          {listing.description ? (
            <p className="text-body" style={{ marginTop: 14 }}>
              {listing.description}
            </p>
          ) : null}

          <div className="detail-actions">
            <BookingButton
              providerId={listing.providerId}
              providerName={providerName}
              listingId={listing.id}
              needId={needId}
              defaultType={isProduct ? 'order' : 'booking'}
              label={isProduct ? 'Order' : 'Book'}
            />
            <ContactButton
              providerId={listing.providerId}
              providerName={providerName}
              needId={needId}
              label={isProduct ? 'Contact seller' : 'Contact / Book'}
              variant="secondary"
            />
            <SaveButton
              size="md"
              item={{
                id: `listing:${listing.id}`,
                kind: 'listing',
                title: listing.title,
                subtitle: listing.locationCity ?? 'Nigeria',
                priceKobo: listing.priceKobo,
                href: needId ? `/listings/${listing.id}?need=${needId}` : `/listings/${listing.id}`,
              }}
            />
          </div>

          {!isProduct ? (
            <p className="text-caption" style={{ marginTop: 10 }}>
              Starting from{' '}
              {listing.providerProfile?.startingPriceKobo != null
                ? formatNaira(listing.providerProfile.startingPriceKobo)
                : listing.priceKobo != null
                  ? formatNaira(listing.priceKobo)
                  : 'quote'}
            </p>
          ) : null}
        </div>
      </div>

      {isProduct && provider ? (
        <section className="section">
          <div className="section-head">
            <h2 className="text-title-md" style={{ margin: 0 }}>
              Seller
            </h2>
            <Link href={`/providers/${provider.id}`} className="text-body-sm">
              View profile
            </Link>
          </div>
          <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Avatar name={providerName} verified={provider.verificationStatus === 'verified'} />
            <div>
              <div className="text-title-sm">{providerName}</div>
              <div className="text-caption">{provider.locationCity ?? 'Nigeria'}</div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <h2 className="text-title-md" style={{ margin: '0 0 8px' }}>
          Reviews
        </h2>
        <ReviewList reviews={reviews} />
      </section>
    </main>
  );
}

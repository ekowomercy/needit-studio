'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, Badge, EmptyState, Price, Rating, Skeleton } from '@needit/ui';
import { ContactButton } from '@/components/contact-button';
import { SaveButton } from '@/components/save-button';
import { ReviewList } from '@/components/review-list';
import { api, ApiError } from '@/lib/api';
import { formatNaira } from '@needit/shared';
import type { ProviderDetail, ProviderListing, Review } from '@/lib/types';

export default function ProviderDetailPage() {
  const params = useParams<{ id: string }>();
  const providerId = params.id;
  const router = useRouter();

  const [profile, setProfile] = useState<ProviderDetail | null>(null);
  const [listings, setListings] = useState<ProviderListing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [needId, setNeedId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNeedId(new URLSearchParams(window.location.search).get('need') ?? undefined);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api<ProviderDetail>(`/providers/${providerId}`)
      .then(async (data) => {
        if (!active) return;
        setProfile(data);
        const [listingRes, reviewRes] = await Promise.all([
          api<{ items: ProviderListing[] }>(`/providers/${providerId}/listings`),
          api<{ items: Review[] }>(`/providers/${providerId}/reviews`),
        ]);
        if (!active) return;
        setListings(listingRes.items.filter((l) => l.status === 'active'));
        setReviews(reviewRes.items);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 404) setError('Provider not found.');
        else setError(err instanceof Error ? err.message : 'Could not load provider');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [providerId]);

  if (loading) {
    return (
      <main className="page page-narrow">
        <div className="card stack">
          <Skeleton style={{ height: 72, width: 72, borderRadius: '50%' }} />
          <Skeleton style={{ height: 20, width: '50%' }} />
          <Skeleton style={{ height: 16, width: '80%' }} />
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="page page-narrow">
        <EmptyState
          icon="&#128533;"
          title="Provider unavailable"
          description={error ?? 'We could not find this provider.'}
          action={
            <Link href="/" className="btn btn-primary">
              Back home
            </Link>
          }
        />
      </main>
    );
  }

  const name = profile.displayName ?? 'Provider';
  const city = profile.areaCity ?? profile.locationCity ?? 'Nigeria';

  return (
    <main className="page page-narrow">
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ marginBottom: 16 }}>
        &larr; Back
      </button>

      <div className="card">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <Avatar name={name} size="lg" verified={profile.verificationStatus === 'verified'} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 className="text-title-lg" style={{ margin: 0 }}>
              {name}
            </h1>
            <div className="text-body-sm">{profile.headline ?? 'Service provider'}</div>
            <div className="text-caption">{city}</div>
          </div>
          {profile.reviewCount > 0 ? <Rating value={profile.ratingAvg} count={profile.reviewCount} /> : null}
        </div>

        <div className="row-wrap" style={{ marginTop: 12 }}>
          {profile.verificationStatus === 'verified' ? <Badge variant="verified">Verified</Badge> : <Badge variant="neutral">Unverified</Badge>}
          {profile.completedJobs > 0 ? <Badge variant="neutral">{profile.completedJobs} jobs done</Badge> : null}
          {profile.responseRate != null ? (
            <Badge variant="availability">Responds {Math.round(profile.responseRate * 100)}%</Badge>
          ) : null}
        </div>

        {profile.bio ? (
          <p className="text-body" style={{ marginTop: 14 }}>
            {profile.bio}
          </p>
        ) : null}

        <div className="detail-actions">
          <ContactButton providerId={providerId} providerName={name} needId={needId} label="Contact / Book" />
          <SaveButton
            size="md"
            item={{
              id: `provider:${providerId}`,
              kind: 'provider',
              title: name,
              subtitle: city,
              priceKobo: profile.startingPriceKobo,
              href: needId ? `/providers/${providerId}?need=${needId}` : `/providers/${providerId}`,
            }}
          />
        </div>
      </div>

      <div className="detail-facts">
        <div className="fact">
          <span className="text-caption">Starting price</span>
          <div className="price">
            {profile.startingPriceKobo != null ? formatNaira(profile.startingPriceKobo) : 'Quote'}
          </div>
        </div>
        <div className="fact">
          <span className="text-caption">Area</span>
          <div className="text-title-sm">{city}</div>
        </div>
        <div className="fact">
          <span className="text-caption">Response time</span>
          <div className="text-title-sm">
            {profile.responseTimeMin != null ? `${profile.responseTimeMin} min` : '—'}
          </div>
        </div>
      </div>

      <section className="section">
        <h2 className="text-title-md" style={{ margin: '0 0 12px' }}>
          Listings
        </h2>
        {listings.length > 0 ? (
          <div className="grid-cards">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}${needId ? `?need=${needId}` : ''}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="text-title-sm">{listing.title}</div>
                <div className="text-caption" style={{ margin: '4px 0' }}>
                  {listing.listingType === 'product' ? 'Product' : 'Service'}
                  {listing.locationCity ? ` · ${listing.locationCity}` : ''}
                </div>
                {listing.priceKobo != null ? <Price kobo={listing.priceKobo} /> : <span className="text-caption">Quote</span>}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon="&#128230;" title="No active listings" description="This provider has no active listings right now." />
        )}
      </section>

      <section className="section">
        <h2 className="text-title-md" style={{ margin: '0 0 8px' }}>
          Reviews
        </h2>
        <ReviewList reviews={reviews} />
      </section>
    </main>
  );
}

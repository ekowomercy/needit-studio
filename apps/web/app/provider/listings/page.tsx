'use client';

import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { EmptyState, Skeleton } from '@needit/ui';
import { api, ApiError } from '@/lib/api';
import type { ProviderListing } from '@/lib/types';

export default function ProviderListingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<ProviderListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api<ProviderListing[]>(`/providers/${user?.id}/listings`);
      setListings(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace('/login?next=%2Fprovider/listings');
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load listings');
      setListings([]);
    }
  }, [router, user?.id]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login?next=%2Fprovider/listings');
      return;
    }
    void load();
  }, [loading, user, load, router]);

  if (error) return <main className="page page-narrow"><p className="error-msg">{error}</p></main>;

  return (
    <main className="page page-narrow">
      <div className="section-head">
        <h1 className="text-title-lg" style={{ margin: 0 }}>
          My Listings
        </h1>
        <Link href="/provider/listings/new" className="btn btn-primary btn-sm">
          New Listing
        </Link>
      </div>
      {listings === null ? (
        <div className="stack">
          {[0, 1].map((i) => (
            <div key={i} className="card">
              <Skeleton style={{ height: 16, width: '70%' }} />
              <Skeleton style={{ height: 14, width: '40%' }} />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon="&#128230;"
          title="No listings yet"
          description="Create your first listing to get discovered"
          action={
            <Link href="/provider/listings/new" className="btn btn-primary">
              Create listing
            </Link>
          }
        />
      ) : (
        <div className="stack">
          {listings.map((listing) => (
            <div key={listing.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div className="text-title-sm">{listing.title}</div>
                  <div className="text-caption">{listing.listingType} · {listing.status}</div>
                </div>
                <Link href={`/provider/listings/${listing.id}/edit`} className="btn btn-secondary btn-sm">
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

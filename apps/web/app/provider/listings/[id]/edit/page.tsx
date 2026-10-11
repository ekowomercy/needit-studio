'use client';

import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, Skeleton } from '@needit/ui';
import { api, ApiError } from '@/lib/api';
import type { ProviderListing, ListingType, PriceType, Condition } from '@/lib/types';

const LISTING_TYPES: ListingType[] = ['product', 'service'];
const PRICE_TYPES: PriceType[] = ['fixed', 'starting', 'quote'];
const CONDITIONS: Condition[] = ['new', 'used', 'any'];

export default function EditListingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [listing, setListing] = useState<ProviderListing | null>(null);
  const [form, setForm] = useState({
    listingType: 'service' as ListingType,
    title: '',
    description: '',
    priceKobo: '',
    priceType: 'quote' as PriceType,
    condition: 'any' as Condition,
    locationCity: '',
    status: 'draft' as 'draft' | 'active' | 'paused',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api<any>(`/listings/${id}`);
      setListing(data);
      setForm({
        listingType: data.listingType,
        title: data.title,
        description: data.description || '',
        priceKobo: data.priceKobo ? String(data.priceKobo) : '',
        priceType: data.priceType || 'quote',
        condition: data.condition || 'any',
        locationCity: data.locationCity || '',
        status: data.status || 'draft',
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(`/provider/listings/${id}/edit`)}`);
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load listing');
    }
  }, [id, router]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/provider/listings/${id}/edit`)}`);
      return;
    }
    void load();
  }, [loading, user, id, router, load]);

  const submit = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await api(`/listings/${id}`, {
        method: 'PATCH',
        body: {
          listingType: form.listingType,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          priceKobo: form.priceKobo ? parseInt(form.priceKobo, 10) : undefined,
          priceType: form.priceType,
          condition: form.condition,
          locationCity: form.locationCity.trim() || undefined,
          status: form.status,
        },
      });
      router.push('/provider/listings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update listing');
    } finally {
      setBusy(false);
    }
  }, [form, id, router]);

  if (listing === null && !error) {
    return (
      <main className="page page-narrow">
        <Skeleton style={{ height: 300 }} />
      </main>
    );
  }

  return (
    <main className="page page-narrow">
      <h1 className="text-title-lg">Edit Listing</h1>
      <div className="card stack">
        {error ? <p className="error-msg">{error}</p> : null}
        <div>
          <label className="text-caption">Type</label>
          <select className="input" value={form.listingType} onChange={(e) => setForm({ ...form, listingType: e.target.value as ListingType })}>
            {LISTING_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
        </div>
        <div>
          <label className="text-caption">Title</label>
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="text-caption">Description</label>
          <textarea className="input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label className="text-caption">Price (Kobo)</label>
            <input className="input" value={form.priceKobo} onChange={(e) => setForm({ ...form, priceKobo: e.target.value.replace(/[^0-9]/g, '') })} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="text-caption">Price Type</label>
            <select className="input" value={form.priceType} onChange={(e) => setForm({ ...form, priceType: e.target.value as PriceType })}>
              {PRICE_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-caption">Condition</label>
          <select className="input" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value as Condition })}>
            {CONDITIONS.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div>
          <label className="text-caption">Location</label>
          <input className="input" value={form.locationCity} onChange={(e) => setForm({ ...form, locationCity: e.target.value })} />
        </div>
        <div>
          <label className="text-caption">Status</label>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>
        <Button disabled={busy} onClick={() => void submit()}>{busy ? 'Saving...' : 'Save'}</Button>
      </div>
    </main>
  );
}

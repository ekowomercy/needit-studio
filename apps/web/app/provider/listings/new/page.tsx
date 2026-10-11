'use client';

import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@needit/ui';
import { api } from '@/lib/api';
import type { ListingType, PriceType, Condition } from '@/lib/types';

const LISTING_TYPES: ListingType[] = ['product', 'service'];
const PRICE_TYPES: PriceType[] = ['fixed', 'starting', 'quote'];
const CONDITIONS: Condition[] = ['new', 'used', 'any'];

export default function NewListingPage() {
  const { user, loading, reload } = useAuth();
  const router = useRouter();
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

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login?next=%2Fprovider/listings/new');
      return;
    }
    if (!user.isProvider) {
      // Try to enable provider
      reload().catch(() => undefined);
    }
  }, [loading, user, router, reload]);

  const submit = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await api('/listings', {
        method: 'POST',
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
      setError(err instanceof Error ? err.message : 'Could not create listing');
    } finally {
      setBusy(false);
    }
  }, [form, router]);

  return (
    <main className="page page-narrow">
      <h1 className="text-title-lg">New Listing</h1>
      <div className="card stack">
        <div>
          <label className="text-caption">Type</label>
          <select className="input" value={form.listingType} onChange={(e) => setForm({ ...form, listingType: e.target.value as ListingType })}>
            {LISTING_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
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
              {PRICE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-caption">Condition</label>
          <select className="input" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value as Condition })}>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
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
        {error ? <p className="error-msg">{error}</p> : null}
        <Button disabled={busy} onClick={() => void submit()}>{busy ? 'Saving...' : 'Create'}</Button>
      </div>
    </main>
  );
}

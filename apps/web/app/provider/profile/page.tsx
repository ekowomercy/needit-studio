'use client';

import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button, Skeleton } from '@needit/ui';
import { api, ApiError } from '@/lib/api';
import type { ProviderProfile } from '@/lib/types';

export default function ProviderProfilePage() {
  const { user, loading, reload } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [form, setForm] = useState({
    headline: '',
    bio: '',
    areaCity: '',
    areaRadiusKm: '20',
    startingPriceKobo: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api<any>('/users/me/profile');
      setProfile(data);
      setForm({
        headline: data.headline || '',
        bio: data.bio || '',
        areaCity: data.areaCity || '',
        areaRadiusKm: String(data.areaRadiusKm || 20),
        startingPriceKobo: data.startingPriceKobo ? String(data.startingPriceKobo) : '',
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setProfile(null);
        return;
      }
      if (err instanceof ApiError && err.status === 401) {
        router.replace('/login?next=%2Fprovider/profile');
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load profile');
    }
  }, [router]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login?next=%2Fprovider/profile');
      return;
    }
    void load();
  }, [loading, user, router, load]);

  const submit = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await api('/users/me/profile', {
        method: 'PUT',
        body: {
          headline: form.headline.trim() || undefined,
          bio: form.bio.trim() || undefined,
          areaCity: form.areaCity.trim() || undefined,
          areaRadiusKm: parseInt(form.areaRadiusKm, 10) || 20,
          startingPriceKobo: form.startingPriceKobo ? parseInt(form.startingPriceKobo, 10) : undefined,
        },
      });
      await reload();
      router.push('/provider');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setBusy(false);
    }
  }, [form, reload, router]);

  return (
    <main className="page page-narrow">
      <h1 className="text-title-lg">Provider Profile</h1>
      {profile === null && !error ? (
        <Skeleton style={{ height: 200 }} />
      ) : (
        <div className="card stack">
          {error ? <p className="error-msg">{error}</p> : null}
          <div>
            <label className="text-caption">Headline</label>
            <input className="input" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
          </div>
          <div>
            <label className="text-caption">Bio</label>
            <textarea className="input" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div>
            <label className="text-caption">Area City</label>
            <input className="input" value={form.areaCity} onChange={(e) => setForm({ ...form, areaCity: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label className="text-caption">Radius (km)</label>
              <input className="input" value={form.areaRadiusKm} onChange={(e) => setForm({ ...form, areaRadiusKm: e.target.value.replace(/[^0-9]/g, '') })} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-caption">Starting Price (Kobo)</label>
              <input className="input" value={form.startingPriceKobo} onChange={(e) => setForm({ ...form, startingPriceKobo: e.target.value.replace(/[^0-9]/g, '') })} />
            </div>
          </div>
          <Button disabled={busy} onClick={() => void submit()}>{busy ? 'Saving...' : 'Save'}</Button>
        </div>
      )}
    </main>
  );
}

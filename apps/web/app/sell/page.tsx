'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@needit/ui';
import { useAuth } from '@/components/auth-provider';
import { api } from '@/lib/api';

export default function SellPage() {
  const router = useRouter();
  const { user, loading, reload } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSelling = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await api('/users/me', { method: 'PATCH', body: { isProvider: true } });
      await reload();
      router.push('/provider/listings/new');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start selling');
      setBusy(false);
    }
  }, [reload, router]);

  return (
    <main className="page page-narrow">
      <div className="section-head">
        <h1 className="text-title-lg" style={{ margin: 0 }}>
          Sell on NeedIt
        </h1>
      </div>

      {loading ? null : !user ? (
        <div className="card stack">
          <p className="text-body">
            Sign in to start selling your products and services to buyers near you.
          </p>
          <Link href="/login?next=%2Fsell" className="btn btn-primary">
            Sign in to sell
          </Link>
        </div>
      ) : user.isProvider ? (
        <div className="stack">
          <div className="card">
            <div className="text-title-sm">You&apos;re a seller</div>
            <div className="text-caption">
              Add products or services, and manage everything from your workspace.
            </div>
          </div>
          <Link href="/provider/listings/new" className="btn btn-primary">
            Add a product or service
          </Link>
          <Link href="/provider/listings" className="btn btn-secondary">
            Manage my listings
          </Link>
          <Link href="/provider" className="btn btn-secondary">
            Go to seller workspace
          </Link>
        </div>
      ) : (
        <div className="card stack">
          <p className="text-body">
            Become a seller to upload your products and services. It&rsquo;s free — you can list
            anything from items you want to sell to services you offer.
          </p>
          {error ? <p className="error-msg">{error}</p> : null}
          <Button disabled={busy} onClick={() => void startSelling()}>
            {busy ? 'Setting up...' : 'Start selling'}
          </Button>
        </div>
      )}
    </main>
  );
}

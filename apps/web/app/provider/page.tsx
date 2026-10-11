'use client';

import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProviderDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login?next=%2Fprovider');
      return;
    }
  }, [loading, user, router]);

  return (
    <main className="page page-narrow">
      <div className="section-head">
        <h1 className="text-title-lg" style={{ margin: 0 }}>
          Provider Workspace
        </h1>
      </div>
      <div className="stack">
        <Link href="/provider/listings" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="text-title-sm">Listings</div>
          <div className="text-caption">Create and manage your service/product listings</div>
        </Link>
        <Link href="/provider/bookings" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="text-title-sm">Bookings</div>
          <div className="text-caption">Manage incoming requests and orders</div>
        </Link>
        <Link href="/provider/profile" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="text-title-sm">Profile</div>
          <div className="text-caption">Edit your provider profile and settings</div>
        </Link>
      </div>
    </main>
  );
}

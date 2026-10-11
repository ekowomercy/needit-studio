'use client';

import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BookingList } from '@/components/booking-list';

export default function ProviderBookingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login?next=%2Fprovider/bookings');
      return;
    }
  }, [loading, user, router]);

  return (
    <main className="page page-narrow">
      <div className="section-head">
        <h1 className="text-title-lg" style={{ margin: 0 }}>
          Provider Bookings
        </h1>
      </div>
      <BookingList />
    </main>
  );
}

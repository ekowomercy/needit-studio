'use client';

import Link from 'next/link';
import { BookingList } from '@/components/booking-list';

export default function BookingsPage() {
  return (
    <main className="page page-narrow">
      <div className="section-head">
        <h1 className="text-title-lg" style={{ margin: 0 }}>
          Bookings
        </h1>
        <Link href="/conversations" className="btn btn-ghost btn-sm">
          Messages
        </Link>
      </div>
      <BookingList />
    </main>
  );
}

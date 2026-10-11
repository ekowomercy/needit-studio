'use client';

import Link from 'next/link';
import { ConversationList } from '@/components/conversation-list';

export default function ConversationsPage() {
  return (
    <main className="page page-narrow">
      <div className="section-head">
        <h1 className="text-title-lg" style={{ margin: 0 }}>
          Messages
        </h1>
        <Link href="/bookings" className="btn btn-ghost btn-sm">
          Bookings
        </Link>
      </div>
      <ConversationList />
    </main>
  );
}

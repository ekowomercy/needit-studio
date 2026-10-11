'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, EmptyState, Skeleton } from '@needit/ui';
import { api, ApiError } from '@/lib/api';
import type { ConversationSummary } from '@/lib/types';

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

export function ConversationList() {
  const router = useRouter();
  const [items, setItems] = useState<ConversationSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api<ConversationSummary[]>('/conversations');
      setItems(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace('/login?next=%2Fconversations');
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load messages');
      setItems([]);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <p className="error-msg">{error}</p>;

  if (items === null) {
    return (
      <div className="stack">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Skeleton style={{ height: 44, width: 44, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <Skeleton style={{ height: 15, width: '40%', marginBottom: 6 }} />
              <Skeleton style={{ height: 13, width: '70%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon="&#128172;"
        title="No conversations yet"
        description="Contact a provider from your request results and the thread will appear here."
        action={
          <Link href="/" className="btn btn-primary">
            Find a provider
          </Link>
        }
      />
    );
  }

  return (
    <div className="stack">
      {items.map((convo) => {
        const name = convo.other?.displayName ?? 'Provider';
        return (
          <Link key={convo.id} href={`/conversations/${convo.id}`} className="card convo-row">
            <Avatar
              name={name}
              size="md"
              verified={convo.other?.verificationStatus === 'verified'}
            />
            <div className="convo-row-main">
              <div className="convo-row-top">
                <span className="convo-name">{name}</span>
                <span className="text-caption">
                  {convo.lastMessage ? timeAgo(convo.lastMessage.sentAt) : ''}
                </span>
              </div>
              <div className="convo-preview text-body-sm">
                {convo.lastMessage?.body ?? 'Conversation started'}
              </div>
            </div>
            {convo.unreadCount > 0 ? <span className="unread-dot">{convo.unreadCount}</span> : null}
          </Link>
        );
      })}
    </div>
  );
}

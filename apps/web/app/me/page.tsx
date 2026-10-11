'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge, Button, EmptyState, Price, Skeleton } from '@needit/ui';
import { useAuth } from '@/components/auth-provider';
import { BookingList } from '@/components/booking-list';
import { ConversationList } from '@/components/conversation-list';
import { api, ApiError } from '@/lib/api';
import { removeSaved, useSavedItems } from '@/lib/saved';
import type { NeedRequest } from '@/lib/types';

type Tab = 'requests' | 'bookings' | 'messages' | 'saved';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function MyNeedsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('requests');
  const [requests, setRequests] = useState<NeedRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saved = useSavedItems();

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api<NeedRequest[]>('/needs/mine');
      setRequests(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace('/login?next=%2Fme');
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load your needs');
      setRequests([]);
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?next=%2Fme');
      return;
    }
    void load();
  }, [authLoading, user, load, router]);

  return (
    <main className="page page-narrow">
      <div className="section-head">
        <h1 className="text-title-lg" style={{ margin: 0 }}>
          My Needs
        </h1>
      </div>

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'requests'}
          className={`tab${tab === 'requests' ? ' is-active' : ''}`}
          onClick={() => setTab('requests')}
        >
          Requests{requests ? ` (${requests.length})` : ''}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'bookings'}
          className={`tab${tab === 'bookings' ? ' is-active' : ''}`}
          onClick={() => setTab('bookings')}
        >
          Bookings
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'messages'}
          className={`tab${tab === 'messages' ? ' is-active' : ''}`}
          onClick={() => setTab('messages')}
        >
          Messages
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'saved'}
          className={`tab${tab === 'saved' ? ' is-active' : ''}`}
          onClick={() => setTab('saved')}
        >
          Saved{saved.length ? ` (${saved.length})` : ''}
        </button>
      </div>

      {error ? <p className="error-msg">{error}</p> : null}

      {tab === 'bookings' ? (
        <BookingList />
      ) : tab === 'messages' ? (
        <ConversationList />
      ) : tab === 'requests' ? (
        requests === null ? (
          <div className="stack">
            {[0, 1].map((i) => (
              <div key={i} className="card stack">
                <Skeleton style={{ height: 16, width: '70%' }} />
                <Skeleton style={{ height: 14, width: '40%' }} />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon="&#128221;"
            title="No requests yet"
            description="Tell us what you need and we'll match people, products, and services near you."
            action={
              <Link href="/" className="btn btn-primary">
                Create a request
              </Link>
            }
          />
        ) : (
          <div className="stack">
            {requests.map((need) => (
              <div key={need.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div className="text-title-sm">&ldquo;{need.rawText}&rdquo;</div>
                    <div className="text-caption" style={{ marginTop: 4 }}>
                      {formatDate(need.createdAt)}
                    </div>
                  </div>
                  <Badge variant="neutral">{need.status}</Badge>
                </div>
                <div style={{ marginTop: 12 }}>
                  <Link href={`/needs/${need.id}`} className="btn btn-secondary btn-sm">
                    View results
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : saved.length === 0 ? (
        <EmptyState
          icon="&#9825;"
          title="Nothing saved yet"
          description="Tap Save on any provider or listing to keep it here."
          action={
            <Link href="/" className="btn btn-primary">
              Find something
            </Link>
          }
        />
      ) : (
        <div className="stack">
          {saved.map((item) => (
            <div key={item.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <Link href={item.href} className="text-title-sm" style={{ textDecoration: 'none' }}>
                  {item.title}
                </Link>
                <div className="text-caption">{item.subtitle}</div>
              </div>
              {item.priceKobo != null ? <Price kobo={item.priceKobo} /> : null}
              <Button variant="ghost" size="sm" onClick={() => removeSaved(item.id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

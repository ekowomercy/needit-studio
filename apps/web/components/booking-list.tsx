'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge, Button, EmptyState, Skeleton } from '@needit/ui';
import { formatNaira } from '@needit/shared';
import { useAuth } from '@/components/auth-provider';
import { api, ApiError } from '@/lib/api';
import type { Booking, BookingStatus } from '@/lib/types';

const STEPS: BookingStatus[] = ['requested', 'confirmed', 'in_progress', 'completed'];
const STEP_LABEL: Record<string, string> = {
  requested: 'Requested',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
};
const TYPE_LABEL: Record<string, string> = {
  booking: 'Booking',
  order: 'Order',
  request_fill: 'Request fill',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function StatusTrack({ status }: { status: BookingStatus }) {
  if (status === 'cancelled' || status === 'refunded') {
    return (
      <div className="booking-status">
        <span className="status-step is-cancelled">{status === 'refunded' ? 'Refunded' : 'Cancelled'}</span>
      </div>
    );
  }
  const currentIndex = STEPS.indexOf(status);
  return (
    <div className="booking-status">
      {STEPS.map((step, i) => {
        const cls = i < currentIndex ? 'is-done' : i === currentIndex ? 'is-current' : '';
        return (
          <span key={step} className={`status-step ${cls}`}>
            {STEP_LABEL[step]}
          </span>
        );
      })}
    </div>
  );
}

interface BookingCardProps {
  booking: Booking;
  role: 'seeker' | 'provider';
  onUpdate: (id: string, status: BookingStatus) => void;
  busy: string | null;
}

function BookingCard({ booking, role, onUpdate, busy }: BookingCardProps) {
  const counterpart = role === 'seeker' ? booking.providerName : booking.seekerName;
  const canCancel =
    role === 'seeker' ? ['requested', 'confirmed'].includes(booking.status) : false;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="text-title-sm">{booking.listingTitle ?? TYPE_LABEL[booking.type] ?? 'Booking'}</div>
          <div className="text-caption" style={{ marginTop: 2 }}>
            {role === 'seeker' ? 'Provider' : 'Customer'}: {counterpart ?? '—'} · {formatDate(booking.createdAt)}
          </div>
        </div>
        {booking.quoteKobo != null ? (
          <div className="price">{formatNaira(booking.quoteKobo)}</div>
        ) : (
          <Badge variant="neutral">Quote pending</Badge>
        )}
      </div>

      <StatusTrack status={booking.status} />

      {booking.notes ? <p className="text-body-sm" style={{ margin: '4px 0 0' }}>{booking.notes}</p> : null}
      {booking.scheduledAt ? (
        <div className="text-caption" style={{ marginTop: 4 }}>
          Scheduled: {formatDate(booking.scheduledAt)}
        </div>
      ) : null}

      <div className="booking-actions">
        {role === 'provider' && booking.status === 'requested' ? (
          <Button size="sm" disabled={busy === booking.id} onClick={() => onUpdate(booking.id, 'confirmed')}>
            Confirm
          </Button>
        ) : null}
        {role === 'provider' && booking.status === 'confirmed' ? (
          <Button size="sm" disabled={busy === booking.id} onClick={() => onUpdate(booking.id, 'in_progress')}>
            Start job
          </Button>
        ) : null}
        {role === 'provider' && booking.status === 'in_progress' ? (
          <Button size="sm" disabled={busy === booking.id} onClick={() => onUpdate(booking.id, 'completed')}>
            Mark complete
          </Button>
        ) : null}
        {canCancel || (role === 'provider' && ['requested', 'confirmed', 'in_progress'].includes(booking.status)) ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy === booking.id}
            onClick={() => onUpdate(booking.id, 'cancelled')}
          >
            Cancel
          </Button>
        ) : null}
        <Link href="/conversations" className="btn btn-secondary btn-sm">
          Message
        </Link>
      </div>
    </div>
  );
}

export function BookingList() {
  const router = useRouter();
  const { user } = useAuth();
  const [asSeeker, setAsSeeker] = useState<Booking[] | null>(null);
  const [asProvider, setAsProvider] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [mine, forProvider] = await Promise.all([
        api<Booking[]>('/bookings/mine'),
        api<Booking[]>('/bookings/for-provider'),
      ]);
      setAsSeeker(mine);
      setAsProvider(forProvider);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace('/login?next=%2Fbookings');
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load bookings');
      setAsSeeker([]);
      setAsProvider([]);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback(
    async (id: string, status: BookingStatus) => {
      setBusy(id);
      setError(null);
      try {
        await api(`/bookings/${id}`, { method: 'PATCH', body: { status } });
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not update booking');
      } finally {
        setBusy(null);
      }
    },
    [load],
  );

  if (error) return <p className="error-msg">{error}</p>;

  const loading = asSeeker === null || asProvider === null;

  return (
    <div className="stack">
      <section>
        <h2 className="text-title-md" style={{ margin: '0 0 12px' }}>
          Bookings
        </h2>
        {loading ? (
          <div className="stack">
            <Skeleton style={{ height: 120 }} />
          </div>
        ) : asSeeker.length === 0 ? (
          <EmptyState
            icon="&#128197;"
            title="No bookings yet"
            description="Book a provider from your request results and track it here."
          />
        ) : (
          <div className="stack">
            {asSeeker.map((b) => (
              <BookingCard key={b.id} booking={b} role="seeker" onUpdate={update} busy={busy} />
            ))}
          </div>
        )}
      </section>

      {user?.isProvider && asProvider && asProvider.length > 0 ? (
        <section className="section">
          <h2 className="text-title-md" style={{ margin: '0 0 12px' }}>
            Incoming jobs
          </h2>
          <div className="stack">
            {asProvider.map((b) => (
              <BookingCard key={b.id} booking={b} role="provider" onUpdate={update} busy={busy} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

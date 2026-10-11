'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@needit/ui';
import { useAuth } from '@/components/auth-provider';
import { api } from '@/lib/api';
import type { BookingType } from '@/lib/types';

interface BookingButtonProps {
  providerId: string;
  providerName: string;
  listingId?: string;
  needId?: string;
  defaultType?: BookingType;
  label?: string;
  variant?: 'primary' | 'secondary';
  block?: boolean;
}

export function BookingButton({
  providerId,
  providerName,
  listingId,
  needId,
  defaultType = 'booking',
  label = 'Book',
  variant = 'primary',
  block = false,
}: BookingButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<BookingType>(defaultType);
  const [notes, setNotes] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function start() {
    if (!user) {
      const next = needId ? `/needs/${needId}` : '/';
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setOpen(true);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api('/bookings', {
        method: 'POST',
        body: {
          providerId,
          listingId,
          needRequestId: needId,
          type,
          notes: notes.trim() || undefined,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create booking');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant={variant} block={block} onClick={start}>
        {label}
      </Button>

      {open ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Book ${providerName}`}>
          <div className="modal card">
            {done ? (
              <>
                <h3 className="text-title-sm" style={{ marginTop: 0 }}>
                  Booking requested
                </h3>
                <p className="text-body-sm">
                  {providerName} will confirm your {type === 'order' ? 'order' : 'booking'} shortly.
                </p>
                <div className="modal-actions">
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Close
                  </Button>
                  <Link href="/bookings" className="btn btn-primary">
                    View bookings
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-title-sm" style={{ marginTop: 0 }}>
                  Book {providerName}
                </h3>
                <label className="text-caption" htmlFor="booking-type">
                  Type
                </label>
                <select
                  id="booking-type"
                  className="input"
                  value={type}
                  onChange={(e) => setType(e.target.value as BookingType)}
                >
                  <option value="booking">Service booking</option>
                  <option value="order">Product order</option>
                  <option value="request_fill">Request fill</option>
                </select>
                <label className="text-caption" htmlFor="booking-when" style={{ marginTop: 10 }}>
                  Preferred date (optional)
                </label>
                <input
                  id="booking-when"
                  type="datetime-local"
                  className="input"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
                <label className="text-caption" htmlFor="booking-notes" style={{ marginTop: 10 }}>
                  Details
                </label>
                <textarea
                  id="booking-notes"
                  className="input"
                  rows={3}
                  placeholder="Anything the provider should know"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                {error ? <p className="error-msg">{error}</p> : null}
                <div className="modal-actions">
                  <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
                    Cancel
                  </Button>
                  <Button onClick={() => void submit()} disabled={busy}>
                    {busy ? 'Sending...' : 'Send request'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

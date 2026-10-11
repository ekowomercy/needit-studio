'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@needit/ui';
import { useAuth } from '@/components/auth-provider';
import { api } from '@/lib/api';

interface ContactButtonProps {
  providerId: string;
  providerName: string;
  needId?: string;
  label?: string;
  variant?: 'primary' | 'secondary';
  block?: boolean;
}

export function ContactButton({
  providerId,
  providerName,
  needId,
  label = 'Contact',
  variant = 'primary',
  block = false,
}: ContactButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function start() {
    if (!user) {
      const next = needId ? `/needs/${needId}` : '/';
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setOpen(true);
  }

  async function send() {
    if (!needId) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/needs/${needId}/contact`, {
        method: 'POST',
        body: { providerId, message: message.trim() || undefined },
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send');
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
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Contact ${providerName}`}>
          <div className="modal card">
            {sent ? (
              <>
                <h3 className="text-title-sm" style={{ marginTop: 0 }}>
                  Enquiry sent
                </h3>
                <p className="text-body-sm">
                  {providerName} has been notified and can reply in your conversations. Messaging
                  threads unlock in the next update.
                </p>
                <Button block onClick={() => setOpen(false)}>
                  Done
                </Button>
              </>
            ) : needId ? (
              <>
                <h3 className="text-title-sm" style={{ marginTop: 0 }}>
                  Message {providerName}
                </h3>
                <p className="text-caption" style={{ marginTop: 0 }}>
                  Your request stays attached to this conversation.
                </p>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Add a short message (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                {error ? <p className="error-msg">{error}</p> : null}
                <div className="modal-actions">
                  <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
                    Cancel
                  </Button>
                  <Button onClick={() => void send()} disabled={busy}>
                    {busy ? 'Sending...' : 'Send enquiry'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-title-sm" style={{ marginTop: 0 }}>
                  Start with a request
                </h3>
                <p className="text-body-sm">
                  Contact is tied to a request so {providerName} knows what you need. Describe your
                  need and we&apos;ll match this provider.
                </p>
                <div className="modal-actions">
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Link href="/" className="btn btn-primary">
                    Create a request
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

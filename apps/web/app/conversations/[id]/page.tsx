'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, EmptyState, Skeleton } from '@needit/ui';
import { useAuth } from '@/components/auth-provider';
import { api, ApiError } from '@/lib/api';
import type { ConversationSummary, Message } from '@/lib/types';

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function ConversationThreadPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { user } = useAuth();

  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const data = await api<Message[]>(`/conversations/${id}/messages`);
      setMessages(data);
      const last = data[data.length - 1];
      if (last && last.senderId !== user?.id) {
        void api(`/conversations/${id}/read`, { method: 'POST' }).catch(() => undefined);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(`/conversations/${id}`)}`);
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load conversation');
    }
  }, [id, router, user?.id]);

  useEffect(() => {
    let active = true;
    api<ConversationSummary>(`/conversations/${id}`)
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 404) setError('Conversation not found.');
        else setError(err instanceof Error ? err.message : 'Could not load conversation');
      });
    void loadMessages();
    return () => {
      active = false;
    };
  }, [id, loadMessages]);

  useEffect(() => {
    const timer = setInterval(() => {
      void loadMessages();
    }, 5000);
    return () => clearInterval(timer);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages?.length]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      await api<Message>(`/conversations/${id}/messages`, { method: 'POST', body: { body } });
      setDraft('');
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message');
    } finally {
      setSending(false);
    }
  }

  const name = summary?.other?.displayName ?? 'Provider';

  return (
    <main className="page page-narrow">
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => router.back()}
        style={{ marginBottom: 12 }}
      >
        &larr; Back
      </button>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Avatar name={name} size="md" verified={summary?.other?.verificationStatus === 'verified'} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="text-title-sm">{name}</div>
            <div className="text-caption">Conversation</div>
          </div>
          {summary?.other?.id ? (
            <Link href={`/providers/${summary.other.id}`} className="btn btn-secondary btn-sm">
              Profile
            </Link>
          ) : null}
        </div>
        {summary?.needText ? (
          <div className="thread-context" style={{ marginTop: 12 }}>
            <span className="text-caption">Request</span>
            <div className="text-body-sm">&ldquo;{summary.needText}&rdquo;</div>
          </div>
        ) : null}
      </div>

      {error ? <p className="error-msg">{error}</p> : null}

      {messages === null ? (
        <div className="stack">
          <Skeleton style={{ height: 48, width: '60%' }} />
          <Skeleton style={{ height: 48, width: '50%', alignSelf: 'flex-end' }} />
        </div>
      ) : messages.length === 0 && !error ? (
        <EmptyState
          icon="&#128172;"
          title="Say hello"
          description="Send the first message to start the conversation."
        />
      ) : (
        <div className="thread">
          {messages.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <div key={m.id} className={`bubble ${mine ? 'mine' : 'theirs'}`}>
                {m.body}
                <span className="bubble-time">{formatTime(m.sentAt)}</span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="thread-compose">
        <textarea
          className="input"
          rows={1}
          placeholder="Write a message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void send()}
          disabled={sending || !draft.trim()}
        >
          {sending ? 'Sending' : 'Send'}
        </button>
      </div>
    </main>
  );
}

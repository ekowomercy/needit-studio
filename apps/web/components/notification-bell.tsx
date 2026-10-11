'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { Badge, Button, EmptyState, Skeleton } from '@needit/ui';
import type { Notification } from '@/lib/types';

export function NotificationBell() {
  const [unread, setUnread] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loadUnread = useCallback(async () => {
    try {
      const data = await api<Notification[]>('/notifications/unread');
      setUnread(data.length);
    } catch {
      // ignore
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<Notification[]>('/notifications');
      setItems(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadUnread();
    const id = setInterval(() => void loadUnread(), 10000);
    return () => clearInterval(id);
  }, [loadUnread]);

  useEffect(() => {
    if (open) void loadAll();
  }, [open, loadAll]);

  const markAll = async () => {
    try {
      await api('/notifications/read-all', { method: 'POST' });
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        Notifications{unread > 0 ? ` (${unread})` : ''}
      </button>
      {open ? (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 320, zIndex: 50 }}>
          <div className="card stack">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="text-title-sm">Notifications</div>
              {unread > 0 ? (
                <Button size="sm" variant="ghost" onClick={() => void markAll()}>
                  Mark all read
                </Button>
              ) : null}
            </div>
            {loading ? (
              <Skeleton style={{ height: 60 }} />
            ) : items.length === 0 ? (
              <EmptyState icon="🔔" title="No notifications" description="You're all caught up" />
            ) : (
              <div className="stack" style={{ maxHeight: 320, overflowY: 'auto' }}>
                {items.map((n) => (
                  <div key={n.id} className="card" style={{ padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <div className="text-body-sm" style={{ fontWeight: 600 }}>
                        {n.title}
                      </div>
                      {n.readAt ? null : <Badge variant="verified">New</Badge>}
                    </div>
                    {n.body ? <div className="text-caption">{n.body}</div> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

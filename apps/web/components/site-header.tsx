'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@needit/ui';
import { useAuth } from '@/components/auth-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationBell } from '@/components/notification-bell';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/sell', label: 'Sell' },
  { href: '/conversations', label: 'Messages' },
  { href: '/bookings', label: 'Bookings' },
  { href: '/me', label: 'My Needs' },
];

export function SiteHeader() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="NeedIt Studio home">
          <span className="brand-mark">N</span>
          NeedIt Studio
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`site-nav-link${active ? ' is-active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="site-header-actions">
          <ThemeToggle />
          <NotificationBell />
          {loading ? null : user ? (
            <div className="site-user">
              <Badge variant="neutral" title={`Signed in as ${user.role}`}>
                {user.role}
              </Badge>
              <span className="site-user-name" title={user.displayName ?? user.phone ?? ''}>
                {user.displayName ?? user.phone ?? 'Account'}
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={signOut}>
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

import '@needit/ui/styles';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';
import { PwaRegister } from '@/components/pwa-register';
import { InstallPrompt } from '@/components/install-prompt';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: 'NeedIt Studio — What do you need?',
  description: 'Tell us what you need. We will help you find the people, products, and services.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'NeedIt',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a7f4b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body className="ds">
        <AuthProvider>
          <PwaRegister />
          <SiteHeader />
          <InstallPrompt />
          <div className="site-main">{children}</div>
          <footer className="site-footer">
            <span>NeedIt Studio</span>
            <span className="text-caption">
              Buy &amp; sell anything · Find people, products &amp; services near you
            </span>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}

import '@needit/ui/styles';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NeedIt Studio — What do you need?',
  description: 'Tell us what you need. We will help you find it.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#1a7f4b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body className="ds">{children}</body>
    </html>
  );
}
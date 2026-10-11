import Link from 'next/link';

export const metadata = { title: 'Offline — NeedIt Studio' };

export default function OfflinePage() {
  return (
    <main className="page page-narrow">
      <div className="empty">
        <div className="ic">&#128246;</div>
        <h4>You&apos;re offline</h4>
        <p>We couldn&apos;t reach the network. Your saved items are still available.</p>
        <Link href="/me" className="btn btn-primary">
          Go to My Needs
        </Link>
      </div>
    </main>
  );
}

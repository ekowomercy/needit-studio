import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page page-narrow">
      <div className="empty">
        <div className="ic">&#128269;</div>
        <h4>Page not found</h4>
        <p>The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Link href="/" className="btn btn-primary">
          Back home
        </Link>
      </div>
    </main>
  );
}

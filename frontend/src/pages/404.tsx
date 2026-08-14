import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-mckinsey-navy mb-4">404</h1>
      <p className="text-mckinsey-muted text-lg mb-8">Page not found</p>
      <Link href="/" className="btn-primary">
        Back to home
      </Link>
    </div>
  );
}

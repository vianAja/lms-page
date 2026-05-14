import Link from 'next/link';
import { EmptyState } from '@/components/vn-ui';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface-container-lowest px-4 py-10">
      <EmptyState
        icon="search_off"
        title="Page Not Found"
        copy="The page you were looking for does not exist or has been moved."
        cta={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="button-secondary">Go Back</Link>
            <Link href="/" className="button-primary">Go to Home</Link>
          </div>
        }
      />
    </main>
  );
}

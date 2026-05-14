import Link from 'next/link';
import { EmptyState } from '@/components/vn-ui';

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface-container-lowest px-4 py-10">
      <EmptyState
        icon="lock"
        title="Access Restricted"
        copy="You do not have permission to open this area of VN-Labs."
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

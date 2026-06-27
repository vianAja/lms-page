'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { csrfFetch } from '@/lib/client/csrf';

type LabRowActionsProps = {
  classId: number;
  labId: number;
  csrfToken: string;
};

export default function LabRowActions({ classId, labId, csrfToken }: LabRowActionsProps) {
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete this lab?');
    if (!confirmed) return;

    try {
      const response = await csrfFetch(`/api/labs/${labId}`, {
        method: 'DELETE',
      }, csrfToken);

      if (!response.ok && response.status !== 204) {
        const payload = await response.json().catch(() => ({ message: 'Failed to delete lab' }));
        window.alert(payload.message || 'Failed to delete lab');
        return;
      }

      router.refresh();
    } catch {
      window.alert('Failed to delete lab');
    }
  };

  return (
    <div className="flex items-center justify-end gap-3">
      <Link
        href={`/dashboard/classes/${classId}/labs/${labId}/edit`}
        className="button-secondary min-h-9 px-3 text-xs"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        className="rounded-sm border border-error/30 bg-error-container/15 px-3 py-2 font-code text-[12px] text-error transition-colors hover:border-error"
      >
        Delete
      </button>
    </div>
  );
}

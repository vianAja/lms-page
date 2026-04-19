'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

type LabRowActionsProps = {
  classId: number;
  labId: number;
  csrfToken: string;
};

function resolveCsrfToken(initialToken: string): string {
  const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  return metaToken || initialToken;
}

export default function LabRowActions({ classId, labId, csrfToken }: LabRowActionsProps) {
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete this lab?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/labs/${labId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': resolveCsrfToken(csrfToken),
        },
      });

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
    <div className="flex items-center gap-4 text-sm justify-end">
      <Link
        href={`/dashboard/classes/${classId}/labs/${labId}/edit`}
        className="text-[#2D9CDB] hover:text-[#2789C2] font-semibold"
      >
        Edit
      </Link>
      <button type="button" onClick={handleDelete} className="text-red-500 hover:text-red-600 font-semibold">
        Delete
      </button>
    </div>
  );
}

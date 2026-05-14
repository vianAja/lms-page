'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { EmptyState, Icon } from '@/components/vn-ui';

type ClassRow = {
  id: number;
  name: string;
  description: string | null;
  lab_count: number;
  created_at: string;
};

type ClassListClientProps = {
  classes: ClassRow[];
  csrfToken: string;
};

function resolveCsrfToken(initialToken: string): string {
  const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  return metaToken || initialToken;
}

export default function ClassListClient({ classes, csrfToken }: ClassListClientProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formattedRows = useMemo(
    () =>
      classes.map((row) => ({
        ...row,
        shortDescription: row.description && row.description.length > 80 ? `${row.description.slice(0, 80)}...` : row.description || 'No description yet.',
        createdLabel: new Date(row.created_at).toLocaleDateString(),
      })),
    [classes]
  );

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Class name is required.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': resolveCsrfToken(csrfToken),
        },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: 'Failed to create class' }));
        setError(payload.message || 'Failed to create class');
        return;
      }

      setName('');
      setDescription('');
      setIsOpen(false);
      router.refresh();
    } catch {
      setError('Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (classId: number) => {
    if (!window.confirm('Delete this class and all of its labs?')) return;

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': resolveCsrfToken(csrfToken),
        },
      });

      if (!response.ok && response.status !== 204) {
        const payload = await response.json().catch(() => ({ message: 'Failed to delete class' }));
        window.alert(payload.message || 'Failed to delete class');
        return;
      }

      router.refresh();
    } catch {
      window.alert('Failed to delete class');
    }
  };

  return (
    <div className="space-y-6">
      <meta name="csrf-token" content={csrfToken} />

      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-headline text-headline-lg text-on-surface">Classes</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">Create, organize, and monitor active learning cohorts.</p>
        </div>
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="button-primary">
          <Icon name="add" className="text-[18px]" />
          Create New Class
        </button>
      </header>

      {isOpen ? (
        <section className="panel p-5">
          <form onSubmit={handleCreate} className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-label-caps text-on-surface-variant">Class Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="Jenkins Fundamentals" />
            </div>
            <div className="space-y-2">
              <label className="text-label-caps text-on-surface-variant">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="field min-h-24" placeholder="Cohort summary and learning outcomes" />
            </div>
            {error ? <p className="text-body-sm text-error lg:col-span-2">{error}</p> : null}
            <div className="flex justify-end gap-3 lg:col-span-2">
              <button type="button" onClick={() => setIsOpen(false)} className="button-secondary">Cancel</button>
              <button type="submit" disabled={loading} className="button-primary">{loading ? 'Creating...' : 'Save Class'}</button>
            </div>
          </form>
        </section>
      ) : null}

      {formattedRows.length === 0 ? (
        <EmptyState icon="assignment" title="No Classes Yet" copy="Create your first class to start organizing labs and enrollments." />
      ) : (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-outline-variant bg-surface-container-high text-label-caps text-on-surface-variant">
                <tr>
                  <th className="px-5 py-4">Class</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4">Labs</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {formattedRows.map((row) => (
                  <tr key={row.id} className="border-b border-outline-variant/60 transition-colors hover:bg-surface-variant">
                    <td className="px-5 py-4">
                      <div className="font-body text-body-md text-on-surface">{row.name}</div>
                    </td>
                    <td className="px-5 py-4 text-body-sm text-on-surface-variant">{row.shortDescription}</td>
                    <td className="px-5 py-4 font-code text-code-md text-on-surface">{row.lab_count}</td>
                    <td className="px-5 py-4 text-body-sm text-on-surface-variant">{row.createdLabel}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-3">
                        <Link href={`/dashboard/classes/${row.id}`} className="button-secondary min-h-9 px-3 text-xs">Manage</Link>
                        <button type="button" onClick={() => handleDelete(row.id)} className="rounded-sm border border-error/30 bg-error-container/15 px-3 py-2 font-code text-[12px] text-error transition-colors hover:border-error">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

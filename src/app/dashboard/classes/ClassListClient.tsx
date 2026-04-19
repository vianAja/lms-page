'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

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
        shortDescription: row.description && row.description.length > 60 ? `${row.description.slice(0, 60)}...` : row.description || '-',
        createdLabel: new Date(row.created_at).toLocaleDateString(),
      })),
    [classes]
  );

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Class name is required');
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
    const confirmed = window.confirm('Delete this class and all its labs?');
    if (!confirmed) return;

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
    <div className="w-full">
      <meta name="csrf-token" content={csrfToken} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#333]">Class Management</h1>
          <p className="text-sm text-[#828282] mt-1">Create and manage classes and their lab sets.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="bg-[#2D9CDB] hover:bg-[#2789C2] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm"
        >
          Create New Class
        </button>
      </div>

      {isOpen && (
        <section className="mb-6 bg-white border border-[#E0E6ED] rounded-xl shadow-sm p-5">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#333] mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[#E0E6ED] px-3 py-2.5 text-sm text-[#333] outline-none focus:ring-2 focus:ring-[#2D9CDB]/30 focus:border-[#2D9CDB]"
                placeholder="e.g. Intro to Linux"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#333] mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#E0E6ED] px-3 py-2.5 text-sm text-[#333] outline-none focus:ring-2 focus:ring-[#2D9CDB]/30 focus:border-[#2D9CDB]"
                placeholder="Short summary for students"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#2D9CDB] hover:bg-[#2789C2] text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-70"
              >
                {loading ? 'Creating...' : 'Submit'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="bg-white border border-[#E0E6ED] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FBFC] border-b border-[#E0E6ED]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#828282]">Class Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#828282]">Description</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#828282]">Labs Count</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#828282]">Created Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#828282] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F5F8]">
              {formattedRows.map((row) => (
                <tr key={row.id} className="hover:bg-[#F9FBFC] transition-colors">
                  <td className="px-6 py-4 font-semibold text-[#333]">{row.name}</td>
                  <td className="px-6 py-4 text-sm text-[#828282]">{row.shortDescription}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-[#333]">{row.lab_count}</td>
                  <td className="px-6 py-4 text-sm text-[#828282]">{row.createdLabel}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-4 text-sm">
                      <Link href={`/dashboard/classes/${row.id}`} className="text-[#2D9CDB] hover:text-[#2789C2] font-semibold">
                        Manage Labs
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        className="text-red-500 hover:text-red-600 font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {formattedRows.length === 0 && (
          <div className="p-12 text-center text-sm text-[#828282]">No classes created yet.</div>
        )}
      </div>
    </div>
  );
}

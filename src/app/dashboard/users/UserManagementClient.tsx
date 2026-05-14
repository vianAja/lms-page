'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState, ToggleSwitch, UserAvatar } from '@/components/vn-ui';

export type UserRow = {
  id: number;
  username: string;
  fullname: string;
  role: 'admin' | 'student';
  is_active: boolean;
};

type UserManagementClientProps = {
  users: UserRow[];
  currentUsername: string;
  csrfToken: string;
};

function resolveCsrfToken(initialToken: string): string {
  const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  return metaToken || initialToken;
}

export default function UserManagementClient({ users, currentUsername, csrfToken }: UserManagementClientProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [fullname, setFullname] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!username.trim() || !fullname.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': resolveCsrfToken(csrfToken),
        },
        body: JSON.stringify({ username: username.trim(), fullname: fullname.trim(), password, role }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: 'Failed to create user' }));
        setError(payload.message || 'Failed to create user');
        return;
      }

      setUsername('');
      setFullname('');
      setPassword('');
      setRole('student');
      setIsOpen(false);
      router.refresh();
    } catch {
      setError('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: UserRow) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': resolveCsrfToken(csrfToken),
        },
        body: JSON.stringify({ is_active: !user.is_active }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: 'Failed to update user status' }));
        window.alert(payload.message || 'Failed to update user status');
        return;
      }

      router.refresh();
    } catch {
      window.alert('Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      <meta name="csrf-token" content={csrfToken} />

      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-headline text-headline-lg text-on-surface">User Management</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">Create staff accounts, manage student access, and review platform activity.</p>
        </div>
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="button-primary">
          + Create User
        </button>
      </header>

      {isOpen ? (
        <section className="panel p-5">
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-label-caps text-on-surface-variant">Full Name</label>
              <input value={fullname} onChange={(e) => setFullname(e.target.value)} className="field" />
            </div>
            <div className="space-y-2">
              <label className="text-label-caps text-on-surface-variant">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="field font-code" />
            </div>
            <div className="space-y-2">
              <label className="text-label-caps text-on-surface-variant">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
            </div>
            <div className="space-y-2">
              <label className="text-label-caps text-on-surface-variant">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as 'student' | 'admin')} className="field">
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {error ? <p className="text-body-sm text-error md:col-span-2">{error}</p> : null}
            <div className="flex justify-end gap-3 md:col-span-2">
              <button type="button" onClick={() => setIsOpen(false)} className="button-secondary">Cancel</button>
              <button type="submit" disabled={loading} className="button-primary">{loading ? 'Creating...' : 'Create User'}</button>
            </div>
          </form>
        </section>
      ) : null}

      {users.length === 0 ? (
        <EmptyState icon="group" title="No Users Found" copy="Add your first platform user to begin assigning roles and permissions." />
      ) : (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-outline-variant bg-surface-container-high text-label-caps text-on-surface-variant">
                <tr>
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Classes</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-outline-variant/60 transition-colors hover:bg-surface-variant">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.fullname || user.username} className="h-10 w-10" />
                        <div>
                          <div className="font-body text-body-md text-on-surface">{user.fullname}</div>
                          <div className="text-body-sm text-on-surface-variant">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full border px-2.5 py-1 font-code text-[12px] ${user.role === 'admin' ? 'border-primary-container/30 bg-primary-container/10 text-primary' : 'border-secondary/30 bg-secondary-container/10 text-secondary'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <ToggleSwitch checked={user.is_active} />
                    </td>
                    <td className="px-5 py-4 text-body-sm text-on-surface-variant">{user.role === 'student' ? '2 classes' : 'System access'}</td>
                    <td className="px-5 py-4 text-right">
                      {user.username !== currentUsername ? (
                        <button type="button" onClick={() => handleToggleActive(user)} className="button-secondary min-h-9 px-3 text-xs">
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      ) : (
                        <span className="text-body-sm text-on-surface-variant">Current user</span>
                      )}
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

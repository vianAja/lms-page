'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState, Icon, UserAvatar } from '@/components/vn-ui';
import { csrfFetch } from '@/lib/client/csrf';

export type UserRow = {
  id: number;
  username: string;
  fullname: string;
  email?: string;
  role: 'admin' | 'student';
  is_active: boolean;
  last_login?: string;
  labs_completed?: number;
};

type UserManagementClientProps = {
  users: UserRow[];
  currentUsername: string;
  csrfToken: string;
};

type StatusFilter = 'All' | 'Active' | 'New' | 'Suspended';

const STATUS_MAP: Record<string, string> = {
  true: 'active',
  false: 'suspended',
};

export default function UserManagementClient({ users, currentUsername, csrfToken }: UserManagementClientProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [fullname, setFullname] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('All');

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!username.trim() || !fullname.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    try {
      const response = await csrfFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), fullname: fullname.trim(), password, role }),
      }, csrfToken);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: 'Failed to create user' }));
        setError(payload.message || 'Failed to create user');
        return;
      }
      setUsername(''); setFullname(''); setPassword(''); setRole('student');
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
      const response = await csrfFetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.is_active }),
      }, csrfToken);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: 'Failed to update' }));
        window.alert(payload.message || 'Failed to update');
        return;
      }
      router.refresh();
    } catch {
      window.alert('Failed to update user status');
    }
  };

  const students = users.filter((u) => u.role === 'student');
  const activeCount = students.filter((u) => u.is_active).length;
  const suspendedCount = students.filter((u) => !u.is_active).length;
  const newCount = students.filter((u) => !u.last_login).length;

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.fullname || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'All' ||
      (filter === 'Active' && u.is_active) ||
      (filter === 'Suspended' && !u.is_active) ||
      (filter === 'New' && !u.last_login);
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6 max-w-[1200px]">
      <meta name="csrf-token" content={csrfToken} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-headline text-[26px] font-bold" style={{ color: '#111827' }}>
            Users Management
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: '#9CA3AF' }}>
            Administer student accounts and demographics.
          </p>
        </div>
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="btn-primary">
          + Create User
        </button>
      </div>

      {/* Create User Form */}
      {isOpen && (
        <div className="card p-5">
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-label-caps block" style={{ color: '#6B7280' }}>Full Name</label>
              <input value={fullname} onChange={(e) => setFullname(e.target.value)} className="field" placeholder="John Smith" />
            </div>
            <div className="space-y-1.5">
              <label className="text-label-caps block" style={{ color: '#6B7280' }}>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="field font-code" placeholder="john_smith" />
            </div>
            <div className="space-y-1.5">
              <label className="text-label-caps block" style={{ color: '#6B7280' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
            </div>
            <div className="space-y-1.5">
              <label className="text-label-caps block" style={{ color: '#6B7280' }}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as 'student' | 'admin')} className="field">
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {error && <p className="text-[13px] text-red-600 md:col-span-2">{error}</p>}
            <div className="flex justify-end gap-3 md:col-span-2">
              <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: 'Active Students', value: activeCount, icon: 'group' },
          { label: 'New Today', value: newCount, icon: 'school' },
          { label: 'Suspended', value: suspendedCount, icon: 'block' },
          { label: 'Total Labs Completed', value: users.reduce((s, u) => s + (u.labs_completed || 0), 0), icon: 'science' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[13px]" style={{ color: '#9CA3AF' }}>{s.label}</div>
                <div className="mt-2 font-headline text-[32px] font-bold" style={{ color: '#111827' }}>
                  {s.value.toLocaleString()}
                </div>
              </div>
              <Icon name={s.icon} className="text-[22px]" style={{ color: '#D1D5DB' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[16px]" style={{ color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field pl-9"
          />
        </div>
        <div className="filter-row shrink-0">
          {(['All', 'Active', 'New', 'Suspended'] as StatusFilter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`filter-chip ${filter === f ? 'active' : ''}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <EmptyState icon="group" title="No Users Found" copy="No users match your search or filter." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Total Labs Completed</th>
                  <th>Last Login</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const statusKey = user.is_active ? 'active' : 'suspended';
                  const isNew = !user.last_login;
                  const badgeClass = isNew ? 'badge-new' : statusKey === 'active' ? 'badge-active' : 'badge-suspended';
                  const badgeLabel = isNew ? 'New' : statusKey === 'active' ? 'Active' : 'Suspended';

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="font-code text-[13px]" style={{ color: '#111827' }}>
                          {user.username}
                        </div>
                      </td>
                      <td className="text-[13px]" style={{ color: '#6B7280' }}>
                        {user.email || `${user.username}@example.com`}
                      </td>
                      <td>
                        <span className={badgeClass}>{badgeLabel}</span>
                      </td>
                      <td className="font-code text-[12px]" style={{ color: '#9CA3AF' }}>
                        {user.last_login
                          ? new Date(user.last_login).toLocaleString()
                          : '—'}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            aria-label="Edit user"
                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                            style={{ color: '#6B7280' }}
                          >
                            <Icon name="edit" className="text-[16px]" />
                          </button>
                          {user.username !== currentUsername && (
                            <button
                              type="button"
                              onClick={() => handleToggleActive(user)}
                              aria-label="More options"
                              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                              style={{ color: '#6B7280' }}
                            >
                              <Icon name="more_horiz" className="text-[16px]" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

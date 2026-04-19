'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
      setError('All fields are required');
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
        body: JSON.stringify({
          username: username.trim(),
          fullname: fullname.trim(),
          password,
          role,
        }),
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
    <div className="w-full">
      <meta name="csrf-token" content={csrfToken} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#333]">User Management</h1>
          <p className="text-[#828282] text-sm mt-1">Manage and view all registered platform users.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="bg-[#2D9CDB] hover:bg-[#2789C2] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-200 active:scale-95"
        >
          Add New User
        </button>
      </div>

      {isOpen && (
        <section className="mb-6 bg-white border border-[#E0E6ED] rounded-xl shadow-sm p-5">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#333] mb-1">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-[#E0E6ED] px-3 py-2.5 text-sm text-[#333] outline-none focus:ring-2 focus:ring-[#2D9CDB]/30 focus:border-[#2D9CDB]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#333] mb-1">Full Name</label>
              <input
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="w-full rounded-lg border border-[#E0E6ED] px-3 py-2.5 text-sm text-[#333] outline-none focus:ring-2 focus:ring-[#2D9CDB]/30 focus:border-[#2D9CDB]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#333] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#E0E6ED] px-3 py-2.5 text-sm text-[#333] outline-none focus:ring-2 focus:ring-[#2D9CDB]/30 focus:border-[#2D9CDB]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#333] mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'student' | 'admin')}
                className="w-full rounded-lg border border-[#E0E6ED] px-3 py-2.5 text-sm text-[#333] outline-none focus:ring-2 focus:ring-[#2D9CDB]/30 focus:border-[#2D9CDB]"
              >
                <option value="student">student</option>
                <option value="admin">admin</option>
              </select>
            </div>
            {error && <p className="text-sm text-red-500 md:col-span-2">{error}</p>}
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#2D9CDB] hover:bg-[#2789C2] text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-70"
              >
                {loading ? 'Creating...' : 'Create User'}
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
                <th className="px-6 py-4 font-bold text-[#828282] text-xs uppercase tracking-wider">User Details</th>
                <th className="px-6 py-4 font-bold text-[#828282] text-xs uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 font-bold text-[#828282] text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold text-[#828282] text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F5F8]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#F9FBFC] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F2F5F8] flex items-center justify-center text-[#2D9CDB] font-bold text-sm border border-[#E0E6ED]">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[#333] tracking-tight">{user.fullname || 'No Name'}</div>
                        <div className="text-xs text-[#828282]">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      user.role === 'admin'
                        ? 'bg-purple-50 text-purple-600 border-purple-100'
                        : 'bg-blue-50 text-[#2D9CDB] border-blue-100'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${user.is_active ? 'text-[#27AE60]' : 'text-[#828282]'}`}>
                      <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-[#27AE60]' : 'bg-[#BDBDBD]'}`}></span>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    {user.username === currentUsername ? null : (
                      <button
                        type="button"
                        onClick={() => handleToggleActive(user)}
                        className={`text-xs font-bold uppercase tracking-wider ${
                          user.is_active ? 'text-red-500 hover:text-red-600' : 'text-[#2D9CDB] hover:text-[#2789C2]'
                        }`}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-12 text-center text-[#BDBDBD] font-medium">
              No users found or database connection failed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

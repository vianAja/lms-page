'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  {
    label: 'Manage Student',
    href: '/dashboard/manage-student',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
  },
  {
    label: 'Class & Lab Management',
    href: '/dashboard/classes',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v13H4a2 2 0 0 1-2-2Z"/><path d="M22 7a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v13h8a2 2 0 0 0 2-2Z"/></svg>
    ),
  },
  {
    label: 'User Management',
    href: '/dashboard/users',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    ),
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-4 mt-2">
      <ul className="space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all group ${
                  isActive
                    ? 'bg-[#F2F5F8] text-[#2D9CDB]'
                    : 'text-[#828282] hover:bg-[#F2F5F8] hover:text-[#2D9CDB]'
                }`}
              >
                <span
                  className={`transition-colors ${
                    isActive ? 'text-[#2D9CDB]' : 'text-[#828282] group-hover:text-[#2D9CDB]'
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

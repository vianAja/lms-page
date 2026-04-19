"use client";

import { useState } from 'react';

interface ProfileProps {
  fullname: string;
  username: string;
  csrfToken?: string;
}

function getCookieValue(name: string): string | null {
  const cookiePart = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`));

  if (!cookiePart) {
    return null;
  }

  return decodeURIComponent(cookiePart.split('=').slice(1).join('='));
}

function resolveCsrfToken(fallbackToken?: string): string {
  if (fallbackToken) {
    return fallbackToken;
  }

  const sessionCookie = getCookieValue('user_session');
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(sessionCookie) as { csrf_token?: unknown };
      if (typeof parsed.csrf_token === 'string' && parsed.csrf_token.length > 0) {
        return parsed.csrf_token;
      }
    } catch {
      // Ignore malformed cookie and fallback to meta tag.
    }
  }

  const metaToken = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute('content');

  return metaToken || '';
}

export default function ProfileDropdown({ fullname, username, csrfToken }: ProfileProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const token = resolveCsrfToken(csrfToken);

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': token,
        },
      });

      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-[#F2F5F8] border border-[#E0E6ED] text-[#828282] hover:bg-[#E0E6ED] hover:text-[#333] transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/><path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/></svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 rounded-xl shadow-xl bg-white border border-[#E0E6ED] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-2">
            <div className="px-5 py-4 border-b border-[#F2F5F8]">
              <p className="text-sm font-bold text-[#333] truncate">{fullname}</p>
              <p className="text-xs text-[#828282] truncate font-medium">@{username}</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full text-left px-5 py-3 text-sm font-bold text-red-500 hover:bg-[#F9FBFC] transition-colors flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

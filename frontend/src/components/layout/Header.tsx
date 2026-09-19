'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Search, LogOut, ChevronDown, User as UserIcon, Shield } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  OFFICE_EXECUTIVE: 'Office Executive',
  AGENT: 'Agent',
  CLIENT: 'Client',
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-violet-100 text-violet-700 border-violet-200',
  OFFICE_EXECUTIVE: 'bg-blue-100 text-blue-700 border-blue-200',
  AGENT: 'bg-amber-100 text-amber-800 border-amber-200',
  CLIENT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

export function Header() {
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const displayName = user.name || user.email.split('@')[0]
  const initial = (user.name ? user.name[0] : user.email[0]).toUpperCase()

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-64 text-sm text-slate-400">
        <Search size={15} />
        <span>Search…</span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button
          type="button"
          className="relative text-slate-500 hover:text-slate-900 transition-colors p-1 rounded-lg hover:bg-slate-50"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left focus:outline-none"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-semibold text-white shadow-xs shrink-0">
              {initial}
            </div>
            <div className="hidden sm:block text-sm leading-tight">
              <div className="font-semibold text-slate-800 truncate max-w-[130px]">{displayName}</div>
              <div
                className={`text-[10px] font-semibold rounded px-1.5 py-0.2 border inline-block mt-0.5 ${
                  ROLE_COLORS[user.role] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {ROLE_LABELS[user.role] ?? user.role}
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400 shrink-0 hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu (Display ONLY user's name/role and Sign Out — no switch role) */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate font-mono mt-0.5">{user.email}</p>
                <div className="mt-2">
                  <span
                    className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border ${
                      ROLE_COLORS[user.role] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </div>
              </div>

              {/* Working Sign Out action */}
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false)
                    logout()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors font-medium text-left"
                >
                  <LogOut size={16} className="shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

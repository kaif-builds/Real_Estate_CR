'use client'

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { MOCK_USERS } from '@/lib/mockData'
import {
  LayoutDashboard, Users, Building2, ClipboardList, Zap,
  BarChart3, Bell, Phone, CheckSquare, Clock, MapPin,
  UserCheck, TrendingUp, Receipt, DollarSign, Users2,
  Settings, Shield, AlertTriangle, FileBarChart,
  ChevronDown, ChevronRight, PanelLeftClose, PanelLeft,
  Mic, Megaphone, Share2, PhoneCall, GitFork, Handshake,
  FolderOpen, FileSpreadsheet, Bot, Sparkles,
} from 'lucide-react'

// ── Nav item definitions ──────────────────────────────────────────────────────

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  roles: string[]
}

type NavGroup = {
  label: string
  roles: string[]
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'DASHBOARD',
    roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE', 'AGENT'],
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE', 'AGENT'] },
    ],
  },
  {
    label: 'LEADS & CLIENTS',
    roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE', 'AGENT'],
    items: [
      { label: 'Leads',        href: '/leads',        icon: Users,         roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE', 'AGENT'] },
      { label: 'Parties',      href: '/parties',      icon: Building2,     roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE', 'AGENT'] },
      { label: 'Requirements', href: '/requirements', icon: ClipboardList, roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE', 'AGENT'] },
      { label: 'Matching',     href: '/matching',     icon: Zap,           roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE', 'AGENT'] },
    ],
  },
  {
    label: 'PROPERTIES',
    roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE', 'AGENT'],
    items: [
      { label: 'Inventory',     href: '/inventory',     icon: Building2, roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE', 'AGENT'] },
      { label: 'Demand/Supply', href: '/demand-supply', icon: BarChart3, roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE'] },
    ],
  },
  {
    label: 'ACTIVITIES',
    roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE', 'AGENT'],
    items: [
      { label: 'Follow-ups',      href: '/follow-ups',      icon: Bell,        roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE', 'AGENT'] },
      { label: 'Telecalling',     href: '/telecalling',     icon: Phone,       roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE', 'AGENT'] },
      { label: 'Call Recordings', href: '/call-recordings', icon: Mic,         roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE'] },
      { label: 'Tasks',           href: '/tasks',           icon: CheckSquare, roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE', 'AGENT'] },
      { label: 'Timeline',        href: '/timeline',        icon: Clock,       roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE', 'AGENT'] },
    ],
  },
  {
    label: 'MARKETING',
    roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE'],
    items: [
      { label: 'Dashboard',        href: '/marketing-dashboard',    icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE'] },
      { label: 'Campaigns',        href: '/campaigns',              icon: Megaphone,       roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE'] },
      { label: 'Lead Sources',     href: '/lead-sources',           icon: Share2,          roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE'] },
      { label: 'Telemarketing',    href: '/telemarketing-campaigns',icon: PhoneCall,       roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE'] },
      { label: 'Traceability',     href: '/marketing-traceability', icon: GitFork,         roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE'] },
      { label: 'Referral Partners',href: '/referral-partners',      icon: Handshake,       roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE'] },
      { label: 'Analytics',        href: '/campaign-analytics',     icon: BarChart3,       roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE'] },
      { label: 'Marketing MIS',    href: '/marketing-mis',          icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE'] },
      { label: 'Content Library',  href: '/content-library',        icon: FolderOpen,      roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE'] },
      { label: 'Marketing Settings', href: '/marketing-settings',   icon: Settings,        roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    label: 'FIELD VISITS',
    roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE', 'AGENT'],
    items: [
      { label: 'Visits',       href: '/visits',        icon: MapPin,    roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE', 'AGENT'] },
      { label: 'Review Queue', href: '/visits/review', icon: UserCheck, roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE'] },
      { label: 'Field Staff',  href: '/field-staff',   icon: Users,     roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE'] },
    ],
  },
  {
    label: 'OPPORTUNITIES',
    roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE'],
    items: [
      { label: 'Opportunities', href: '/opportunities', icon: TrendingUp,   roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE'] },
      { label: 'Transactions',  href: '/transactions',  icon: Receipt,      roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE'] },
      { label: 'Commissions',   href: '/commissions',   icon: DollarSign,   roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    label: 'ADMIN',
    roles: ['SUPER_ADMIN'],
    items: [
      { label: 'Users',    href: '/user-management', icon: Users2,        roles: ['SUPER_ADMIN'] },
      { label: 'Settings', href: '/settings',        icon: Settings,      roles: ['SUPER_ADMIN'] },
      { label: 'Audit Log',href: '/audit',           icon: Shield,        roles: ['SUPER_ADMIN'] },
      { label: 'Alerts',   href: '/alerts',          icon: AlertTriangle, roles: ['SUPER_ADMIN'] },
      { label: 'Reports',  href: '/reports',         icon: FileBarChart,  roles: ['SUPER_ADMIN'] },
    ],
  },
]

// ── Standalone items (not in any group) ──────────────────────────────────────
// These are rendered as a pinned section separate from the grouped nav.

const NAV_STANDALONE: NavItem[] = [
  { label: 'AI Assistant', href: '/ai-assistant', icon: Bot, roles: ['SUPER_ADMIN', 'OFFICE_EXECUTIVE', 'AGENT'] },
  { label: 'AI Management', href: '/ai-management', icon: Sparkles, roles: ['SUPER_ADMIN'] },
]

// ── Persistent Module-Level Cache ────────────────────────────────────────────
// Survives component remounts across client-side page transitions
let cachedSidebarScrollTop = 0
let cachedClosedGroups: Record<string, boolean> = {}

if (typeof window !== 'undefined') {
  try {
    const savedScroll = sessionStorage.getItem('sidebarScrollTop')
    if (savedScroll) cachedSidebarScrollTop = Number(savedScroll)
    const savedGroups = sessionStorage.getItem('sidebarClosedGroups')
    if (savedGroups) cachedClosedGroups = JSON.parse(savedGroups)
  } catch {}
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function Sidebar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const asideRef = useRef<HTMLElement>(null)

  const [collapsed, setCollapsed] = useState(false)
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>(() => cachedClosedGroups)

  // Persist collapse state to sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('sidebarCollapsed')
    if (stored) setCollapsed(stored === 'true')
  }, [])

  // Restore scroll position synchronously before paint & verify on rAF
  useIsomorphicLayoutEffect(() => {
    const restore = () => {
      if (asideRef.current && cachedSidebarScrollTop > 0) {
        asideRef.current.scrollTop = cachedSidebarScrollTop
      }
    }
    restore()
    const rafId = requestAnimationFrame(restore)
    return () => cancelAnimationFrame(rafId)
  }, [pathname])

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    cachedSidebarScrollTop = e.currentTarget.scrollTop
    try {
      sessionStorage.setItem('sidebarScrollTop', String(e.currentTarget.scrollTop))
    } catch {}
  }

  const handleLinkClick = () => {
    if (asideRef.current) {
      cachedSidebarScrollTop = asideRef.current.scrollTop
      try {
        sessionStorage.setItem('sidebarScrollTop', String(asideRef.current.scrollTop))
      } catch {}
    }
  }

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      sessionStorage.setItem('sidebarCollapsed', String(next))
    } catch {}
  }

  const toggleGroup = (label: string) => {
    setClosedGroups((prev) => {
      const next = { ...prev, [label]: !prev[label] }
      cachedClosedGroups = next
      try {
        sessionStorage.setItem('sidebarClosedGroups', JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const currentUser = user || (MOCK_USERS[0] ? {
    id: MOCK_USERS[0].id,
    name: MOCK_USERS[0].name,
    email: MOCK_USERS[0].email,
    role: MOCK_USERS[0].role as any,
  } : null)

  if (!currentUser) return null

  const visibleGroups = NAV_GROUPS.filter((g) => g.roles.includes(currentUser.role))

  return (
    <aside
      ref={asideRef}
      onScroll={handleScroll}
      className={cn(
        'flex flex-col bg-slate-900 text-slate-100 transition-all duration-200 ease-in-out',
        collapsed ? 'w-16' : 'w-60',
        'shrink-0 h-screen sticky top-0 overflow-y-auto overflow-x-hidden'
      )}
    >
      {/* Logo / brand */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700 min-h-[64px]">
        {!collapsed && (
          <span className="text-white font-bold text-base truncate">PropDesk CRM</span>
        )}
        <button
          onClick={toggleCollapse}
          className="text-slate-400 hover:text-white p-1 rounded transition-colors ml-auto"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 py-2 space-y-0.5">
        {visibleGroups.map((group) => {
          const visibleItems = group.items.filter((i) => i.roles.includes(currentUser.role))
          if (visibleItems.length === 0) return null
          const isGroupOpen = !closedGroups[group.label]

          return (
            <div key={group.label}>
              {/* Group label — hidden when sidebar is collapsed */}
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {group.label}
                  {isGroupOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
              )}

              {/* Items — always show when collapsed (icons only) */}
              {(isGroupOpen || collapsed) && visibleItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    scroll={false}
                    onClick={handleLinkClick}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-amber-500/20 text-amber-400 border-r-2 border-amber-400'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                      collapsed && 'justify-center px-0'
                    )}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* AI Assistant & Management — standalone items (not in a group) */}
      {(() => {
        const standaloneItems = NAV_STANDALONE.filter(i => i.roles.includes(currentUser.role))
        if (standaloneItems.length === 0) return null
        return (
          <div className="border-t border-slate-700/50 py-2">
            {standaloneItems.map(item => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  scroll={false}
                  onClick={handleLinkClick}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-amber-500/20 text-amber-400 border-r-2 border-amber-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                    collapsed && 'justify-center px-0'
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
          </div>
        )
      })()}

      {/* Role indicator at bottom */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-500 truncate">
          {currentUser.role.replace('_', ' ')} · {currentUser.email}
        </div>
      )}
    </aside>
  )
}

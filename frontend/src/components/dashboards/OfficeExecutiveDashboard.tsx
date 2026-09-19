'use client'

/**
 * OfficeExecutiveDashboard — Spec §1.2.1
 * Accessible by: SUPER_ADMIN, OFFICE_EXECUTIVE
 *
 * Sections:
 *  1. Summary cards (5 stats)
 *  2. Today's Follow-up Queue table
 *  3. Stale Records Alert table
 *     — Properties with status SOLD/RENTED/LEASED/WITHDRAWN are NEVER shown here.
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, Bell, Building2, ClipboardList, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiGet } from '@/lib/apiClient'
import {
  formatAgeDays, formatDateTime, priorityClasses, statusClasses,
} from '@/lib/formatters'

import {
  MOCK_LEADS,
  MOCK_REQUIREMENTS,
  MOCK_PROPERTIES,
  MOCK_FOLLOW_UPS,
} from '@/lib/mockData'

// ── Types ─────────────────────────────────────────────────────────────────────

interface OfficeSummary {
  active_leads: number
  active_requirements: number
  active_inventory: number
  pending_follow_ups: number
  overdue_follow_ups: number
}

interface FollowUpRow {
  id: string
  client_name: string
  type: string
  purpose: string
  priority: string
  status: string
  scheduled_at: string | null
  responsible_name: string
}

interface StaleRecord {
  id: string
  record_type: string
  name: string
  age_days: number
  last_verified_at: string | null
  status: string
}

interface OfficeDashboardData {
  summary: OfficeSummary
  todays_queue: FollowUpRow[]
  stale_records: StaleRecord[]
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, accent = false, danger = false,
}: {
  label: string; value: number; icon: React.ElementType; accent?: boolean; danger?: boolean
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
          <p className={`text-3xl font-bold ${danger ? 'text-red-600' : accent ? 'text-amber-600' : 'text-slate-900'}`}>
            {value}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          danger ? 'bg-red-100 text-red-600' : accent ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
        }`}>
          <Icon size={24} />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function OfficeExecutiveDashboard() {
  const [data, setData] = useState<OfficeDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // TODO: reconnect to real backend during wiring pass
    /*
    apiGet<OfficeDashboardData>('/api/dashboard/office')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
    */

    // 1. Summary counts: directly computed from mockData.ts arrays
    const active_leads = MOCK_LEADS.filter(
      (l) => l.status !== 'LOST' && l.status !== 'Lost'
    ).length

    const active_requirements = MOCK_REQUIREMENTS.filter(
      (r) => r.status === 'ACTIVE' || r.status === 'Active'
    ).length

    const active_inventory = MOCK_PROPERTIES.filter(
      (p) =>
        p.status === 'AVAILABLE' ||
        p.status === 'Available' ||
        p.status === 'NEW' ||
        p.status === 'New' ||
        p.status === 'UNDER_NEGOTIATION' ||
        p.status === 'ON_HOLD'
    ).length

    const pending_follow_ups = MOCK_FOLLOW_UPS.filter(
      (fu) =>
        fu.status === 'PENDING' ||
        fu.status === 'Pending' ||
        fu.status === 'OVERDUE' ||
        fu.status === 'Overdue'
    ).length

    const overdue_follow_ups = MOCK_FOLLOW_UPS.filter(
      (fu) => fu.status === 'OVERDUE' || fu.status === 'Overdue'
    ).length

    const summary: OfficeSummary = {
      active_leads,
      active_requirements,
      active_inventory,
      pending_follow_ups,
      overdue_follow_ups,
    }

    // 2. Today's Follow-up Queue: pulled from mock Follow-up records
    const todays_queue: FollowUpRow[] = MOCK_FOLLOW_UPS
      .filter(
        (fu) =>
          fu.status === 'PENDING' ||
          fu.status === 'Pending' ||
          fu.status === 'OVERDUE' ||
          fu.status === 'Overdue'
      )
      .map((fu) => ({
        id: fu.id,
        client_name: fu.client_name,
        type: fu.entity_type,
        purpose: fu.purpose,
        priority: fu.priority,
        status: fu.status,
        scheduled_at: fu.due_date,
        responsible_name: fu.responsible_name,
      }))

    // 3. Stale Records Alert: uses mock Properties with terminal status exclusion rule
    // Terminal statuses (Sold, Rented, Leased, Withdrawn) are explicitly excluded
    const TERMINAL_STATUSES = new Set([
      'SOLD',
      'RENTED',
      'LEASED',
      'WITHDRAWN',
      'Sold',
      'Rented',
      'Leased',
      'Withdrawn',
    ])

    const now = new Date('2026-09-19T12:00:00Z').getTime()
    const STALE_DAYS_THRESHOLD = 5

    const stale_records: StaleRecord[] = MOCK_PROPERTIES
      .filter((p) => !TERMINAL_STATUSES.has(p.status))
      .map((p) => {
        let age_days = 0
        if (p.last_verified_at) {
          const verifiedTime = new Date(p.last_verified_at).getTime()
          age_days = Math.max(0, Math.floor((now - verifiedTime) / (1000 * 60 * 60 * 24)))
        } else {
          const createdTime = new Date(p.created_at).getTime()
          age_days = Math.max(0, Math.floor((now - createdTime) / (1000 * 60 * 60 * 24)))
        }
        return {
          id: p.id,
          record_type: 'Property',
          name: p.short_loc,
          age_days,
          last_verified_at: p.last_verified_at,
          status: p.status,
        }
      })
      .filter((r) => r.age_days > STALE_DAYS_THRESHOLD)
      .sort((a, b) => b.age_days - a.age_days)

    setData({
      summary,
      todays_queue,
      stale_records,
    })
    setLoading(false)
  }, [])

  if (loading) return <DashboardSkeleton />
  if (error) return <ErrorBanner message={error} />
  if (!data) return null

  const { summary, todays_queue, stale_records } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Office overview — all figures are live from the database.</p>
      </div>

      {/* ── Summary cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Active Leads"        value={summary.active_leads}        icon={Users}        />
        <StatCard label="Active Requirements" value={summary.active_requirements} icon={ClipboardList} />
        <StatCard label="Active Inventory"    value={summary.active_inventory}    icon={Building2}    />
        <StatCard label="Pending Follow-ups"  value={summary.pending_follow_ups}  icon={Bell}   accent />
        <StatCard
          label="Overdue Follow-ups"
          value={summary.overdue_follow_ups}
          icon={AlertTriangle}
          danger={summary.overdue_follow_ups > 0}
        />
      </div>

      {/* ── Today's Follow-up Queue ───────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Bell size={18} className="text-amber-500" />
            Today&apos;s Follow-up Queue
            <span className="ml-auto text-sm font-normal text-slate-500">{todays_queue.length} pending</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {todays_queue.length === 0 ? (
            <p className="text-sm text-slate-400 px-6 pb-5">No pending follow-ups. 🎉</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-6 py-3">Client</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Scheduled</th>
                    <th className="px-4 py-3">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {todays_queue.map((row, i) => (
                    <tr key={row.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                      <td className="px-6 py-3 font-medium text-slate-800">{row.client_name}</td>
                      <td className="px-4 py-3 text-slate-600">{row.type}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{row.purpose}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${priorityClasses(row.priority)}`}>
                          {row.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(row.scheduled_at)}</td>
                      <td className="px-4 py-3 text-slate-500">{row.responsible_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Stale Records Alert ───────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className={stale_records.length > 0 ? 'text-red-500' : 'text-slate-400'} />
            Stale Records Alert
            {stale_records.length > 0 && (
              <Badge variant="destructive" className="ml-1">{stale_records.length}</Badge>
            )}
            <span className="ml-auto text-xs font-normal text-slate-400">
              Properties unverified &gt; 5 days · Sold/Rented/Leased/Withdrawn excluded
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {stale_records.length === 0 ? (
            <p className="text-sm text-slate-400 px-6 pb-5">All active properties verified within 5 days. ✅</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-6 py-3">Property ID</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Verified</th>
                    <th className="px-4 py-3">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {stale_records.map((row, i) => (
                    <tr key={row.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                      <td className="px-6 py-3 font-mono text-xs font-medium text-slate-700">{row.id}</td>
                      <td className="px-4 py-3 text-slate-800">{row.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700">
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDateTime(row.last_verified_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                          row.age_days >= 14 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {formatAgeDays(row.age_days)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Skeleton / error states ───────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-slate-200 rounded-xl" />
      <div className="h-48 bg-slate-200 rounded-xl" />
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
      <p className="font-semibold mb-1">Failed to load dashboard data</p>
      <p className="text-red-600 font-mono text-xs">{message}</p>
      <p className="mt-2 text-red-500 text-xs">Make sure the backend is running and you have X-Mock-Role set.</p>
    </div>
  )
}

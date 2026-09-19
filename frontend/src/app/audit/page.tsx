'use client'

/**
 * System Audit Log Module — Module 17 (Super Admin Only)
 * Read-only immutable security audit trail capturing changes to properties,
 * requirements, leads, visits, deals, users, and transactions.
 */

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Shield, Search, Filter, Calendar, Clock, User, Eye,
  Building2, ClipboardList, Users, MapPin, TrendingUp,
  Receipt, UserCheck, X, FileText, CheckCircle2, AlertTriangle,
  ArrowRight, ExternalLink
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  MOCK_AUDIT_LOGS,
  MOCK_USERS,
  type AuditLogRow,
} from '@/lib/mockData'

// ── Action Badge ──────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: AuditLogRow['action'] }) {
  switch (action) {
    case 'Created':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Created
        </span>
      )
    case 'Updated':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Updated
        </span>
      )
    case 'Status Changed':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          Status Changed
        </span>
      )
    case 'Deleted':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Deleted
        </span>
      )
    default:
      return <Badge variant="outline">{action}</Badge>
  }
}

// ── Entity Type Badge ─────────────────────────────────────────────────────────

function EntityTypeBadge({ type }: { type: AuditLogRow['entity_type'] }) {
  const styles: Record<AuditLogRow['entity_type'], string> = {
    Property: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Requirement: 'bg-teal-50 text-teal-700 border-teal-200',
    Lead: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    Visit: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Opportunity: 'bg-amber-50 text-amber-700 border-amber-200',
    Transaction: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    User: 'bg-purple-50 text-purple-700 border-purple-200',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
        styles[type] || 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {type}
    </span>
  )
}

// ── Entity Link Helper ────────────────────────────────────────────────────────

function getEntityHref(type: AuditLogRow['entity_type']): string {
  switch (type) {
    case 'Property':
      return '/inventory'
    case 'Requirement':
      return '/requirements'
    case 'Lead':
      return '/leads'
    case 'Visit':
      return '/visits'
    case 'Opportunity':
      return '/opportunities'
    case 'Transaction':
      return '/transactions'
    case 'User':
      return '/user-management'
    default:
      return '#'
  }
}

export default function AuditPage() {
  const [logs] = useState<AuditLogRow[]>([...MOCK_AUDIT_LOGS])
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null)

  // Filter States
  const [entityFilter, setEntityFilter] = useState('ALL')
  const [userFilter, setUserFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // ── Filtered Logs ───────────────────────────────────────────────────────────

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Entity type filter
      if (entityFilter !== 'ALL' && log.entity_type !== entityFilter) {
        return false
      }
      // User filter
      if (userFilter !== 'ALL' && log.user_name !== userFilter) {
        return false
      }
      // Date range filter
      if (dateFrom && log.timestamp.slice(0, 10) < dateFrom) {
        return false
      }
      if (dateTo && log.timestamp.slice(0, 10) > dateTo) {
        return false
      }
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesId = log.id.toLowerCase().includes(q)
        const matchesEntityId = log.entity_id.toLowerCase().includes(q)
        const matchesUser = log.user_name.toLowerCase().includes(q)
        const matchesSummary = log.summary.toLowerCase().includes(q)
        if (!matchesId && !matchesEntityId && !matchesUser && !matchesSummary) {
          return false
        }
      }
      return true
    })
  }, [logs, entityFilter, userFilter, dateFrom, dateTo, searchQuery])

  // Unique Users in Audit
  const auditUsers = useMemo(() => {
    const names = new Set<string>()
    logs.forEach((l) => names.add(l.user_name))
    return Array.from(names)
  }, [logs])

  const handleResetFilters = () => {
    setEntityFilter('ALL')
    setUserFilter('ALL')
    setDateFrom('')
    setDateTo('')
    setSearchQuery('')
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
              <Badge variant="secondary" className="font-mono text-xs">
                {filteredLogs.length} Records
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                Super Admin Only
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Read-only chronological audit trail capturing all system state mutations, access, and status changes.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search ID, summary, entity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {/* Entity Type Dropdown */}
              <div>
                <Select
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  className="h-9 text-sm"
                >
                  <option value="ALL">All Entity Types</option>
                  <option value="Property">Property</option>
                  <option value="Requirement">Requirement</option>
                  <option value="Lead">Lead</option>
                  <option value="Visit">Visit</option>
                  <option value="Opportunity">Opportunity</option>
                  <option value="Transaction">Transaction</option>
                  <option value="User">User</option>
                </Select>
              </div>

              {/* User Dropdown */}
              <div>
                <Select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="h-9 text-sm"
                >
                  <option value="ALL">All Users</option>
                  {auditUsers.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Date From */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium shrink-0">From:</span>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Date To */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium shrink-0">To:</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Active filters reset */}
            {(entityFilter !== 'ALL' || userFilter !== 'ALL' || dateFrom || dateTo || searchQuery) && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
                <span>Showing filtered audit events</span>
                <button
                  onClick={handleResetFilters}
                  className="text-indigo-600 hover:text-indigo-800 font-medium underline"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">Summary of Change</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <Shield className="w-10 h-10 text-slate-300 mb-2" />
                        <p className="font-medium text-slate-600">No audit records found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Try adjusting your search criteria or date filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400 shrink-0" />
                          <span>{log.timestamp}</span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center border border-slate-300 shrink-0">
                            {log.user_name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900 text-xs">
                              {log.user_name}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {log.user_role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <ActionBadge action={log.action} />
                      </td>

                      {/* Entity Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <EntityTypeBadge type={log.entity_type} />
                      </td>

                      {/* Entity ID */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-xs" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={getEntityHref(log.entity_type)}
                          className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 font-semibold"
                        >
                          {log.entity_id}
                          <ExternalLink size={10} />
                        </Link>
                      </td>

                      {/* Summary of Change */}
                      <td className="py-3 px-4 text-xs text-slate-800 max-w-md truncate">
                        {log.summary}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900"
                        >
                          <Eye size={13} className="mr-1" /> View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Audit Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Shield className="text-slate-700" size={18} />
                  <h2 className="text-base font-bold text-slate-900">
                    Audit Event — {selectedLog.id}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
                {/* Event header card */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-mono">
                      Timestamp: {selectedLog.timestamp}
                    </span>
                    <ActionBadge action={selectedLog.action} />
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {selectedLog.summary}
                  </p>
                </div>

                {/* Details list */}
                <div className="space-y-3">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 text-xs">Actor / User</span>
                    <span className="font-medium text-slate-900 text-xs">
                      {selectedLog.user_name} ({selectedLog.user_role})
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 text-xs">Entity Type</span>
                    <EntityTypeBadge type={selectedLog.entity_type} />
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 text-xs">Entity ID</span>
                    <span className="font-mono text-xs font-semibold text-slate-900">
                      {selectedLog.entity_id}
                    </span>
                  </div>

                  {selectedLog.ip_address && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 text-xs">Origin IP</span>
                      <span className="font-mono text-xs text-slate-600">
                        {selectedLog.ip_address}
                      </span>
                    </div>
                  )}

                  {/* Metadata / Details Payload */}
                  {selectedLog.details && (
                    <div className="pt-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                        Change Payload & Metadata
                      </span>
                      <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto font-mono">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSelectedLog(null)}
                  className="bg-slate-900 text-white text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

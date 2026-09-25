'use client'

/**
 * System Audit Log Module — Module 17 (Super Admin Only)
 * Unified audit trail capturing all system state mutations,
 * including AI-assisted actions with full 3-state trail.
 */

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Shield, Search, Filter, Calendar, Clock, User, Eye,
  Building2, ClipboardList, Users, MapPin, TrendingUp,
  Receipt, UserCheck, X, FileText, CheckCircle2, AlertTriangle,
  ArrowRight, ExternalLink, Bot, Sparkles, ChevronRight,
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
  type AiTrail,
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
  const styles: Record<string, string> = {
    Property: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Requirement: 'bg-teal-50 text-teal-700 border-teal-200',
    Lead: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    Visit: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Opportunity: 'bg-amber-50 text-amber-700 border-amber-200',
    Transaction: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    User: 'bg-purple-50 text-purple-700 border-purple-200',
    'Marketing Config': 'bg-pink-50 text-pink-700 border-pink-200',
    'Follow-up': 'bg-orange-50 text-orange-700 border-orange-200',
    Task: 'bg-slate-50 text-slate-700 border-slate-300',
    Campaign: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
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
    case 'Marketing Config':
      return '/marketing-settings'
    case 'Follow-up':
      return '/follow-ups'
    case 'Task':
      return '/tasks'
    case 'Campaign':
      return '/campaigns'
    default:
      return '#'
  }
}

// ── AI Trail Detail Component ─────────────────────────────────────────────────

function AiTrailDetail({ trail }: { trail: AiTrail }) {
  const hasEdits = Object.keys(trail.user_edits).length > 0
  const isWorkflow = trail.workflow_steps && trail.workflow_steps.length > 0

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
        <Bot size={16} className="text-amber-600 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-amber-800">AI-Assisted Action</p>
          <p className="text-[11px] text-amber-600">This action was performed via the AI Assistant with human approval</p>
        </div>
      </div>

      {/* Step 1: Original Request */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">1</div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Original User Request</span>
        </div>
        <div className="ml-7 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-900 italic">
          {'\u201c'}{trail.original_request}{'\u201d'}
        </div>
      </div>

      {/* Step 2: AI Proposed Values */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold flex items-center justify-center">2</div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">AI Proposed Values</span>
          <span className="text-[10px] text-slate-400">(intent: {trail.interpreted_intent})</span>
        </div>
        <div className="ml-7">
          <div className="grid grid-cols-2 gap-1 bg-slate-50 border border-slate-200 rounded-lg p-2">
            {Object.entries(trail.proposed_values).filter(([, v]) => v != null && v !== '').map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-1 text-xs py-0.5">
                <span className="text-slate-500 font-medium">{k}:</span>
                <span className="text-slate-800">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 3: User Edits */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`w-5 h-5 rounded-full ${hasEdits ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} text-[10px] font-bold flex items-center justify-center`}>3</div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">User Edits</span>
          {!hasEdits && <span className="text-[10px] text-emerald-600 font-medium">No changes made</span>}
        </div>
        {hasEdits ? (
          <div className="ml-7 space-y-1">
            {Object.entries(trail.user_edits).filter(([, v]) => v != null).map(([k, v]) => {
              const oldVal = trail.proposed_values[k]
              return (
                <div key={k} className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  <span className="text-slate-600 font-medium">{k}:</span>
                  <span className="text-red-500 line-through">{String(oldVal ?? '(empty)')}</span>
                  <ArrowRight size={10} className="text-slate-400" />
                  <span className="text-emerald-700 font-semibold">{String(v)}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="ml-7 text-xs text-slate-400 italic">User approved with no modifications</p>
        )}
      </div>

      {/* Step 4: Final Committed Values */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center">4</div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Final Committed Values</span>
          <CheckCircle2 size={12} className="text-emerald-500" />
        </div>
        <div className="ml-7">
          <div className="grid grid-cols-2 gap-1 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
            {Object.entries(trail.final_values).filter(([, v]) => v != null && v !== '').map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-1 text-xs py-0.5">
                <span className="text-emerald-600 font-medium">{k}:</span>
                <span className="text-emerald-900 font-semibold">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workflow Steps (if part of a workflow) */}
      {isWorkflow && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles size={14} className="text-indigo-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Workflow Steps ({trail.workflow_steps!.length})</span>
          </div>
          <div className="ml-5 space-y-1">
            {trail.workflow_steps!.map((ws, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded border ${ws.status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : ws.status === 'failed' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <span className="font-bold">{i + 1}.</span>
                <span className="font-medium">{ws.action_type}</span>
                {ws.record_id && <span className="font-mono text-[10px]">{ws.record_id}</span>}
                <span className={`ml-auto text-[10px] font-semibold uppercase ${ws.status === 'success' ? 'text-emerald-600' : ws.status === 'failed' ? 'text-red-600' : 'text-slate-400'}`}>{ws.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [logs] = useState<AuditLogRow[]>([...MOCK_AUDIT_LOGS])
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null)

  // Filter States
  const [entityFilter, setEntityFilter] = useState('ALL')
  const [userFilter, setUserFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [aiFilter, setAiFilter] = useState('ALL') // 'ALL' | 'YES' | 'NO'

  // ── Filtered Logs ───────────────────────────────────────────────────────────

  const filteredLogs = useMemo(() => {
    return MOCK_AUDIT_LOGS.filter((log) => {
      // Entity type filter
      if (entityFilter !== 'ALL' && log.entity_type !== entityFilter) {
        return false
      }
      // User filter
      if (userFilter !== 'ALL' && log.user_name !== userFilter) {
        return false
      }
      // AI-Assisted filter
      if (aiFilter === 'YES' && !log.ai_assisted) return false
      if (aiFilter === 'NO' && log.ai_assisted) return false
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
  }, [entityFilter, userFilter, dateFrom, dateTo, searchQuery, aiFilter])

  // Unique Users in Audit
  const auditUsers = useMemo(() => {
    const names = new Set<string>()
    MOCK_AUDIT_LOGS.forEach((l) => names.add(l.user_name))
    return Array.from(names)
  }, [])

  // Stats
  const aiCount = useMemo(() => MOCK_AUDIT_LOGS.filter(l => l.ai_assisted).length, [])

  const handleResetFilters = () => {
    setEntityFilter('ALL')
    setUserFilter('ALL')
    setDateFrom('')
    setDateTo('')
    setSearchQuery('')
    setAiFilter('ALL')
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
              {aiCount > 0 && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs gap-1">
                  <Bot size={10} />{aiCount} AI-Assisted
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Unified audit trail — human and AI-assisted actions in one view.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
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
                  <option value="Marketing Config">Marketing Config</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Task">Task</option>
                  <option value="Campaign">Campaign</option>
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

              {/* AI-Assisted Filter */}
              <div>
                <Select
                  value={aiFilter}
                  onChange={(e) => setAiFilter(e.target.value)}
                  className="h-9 text-sm"
                >
                  <option value="ALL">All Sources</option>
                  <option value="YES">AI-Assisted Only</option>
                  <option value="NO">Manual Only</option>
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
            {(entityFilter !== 'ALL' || userFilter !== 'ALL' || dateFrom || dateTo || searchQuery || aiFilter !== 'ALL') && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
                <span>
                  Showing filtered audit events
                  {aiFilter === 'YES' && <span className="ml-1 text-amber-600 font-semibold">(AI-assisted only)</span>}
                  {aiFilter === 'NO' && <span className="ml-1 text-slate-500 font-semibold">(manual only)</span>}
                </span>
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
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${log.ai_assisted ? 'bg-amber-50/30' : ''}`}
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
                        <div className="flex items-center gap-1.5">
                          <ActionBadge action={log.action} />
                          {log.ai_assisted && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                              <Bot size={9} />AI
                            </span>
                          )}
                        </div>
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
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Shield className="text-slate-700" size={18} />
                  <h2 className="text-base font-bold text-slate-900">
                    Audit Event — {selectedLog.id}
                  </h2>
                  {selectedLog.ai_assisted && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                      <Bot size={11} />AI-Assisted
                    </span>
                  )}
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

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 text-xs">Source</span>
                    <span className="text-xs font-medium">
                      {selectedLog.ai_assisted ? (
                        <span className="text-amber-700 flex items-center gap-1"><Bot size={11} />AI Assistant</span>
                      ) : (
                        <span className="text-slate-700">Manual</span>
                      )}
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

                  {/* AI Trail — the 3-state detail (only for AI-assisted entries) */}
                  {selectedLog.ai_assisted && selectedLog.ai_trail && (
                    <div className="pt-3">
                      <AiTrailDetail trail={selectedLog.ai_trail} />
                    </div>
                  )}

                  {/* Standard Metadata / Details Payload (for non-AI entries or as supplement) */}
                  {selectedLog.details && Object.keys(selectedLog.details).length > 0 && !selectedLog.ai_trail && (
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

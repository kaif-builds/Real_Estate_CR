'use client'

/**
 * AI Management Dashboard — Module 8 (Super Admin Only)
 * Performance analytics, staff adoption, and quality trends
 * computed live from unified MOCK_AUDIT_LOGS.
 */

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Sparkles, Bot, Shield, CheckCircle2, XCircle, Edit3,
  TrendingUp, Users, Calendar, ArrowRight, ExternalLink,
  HelpCircle, AlertTriangle, Layers, MessageSquare, ChevronRight,
  Filter, Clock, CheckSquare, Bell, MapPin, ClipboardList,
  Megaphone, ArrowRightLeft, UserPlus, RefreshCw, BarChart3,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  MOCK_AUDIT_LOGS,
  type AuditLogRow,
} from '@/lib/mockData'

// ── Module Metadata ───────────────────────────────────────────────────────────

const MODULE_META: Record<string, { label: string; icon: React.ElementType; color: string; href: string }> = {
  Lead:        { label: 'Leads',         icon: UserPlus,       color: 'bg-sky-50 text-sky-700 border-sky-200',       href: '/leads' },
  Requirement: { label: 'Requirements',  icon: ClipboardList,  color: 'bg-violet-50 text-violet-700 border-violet-200', href: '/requirements' },
  Visit:       { label: 'Visits',        icon: MapPin,         color: 'bg-emerald-50 text-emerald-700 border-emerald-200', href: '/visits' },
  Opportunity: { label: 'Opportunities', icon: TrendingUp,     color: 'bg-indigo-50 text-indigo-700 border-indigo-200', href: '/opportunities' },
  'Follow-up': { label: 'Follow-ups',    icon: Bell,           color: 'bg-amber-50 text-amber-700 border-amber-200', href: '/follow-ups' },
  Task:        { label: 'Tasks',         icon: CheckSquare,    color: 'bg-teal-50 text-teal-700 border-teal-200',     href: '/tasks' },
  Campaign:    { label: 'Campaigns',     icon: Megaphone,      color: 'bg-pink-50 text-pink-700 border-pink-200',     href: '/campaigns' },
}

const ACTION_LABELS: Record<string, string> = {
  create_lead: 'Create Lead',
  create_followup: 'Create Follow-up',
  schedule_visit: 'Schedule Visit',
  create_requirement: 'Create Requirement',
  create_opportunity: 'Create Opportunity',
  update_deal_stage: 'Update Deal Stage',
  create_campaign: 'Create Campaign',
  create_task: 'Create Task',
  workflow: 'Multi-Step Workflow',
  query_data: 'Read-only Data Query',
  clarify: 'Clarification Prompt',
}

export default function AIManagementPage() {
  // ── Date Range Filter ───────────────────────────────────────────────────────
  const [dateRangePreset, setDateRangePreset] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Compute active date boundaries
  const activeDates = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    if (dateRangePreset === 'TODAY') {
      return { from: today, to: today }
    }
    if (dateRangePreset === 'THIS_WEEK') {
      const d = new Date()
      const day = d.getDay() || 7
      d.setDate(d.getDate() - day + 1)
      const monday = d.toISOString().slice(0, 10)
      return { from: monday, to: today }
    }
    if (dateRangePreset === 'THIS_MONTH') {
      const monthStart = today.slice(0, 7) + '-01'
      return { from: monthStart, to: today }
    }
    if (dateRangePreset === 'CUSTOM') {
      return { from: dateFrom, to: dateTo }
    }
    return { from: '', to: '' }
  }, [dateRangePreset, dateFrom, dateTo])

  // ── Filtered AI Audit Logs ──────────────────────────────────────────────────
  const aiLogs = useMemo(() => {
    return MOCK_AUDIT_LOGS.filter((l) => {
      if (!l.ai_assisted) return false
      const logDate = l.timestamp.slice(0, 10)
      if (activeDates.from && logDate < activeDates.from) return false
      if (activeDates.to && logDate > activeDates.to) return false
      return true
    })
  }, [activeDates])

  // ── Analytics Computations ──────────────────────────────────────────────────

  // 1. Total Interactions & Queries vs Writes
  const totalInteractions = aiLogs.length

  const readQueries = useMemo(() => {
    return aiLogs.filter((l) => l.action === 'Query' || l.ai_trail?.interpreted_intent === 'query_data')
  }, [aiLogs])

  const writeInteractions = useMemo(() => {
    return aiLogs.filter((l) => l.action !== 'Query' && l.ai_trail?.interpreted_intent !== 'query_data')
  }, [aiLogs])

  // 2. Action Outcomes (Approved vs Edited-then-Approved vs Cancelled/Rejected)
  const outcomes = useMemo(() => {
    let approvedDirect = 0
    let editedThenApproved = 0
    let cancelled = 0

    writeInteractions.forEach((l) => {
      if (l.action === 'Cancelled' || l.details?.status === 'cancelled') {
        cancelled++
      } else if (l.action === 'Created' || l.action === 'Updated' || l.action === 'Status Changed') {
        const editsCount = l.ai_trail?.user_edits ? Object.keys(l.ai_trail.user_edits).length : 0
        if (editsCount > 0) {
          editedThenApproved++
        } else {
          approvedDirect++
        }
      }
    })

    return { approvedDirect, editedThenApproved, cancelled }
  }, [writeInteractions])

  // 3. Workflows (multi-step) vs Single Actions
  const workflowVsSingle = useMemo(() => {
    let workflows = 0
    let singleActions = 0

    writeInteractions.forEach((l) => {
      if (l.ai_trail?.interpreted_intent === 'workflow' || l.entity_type === 'Workflow' || (l.ai_trail?.workflow_steps && l.ai_trail.workflow_steps.length > 0)) {
        workflows++
      } else if (l.action !== 'Clarification' && l.action !== 'Failed') {
        singleActions++
      }
    })

    return { workflows, singleActions }
  }, [writeInteractions])

  // 4. Actions by Module Breakdown
  const moduleBreakdown = useMemo(() => {
    const counts: Record<string, { total: number; approved: number; edited: number; cancelled: number }> = {}

    const trackedModules = ['Lead', 'Requirement', 'Visit', 'Opportunity', 'Follow-up', 'Task', 'Campaign']
    trackedModules.forEach((m) => {
      counts[m] = { total: 0, approved: 0, edited: 0, cancelled: 0 }
    })

    writeInteractions.forEach((l) => {
      const mod = l.entity_type
      if (!counts[mod]) counts[mod] = { total: 0, approved: 0, edited: 0, cancelled: 0 }
      counts[mod].total++

      if (l.action === 'Cancelled') {
        counts[mod].cancelled++
      } else {
        const editsCount = l.ai_trail?.user_edits ? Object.keys(l.ai_trail.user_edits).length : 0
        if (editsCount > 0) {
          counts[mod].edited++
        } else {
          counts[mod].approved++
        }
      }
    })

    return Object.entries(counts)
      .map(([mod, data]) => ({
        module: mod,
        ...data,
      }))
      .sort((a, b) => b.total - a.total)
  }, [writeInteractions])

  // 5. Actions by User
  const userBreakdown = useMemo(() => {
    const userMap: Record<string, {
      userId: string
      name: string
      role: string
      interactions: number
      committed: number
      edited: number
      cancelled: number
    }> = {}

    aiLogs.forEach((l) => {
      if (!userMap[l.user_name]) {
        userMap[l.user_name] = {
          userId: l.user_id,
          name: l.user_name,
          role: l.user_role,
          interactions: 0,
          committed: 0,
          edited: 0,
          cancelled: 0,
        }
      }
      userMap[l.user_name].interactions++

      if (l.action === 'Cancelled') {
        userMap[l.user_name].cancelled++
      } else if (l.action === 'Created' || l.action === 'Updated' || l.action === 'Status Changed') {
        userMap[l.user_name].committed++
        const editsCount = l.ai_trail?.user_edits ? Object.keys(l.ai_trail.user_edits).length : 0
        if (editsCount > 0) {
          userMap[l.user_name].edited++
        }
      }
    })

    return Object.values(userMap).sort((a, b) => b.interactions - a.interactions)
  }, [aiLogs])

  // 6. Most Common Requests (intent leaderboard)
  const commonRequests = useMemo(() => {
    const counts: Record<string, number> = {}

    aiLogs.forEach((l) => {
      const intent = l.ai_trail?.interpreted_intent || l.action
      counts[intent] = (counts[intent] || 0) + 1
    })

    return Object.entries(counts)
      .map(([intent, count]) => ({
        intent,
        label: ACTION_LABELS[intent] || intent.replace(/_/g, ' '),
        count,
        pct: totalInteractions > 0 ? Math.round((count / totalInteractions) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
  }, [aiLogs, totalInteractions])

  // 7. Clarifications & Failures
  const clarifications = useMemo(() => {
    return aiLogs.filter((l) => l.action === 'Clarification')
  }, [aiLogs])

  const failures = useMemo(() => {
    return aiLogs.filter((l) => l.action === 'Failed')
  }, [aiLogs])

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">AI Management Dashboard</h1>
                <p className="text-xs text-slate-500">
                  Live metrics, staff adoption, and accuracy tracking across all AI Assistant operations.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/ai-assistant">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs gap-1.5 h-9">
                <Bot size={14} /> Open AI Assistant
              </Button>
            </Link>
            <Link href="/audit?ai=YES">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 h-9 text-slate-700">
                <Shield size={14} className="text-indigo-600" /> Full Audit Trail
              </Button>
            </Link>
          </div>
        </div>

        {/* Global Date Range Filter Bar */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" /> Period:
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                {(['ALL', 'TODAY', 'THIS_WEEK', 'THIS_MONTH', 'CUSTOM'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setDateRangePreset(preset)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      dateRangePreset === preset
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {preset === 'ALL' && 'All Time'}
                    {preset === 'TODAY' && 'Today'}
                    {preset === 'THIS_WEEK' && 'This Week'}
                    {preset === 'THIS_MONTH' && 'This Month'}
                    {preset === 'CUSTOM' && 'Custom'}
                  </button>
                ))}
              </div>
            </div>

            {dateRangePreset === 'CUSTOM' && (
              <div className="flex items-center gap-2 animate-in fade-in">
                <span className="text-slate-500">From:</span>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-8 text-xs w-36"
                />
                <span className="text-slate-500">To:</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-8 text-xs w-36"
                />
              </div>
            )}

            <div className="text-slate-500 font-mono text-[11px] ml-auto">
              Analyzing <strong className="text-slate-900">{aiLogs.length}</strong> logged interactions
            </div>
          </CardContent>
        </Card>

        {/* ── 1. Top Summary Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total AI Interactions */}
          <Link href="/audit?ai=YES" className="block group">
            <Card className="border-slate-200 hover:border-amber-400 hover:shadow-md transition-all bg-white h-full">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
                  <span>Total AI Interactions</span>
                  <div className="w-7 h-7 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                    <Bot size={15} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900">{totalInteractions}</div>
                <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Logged in unified audit</span>
                  <span className="text-indigo-600 font-medium group-hover:underline flex items-center gap-0.5">
                    View list <ChevronRight size={12} />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card 2: Read Queries vs Write Actions */}
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
                <span>Queries vs Writes</span>
                <div className="w-7 h-7 rounded-md bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                  <BarChart3 size={15} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-slate-900">{writeInteractions.length}</div>
                <span className="text-xs text-slate-500 font-normal">writes</span>
                <span className="text-slate-300">/</span>
                <div className="text-xl font-semibold text-slate-600">{readQueries.length}</div>
                <span className="text-xs text-slate-500 font-normal">queries</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-3">
                <Link href="/audit?ai=YES&action=Query" className="text-sky-600 hover:underline">
                  {readQueries.length} read-only
                </Link>
                <span>·</span>
                <Link href="/audit?ai=YES&action=Created" className="text-emerald-600 hover:underline">
                  {writeInteractions.length} write ops
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Action Outcomes */}
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
                <span>Action Approvals</span>
                <div className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <CheckCircle2 size={15} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-700">{outcomes.approvedDirect}</span>
                <span className="text-xs text-slate-500 font-normal">approved</span>
                <span className="text-slate-300">/</span>
                <span className="text-xl font-semibold text-amber-700">{outcomes.editedThenApproved}</span>
                <span className="text-xs text-slate-500 font-normal">edited</span>
              </div>
              <div className="mt-2 text-[11px] flex items-center justify-between">
                <span className="text-slate-500">
                  {outcomes.cancelled > 0 ? (
                    <Link href="/audit?ai=YES&action=Cancelled" className="text-red-600 hover:underline font-medium">
                      {outcomes.cancelled} cancelled
                    </Link>
                  ) : (
                    '0 cancelled'
                  )}
                </span>
                <Link href="/audit?ai=YES&action=Created" className="text-indigo-600 hover:underline flex items-center gap-0.5">
                  Drill down <ChevronRight size={11} />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Workflows vs Single Actions */}
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
                <span>Workflows vs Single</span>
                <div className="w-7 h-7 rounded-md bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <Layers size={15} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-indigo-700">{workflowVsSingle.workflows}</span>
                <span className="text-xs text-slate-500 font-normal">workflows</span>
                <span className="text-slate-300">/</span>
                <span className="text-xl font-semibold text-slate-700">{workflowVsSingle.singleActions}</span>
                <span className="text-xs text-slate-500 font-normal">single</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Multi-step sequences</span>
                <Link href="/audit?ai=YES&search=workflow" className="text-indigo-600 hover:underline flex items-center gap-0.5">
                  View workflows <ChevronRight size={11} />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── 2 & 5. Row: Actions by Module & Common Requests ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actions by Module (2 columns) */}
          <Card className="lg:col-span-2 border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Actions by Module</CardTitle>
                  <CardDescription className="text-xs">
                    Distribution of AI-driven actions across CRM functional areas. Click any row to drill down.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="font-mono text-[11px]">
                  {writeInteractions.length} write ops
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {moduleBreakdown.map((item) => {
                  const meta = MODULE_META[item.module] || { label: item.module, icon: Bot, color: 'bg-slate-50 text-slate-700 border-slate-200' }
                  const Icon = meta.icon
                  const totalWrites = writeInteractions.length || 1
                  const pct = Math.round((item.total / totalWrites) * 100)

                  return (
                    <Link
                      key={item.module}
                      href={`/audit?ai=YES&entity=${encodeURIComponent(item.module)}`}
                      className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${meta.color}`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
                            {meta.label}
                            <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <span className="text-emerald-600 font-medium">{item.approved} direct</span>
                            <span>·</span>
                            <span className="text-amber-600 font-medium">{item.edited} edited</span>
                            {item.cancelled > 0 && (
                              <>
                                <span>·</span>
                                <span className="text-red-500 font-medium">{item.cancelled} cancelled</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{item.total}</div>
                          <div className="text-[11px] text-slate-400">{pct}% of ops</div>
                        </div>
                        {/* Mini bar */}
                        <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <ChevronRight size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Most Common Requests Leaderboard (1 column) */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Most Common Requests</CardTitle>
                  <CardDescription className="text-xs">
                    Ranked by frequency of user intents.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {commonRequests.slice(0, 7).map((item, idx) => (
                <Link
                  key={item.intent}
                  href={`/audit?ai=YES&search=${encodeURIComponent(item.intent)}`}
                  className="block p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50/60 transition-all group"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {item.label}
                      </span>
                    </div>
                    <span className="font-mono text-slate-500 font-semibold">{item.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(5, item.pct))}%` }}
                    />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ── 3. Actions by User (Staff Adoption) ─────────────────────────── */}
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Actions by User (Staff Adoption)</CardTitle>
                <CardDescription className="text-xs">
                  How actively each team member leverages the AI Assistant and their review calibration.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {userBreakdown.length} Team Members Active
              </Badge>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Total Interactions</th>
                  <th className="py-3 px-4 text-center">Committed Actions</th>
                  <th className="py-3 px-4 text-center">Edited Before Approving</th>
                  <th className="py-3 px-4 text-center">Cancelled / Rejected</th>
                  <th className="py-3 px-4 text-center">Direct Approval Rate</th>
                  <th className="py-3 px-4 text-right">Drill-Down</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userBreakdown.map((u) => {
                  const directApprovals = u.committed - u.edited
                  const rate = u.committed > 0 ? Math.round((directApprovals / u.committed) * 100) : 100

                  return (
                    <tr key={u.name} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center border border-slate-300">
                            {u.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <span className="font-semibold text-slate-900 text-xs">{u.name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        <Badge variant="outline" className="text-[11px]">
                          {u.role}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 text-xs">
                        {u.interactions}
                      </td>

                      <td className="py-3.5 px-4 text-center text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {u.committed}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center text-xs">
                        {u.edited > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Edit3 size={10} /> {u.edited}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center text-xs">
                        {u.cancelled > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            <XCircle size={10} /> {u.cancelled}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center text-xs font-mono">
                        <span className={rate >= 70 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-medium'}>
                          {rate}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/audit?ai=YES&user=${encodeURIComponent(u.name)}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-900">
                            View Logs <ChevronRight size={12} className="ml-0.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── 5. Clarification & Failure Trends ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clarifications */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                    <HelpCircle size={15} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">Clarification Trends</CardTitle>
                    <CardDescription className="text-xs">
                      When AI had to ask for missing parameters or disambiguation.
                    </CardDescription>
                  </div>
                </div>
                <Link href="/audit?ai=YES&action=Clarification">
                  <Badge variant="outline" className="text-xs hover:bg-amber-50 cursor-pointer">
                    {clarifications.length} Events
                  </Badge>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {clarifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No clarification events recorded in this period.
                </div>
              ) : (
                clarifications.map((c) => (
                  <Link
                    key={c.id}
                    href={`/audit?ai=YES&search=${encodeURIComponent(c.id)}`}
                    className="block p-3 rounded-lg border border-amber-100 bg-amber-50/40 hover:bg-amber-50/80 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 leading-snug">{c.summary}</p>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{c.timestamp.slice(5, 16)}</span>
                    </div>
                    {c.ai_trail?.original_request && (
                      <p className="text-[11px] text-slate-500 italic mt-1.5 truncate">
                        User prompt: &ldquo;{c.ai_trail.original_request}&rdquo;
                      </p>
                    )}
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Failures */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-red-50 border border-red-200 flex items-center justify-center text-red-700">
                    <AlertTriangle size={15} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">Execution Failures</CardTitle>
                    <CardDescription className="text-xs">
                      Operations blocked by validation rules or runtime errors.
                    </CardDescription>
                  </div>
                </div>
                <Link href="/audit?ai=YES&action=Failed">
                  <Badge variant="outline" className="text-xs text-red-700 border-red-200 hover:bg-red-50 cursor-pointer">
                    {failures.length} Failures
                  </Badge>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {failures.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-400 mb-1" />
                  No failures encountered in this period!
                </div>
              ) : (
                failures.map((f) => (
                  <Link
                    key={f.id}
                    href={`/audit?ai=YES&search=${encodeURIComponent(f.id)}`}
                    className="block p-3 rounded-lg border border-red-100 bg-red-50/40 hover:bg-red-50/80 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-red-900 leading-snug">{f.summary}</p>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{f.timestamp.slice(5, 16)}</span>
                    </div>
                    {f.details?.error && (
                      <p className="text-[11px] text-red-600 font-mono mt-1.5">
                        Error: {f.details.error}
                      </p>
                    )}
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

'use client'

/**
 * Commissions Module — Module 14
 * Staff commission tracking, dynamically aggregated from Transactions data.
 * Features expandable rows displaying contributing individual transactions,
 * month-over-month performance indicators, and role filtering.
 */

import React, { useState, useMemo, Fragment } from 'react'
import Link from 'next/link'
import {
  DollarSign, TrendingUp, TrendingDown, Users, ChevronDown, ChevronRight,
  Receipt, MapPin, Search, Filter, CheckCircle2, Clock, AlertCircle,
  ExternalLink, ArrowUpRight, ArrowDownRight, Award, Building2, Minus
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatPrice, formatDate } from '@/lib/formatters'
import {
  MOCK_TRANSACTIONS,
  MOCK_USERS,
  type TransactionRow,
} from '@/lib/mockData'

// ── Distinct ShortLoc Badge ───────────────────────────────────────────────────

function ShortLocBadge({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200">
      <MapPin size={11} className="text-indigo-600 shrink-0" />
      <span>{code}</span>
    </span>
  )
}

// ── Payment Status Badge ──────────────────────────────────────────────────────

function PaymentBadge({ status }: { status: TransactionRow['payment_status'] }) {
  switch (status) {
    case 'Paid':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={11} className="text-emerald-600" />
          Paid
        </span>
      )
    case 'Partial':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          <Clock size={11} className="text-amber-600" />
          Partial
        </span>
      )
    case 'Pending':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
          <AlertCircle size={11} className="text-rose-600" />
          Pending
        </span>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

// ── Transaction Type Badge ────────────────────────────────────────────────────

function TypeBadge({ type }: { type: TransactionRow['transaction_type'] }) {
  const styles: Record<TransactionRow['transaction_type'], string> = {
    Sale: 'bg-blue-50 text-blue-700 border-blue-200',
    Rent: 'bg-teal-50 text-teal-700 border-teal-200',
    Lease: 'bg-purple-50 text-purple-700 border-purple-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[type] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
      {type}
    </span>
  )
}

// ── Month-over-Month Indicator ────────────────────────────────────────────────

function MoMIndicator({
  thisMonth,
  lastMonth,
}: {
  thisMonth: number
  lastMonth: number
}) {
  if (lastMonth === 0 && thisMonth === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
        <Minus size={12} /> 0%
      </span>
    )
  }

  if (lastMonth === 0 && thisMonth > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
        <ArrowUpRight size={13} className="text-emerald-600 shrink-0" />
        +100%
      </span>
    )
  }

  const pct = ((thisMonth - lastMonth) / lastMonth) * 100

  if (pct > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
        <ArrowUpRight size={13} className="text-emerald-600 shrink-0" />
        +{pct.toFixed(1)}%
      </span>
    )
  }

  if (pct < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
        <ArrowDownRight size={13} className="text-rose-600 shrink-0" />
        {pct.toFixed(1)}%
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
      <Minus size={12} /> 0.0%
    </span>
  )
}

// ── Aggregated Staff Record Interface ─────────────────────────────────────────

interface StaffCommissionSummary {
  staffId: string
  staffName: string
  role: string
  email?: string
  totalClosed: number
  totalEarned: number
  commissionPaid: number
  commissionPending: number
  thisMonthEarned: number
  lastMonthEarned: number
  contributingTransactions: TransactionRow[]
}

export default function CommissionsPage() {
  const [expandedStaffIds, setExpandedStaffIds] = useState<Set<string>>(new Set(['u3'])) // Ravi Mehta expanded by default
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState<'earned_desc' | 'deals_desc' | 'pending_desc' | 'name_asc'>('earned_desc')

  // ── Dynamic Aggregation from MOCK_TRANSACTIONS ──────────────────────────────

  const staffSummaries = useMemo<StaffCommissionSummary[]>(() => {
    // 1. Collect all internal staff eligible for commissions (Agents + Office Executives)
    const eligibleUsers = MOCK_USERS.filter(
      (u) => u.role === 'AGENT' || u.role === 'OFFICE_EXECUTIVE'
    )

    // Build summaries by aggregating MOCK_TRANSACTIONS
    const summaries: StaffCommissionSummary[] = eligibleUsers.map((user) => {
      const userTransactions = MOCK_TRANSACTIONS.filter(
        (tx) => tx.staff_id === user.id || tx.staff_name.toLowerCase() === user.name.toLowerCase()
      )

      const totalClosed = userTransactions.length
      const totalEarned = userTransactions.reduce((sum, tx) => sum + tx.commission_amount, 0)

      const commissionPaid = userTransactions.reduce((sum, tx) => {
        if (tx.payment_status === 'Paid') return sum + tx.commission_amount
        if (tx.payment_status === 'Partial') return sum + Math.round(tx.commission_amount * 0.5)
        return sum
      }, 0)

      const commissionPending = totalEarned - commissionPaid

      // This Month (Sep 2026) vs Last Month (Aug 2026)
      const thisMonthEarned = userTransactions
        .filter((tx) => tx.closed_date.startsWith('2026-09'))
        .reduce((sum, tx) => sum + tx.commission_amount, 0)

      const lastMonthEarned = userTransactions
        .filter((tx) => tx.closed_date.startsWith('2026-08'))
        .reduce((sum, tx) => sum + tx.commission_amount, 0)

      const displayRole = user.role === 'AGENT' ? 'Field Agent' : 'Office Executive'

      return {
        staffId: user.id,
        staffName: user.name,
        role: displayRole,
        email: user.email,
        totalClosed,
        totalEarned,
        commissionPaid,
        commissionPending,
        thisMonthEarned,
        lastMonthEarned,
        contributingTransactions: userTransactions,
      }
    })

    return summaries
  }, [])

  // ── Filtered & Sorted Staff ─────────────────────────────────────────────────

  const filteredStaff = useMemo(() => {
    return staffSummaries
      .filter((staff) => {
        if (roleFilter !== 'ALL' && staff.role !== roleFilter) {
          return false
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          if (!staff.staffName.toLowerCase().includes(q) && !staff.role.toLowerCase().includes(q)) {
            return false
          }
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'earned_desc') return b.totalEarned - a.totalEarned
        if (sortBy === 'deals_desc') return b.totalClosed - a.totalClosed
        if (sortBy === 'pending_desc') return b.commissionPending - a.commissionPending
        if (sortBy === 'name_asc') return a.staffName.localeCompare(b.staffName)
        return 0
      })
  }, [staffSummaries, roleFilter, searchQuery, sortBy])

  // ── Overall Ledger Totals ───────────────────────────────────────────────────

  const overallTotals = useMemo(() => {
    const totalEarned = staffSummaries.reduce((sum, s) => sum + s.totalEarned, 0)
    const totalPaid = staffSummaries.reduce((sum, s) => sum + s.commissionPaid, 0)
    const totalPending = staffSummaries.reduce((sum, s) => sum + s.commissionPending, 0)
    const totalDeals = staffSummaries.reduce((sum, s) => sum + s.totalClosed, 0)
    const activeStaff = staffSummaries.filter((s) => s.totalClosed > 0).length

    return { totalEarned, totalPaid, totalPending, totalDeals, activeStaff }
  }, [staffSummaries])

  // ── Accordion toggle ────────────────────────────────────────────────────────

  const toggleRow = (staffId: string) => {
    setExpandedStaffIds((prev) => {
      const next = new Set(prev)
      if (next.has(staffId)) {
        next.delete(staffId)
      } else {
        next.add(staffId)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedStaffIds(new Set(staffSummaries.map((s) => s.staffId)))
  }

  const collapseAll = () => {
    setExpandedStaffIds(new Set())
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Commissions</h1>
              <Badge variant="secondary" className="font-mono text-xs">
                {filteredStaff.length} Staff Members
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Staff commission tracking dynamically aggregated from the transaction ledger with Month-over-Month performance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="text-xs text-slate-600"
            >
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="text-xs text-slate-600"
            >
              Collapse All
            </Button>
          </div>
        </div>

        {/* Executive Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total Commission Earned
                </p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {formatPrice(overallTotals.totalEarned)}
                </p>
                <span className="text-xs text-slate-500">{overallTotals.totalDeals} transactions aggregated</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <DollarSign size={20} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Commission Paid Out
                </p>
                <p className="text-xl font-bold text-emerald-600 mt-1">
                  {formatPrice(overallTotals.totalPaid)}
                </p>
                <span className="text-xs text-emerald-700">Settled to consultants</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Commission Pending
                </p>
                <p className="text-xl font-bold text-amber-600 mt-1">
                  {formatPrice(overallTotals.totalPending)}
                </p>
                <span className="text-xs text-amber-700">Awaiting client clearance</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock size={20} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Active Producers
                </p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {overallTotals.activeStaff} of {staffSummaries.length}
                </p>
                <span className="text-xs text-slate-500">Staff with closed deals</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Award size={20} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Sort Bar */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search staff name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {/* Role filter */}
              <div>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-9 text-sm"
                >
                  <option value="ALL">All Roles</option>
                  <option value="Field Agent">Field Agent</option>
                  <option value="Office Executive">Office Executive</option>
                </Select>
              </div>

              {/* Sort filter */}
              <div>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="h-9 text-sm"
                >
                  <option value="earned_desc">Sort by: Total Earned (High to Low)</option>
                  <option value="deals_desc">Sort by: Transactions Closed</option>
                  <option value="pending_desc">Sort by: Commission Pending</option>
                  <option value="name_asc">Sort by: Staff Name (A-Z)</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Aggregated Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-10"></th>
                  <th className="py-3 px-4">Staff Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Total Transactions Closed</th>
                  <th className="py-3 px-4 text-right">Total Commission Earned (₹)</th>
                  <th className="py-3 px-4 text-right">Commission Paid (₹)</th>
                  <th className="py-3 px-4 text-right">Commission Pending (₹)</th>
                  <th className="py-3 px-4 text-center">This Month vs Last Month</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="w-10 h-10 text-slate-300 mb-2" />
                        <p className="font-medium text-slate-600">No staff records match criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => {
                    const isExpanded = expandedStaffIds.has(staff.staffId)
                    return (
                      <React.Fragment key={staff.staffId}>
                        {/* Parent Staff Row */}
                        <tr
                          onClick={() => toggleRow(staff.staffId)}
                          className={`hover:bg-slate-50/90 cursor-pointer transition-colors ${
                            isExpanded ? 'bg-slate-50/60 font-medium' : ''
                          }`}
                        >
                          {/* Accordion Arrow Toggle */}
                          <td className="py-3.5 px-4 text-slate-400">
                            <button
                              type="button"
                              className="p-1 hover:text-slate-700 rounded transition-transform"
                              aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                            >
                              {isExpanded ? (
                                <ChevronDown size={16} className="text-indigo-600" />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </button>
                          </td>

                          {/* 1. Staff Name */}
                          <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {staff.staffName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </div>
                              <div>
                                <span>{staff.staffName}</span>
                                {staff.email && (
                                  <span className="block text-xs font-normal text-slate-400">
                                    {staff.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 2. Role */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={
                                staff.role === 'Field Agent'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }
                            >
                              {staff.role}
                            </Badge>
                          </td>

                          {/* 3. Total Transactions Closed */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-slate-100 text-slate-800 border border-slate-200">
                              {staff.totalClosed}
                            </span>
                          </td>

                          {/* 4. Total Commission Earned (₹) */}
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap font-mono">
                            {formatPrice(staff.totalEarned)}
                          </td>

                          {/* 5. Commission Paid (₹) */}
                          <td className="py-3.5 px-4 text-right font-semibold text-emerald-700 whitespace-nowrap font-mono">
                            {formatPrice(staff.commissionPaid)}
                          </td>

                          {/* 6. Commission Pending (₹) */}
                          <td className="py-3.5 px-4 text-right font-semibold text-amber-700 whitespace-nowrap font-mono">
                            {formatPrice(staff.commissionPending)}
                          </td>

                          {/* 7. This Month vs Last Month */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center justify-center">
                              <MoMIndicator
                                thisMonth={staff.thisMonthEarned}
                                lastMonth={staff.lastMonthEarned}
                              />
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                Sep: {formatPrice(staff.thisMonthEarned)}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Accordion Child Sub-table: Contributing Individual Transactions */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70 border-b border-slate-200">
                            <td colSpan={8} className="p-4 pl-12">
                              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Receipt size={15} className="text-slate-600" />
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                      Individual Transactions Contributing to {staff.staffName}&apos;s Commission
                                    </h4>
                                  </div>
                                  <Link
                                    href="/transactions"
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                                  >
                                    View Full Ledger <ExternalLink size={12} />
                                  </Link>
                                </div>

                                {staff.contributingTransactions.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic py-3 text-center">
                                    No closed transactions recorded for this staff member yet.
                                  </p>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left border-collapse">
                                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                        <tr>
                                          <th className="py-2 px-3">Txn ID</th>
                                          <th className="py-2 px-3">Closed Date</th>
                                          <th className="py-2 px-3">Opportunity</th>
                                          <th className="py-2 px-3">Property</th>
                                          <th className="py-2 px-3">Client</th>
                                          <th className="py-2 px-3">Type</th>
                                          <th className="py-2 px-3 text-right">Deal Value</th>
                                          <th className="py-2 px-3 text-center">Comm %</th>
                                          <th className="py-2 px-3 text-right">Comm Earned</th>
                                          <th className="py-2 px-3 text-center">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {staff.contributingTransactions.map((tx) => (
                                          <tr key={tx.id} className="hover:bg-slate-50/80">
                                            <td className="py-2 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                                              {tx.id}
                                            </td>
                                            <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                                              {formatDate(tx.closed_date)}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-blue-600 whitespace-nowrap">
                                              {tx.opportunity_id}
                                            </td>
                                            <td className="py-2 px-3 whitespace-nowrap">
                                              <ShortLocBadge code={tx.property_short_loc} />
                                            </td>
                                            <td className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap">
                                              {tx.client_name}
                                            </td>
                                            <td className="py-2 px-3 whitespace-nowrap">
                                              <TypeBadge type={tx.transaction_type} />
                                            </td>
                                            <td className="py-2 px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                                              {formatPrice(tx.transaction_value)}
                                            </td>
                                            <td className="py-2 px-3 text-center font-mono text-slate-600 whitespace-nowrap">
                                              {tx.commission_pct.toFixed(1)}%
                                            </td>
                                            <td className="py-2 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                                              {formatPrice(tx.commission_amount)}
                                            </td>
                                            <td className="py-2 px-3 text-center whitespace-nowrap">
                                              <PaymentBadge status={tx.payment_status} />
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}

'use client'

/**
 * Transactions Module — Module 13
 * Standalone financial ledger for closed deals with commission tracking,
 * filtering by type, payment status, and date range, with detail inspection.
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Receipt, Search, Filter, Plus, MapPin, DollarSign,
  TrendingUp, Calendar, CheckCircle2, Clock, AlertCircle,
  Eye, ExternalLink, ArrowUpDown, Building2, User, X, FileText,
  Percent, ArrowRight, Megaphone
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatPrice, formatDate } from '@/lib/formatters'
import {
  MOCK_TRANSACTIONS,
  MOCK_PIPELINE_OPPORTUNITIES,
  MOCK_PROPERTIES,
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={12} className="text-emerald-600" />
          Paid
        </span>
      )
    case 'Partial':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          <Clock size={12} className="text-amber-600" />
          Partial
        </span>
      )
    case 'Pending':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
          <AlertCircle size={12} className="text-rose-600" />
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([...MOCK_TRANSACTIONS])
  const [selectedTxn, setSelectedTxn] = useState<TransactionRow | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Filter Bar State
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Create Modal Form State
  const [formOppId, setFormOppId] = useState(MOCK_PIPELINE_OPPORTUNITIES[0]?.id || 'OPP-5001')
  const [formPropertyId, setFormPropertyId] = useState('P-1001')
  const [formClientName, setFormClientName] = useState('Vikram Malhotra')
  const [formStaffId, setFormStaffId] = useState('u3')
  const [formType, setFormType] = useState<TransactionRow['transaction_type']>('Sale')
  const [formValue, setFormValue] = useState('5000000')
  const [formCommPct, setFormCommPct] = useState('2.0')
  const [formPaymentStatus, setFormPaymentStatus] = useState<TransactionRow['payment_status']>('Paid')
  const [formClosedDate, setFormClosedDate] = useState('2026-09-19')
  const [formNotes, setFormNotes] = useState('')

  // ── Filtered Transactions ───────────────────────────────────────────────────

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type filter
      if (typeFilter !== 'ALL' && tx.transaction_type !== typeFilter) {
        return false
      }
      // Status filter
      if (statusFilter !== 'ALL' && tx.payment_status !== statusFilter) {
        return false
      }
      // Date range filter
      if (dateFrom && tx.closed_date < dateFrom) {
        return false
      }
      if (dateTo && tx.closed_date > dateTo) {
        return false
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesId = tx.id.toLowerCase().includes(q)
        const matchesOpp = tx.opportunity_id.toLowerCase().includes(q)
        const matchesProp = tx.property_short_loc.toLowerCase().includes(q)
        const matchesClient = tx.client_name.toLowerCase().includes(q)
        const matchesStaff = tx.staff_name.toLowerCase().includes(q)
        if (!matchesId && !matchesOpp && !matchesProp && !matchesClient && !matchesStaff) {
          return false
        }
      }
      return true
    })
  }, [transactions, typeFilter, statusFilter, dateFrom, dateTo, searchQuery])

  // ── Metrics Summary ─────────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    let totalValue = 0
    let totalComm = 0
    let paidComm = 0
    let pendingComm = 0

    transactions.forEach((tx) => {
      totalValue += tx.transaction_value
      totalComm += tx.commission_amount
      if (tx.payment_status === 'Paid') {
        paidComm += tx.commission_amount
      } else if (tx.payment_status === 'Partial') {
        paidComm += Math.round(tx.commission_amount * 0.5)
        pendingComm += Math.round(tx.commission_amount * 0.5)
      } else {
        pendingComm += tx.commission_amount
      }
    })

    return {
      totalDeals: transactions.length,
      totalValue,
      totalComm,
      paidComm,
      pendingComm,
    }
  }, [transactions])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleResetFilters = () => {
    setSearchQuery('')
    setTypeFilter('ALL')
    setStatusFilter('ALL')
    setDateFrom('')
    setDateTo('')
  }

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(formValue) || 0
    const pct = parseFloat(formCommPct) || 0
    const commAmt = Math.round((val * pct) / 100)

    const staffObj = MOCK_USERS.find((u) => u.id === formStaffId) || {
      name: 'Ravi Mehta',
      role: 'AGENT',
    }
    const propObj = MOCK_PROPERTIES.find((p) => p.id === formPropertyId)
    const shortLoc = propObj ? propObj.short_loc : '01-Schm140_Mayank'

    const newTx: TransactionRow = {
      id: `TXN-${800 + transactions.length + 1}`,
      opportunity_id: formOppId,
      property_id: formPropertyId,
      property_short_loc: shortLoc,
      client_name: formClientName,
      staff_id: formStaffId,
      staff_name: staffObj.name,
      staff_role: staffObj.role === 'AGENT' ? 'Field Agent' : 'Office Executive',
      transaction_type: formType,
      transaction_value: val,
      commission_pct: pct,
      commission_amount: commAmt,
      payment_status: formPaymentStatus,
      closed_date: formClosedDate,
      notes: formNotes || undefined,
    }

    setTransactions([newTx, ...transactions])
    setShowCreateModal(false)
    setFormNotes('')
  }

  const handleMarkAsPaid = (id: string) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, payment_status: 'Paid' } : tx))
    )
    if (selectedTxn && selectedTxn.id === id) {
      setSelectedTxn((prev) => (prev ? { ...prev, payment_status: 'Paid' } : null))
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
              <Badge variant="secondary" className="font-mono text-xs">
                {filteredTransactions.length} of {transactions.length}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Standalone transaction ledger for closed sales, rentals, and leases with commission tracking.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              <Plus size={16} className="mr-1.5" /> Record Transaction
            </Button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total Closed Value
                </p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {formatPrice(metrics.totalValue)}
                </p>
                <span className="text-xs text-slate-500">{metrics.totalDeals} transactions</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <TrendingUp size={20} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total Commission
                </p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {formatPrice(metrics.totalComm)}
                </p>
                <span className="text-xs text-slate-500">Gross receivables</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Receipt size={20} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Commission Received
                </p>
                <p className="text-xl font-bold text-emerald-600 mt-1">
                  {formatPrice(metrics.paidComm)}
                </p>
                <span className="text-xs text-emerald-700">Settled & deposited</span>
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
                  {formatPrice(metrics.pendingComm)}
                </p>
                <span className="text-xs text-amber-700">Awaiting clearance</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock size={20} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {/* Text Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search ID, client, loc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {/* Transaction Type Dropdown */}
              <div>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-9 text-sm"
                >
                  <option value="ALL">All Types (Sale / Rent / Lease)</option>
                  <option value="Sale">Sale</option>
                  <option value="Rent">Rent</option>
                  <option value="Lease">Lease</option>
                </Select>
              </div>

              {/* Payment Status Dropdown */}
              <div>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 text-sm"
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                  <option value="Paid">Paid</option>
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

            {/* Active filter tags & reset */}
            {(typeFilter !== 'ALL' || statusFilter !== 'ALL' || dateFrom || dateTo || searchQuery) && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
                <span>Showing filtered transactions</span>
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

        {/* Transactions Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Opportunity</th>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Transaction Value</th>
                  <th className="py-3 px-4 text-right">Commission Amount</th>
                  <th className="py-3 px-4 text-center">Comm %</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4">Marketing Attribution</th>
                  <th className="py-3 px-4">Closed Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <Receipt className="w-10 h-10 text-slate-300 mb-2" />
                        <p className="font-medium text-slate-600">No transactions found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Try adjusting your search criteria or record a new transaction.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedTxn(tx)}
                    >
                      {/* 1. Transaction ID */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {tx.id}
                      </td>

                      {/* 2. Opportunity (linked, clickable) */}
                      <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/opportunities`}
                          className="inline-flex items-center gap-1 font-mono text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                        >
                          {tx.opportunity_id}
                          <ExternalLink size={10} />
                        </Link>
                      </td>

                      {/* 3. Property (ShortLoc badge) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <ShortLocBadge code={tx.property_short_loc} />
                      </td>

                      {/* 4. Client Name */}
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {tx.client_name}
                      </td>

                      {/* 5. Transaction Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <TypeBadge type={tx.transaction_type} />
                      </td>

                      {/* 6. Transaction Value */}
                      <td className="py-3 px-4 text-right font-medium text-slate-900 whitespace-nowrap">
                        {formatPrice(tx.transaction_value)}
                      </td>

                      {/* 7. Commission Amount */}
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700 whitespace-nowrap">
                        {formatPrice(tx.commission_amount)}
                      </td>

                      {/* 8. Commission % */}
                      <td className="py-3 px-4 text-center text-xs font-mono text-slate-600 whitespace-nowrap">
                        {tx.commission_pct.toFixed(1)}%
                      </td>

                      {/* 9. Payment Status (badge) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <PaymentBadge status={tx.payment_status} />
                      </td>

                      {/* Marketing Attribution */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {tx.attributed_campaign_name ? (
                          <div className="space-y-0.5 max-w-[160px]">
                            <span
                              className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-medium truncate max-w-full"
                              title={`Campaign: ${tx.attributed_campaign_name}`}
                            >
                              <Megaphone size={9} className="shrink-0 text-indigo-500" />
                              <span className="truncate">{tx.attributed_campaign_name}</span>
                            </span>
                            <div className="text-[10px] text-slate-500 truncate">
                              {tx.attributed_source || 'Direct Outreach'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Direct / Organic</span>
                        )}
                      </td>

                      {/* 10. Closed Date */}
                      <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap">
                        {formatDate(tx.closed_date)}
                      </td>

                      {/* 11. Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTxn(tx)}
                            className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900"
                          >
                            <Eye size={13} className="mr-1" /> View
                          </Button>
                          {tx.payment_status !== 'Paid' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsPaid(tx.id)}
                              className="h-8 px-2 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Transaction Detail Modal */}
        {selectedTxn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Receipt className="text-slate-700" size={18} />
                  <h2 className="text-base font-bold text-slate-900">
                    Transaction Details — {selectedTxn.id}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedTxn(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Financial highlight */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Deal Value</span>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">
                      {formatPrice(selectedTxn.transaction_value)}
                    </p>
                    <TypeBadge type={selectedTxn.transaction_type} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Commission</span>
                    <p className="text-lg font-bold text-emerald-700 mt-0.5">
                      {formatPrice(selectedTxn.commission_amount)}
                    </p>
                    <span className="text-xs text-slate-500">
                      Rate: {selectedTxn.commission_pct.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Payment Status</span>
                    <PaymentBadge status={selectedTxn.payment_status} />
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Closed Date</span>
                    <span className="font-medium text-slate-900">{formatDate(selectedTxn.closed_date)}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Linked Opportunity</span>
                    <Link
                      href="/opportunities"
                      className="font-mono text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      {selectedTxn.opportunity_id}
                      <ExternalLink size={12} />
                    </Link>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Property</span>
                    <ShortLocBadge code={selectedTxn.property_short_loc} />
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Client</span>
                    <span className="font-medium text-slate-900">{selectedTxn.client_name}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Responsible Staff</span>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">{selectedTxn.staff_name}</p>
                      <p className="text-xs text-slate-500">{selectedTxn.staff_role}</p>
                    </div>
                  </div>

                  {/* Marketing Attribution Section */}
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Megaphone size={14} className="text-indigo-600" />
                        Marketing Attribution &amp; Origin
                      </span>
                      <span className="text-[10px] bg-indigo-100/80 text-indigo-800 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                        Read-Only Heritage
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-medium">Originating Lead</span>
                        {selectedTxn.originating_lead_id ? (
                          <Link
                            href={`/leads?search=${selectedTxn.originating_lead_id}`}
                            className="font-semibold text-indigo-600 hover:underline font-mono text-xs inline-flex items-center gap-0.5"
                          >
                            {selectedTxn.originating_lead_id}
                            <ArrowRight size={10} />
                          </Link>
                        ) : (
                          <span className="text-slate-600 font-medium">Direct / Walk-in</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-medium">Attributed Campaign</span>
                        <span
                          className="font-semibold text-indigo-700 truncate block"
                          title={selectedTxn.attributed_campaign_name || 'Organic'}
                        >
                          {selectedTxn.attributed_campaign_name || 'Organic (Unlinked)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-medium">Source &amp; Channel</span>
                        <span className="font-medium text-slate-700">
                          {selectedTxn.attributed_channel_type ? `${selectedTxn.attributed_channel_type} — ` : ''}
                          {selectedTxn.attributed_source || 'Direct Outreach'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-medium">Marketing Executive</span>
                        <span className="font-medium text-slate-700">
                          {selectedTxn.marketing_executive_name || 'Neha Kapoor'}
                        </span>
                      </div>
                    </div>

                    {(selectedTxn.first_touch_source || selectedTxn.latest_touch_source) && (
                      <div className="pt-2 border-t border-indigo-100/70 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-500 block">First-Touch Source:</span>
                          <span className="text-slate-600 truncate block">
                            {selectedTxn.first_touch_source || selectedTxn.attributed_source || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Latest-Touch Source:</span>
                          <span className="text-slate-600 truncate block">
                            {selectedTxn.latest_touch_source || selectedTxn.attributed_source || '—'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedTxn.notes && (
                    <div className="pt-2">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
                        Notes & Payment Remarks
                      </span>
                      <p className="text-xs bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-700 leading-relaxed">
                        {selectedTxn.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div>
                  {selectedTxn.payment_status !== 'Paid' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsPaid(selectedTxn.id)}
                      className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    >
                      <CheckCircle2 size={14} className="mr-1" /> Mark as Paid
                    </Button>
                  )}
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSelectedTxn(null)}
                  className="bg-slate-900 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Record Transaction Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Receipt className="text-slate-700" size={18} />
                  <h2 className="text-base font-bold text-slate-900">Record New Transaction</h2>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTransaction}>
                <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Opportunity</Label>
                      <Select
                        value={formOppId}
                        onChange={(e) => setFormOppId(e.target.value)}
                        className="mt-1 text-xs"
                      >
                        {MOCK_PIPELINE_OPPORTUNITIES.map((opp) => (
                          <option key={opp.id} value={opp.id}>
                            {opp.id} — {opp.client_name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Property</Label>
                      <Select
                        value={formPropertyId}
                        onChange={(e) => setFormPropertyId(e.target.value)}
                        className="mt-1 text-xs"
                      >
                        {MOCK_PROPERTIES.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.short_loc} ({p.id})
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Client Name</Label>
                      <Input
                        value={formClientName}
                        onChange={(e) => setFormClientName(e.target.value)}
                        required
                        className="mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Responsible Staff</Label>
                      <Select
                        value={formStaffId}
                        onChange={(e) => setFormStaffId(e.target.value)}
                        className="mt-1 text-xs"
                      >
                        {MOCK_USERS.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-semibold">Type</Label>
                      <Select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as TransactionRow['transaction_type'])}
                        className="mt-1 text-xs"
                      >
                        <option value="Sale">Sale</option>
                        <option value="Rent">Rent</option>
                        <option value="Lease">Lease</option>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Deal Value (₹)</Label>
                      <Input
                        type="number"
                        value={formValue}
                        onChange={(e) => setFormValue(e.target.value)}
                        required
                        className="mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Commission %</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formCommPct}
                        onChange={(e) => setFormCommPct(e.target.value)}
                        required
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Computed Commission:</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {formatPrice(
                        Math.round(((parseFloat(formValue) || 0) * (parseFloat(formCommPct) || 0)) / 100)
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Payment Status</Label>
                      <Select
                        value={formPaymentStatus}
                        onChange={(e) =>
                          setFormPaymentStatus(e.target.value as TransactionRow['payment_status'])
                        }
                        className="mt-1 text-xs"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Partial">Partial</option>
                        <option value="Paid">Paid</option>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Closed Date</Label>
                      <Input
                        type="date"
                        value={formClosedDate}
                        onChange={(e) => setFormClosedDate(e.target.value)}
                        required
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Notes / Payment Details</Label>
                    <Textarea
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="e.g. Agreement registered at registrar office, advance received via cheque..."
                      rows={2}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-slate-900 text-white text-xs">
                    Save Transaction
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

'use client'

/**
 * Telecalling Page — Module 6
 *
 * Call log tracking actual communications made and received.
 *
 * Filter bar:
 * - Outcome dropdown (Connected, No Answer, Busy, Wrong Number, Call Back Later)
 * - Caller dropdown (list of mock staff names)
 * - Date range picker (All Time, Today, Yesterday, Last 7 Days, This Month)
 * - Text search
 * - "+ Log Call" button
 *
 * Table columns:
 * - Party/Lead Name
 * - Phone
 * - Call Type (Outbound/Inbound/Missed — small badge)
 * - Duration (in minutes)
 * - Outcome (colored badge)
 * - Caller (staff name)
 * - Date/Time
 * - Remarks
 * - Actions
 *
 * "+ Log Call" form:
 * - Party/Lead (searchable dropdown of existing mock names)
 * - Call Type (Outbound/Inbound/Missed dropdown)
 * - Outcome (dropdown)
 * - Duration in minutes (number input)
 * - Remarks (textarea)
 * - Schedule Callback (toggle revealing date/time picker when enabled)
 * - Save & Cancel buttons
 */

import { useMemo, useState } from 'react'
import {
  Plus, Search, RefreshCw, ArrowLeft, Phone, PhoneCall, PhoneIncoming,
  PhoneOutgoing, PhoneMissed, Clock, Calendar, UserCheck, CheckCircle2,
  AlertCircle, Sparkles, MessageSquare, History, X
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  formatDateTime, formatDate,
} from '@/lib/formatters'
import {
  MOCK_CALL_LOGS, MOCK_PARTIES, MOCK_LEADS, MOCK_USERS,
  type CallLogRow,
} from '@/lib/mockData'

// ── Dropdown Constants ────────────────────────────────────────────────────────

const OUTCOME_OPTIONS = [
  { value: '', label: 'All Outcomes' },
  { value: 'CONNECTED', label: 'Connected' },
  { value: 'NO_ANSWER', label: 'No Answer' },
  { value: 'BUSY', label: 'Busy' },
  { value: 'WRONG_NUMBER', label: 'Wrong Number' },
  { value: 'CALL_BACK_LATER', label: 'Call Back Later' },
] as const

const CALL_TYPE_OPTIONS = [
  { value: 'OUTBOUND', label: 'Outbound' },
  { value: 'INBOUND', label: 'Inbound' },
  { value: 'MISSED', label: 'Missed' },
] as const

const DATE_RANGE_OPTIONS = [
  { value: 'ALL', label: 'All Time' },
  { value: 'TODAY', label: 'Today (Sep 19)' },
  { value: 'YESTERDAY', label: 'Yesterday (Sep 18)' },
  { value: 'LAST_7_DAYS', label: 'Last 7 Days' },
] as const

export default function TelecallingPage() {
  const [calls, setCalls] = useState<CallLogRow[]>([...MOCK_CALL_LOGS])
  const [view, setView] = useState<'list' | 'add'>('list')

  // Filter Bar State
  const [fOutcome, setFOutcome] = useState<string>('')
  const [fCaller, setFCaller] = useState<string>('')
  const [fDateRange, setFDateRange] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // View Details Modal
  const [selectedCall, setSelectedCall] = useState<CallLogRow | null>(null)

  // Add Call Form State
  const [formPartyId, setFormPartyId] = useState<string>('p4')
  const [formCallType, setFormCallType] = useState<string>('OUTBOUND')
  const [formOutcome, setFormOutcome] = useState<string>('CONNECTED')
  const [formDuration, setFormDuration] = useState<string>('5')
  const [formCallerId, setFormCallerId] = useState<string>('u2')
  const [formRemarks, setFormRemarks] = useState<string>('')
  const [formScheduleCallback, setFormScheduleCallback] = useState<boolean>(false)
  const [formCallbackDate, setFormCallbackDate] = useState<string>('2026-09-21T11:00')
  const [partySearch, setPartySearch] = useState<string>('')

  // ── Unified Searchable Parties / Contacts List ──────────────────────────────

  const partyOptions = useMemo(() => {
    return MOCK_PARTIES.map((p) => ({
      id: p.id,
      name: p.name,
      mobile: p.mobile,
      roles: p.roles.join(', '),
    }))
  }, [])

  const filteredParties = useMemo(() => {
    if (!partySearch.trim()) return partyOptions
    const q = partySearch.toLowerCase()
    return partyOptions.filter(
      (p) => p.name.toLowerCase().includes(q) || p.mobile.includes(q)
    )
  }, [partyOptions, partySearch])

  // ── Filtered Calls ──────────────────────────────────────────────────────────

  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      // Outcome filter
      if (fOutcome && call.outcome !== fOutcome) return false

      // Caller filter
      if (fCaller && call.caller_name !== fCaller) return false

      // Date range filter (Simulated around Sep 19, 2026)
      if (fDateRange === 'TODAY') {
        if (!call.call_time.startsWith('2026-09-19')) return false
      } else if (fDateRange === 'YESTERDAY') {
        if (!call.call_time.startsWith('2026-09-18')) return false
      } else if (fDateRange === 'LAST_7_DAYS') {
        const callDate = new Date(call.call_time)
        const cutoff = new Date('2026-09-12T00:00:00Z')
        if (callDate < cutoff) return false
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = call.party_name.toLowerCase().includes(q)
        const matchPhone = call.phone.includes(q)
        const matchRemarks = call.remarks.toLowerCase().includes(q)
        const matchCaller = call.caller_name.toLowerCase().includes(q)
        if (!matchName && !matchPhone && !matchRemarks && !matchCaller) return false
      }

      return true
    })
  }, [calls, fOutcome, fCaller, fDateRange, searchQuery])

  // ── Caller Staff Options ────────────────────────────────────────────────────

  const staffOptions = useMemo(() => {
    return MOCK_USERS.filter((u) => u.role !== 'CLIENT').map((u) => u.name)
  }, [])

  // ── Badge Helpers ───────────────────────────────────────────────────────────

  const renderCallTypeBadge = (type: string) => {
    switch (type) {
      case 'OUTBOUND':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <PhoneOutgoing size={11} className="shrink-0" />
            Outbound
          </span>
        )
      case 'INBOUND':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <PhoneIncoming size={11} className="shrink-0" />
            Inbound
          </span>
        )
      case 'MISSED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <PhoneMissed size={11} className="shrink-0" />
            Missed
          </span>
        )
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  const renderOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
            Connected
          </span>
        )
      case 'CALL_BACK_LATER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock size={12} className="text-blue-600 shrink-0" />
            Call Back Later
          </span>
        )
      case 'NO_ANSWER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle size={12} className="text-amber-600 shrink-0" />
            No Answer
          </span>
        )
      case 'BUSY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
            <PhoneCall size={12} className="text-orange-600 shrink-0" />
            Busy
          </span>
        )
      case 'WRONG_NUMBER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <X size={12} className="text-rose-600 shrink-0" />
            Wrong Number
          </span>
        )
      default:
        return <Badge variant="secondary">{outcome.replace(/_/g, ' ')}</Badge>
    }
  }

  // ── Form Handlers ───────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormPartyId('p4')
    setFormCallType('OUTBOUND')
    setFormOutcome('CONNECTED')
    setFormDuration('5')
    setFormCallerId('u2')
    setFormRemarks('')
    setFormScheduleCallback(false)
    setFormCallbackDate('2026-09-21T11:00')
    setPartySearch('')
  }

  const handleSaveCall = (e: React.FormEvent) => {
    e.preventDefault()

    const party = MOCK_PARTIES.find((p) => p.id === formPartyId)
    const caller = MOCK_USERS.find((u) => u.id === formCallerId)

    const newCall: CallLogRow = {
      id: `C-${Date.now().toString().slice(-4)}`,
      party_name: party?.name || 'Contact',
      party_id: formPartyId,
      phone: party?.mobile || '+91 9876543210',
      call_type: formCallType,
      duration_minutes: Number(formDuration) || 0,
      outcome: formOutcome,
      caller_name: caller?.name || 'Neha Kapoor',
      caller_id: formCallerId,
      call_time: new Date().toISOString(),
      remarks: formRemarks.trim() || 'Call completed successfully',
      callback_time: formScheduleCallback ? new Date(formCallbackDate).toISOString() : null,
    }

    setCalls([newCall, ...calls])
    resetForm()
    setView('list')
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* ================================================================= */}
        {/* VIEW 1: CALL LOG TABLE                                            */}
        {/* ================================================================= */}
        {view === 'list' && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
                    <Phone size={22} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Telecalling Log
                    </h1>
                    <p className="text-sm text-slate-500">
                      Track inbound and outbound communication history, call durations, and caller outcomes
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setView('add')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
              >
                <Plus size={16} className="mr-1.5" />
                Log Call
              </Button>
            </div>

            {/* Filter Bar */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardContent className="p-4 flex flex-wrap items-center gap-3">
                {/* Text Search */}
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search party, phone, remarks..."
                    className="pl-9 text-sm h-9"
                  />
                </div>

                {/* Outcome Dropdown */}
                <div className="w-full sm:w-auto min-w-[160px]">
                  <Select
                    value={fOutcome}
                    onChange={(e) => setFOutcome(e.target.value)}
                    className="h-9 text-sm"
                  >
                    {OUTCOME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Caller Dropdown */}
                <div className="w-full sm:w-auto min-w-[150px]">
                  <Select
                    value={fCaller}
                    onChange={(e) => setFCaller(e.target.value)}
                    className="h-9 text-sm"
                  >
                    <option value="">All Callers</option>
                    {staffOptions.map((staff) => (
                      <option key={staff} value={staff}>
                        {staff}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Date Range Dropdown */}
                <div className="w-full sm:w-auto min-w-[150px]">
                  <Select
                    value={fDateRange}
                    onChange={(e) => setFDateRange(e.target.value)}
                    className="h-9 text-sm"
                  >
                    {DATE_RANGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Reset Filters */}
                {(fOutcome || fCaller || fDateRange !== 'ALL' || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFOutcome('')
                      setFCaller('')
                      setFDateRange('ALL')
                      setSearchQuery('')
                    }}
                    className="text-slate-500 hover:text-slate-800 h-9 px-2.5"
                    title="Clear filters"
                  >
                    <RefreshCw size={14} className="mr-1.5" />
                    Reset
                  </Button>
                )}

                <div className="ml-auto text-xs text-slate-400 font-medium">
                  Showing {filteredCalls.length} of {calls.length} logged calls
                </div>
              </CardContent>
            </Card>

            {/* Calls Table */}
            <Card className="border-slate-200/80 shadow-xs overflow-hidden">
              <CardContent className="p-0">
                {filteredCalls.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <Phone className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <h3 className="text-base font-semibold text-slate-800">No call records found</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                      No calls match the selected filter criteria. Try clearing filters or log a new telecalling activity.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFOutcome('')
                        setFCaller('')
                        setFDateRange('ALL')
                        setSearchQuery('')
                      }}
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4">Party / Lead Name</th>
                          <th className="py-3 px-4">Phone</th>
                          <th className="py-3 px-4">Call Type</th>
                          <th className="py-3 px-4 text-center">Duration</th>
                          <th className="py-3 px-4">Outcome</th>
                          <th className="py-3 px-4">Caller</th>
                          <th className="py-3 px-4">Date / Time</th>
                          <th className="py-3 px-4 min-w-[200px]">Remarks</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCalls.map((call) => (
                          <tr
                            key={call.id}
                            className="hover:bg-slate-50/80 transition-colors group"
                          >
                            {/* Party / Lead Name */}
                            <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                              {call.party_name}
                            </td>

                            {/* Phone */}
                            <td className="py-3.5 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                              {call.phone}
                            </td>

                            {/* Call Type Badge */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {renderCallTypeBadge(call.call_type)}
                            </td>

                            {/* Duration */}
                            <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-700 whitespace-nowrap">
                              {call.duration_minutes > 0 ? `${call.duration_minutes} min` : '0 min'}
                            </td>

                            {/* Outcome Badge */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {renderOutcomeBadge(call.outcome)}
                            </td>

                            {/* Caller */}
                            <td className="py-3.5 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5">
                                <UserCheck size={13} className="text-slate-400" />
                                {call.caller_name}
                              </span>
                            </td>

                            {/* Date / Time */}
                            <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                              {formatDateTime(call.call_time)}
                            </td>

                            {/* Remarks */}
                            <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                              <p className="line-clamp-2">{call.remarks}</p>
                              {call.callback_time && (
                                <p className="text-[11px] text-blue-700 font-semibold mt-1 flex items-center gap-1">
                                  <Clock size={11} />
                                  Callback: {formatDateTime(call.callback_time)}
                                </p>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedCall(call)}
                                className="h-7 px-2.5 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-50"
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: LOG CALL FORM                                             */}
        {/* ================================================================= */}
        {view === 'add' && (
          <div className="space-y-6">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetForm()
                  setView('list')
                }}
                className="text-slate-600 hover:text-slate-900 -ml-2"
              >
                <ArrowLeft size={16} className="mr-1.5" />
                Back to Call Log
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetForm()
                    setView('list')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="log-call-form"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  Save Call Log
                </Button>
              </div>
            </div>

            {/* Form Container */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
                    <PhoneCall size={22} />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      Log Telecalling Activity
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500">
                      Record conversation outcomes, call durations, and optional scheduled callbacks
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <form id="log-call-form" onSubmit={handleSaveCall} className="space-y-6">
                  {/* Party / Lead Selection with search */}
                  <div className="space-y-1.5">
                    <Label htmlFor="party_lead" className="text-xs font-semibold text-slate-700">
                      Party / Client Contact <span className="text-red-500">*</span>
                    </Label>
                    <div className="space-y-1.5 max-w-xl">
                      <Input
                        type="text"
                        placeholder="Search contact by name or phone..."
                        value={partySearch}
                        onChange={(e) => setPartySearch(e.target.value)}
                        className="h-8 text-xs bg-slate-50"
                      />
                      <Select
                        id="party_lead"
                        value={formPartyId}
                        onChange={(e) => setFormPartyId(e.target.value)}
                        required
                        className="h-10 text-sm"
                      >
                        {filteredParties.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.mobile}) — {p.roles}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Call Type */}
                    <div className="space-y-1.5">
                      <Label htmlFor="call_type" className="text-xs font-semibold text-slate-700">
                        Call Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        id="call_type"
                        value={formCallType}
                        onChange={(e) => setFormCallType(e.target.value)}
                        required
                        className="h-10 text-sm"
                      >
                        {CALL_TYPE_OPTIONS.map((ct) => (
                          <option key={ct.value} value={ct.value}>
                            {ct.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Outcome */}
                    <div className="space-y-1.5">
                      <Label htmlFor="outcome" className="text-xs font-semibold text-slate-700">
                        Call Outcome <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        id="outcome"
                        value={formOutcome}
                        onChange={(e) => setFormOutcome(e.target.value)}
                        required
                        className="h-10 text-sm"
                      >
                        {OUTCOME_OPTIONS.filter((o) => o.value).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Duration in Minutes */}
                    <div className="space-y-1.5">
                      <Label htmlFor="duration" className="text-xs font-semibold text-slate-700">
                        Duration (Minutes) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="duration"
                        type="number"
                        min="0"
                        value={formDuration}
                        onChange={(e) => setFormDuration(e.target.value)}
                        placeholder="e.g. 5"
                        required
                        className="h-10 text-sm"
                      />
                    </div>

                    {/* Caller (Staff Name) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="caller" className="text-xs font-semibold text-slate-700">
                        Caller / Staff <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        id="caller"
                        value={formCallerId}
                        onChange={(e) => setFormCallerId(e.target.value)}
                        required
                        className="h-10 text-sm"
                      >
                        {MOCK_USERS.filter((u) => u.role !== 'CLIENT').map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role.replace(/_/g, ' ')})
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="space-y-1.5">
                    <Label htmlFor="remarks" className="text-xs font-semibold text-slate-700">
                      Call Discussion Notes / Remarks <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="remarks"
                      value={formRemarks}
                      onChange={(e) => setFormRemarks(e.target.value)}
                      placeholder="e.g. Inquired about flat availability, budget requirements, negotiated pricing terms..."
                      required
                      rows={3}
                      className="text-sm"
                    />
                  </div>

                  {/* Schedule Callback Toggle */}
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="callback-toggle" className="text-sm font-semibold text-slate-800 cursor-pointer">
                          Schedule Future Callback
                        </Label>
                        <p className="text-xs text-slate-500">
                          Enable if client requested a follow-up call at a later date and time
                        </p>
                      </div>
                      <input
                        id="callback-toggle"
                        type="checkbox"
                        checked={formScheduleCallback}
                        onChange={(e) => setFormScheduleCallback(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    {/* Revealed Callback Date Picker */}
                    {formScheduleCallback && (
                      <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-2 animate-in fade-in duration-150">
                        <Label htmlFor="callback_date" className="text-xs font-semibold text-indigo-950 flex items-center gap-1.5">
                          <Clock size={13} className="text-indigo-600" />
                          Callback Date &amp; Time
                        </Label>
                        <Input
                          id="callback_date"
                          type="datetime-local"
                          value={formCallbackDate}
                          onChange={(e) => setFormCallbackDate(e.target.value)}
                          className="h-10 text-sm max-w-sm bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Form Footer Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm()
                        setView('list')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                    >
                      Save Call Log
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW DETAILS MODAL                                                */}
        {/* ================================================================= */}
        {selectedCall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                    <PhoneCall size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Call Details — {selectedCall.id}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(selectedCall.call_time)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCall(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Contact Name</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedCall.party_name}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Phone</span>
                    <p className="font-mono text-slate-800 text-sm mt-0.5">{selectedCall.phone}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Call Type</span>
                    <div className="mt-1">{renderCallTypeBadge(selectedCall.call_type)}</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Outcome</span>
                    <div className="mt-1">{renderOutcomeBadge(selectedCall.outcome)}</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Duration</span>
                    <p className="font-semibold text-slate-900 text-sm mt-0.5">{selectedCall.duration_minutes} minutes</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Caller Staff</span>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5">{selectedCall.caller_name}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Discussion Remarks</span>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-800">
                    {selectedCall.remarks}
                  </div>
                </div>

                {selectedCall.callback_time && (
                  <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-xs text-blue-900 flex items-center gap-2 font-medium">
                    <Clock size={14} className="text-blue-600 shrink-0" />
                    <span>Scheduled Callback: {formatDateTime(selectedCall.callback_time)}</span>
                  </div>
                )}
              </div>

              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedCall(null)}>
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

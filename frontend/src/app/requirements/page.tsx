'use client'

/**
 * Requirements Page — Module 2
 *
 * VIEW 1 — List:
 * - Filter bar: Category dropdown (Rental Residential, Rental Commercial, Buy-Sell Flat/Duplex, Buy-Sell Commercial, Plot/Jameen),
 *   Status dropdown (New, Active, Qualified, Low-Clarity, Fulfilled, Dropped), text search, "+ Add Requirement" button.
 * - Table columns: Requirement ID, Client Name, Category, Preferred ShortLoc(s), Budget Range, Status (colored badge),
 *   Match Count (clickable link badge computed from mock Match records: mockMatches.filter(m => m.requirement_id === req.id).length),
 *   Assigned To.
 * - Clicking "Match Count" navigates to /matching?reqId={req.id}.
 *
 * VIEW 2 — Add Requirement Form:
 * - Client (searchable dropdown of mock Party/Client names)
 * - Category (dropdown: Rental Residential, Rental Commercial, Buy-Sell Flat/Duplex, Buy-Sell Commercial, Plot/Jameen)
 * - Intent (Buy/Rent/Lease dropdown)
 * - Preferred ShortLoc(s) (multi-tag input with helper text: "Hyperlocal code, e.g. 01-Schm140_Mayank — NOT a generic city area")
 * - Alternate Locations (optional multi-tag input)
 * - Min Budget / Max Budget (two number inputs)
 * - Min Area / Max Area (two number inputs)
 * - Timeline/Urgency (dropdown: Immediate / 1 month / 3 months / Flexible)
 * - Required Facilities (checkboxes: Parking, Furnished, Lift, Power Backup, Security, Air Conditioning)
 * - Remarks (textarea)
 * - Save & Cancel buttons.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Plus, Search, RefreshCw, ArrowLeft, ClipboardList, MapPin,
  X, Zap, Sparkles, UserCheck, CheckSquare, Clock, Building
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
  formatBudget, formatCategory, statusClasses,
} from '@/lib/formatters'
import {
  MOCK_REQUIREMENTS, MOCK_MATCHES, MOCK_PARTIES, MOCK_USERS,
  type FullRequirementRow,
} from '@/lib/mockData'

// ── Dropdown Option Constants ─────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'RENTAL_RESIDENTIAL', label: 'Rental Residential' },
  { value: 'RENTAL_COMMERCIAL', label: 'Rental Commercial' },
  { value: 'BUY_SELL_FLAT', label: 'Buy-Sell Flat/Duplex' },
  { value: 'BUY_SELL_COMMERCIAL', label: 'Buy-Sell Commercial' },
  { value: 'PLOT', label: 'Plot/Jameen' },
] as const

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'NEW', label: 'New' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'LOW_CLARITY', label: 'Low-Clarity' },
  { value: 'FULFILLED', label: 'Fulfilled' },
  { value: 'DROPPED', label: 'Dropped' },
] as const

const INTENT_OPTIONS = ['BUY', 'RENT', 'LEASE'] as const
const TIMELINE_OPTIONS = ['Immediate', '1 month', '3 months', 'Flexible'] as const

const STANDARD_FACILITIES = [
  'Parking',
  'Furnished',
  'Lift / Elevator',
  'Power Backup',
  '24/7 Security',
  'Air Conditioning',
  'Pantry / Cafeteria',
]

// ── Distinct ShortLoc Badge ───────────────────────────────────────────────────

function ShortLocBadge({ code, onRemove }: { code: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-2xs group">
      <MapPin size={11} className="text-indigo-600 shrink-0" />
      <span>{code}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 text-indigo-400 hover:text-indigo-800 transition-colors"
          title="Remove tag"
        >
          <X size={12} />
        </button>
      )}
    </span>
  )
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState<FullRequirementRow[]>([...MOCK_REQUIREMENTS])
  const [view, setView] = useState<'list' | 'add'>('list')

  // List Filters
  const [fCategory, setFCategory] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Add Form State
  const [formClientId, setFormClientId] = useState('p4')
  const [clientSearch, setClientSearch] = useState('')
  const [formCategory, setFormCategory] = useState('RENTAL_RESIDENTIAL')
  const [formIntent, setFormIntent] = useState<'BUY' | 'RENT' | 'LEASE'>('RENT')
  const [formPreferredLocs, setFormPreferredLocs] = useState<string[]>(['01-Schm140_Mayank'])
  const [prefInput, setPrefInput] = useState('')
  const [formAlternateLocs, setFormAlternateLocs] = useState<string[]>([])
  const [altInput, setAltInput] = useState('')
  const [formMinBudget, setFormMinBudget] = useState('')
  const [formMaxBudget, setFormMaxBudget] = useState('')
  const [formMinArea, setFormMinArea] = useState('')
  const [formMaxArea, setFormMaxArea] = useState('')
  const [formTimeline, setFormTimeline] = useState('Immediate')
  const [formFacilities, setFormFacilities] = useState<string[]>(['Parking'])
  const [formAssignedToId, setFormAssignedToId] = useState('u2')
  const [formRemarks, setFormRemarks] = useState('')

  // ── Dynamic Match Count Map (calculated from MOCK_MATCHES) ─────────────────

  const matchCountMap = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const match of MOCK_MATCHES) {
      counts[match.requirement_id] = (counts[match.requirement_id] || 0) + 1
    }
    return counts
  }, [])

  // ── Filtered Requirements ──────────────────────────────────────────────────

  const filteredRequirements = useMemo(() => {
    return requirements.filter((req) => {
      if (fCategory && req.category !== fCategory) return false
      if (fStatus && req.status !== fStatus) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchId = req.id.toLowerCase().includes(q)
        const matchClient = req.client_name.toLowerCase().includes(q)
        const matchLoc = req.preferred_short_locs.some((l) => l.toLowerCase().includes(q))
        const matchRemarks = (req.remarks || '').toLowerCase().includes(q)
        if (!matchId && !matchClient && !matchLoc && !matchRemarks) return false
      }
      return true
    })
  }, [requirements, fCategory, fStatus, searchQuery])

  // ── Filtered Client Parties for searchable dropdown ────────────────────────

  const filteredParties = useMemo(() => {
    if (!clientSearch.trim()) return MOCK_PARTIES
    const q = clientSearch.toLowerCase()
    return MOCK_PARTIES.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        p.mobile.includes(q)
    )
  }, [clientSearch])

  // ── Tag Handlers ────────────────────────────────────────────────────────────

  const addPreferredLoc = () => {
    const val = prefInput.trim()
    if (val && !formPreferredLocs.includes(val)) {
      setFormPreferredLocs([...formPreferredLocs, val])
    }
    setPrefInput('')
  }

  const addAlternateLoc = () => {
    const val = altInput.trim()
    if (val && !formAlternateLocs.includes(val)) {
      setFormAlternateLocs([...formAlternateLocs, val])
    }
    setAltInput('')
  }

  const toggleFacility = (facility: string) => {
    if (formFacilities.includes(facility)) {
      setFormFacilities(formFacilities.filter((f) => f !== facility))
    } else {
      setFormFacilities([...formFacilities, facility])
    }
  }

  // ── Reset Form ──────────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormClientId('p4')
    setClientSearch('')
    setFormCategory('RENTAL_RESIDENTIAL')
    setFormIntent('RENT')
    setFormPreferredLocs(['01-Schm140_Mayank'])
    setPrefInput('')
    setFormAlternateLocs([])
    setAltInput('')
    setFormMinBudget('')
    setFormMaxBudget('')
    setFormMinArea('')
    setFormMaxArea('')
    setFormTimeline('Immediate')
    setFormFacilities(['Parking'])
    setFormAssignedToId('u2')
    setFormRemarks('')
  }

  // ── Handle Save ─────────────────────────────────────────────────────────────

  const handleSaveRequirement = (e: React.FormEvent) => {
    e.preventDefault()

    const client = MOCK_PARTIES.find((p) => p.id === formClientId)
    const assignedUser = MOCK_USERS.find((u) => u.id === formAssignedToId)

    const newReq: FullRequirementRow = {
      id: `R-${Date.now().toString().slice(-4)}`,
      client_id: formClientId,
      client_name: client?.name || 'Client',
      assigned_to_id: formAssignedToId || null,
      assigned_to_name: assignedUser?.name || null,
      category: formCategory,
      intent: formIntent,
      preferred_short_locs: formPreferredLocs.length > 0 ? formPreferredLocs : ['01-Schm140_Mayank'],
      alternate_locs: formAlternateLocs,
      min_budget: formMinBudget ? parseFloat(formMinBudget) : null,
      max_budget: formMaxBudget ? parseFloat(formMaxBudget) : null,
      min_area: formMinArea ? parseFloat(formMinArea) : null,
      max_area: formMaxArea ? parseFloat(formMaxArea) : null,
      timeline: formTimeline,
      facilities: formFacilities,
      status: 'NEW',
      remarks: formRemarks.trim() || null,
      created_at: new Date().toISOString(),
    }

    setRequirements([newReq, ...requirements])
    resetForm()
    setView('list')
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* ================================================================= */}
        {/* VIEW 1: REQUIREMENTS LIST                                         */}
        {/* ================================================================= */}
        {view === 'list' && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
                    <ClipboardList size={22} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Client Requirements
                    </h1>
                    <p className="text-sm text-slate-500">
                      Track buyer and tenant property requirements, budgets, and automated match counts
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setView('add')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
              >
                <Plus size={16} className="mr-1.5" />
                Add Requirement
              </Button>
            </div>

            {/* Filter Bar */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardContent className="p-4 flex flex-wrap items-center gap-3">
                {/* Text Search */}
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Req ID, client name, ShortLoc..."
                    className="pl-9 text-sm h-9"
                  />
                </div>

                {/* Category Dropdown */}
                <div className="w-full sm:w-auto min-w-[180px]">
                  <Select
                    value={fCategory}
                    onChange={(e) => setFCategory(e.target.value)}
                    className="h-9 text-sm"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Status Dropdown */}
                <div className="w-full sm:w-auto min-w-[170px]">
                  <Select
                    value={fStatus}
                    onChange={(e) => setFStatus(e.target.value)}
                    className="h-9 text-sm"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Reset Filters */}
                {(fCategory || fStatus || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFCategory('')
                      setFStatus('')
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
                  Showing {filteredRequirements.length} of {requirements.length} requirements
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-slate-200/80 shadow-xs overflow-hidden">
              <CardContent className="p-0">
                {filteredRequirements.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <ClipboardList className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <h3 className="text-base font-semibold text-slate-800">No requirements found</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                      No client requirements match your current filters. Try changing or clearing filters.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFCategory('')
                        setFStatus('')
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
                          <th className="py-3 px-4">Req ID</th>
                          <th className="py-3 px-4">Client Name</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Preferred ShortLoc(s)</th>
                          <th className="py-3 px-4">Budget Range</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-center">Match Count</th>
                          <th className="py-3 px-4">Assigned To</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRequirements.map((req) => {
                          // Dynamic match count calculated from mockMatches array
                          const matchCount = matchCountMap[req.id] || 0

                          return (
                            <tr
                              key={req.id}
                              className="hover:bg-slate-50/80 transition-colors group"
                            >
                              {/* Requirement ID */}
                              <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-800 whitespace-nowrap">
                                {req.id}
                              </td>

                              {/* Client Name */}
                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-slate-900">{req.client_name}</p>
                                <span className="inline-flex items-center text-[11px] font-medium text-slate-400 gap-1">
                                  <span>Intent:</span>
                                  <span
                                    className={`font-semibold ${
                                      req.intent === 'BUY'
                                        ? 'text-emerald-600'
                                        : req.intent === 'RENT'
                                        ? 'text-blue-600'
                                        : 'text-purple-600'
                                    }`}
                                  >
                                    {req.intent}
                                  </span>
                                </span>
                              </td>

                              {/* Category */}
                              <td className="py-3.5 px-4">
                                <Badge
                                  variant="secondary"
                                  className="text-xs font-medium bg-slate-100 text-slate-700"
                                >
                                  {formatCategory(req.category)}
                                </Badge>
                              </td>

                              {/* Preferred ShortLoc(s) with distinctive visual key */}
                              <td className="py-3.5 px-4">
                                <div className="flex flex-wrap gap-1.5 max-w-xs">
                                  {req.preferred_short_locs.map((loc) => (
                                    <ShortLocBadge key={loc} code={loc} />
                                  ))}
                                </div>
                              </td>

                              {/* Budget Range */}
                              <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap text-xs">
                                {formatBudget(req.min_budget, req.max_budget)}
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClasses(
                                    req.status
                                  )}`}
                                >
                                  {req.status.replace(/_/g, ' ')}
                                </span>
                              </td>

                              {/* Match Count Badge — Styled as Clickable Link to /matching */}
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <Link
                                  href={`/matching?reqId=${req.id}`}
                                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-all shadow-xs ${
                                    matchCount > 0
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 cursor-pointer'
                                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 cursor-pointer'
                                  }`}
                                  title={`View matching properties for ${req.id}`}
                                >
                                  <Zap size={13} className={matchCount > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-400'} />
                                  <span>{matchCount === 1 ? '1 match' : `${matchCount} matches`}</span>
                                </Link>
                              </td>

                              {/* Assigned To */}
                              <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                                {req.assigned_to_name ? (
                                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                                    <UserCheck size={14} className="text-slate-400" />
                                    {req.assigned_to_name}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">Unassigned</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: ADD REQUIREMENT FORM                                      */}
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
                Back to Requirements List
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
                  form="add-requirement-form"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Save Requirement
                </Button>
              </div>
            </div>

            {/* Form Container */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
                    <ClipboardList size={22} />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      Create Client Requirement
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500">
                      Specify buyer or tenant criteria, budget ranges, preferred hyperlocal ShortLocs, and facilities
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <form id="add-requirement-form" onSubmit={handleSaveRequirement} className="space-y-8">
                  {/* ───────────────────────────────────────────────────────── */}
                  {/* SECTION 1: CLIENT & CATEGORY CRITERIA                     */}
                  {/* ───────────────────────────────────────────────────────── */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-2">
                      <Sparkles size={16} className="text-indigo-600" />
                      Client &amp; Intent Criteria
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {/* Client (Searchable dropdown) */}
                      <div className="space-y-1.5">
                        <Label htmlFor="client_id" className="text-xs font-semibold text-slate-700">
                          Client / Contact <span className="text-red-500">*</span>
                        </Label>
                        <div className="space-y-1">
                          <Input
                            type="text"
                            placeholder="Filter clients by name/mobile..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            className="h-8 text-xs bg-slate-50"
                          />
                          <Select
                            id="client_id"
                            value={formClientId}
                            onChange={(e) => setFormClientId(e.target.value)}
                            required
                            className="h-10 text-sm"
                          >
                            {filteredParties.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.mobile})
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>

                      {/* Category (Dropdown) */}
                      <div className="space-y-1.5">
                        <Label htmlFor="category" className="text-xs font-semibold text-slate-700">
                          Property Category <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          id="category"
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          required
                          className="h-10 text-sm mt-1"
                        >
                          <option value="RENTAL_RESIDENTIAL">Rental Residential</option>
                          <option value="RENTAL_COMMERCIAL">Rental Commercial</option>
                          <option value="BUY_SELL_FLAT">Buy-Sell Flat/Duplex</option>
                          <option value="BUY_SELL_COMMERCIAL">Buy-Sell Commercial</option>
                          <option value="PLOT">Plot/Jameen</option>
                        </Select>
                      </div>

                      {/* Intent (Buy/Rent/Lease) */}
                      <div className="space-y-1.5">
                        <Label htmlFor="intent" className="text-xs font-semibold text-slate-700">
                          Transaction Intent <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          id="intent"
                          value={formIntent}
                          onChange={(e) => setFormIntent(e.target.value as 'BUY' | 'RENT' | 'LEASE')}
                          required
                          className="h-10 text-sm mt-1"
                        >
                          {INTENT_OPTIONS.map((intent) => (
                            <option key={intent} value={intent}>
                              {intent}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* ───────────────────────────────────────────────────────── */}
                  {/* SECTION 2: SHORTLOCS & LOCATIONS                          */}
                  {/* ───────────────────────────────────────────────────────── */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-2">
                      <MapPin size={16} className="text-indigo-600" />
                      Location Preferences
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Preferred ShortLocs (Multi-tag with helper text) */}
                      <div className="space-y-2 bg-indigo-50/30 p-4 rounded-xl border border-indigo-100">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <MapPin size={14} className="text-indigo-600" />
                            Preferred ShortLoc(s) <span className="text-red-500">*</span>
                          </Label>
                          <Badge variant="outline" className="text-[10px] text-indigo-700 border-indigo-300 font-mono">
                            Match Key
                          </Badge>
                        </div>

                        {/* Existing Tags */}
                        <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center p-2 bg-white rounded-lg border border-indigo-200">
                          {formPreferredLocs.map((loc) => (
                            <ShortLocBadge
                              key={loc}
                              code={loc}
                              onRemove={() => setFormPreferredLocs(formPreferredLocs.filter((l) => l !== loc))}
                            />
                          ))}
                          {formPreferredLocs.length === 0 && (
                            <span className="text-xs text-slate-400 italic">No ShortLoc added yet</span>
                          )}
                        </div>

                        {/* Add Input */}
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={prefInput}
                            onChange={(e) => setPrefInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addPreferredLoc()
                              }
                            }}
                            placeholder="e.g. 01-Schm140_Mayank"
                            className="text-xs h-9 bg-white font-mono"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={addPreferredLoc}
                            className="h-9 px-3 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-800"
                          >
                            Add
                          </Button>
                        </div>

                        <p className="text-[11px] text-amber-700 font-medium">
                          Hyperlocal code, e.g. 01-Schm140_Mayank — NOT a generic city area
                        </p>
                      </div>

                      {/* Alternate Locations (Optional multi-tag) */}
                      <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <Label className="text-xs font-semibold text-slate-700">
                          Alternate Locations (Optional)
                        </Label>

                        {/* Existing Alternate Tags */}
                        <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center p-2 bg-white rounded-lg border border-slate-200">
                          {formAlternateLocs.map((loc) => (
                            <span
                              key={loc}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 border border-slate-200 font-mono"
                            >
                              <span>{loc}</span>
                              <button
                                type="button"
                                onClick={() => setFormAlternateLocs(formAlternateLocs.filter((l) => l !== loc))}
                                className="text-slate-400 hover:text-slate-700"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                          {formAlternateLocs.length === 0 && (
                            <span className="text-xs text-slate-400 italic">No alternate locations added</span>
                          )}
                        </div>

                        {/* Add Input */}
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={altInput}
                            onChange={(e) => setAltInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addAlternateLoc()
                              }
                            }}
                            placeholder="e.g. 08-SAPNA_SANGEETA"
                            className="text-xs h-9 bg-white font-mono"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addAlternateLoc}
                            className="h-9 px-3 text-xs"
                          >
                            Add
                          </Button>
                        </div>

                        <p className="text-[11px] text-slate-400">
                          Secondary location preferences considered when primary matches are unavailable
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ───────────────────────────────────────────────────────── */}
                  {/* SECTION 3: BUDGET, AREA & TIMELINE                        */}
                  {/* ───────────────────────────────────────────────────────── */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-2">
                      <Clock size={16} className="text-indigo-600" />
                      Budget, Dimension &amp; Timeline
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {/* Min Budget */}
                      <div className="space-y-1.5">
                        <Label htmlFor="min_budget" className="text-xs font-semibold text-slate-700">
                          Min Budget (₹)
                        </Label>
                        <Input
                          id="min_budget"
                          type="number"
                          value={formMinBudget}
                          onChange={(e) => setFormMinBudget(e.target.value)}
                          placeholder="e.g. 20000 or 4000000"
                          className="h-10 text-sm"
                        />
                      </div>

                      {/* Max Budget */}
                      <div className="space-y-1.5">
                        <Label htmlFor="max_budget" className="text-xs font-semibold text-slate-700">
                          Max Budget (₹)
                        </Label>
                        <Input
                          id="max_budget"
                          type="number"
                          value={formMaxBudget}
                          onChange={(e) => setFormMaxBudget(e.target.value)}
                          placeholder="e.g. 35000 or 6000000"
                          className="h-10 text-sm"
                        />
                      </div>

                      {/* Timeline / Urgency */}
                      <div className="space-y-1.5">
                        <Label htmlFor="timeline" className="text-xs font-semibold text-slate-700">
                          Timeline / Urgency
                        </Label>
                        <Select
                          id="timeline"
                          value={formTimeline}
                          onChange={(e) => setFormTimeline(e.target.value)}
                          className="h-10 text-sm"
                        >
                          {TIMELINE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </Select>
                      </div>

                      {/* Min Area */}
                      <div className="space-y-1.5">
                        <Label htmlFor="min_area" className="text-xs font-semibold text-slate-700">
                          Min Built-up Area (sq. ft.)
                        </Label>
                        <Input
                          id="min_area"
                          type="number"
                          value={formMinArea}
                          onChange={(e) => setFormMinArea(e.target.value)}
                          placeholder="e.g. 900"
                          className="h-10 text-sm"
                        />
                      </div>

                      {/* Max Area */}
                      <div className="space-y-1.5">
                        <Label htmlFor="max_area" className="text-xs font-semibold text-slate-700">
                          Max Built-up Area (sq. ft.)
                        </Label>
                        <Input
                          id="max_area"
                          type="number"
                          value={formMaxArea}
                          onChange={(e) => setFormMaxArea(e.target.value)}
                          placeholder="e.g. 1500"
                          className="h-10 text-sm"
                        />
                      </div>

                      {/* Assigned To */}
                      <div className="space-y-1.5">
                        <Label htmlFor="assigned_to" className="text-xs font-semibold text-slate-700">
                          Assigned Staff
                        </Label>
                        <Select
                          id="assigned_to"
                          value={formAssignedToId}
                          onChange={(e) => setFormAssignedToId(e.target.value)}
                          className="h-10 text-sm"
                        >
                          <option value="">Unassigned</option>
                          {MOCK_USERS.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.role})
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* ───────────────────────────────────────────────────────── */}
                  {/* SECTION 4: REQUIRED FACILITIES (CHECKBOXES)               */}
                  {/* ───────────────────────────────────────────────────────── */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-2">
                      <CheckSquare size={16} className="text-indigo-600" />
                      Required Facilities
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {STANDARD_FACILITIES.map((facility) => {
                        const isChecked = formFacilities.includes(facility)
                        return (
                          <label
                            key={facility}
                            className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleFacility(facility)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{facility}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* ───────────────────────────────────────────────────────── */}
                  {/* SECTION 5: REMARKS                                        */}
                  {/* ───────────────────────────────────────────────────────── */}
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="remarks" className="text-xs font-semibold text-slate-700">
                      Additional Remarks / Special Requirements
                    </Label>
                    <Textarea
                      id="remarks"
                      value={formRemarks}
                      onChange={(e) => setFormRemarks(e.target.value)}
                      placeholder="e.g. Client prefers higher floors with morning sunlight, pre-approved home loan, ready for quick closing..."
                      rows={3}
                      className="text-sm"
                    />
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
                      Save Requirement
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

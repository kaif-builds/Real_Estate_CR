'use client'

/**
 * Requirements Page — Module 2
 *
 * VIEW 1 — List:
 * - Filter bar: Category dropdown (Rental Residential, Rental Commercial, Buy-Sell Flat/Duplex, Buy-Sell Commercial, Plot/Jameen),
 *   Status dropdown (New, Active, Qualified, Low-Clarity, Fulfilled, Dropped), text search, "+ Add Requirement" button.
 * - Table columns: Requirement ID, Client Name, Category, Preferred ShortLoc(s), Budget Range, Status (colored badge),
 *   Match Count (clickable link badge from API RequirementResponse.match_count), Assigned To, Actions (Edit, Delete).
 * - Clicking "Match Count" navigates to /matching?reqId={req.id}.
 *
 * VIEW 2 — Add/Edit Requirement Form:
 * - Client (searchable dropdown of real Parties)
 * - Category (dropdown: Rental Residential, Rental Commercial, Buy-Sell Flat/Duplex, Buy-Sell Commercial, Plot/Jameen)
 * - Intent (Buy/Rent/Lease dropdown)
 * - Status (New, Active, Qualified, Low-Clarity, Fulfilled, Dropped)
 * - Preferred ShortLoc(s) (multi-tag input with helper text: "Hyperlocal code, e.g. 01-Schm140_Mayank — NOT a generic city area")
 * - Alternate Locations (optional multi-tag input)
 * - Min Budget / Max Budget (two number inputs with validation)
 * - Min Area / Max Area (two number inputs)
 * - Timeline/Urgency (dropdown: Immediate / 1 month / 3 months / Flexible)
 * - Required Facilities (checkboxes: Parking, Furnished, Lift / Elevator, Power Backup, 24/7 Security, Air Conditioning, Pantry / Cafeteria)
 * - Assigned Staff (disabled until User Management is live)
 * - Remarks (textarea)
 * - Save & Cancel buttons.
 *
 * DATA SOURCE: Real FastAPI backend via apiClient.ts (/api/requirements, /api/parties)
 */

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Plus, Search, RefreshCw, ArrowLeft, ClipboardList, MapPin,
  X, Zap, Sparkles, UserCheck, CheckSquare, Clock,
  Edit3, Trash2, Loader2, AlertCircle, ShieldAlert
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
import { apiClient } from '@/lib/apiClient'
import { type PartyRow } from '@/lib/mockData'

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

const FORM_STATUS_OPTIONS = [
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

// ── Interface for Requirement Item ───────────────────────────────────────────

export interface RequirementItem {
  id: string
  client_id: string
  client_name: string
  assigned_to_id: string | null
  assigned_to_name: string | null
  category: string
  intent: 'BUY' | 'RENT' | 'LEASE'
  preferred_short_locs: string[]
  alternate_locs?: string[] | null
  min_budget: number | null
  max_budget: number | null
  min_area?: number | null
  max_area?: number | null
  timeline?: string | null
  facilities?: string[] | null
  status: string
  remarks?: string | null
  match_count?: number
  created_at?: string | null
}

// ── Error Parsing Helper ──────────────────────────────────────────────────────

function parseApiError(err: unknown, defaultMsg: string): { status?: number; message: string; isForbidden?: boolean } {
  if (!(err instanceof Error)) return { message: defaultMsg }
  const raw = err.message
  const match = raw.match(/API (\d{3}):/)
  const status = match ? parseInt(match[1], 10) : undefined

  let detail = raw
  try {
    const jsonStart = raw.indexOf('{')
    if (jsonStart !== -1) {
      const parsed = JSON.parse(raw.slice(jsonStart))
      if (parsed.detail) {
        if (typeof parsed.detail === 'string') {
          detail = parsed.detail.replace(/^Value error,\s*/i, '')
        } else if (Array.isArray(parsed.detail)) {
          detail = parsed.detail
            .map((d: any) => {
              const field = d.loc?.slice(-1)[0] || 'field'
              const msg = (d.msg || '').replace(/^Value error,\s*/i, '')
              return `${field}: ${msg}`
            })
            .join(', ')
        }
      }
    }
  } catch {
    // Ignore JSON parse errors
  }

  if (status === 403) {
    return {
      status: 403,
      message: "You don't have permission to perform this action (requires SUPER_ADMIN or OFFICE_EXECUTIVE).",
      isForbidden: true,
    }
  }
  if (status === 401) {
    return { status: 401, message: 'Not authenticated — provide a valid session or mock role header.' }
  }

  return { status, message: detail || defaultMsg }
}

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

function RequirementsContent() {
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get('status') || ''
  const initialSearch = searchParams.get('search') || ''

  // Backend state
  const [requirements, setRequirements] = useState<RequirementItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Parties state for Client Picker
  const [parties, setParties] = useState<PartyRow[]>([])
  const [partiesLoading, setPartiesLoading] = useState(false)

  // View & Edit mode state
  const [view, setView] = useState<'list' | 'add'>('list')
  const [editingReqId, setEditingReqId] = useState<string | null>(null)

  // List Filters
  const [fCategory, setFCategory] = useState('')
  const [fStatus, setFStatus] = useState(initialStatus)
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  useEffect(() => {
    if (initialStatus) {
      setFStatus(initialStatus)
    }
  }, [initialStatus])

  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch)
    }
  }, [initialSearch])

  // Form State
  const [formClientId, setFormClientId] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [formCategory, setFormCategory] = useState('RENTAL_RESIDENTIAL')
  const [formIntent, setFormIntent] = useState<'BUY' | 'RENT' | 'LEASE'>('RENT')
  const [formStatus, setFormStatus] = useState('NEW')
  const [formPreferredLocs, setFormPreferredLocs] = useState<string[]>([])
  const [prefInput, setPrefInput] = useState('')
  const [formAlternateLocs, setFormAlternateLocs] = useState<string[]>([])
  const [altInput, setAltInput] = useState('')
  const [formMinBudget, setFormMinBudget] = useState('')
  const [formMaxBudget, setFormMaxBudget] = useState('')
  const [formMinArea, setFormMinArea] = useState('')
  const [formMaxArea, setFormMaxArea] = useState('')
  const [formTimeline, setFormTimeline] = useState('Immediate')
  const [formFacilities, setFormFacilities] = useState<string[]>([])
  const [formRemarks, setFormRemarks] = useState('')

  // ── Fetch Requirements from Real Backend ────────────────────────────────────

  const fetchRequirements = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const params = new URLSearchParams()
      if (fCategory) params.set('category', fCategory)
      if (fStatus) params.set('status', fStatus)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      params.set('limit', '200')
      const queryString = params.toString()
      const url = `/api/requirements${queryString ? `?${queryString}` : ''}`

      const data = await apiClient.get<{ items: RequirementItem[]; total: number }>(url)
      setRequirements(data.items || [])
      setTotalCount(data.total || 0)
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Failed to load requirements')
      if (parsed.status === 403) {
        setPermissionDenied(true)
      } else {
        setError(parsed.message)
      }
    } finally {
      setLoading(false)
    }
  }, [fCategory, fStatus, searchQuery])

  // ── Fetch Parties for Client Picker ─────────────────────────────────────────

  const fetchParties = useCallback(async () => {
    setPartiesLoading(true)
    try {
      let all: PartyRow[] = []
      let offset = 0
      const limit = 200
      let total = 0
      do {
        const data = await apiClient.get<{ items: PartyRow[]; total: number }>(
          `/api/parties?limit=${limit}&offset=${offset}`
        )
        all = all.concat(data.items || [])
        total = data.total || 0
        offset += limit
      } while (all.length < total && offset < 5000)
      setParties(all)
    } catch {
      // Non-critical fallback
    } finally {
      setPartiesLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequirements()
    }, 200)
    return () => clearTimeout(timer)
  }, [fetchRequirements])

  useEffect(() => {
    fetchParties()
  }, [fetchParties])

  // ── Filtered Client Parties for Searchable Dropdown ─────────────────────────

  const filteredParties = useMemo(() => {
    if (!clientSearch.trim()) return parties
    const q = clientSearch.toLowerCase()
    return parties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        (p.mobile || '').includes(q)
    )
  }, [parties, clientSearch])

  const displayParties = useMemo(() => {
    if (!formClientId) return filteredParties
    const selectedInList = filteredParties.some((p) => p.id === formClientId)
    if (!selectedInList) {
      const selectedParty = parties.find((p) => p.id === formClientId)
      if (selectedParty) return [selectedParty, ...filteredParties]
    }
    return filteredParties
  }, [filteredParties, formClientId, parties])

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
    setEditingReqId(null)
    setFormClientId('')
    setClientSearch('')
    setFormCategory('RENTAL_RESIDENTIAL')
    setFormIntent('RENT')
    setFormStatus('NEW')
    setFormPreferredLocs([])
    setPrefInput('')
    setFormAlternateLocs([])
    setAltInput('')
    setFormMinBudget('')
    setFormMaxBudget('')
    setFormMinArea('')
    setFormMaxArea('')
    setFormTimeline('Immediate')
    setFormFacilities([])
    setFormRemarks('')
  }

  // ── Open Add Mode ───────────────────────────────────────────────────────────

  const startAdd = () => {
    resetForm()
    setError(null)
    setView('add')
  }

  // ── Open Edit Mode ──────────────────────────────────────────────────────────

  const startEdit = (req: RequirementItem) => {
    setEditingReqId(req.id)
    setFormClientId(req.client_id)
    setClientSearch('')
    setFormCategory(req.category)
    setFormIntent(req.intent)
    setFormStatus(req.status)
    setFormPreferredLocs([...(req.preferred_short_locs || [])])
    setPrefInput('')
    setFormAlternateLocs([...(req.alternate_locs || [])])
    setAltInput('')
    setFormMinBudget(req.min_budget != null ? String(req.min_budget) : '')
    setFormMaxBudget(req.max_budget != null ? String(req.max_budget) : '')
    setFormMinArea(req.min_area != null ? String(req.min_area) : '')
    setFormMaxArea(req.max_area != null ? String(req.max_area) : '')
    setFormTimeline(req.timeline || 'Immediate')
    setFormFacilities([...(req.facilities || [])])
    setFormRemarks(req.remarks || '')
    setError(null)
    setView('add')
  }

  // ── Handle Save / Update ────────────────────────────────────────────────────

  const handleSaveRequirement = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    // Validation: Client is required
    if (!formClientId.trim()) {
      setError('Please select a client for this requirement')
      setIsSaving(false)
      return
    }

    // Validation: Budget Range
    const cleanMin = formMinBudget.replace(/,/g, '').trim()
    const cleanMax = formMaxBudget.replace(/,/g, '').trim()
    const minB = cleanMin ? Number(cleanMin) : null
    const maxB = cleanMax ? Number(cleanMax) : null

    if (minB !== null && (isNaN(minB) || minB <= 0)) {
      setError('Min budget must be greater than 0')
      setIsSaving(false)
      return
    }
    if (maxB !== null && (isNaN(maxB) || maxB <= 0)) {
      setError('Max budget must be greater than 0')
      setIsSaving(false)
      return
    }
    if (minB !== null && maxB !== null && minB > maxB) {
      setError('Min budget cannot be greater than max budget')
      setIsSaving(false)
      return
    }

    // ShortLocs: Include pending input if typed
    let finalPreferredLocs = [...formPreferredLocs]
    const pendingLoc = prefInput.trim()
    if (pendingLoc && !finalPreferredLocs.includes(pendingLoc)) {
      finalPreferredLocs.push(pendingLoc)
      setFormPreferredLocs(finalPreferredLocs)
      setPrefInput('')
    }
    if (finalPreferredLocs.length === 0) {
      setError('Please add at least one preferred ShortLoc')
      setIsSaving(false)
      return
    }

    const payload = {
      client_id: formClientId,
      category: formCategory,
      intent: formIntent,
      status: formStatus,
      preferred_short_locs: finalPreferredLocs,
      alternate_locs: formAlternateLocs,
      min_budget: minB,
      max_budget: maxB,
      min_area: formMinArea.trim() ? Number(formMinArea.trim()) : null,
      max_area: formMaxArea.trim() ? Number(formMaxArea.trim()) : null,
      timeline: formTimeline || null,
      facilities: formFacilities,
      remarks: formRemarks.trim() || null,
      assigned_to_id: null,
    }

    try {
      if (editingReqId) {
        await apiClient.patch(`/api/requirements/${editingReqId}`, payload)
      } else {
        await apiClient.post('/api/requirements', payload)
      }
      resetForm()
      setView('list')
      await fetchRequirements()
    } catch (err: unknown) {
      const parsed = parseApiError(
        err,
        editingReqId ? 'Failed to update requirement' : 'Failed to create requirement'
      )
      setError(parsed.message)
    } finally {
      setIsSaving(false)
    }
  }

  // ── Handle Delete (DELETE /api/requirements/{id}) ───────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete requirement ${id}?`)) return
    setDeletingId(id)
    setError(null)

    try {
      await apiClient.delete(`/api/requirements/${id}`)
      await fetchRequirements()
    } catch (err: unknown) {
      const parsed = parseApiError(err, `Failed to delete requirement ${id}`)
      setError(parsed.message)
    } finally {
      setDeletingId(null)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-900">Notice</h4>
                <p className="text-xs text-red-700 mt-0.5 whitespace-pre-wrap">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-700 transition-colors"
              title="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* 403 Forbidden Access Restricted Banner */}
        {permissionDenied && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6 flex items-start gap-4">
              <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-semibold text-amber-900">Access Restricted</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Requirements management is restricted to Super Admin and Office Executive roles.
                  Your current role does not have permission to view or manage client requirements.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Render main content only when access is granted */}
        {!permissionDenied && (
          <>
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
                    onClick={startAdd}
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

                    <div className="ml-auto text-xs text-slate-400 font-medium flex items-center gap-2">
                      {loading && <Loader2 size={13} className="animate-spin text-indigo-600" />}
                      <span>Showing {requirements.length} of {totalCount} requirements</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Table */}
                <Card className="border-slate-200/80 shadow-xs overflow-hidden">
                  <CardContent className="p-0">
                    {loading && requirements.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                        <span className="text-sm font-medium">Loading requirements from database...</span>
                      </div>
                    ) : requirements.length === 0 ? (
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
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {requirements.map((req) => {
                              const matchCount = req.match_count ?? 0

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

                                  {/* Preferred ShortLoc(s) */}
                                  <td className="py-3.5 px-4">
                                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                                      {(req.preferred_short_locs || []).map((loc) => (
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

                                  {/* Match Count Badge — Clickable Link to /matching */}
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
                                      <Zap
                                        size={13}
                                        className={matchCount > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}
                                      />
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

                                  {/* Actions */}
                                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => startEdit(req)}
                                        className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                                        title="Edit requirement"
                                      >
                                        <Edit3 size={14} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(req.id)}
                                        disabled={deletingId === req.id}
                                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                        title="Delete requirement"
                                      >
                                        {deletingId === req.id ? (
                                          <Loader2 size={14} className="animate-spin text-red-500" />
                                        ) : (
                                          <Trash2 size={14} />
                                        )}
                                      </Button>
                                    </div>
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
            {/* VIEW 2: ADD / EDIT REQUIREMENT FORM                               */}
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
                      disabled={isSaving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {isSaving && <Loader2 size={14} className="animate-spin mr-1.5" />}
                      {editingReqId ? 'Update Requirement' : 'Save Requirement'}
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
                          {editingReqId ? `Edit Client Requirement: ${editingReqId}` : 'Create Client Requirement'}
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                          {/* Client (Searchable dropdown) */}
                          <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="client_id" className="text-xs font-semibold text-slate-700">
                                Client / Contact <span className="text-red-500">*</span>
                              </Label>
                              {partiesLoading && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Loader2 size={10} className="animate-spin" /> Loading
                                </span>
                              )}
                            </div>
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
                                className="h-10 text-sm"
                              >
                                <option value="">— Select a client (Required) —</option>
                                {displayParties.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.mobile || 'No mobile'})
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
                              className="h-10 text-sm mt-1"
                            >
                              {INTENT_OPTIONS.map((intent) => (
                                <option key={intent} value={intent}>
                                  {intent}
                                </option>
                              ))}
                            </Select>
                          </div>

                          {/* Status */}
                          <div className="space-y-1.5">
                            <Label htmlFor="status" className="text-xs font-semibold text-slate-700">
                              Status <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              id="status"
                              value={formStatus}
                              onChange={(e) => setFormStatus(e.target.value)}
                              className="h-10 text-sm mt-1"
                            >
                              {FORM_STATUS_OPTIONS.map((st) => (
                                <option key={st.value} value={st.value}>
                                  {st.label}
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
                              <Badge
                                variant="outline"
                                className="text-[10px] text-indigo-700 border-indigo-300 font-mono"
                              >
                                Match Key
                              </Badge>
                            </div>

                            {/* Existing Tags */}
                            <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center p-2 bg-white rounded-lg border border-indigo-200">
                              {formPreferredLocs.map((loc) => (
                                <ShortLocBadge
                                  key={loc}
                                  code={loc}
                                  onRemove={() =>
                                    setFormPreferredLocs(formPreferredLocs.filter((l) => l !== loc))
                                  }
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
                            <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center p-2 bg-white rounded-lg border border-slate-200">
                              {formAlternateLocs.map((loc) => (
                                <span
                                  key={loc}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 border border-slate-200 font-mono"
                                >
                                  <span>{loc}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFormAlternateLocs(formAlternateLocs.filter((l) => l !== loc))
                                    }
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

                          {/* Assigned Staff (Disabled with note) */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="assigned_to" className="text-xs font-semibold text-slate-700">
                                Assigned Staff
                              </Label>
                              <span className="text-[10px] text-slate-400 italic">Coming soon</span>
                            </div>
                            <Select
                              id="assigned_to"
                              value=""
                              disabled
                              className="h-10 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                            >
                              <option value="">Unassigned</option>
                            </Select>
                            <p className="text-[11px] text-slate-400">
                              Agent assignment will be available once User Management is live
                            </p>
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
                          disabled={isSaving}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                        >
                          {isSaving && <Loader2 size={14} className="animate-spin mr-1.5" />}
                          {editingReqId ? 'Update Requirement' : 'Save Requirement'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}

export default function RequirementsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
          Loading Requirements…
        </div>
      }
    >
      <RequirementsContent />
    </Suspense>
  )
}

'use client'

/**
 * Matching Workspace — Spec §1.7
 * Split-panel: Left = requirements list with search/filter (from real backend GET /api/requirements).
 * Right = match results with scoring (from real backend GET /api/matches and POST /api/matches/run).
 * "Run Matching" calls real backend matching engine.
 * "Why this match?" expandable accordion with live score breakdown.
 * Action buttons: Shortlist, Reject Match, Share update real match status via PATCH /api/matches/{id}.
 * Schedule Visit creates mock visit (Visit module un-wired) and updates match status on real backend.
 *
 * DATA SOURCE: Real FastAPI backend via apiClient.ts (/api/requirements, /api/matches)
 */

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search, Zap, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle,
  Loader2, Star, XCircle, Share2, CalendarPlus, X, ThumbsDown,
  Check, Eye, EyeOff, ShieldAlert, AlertCircle
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  formatPrice, formatBudget, formatCategory, tierClasses, statusClasses, propertyStatusClasses,
} from '@/lib/formatters'
import { apiClient } from '@/lib/apiClient'
import {
  MOCK_VISITS, MOCK_USERS,
  type FullRequirementRow, type VisitRow,
} from '@/lib/mockData'

export interface MatchRow {
  id: string
  requirement_id: string
  client_name?: string | null
  property_id: string
  short_loc?: string | null
  property_category?: string | null
  property_price?: number | null
  score: number
  tier: string
  status: string
  reject_reason?: string | null
  score_breakdown?: Record<string, string> | null
  property_status?: string | null
  property_unavailable?: boolean
}

const CATEGORIES = ['', 'RENTAL_RESIDENTIAL', 'RENTAL_COMMERCIAL', 'BUY_SELL_FLAT', 'BUY_SELL_COMMERCIAL', 'PLOT'] as const

const REJECT_REASONS = [
  'Price too high',
  'Location mismatch',
  'Client not interested',
  'Property already visited',
  'Size/layout mismatch',
  'Availability issue',
  'Other',
] as const

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
    // Ignore JSON parsing issues
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

// ── Matching Content Component ────────────────────────────────────────────────

function MatchingContent() {
  const searchParams = useSearchParams()
  const urlReqId = searchParams.get('reqId')

  // Real backend state
  const [requirements, setRequirements] = useState<FullRequirementRow[]>([])
  const [loadingReqs, setLoadingReqs] = useState(true)
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Filter & Selection State
  const [search, setSearch] = useState('')
  const [fCategory, setFCategory] = useState('')
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showRejected, setShowRejected] = useState(false)

  // Reject dialog state
  const [rejectingMatchId, setRejectingMatchId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<string>(REJECT_REASONS[0])
  const [rejectCustomReason, setRejectCustomReason] = useState('')

  // Share toast
  const [shareToast, setShareToast] = useState<{ matchId: string; clientName: string } | null>(null)

  // Schedule Visit dialog state (depends on visits module, left on mock data)
  const [schedulingMatch, setSchedulingMatch] = useState<MatchRow | null>(null)
  const [visitAgent, setVisitAgent] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [visitPurpose, setVisitPurpose] = useState<'Property Viewing' | 'Owner Meeting' | 'Verification'>('Property Viewing')
  const [visitInstructions, setVisitInstructions] = useState('')
  const [visitTemplate, setVisitTemplate] = useState('Standard Residential')

  // ── Fetch Requirements from Real Backend ────────────────────────────────────

  const fetchRequirements = useCallback(async () => {
    setLoadingReqs(true)
    setError(null)
    setPermissionDenied(false)
    try {
      let all: FullRequirementRow[] = []
      let offset = 0
      const limit = 200
      let total = 0
      do {
        const data = await apiClient.get<{ items: FullRequirementRow[]; total: number }>(
          `/api/requirements?limit=${limit}&offset=${offset}`
        )
        all = all.concat(data.items || [])
        total = data.total || 0
        offset += limit
      } while (all.length < total && offset < 5000)
      setRequirements(all)
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Failed to load requirements')
      if (parsed.status === 403) {
        setPermissionDenied(true)
      } else {
        setError(parsed.message)
      }
    } finally {
      setLoadingReqs(false)
    }
  }, [])

  useEffect(() => {
    fetchRequirements()
  }, [fetchRequirements])

  // ── Fetch Existing Matches for a Requirement ────────────────────────────────

  const fetchMatchesForReq = useCallback(async (reqId: string) => {
    setLoadingMatches(true)
    setError(null)
    try {
      const data = await apiClient.get<{ items: MatchRow[]; total: number }>(
        `/api/matches?requirement_id=${encodeURIComponent(reqId)}&limit=100`
      )
      const items = data.items || []
      setMatches(items)
      if (items.length > 0) {
        setExpanded(new Set(items.map(m => m.id)))
      } else {
        setExpanded(new Set())
      }
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Failed to load matches')
      if (parsed.status === 403) {
        setPermissionDenied(true)
      } else {
        setError(parsed.message)
      }
    } finally {
      setLoadingMatches(false)
    }
  }, [])

  // ── Handle URL Pre-selection (`/matching?reqId=...`) ─────────────────────────

  useEffect(() => {
    if (urlReqId && requirements.length > 0) {
      const found = requirements.find(r => r.id === urlReqId)
      if (found) {
        setSelectedReqId(urlReqId)
        fetchMatchesForReq(urlReqId)
      }
    }
  }, [urlReqId, requirements, fetchMatchesForReq])

  // ── Filtered Requirements for Left Panel ────────────────────────────────────

  const filteredReqs = useMemo(() => {
    let items = requirements
    if (fCategory) items = items.filter(r => r.category === fCategory)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      items = items.filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.client_name.toLowerCase().includes(q) ||
        (r.preferred_short_locs || []).some(loc => loc.toLowerCase().includes(q))
      )
    }
    return items
  }, [requirements, fCategory, search])

  const selectedReq = useMemo(() => {
    return requirements.find(r => r.id === selectedReqId) ?? null
  }, [requirements, selectedReqId])

  // Sorted & Filtered Matches
  const displayedMatches = useMemo(() => {
    return matches
      .filter(m => showRejected || m.status !== 'REJECTED')
      .sort((a, b) => {
        // Put rejected at the bottom
        if (a.status === 'REJECTED' && b.status !== 'REJECTED') return 1
        if (b.status === 'REJECTED' && a.status !== 'REJECTED') return -1
        return b.score - a.score
      })
  }, [matches, showRejected])

  const rejectedCount = useMemo(() => {
    return matches.filter(m => m.status === 'REJECTED').length
  }, [matches])

  // ── Handle Run Matching (POST /api/matches/run) ─────────────────────────────

  const handleRunMatching = async () => {
    if (!selectedReqId) return
    setRunning(true)
    setError(null)
    setSummary(null)
    try {
      const data = await apiClient.post<{ matches: MatchRow[]; summary: string; total: number }>(
        `/api/matches/run?requirement_id=${encodeURIComponent(selectedReqId)}`,
        {}
      )
      const newMatches = data.matches || []
      setMatches(newMatches)
      setSummary(data.summary || null)
      setExpanded(new Set(newMatches.map(m => m.id)))
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Failed to compute matches')
      if (parsed.status === 403) {
        setPermissionDenied(true)
      } else {
        setError(parsed.message)
      }
    } finally {
      setRunning(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSelect = (reqId: string) => {
    setSelectedReqId(reqId)
    setSummary(null)
    fetchMatchesForReq(reqId)
  }

  // ── Action Handlers ─────────────────────────────────────────────────────────

  const handleShortlist = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId)
    if (!match || match.status === 'SHORTLISTED') return
    try {
      await apiClient.patch(`/api/matches/${matchId}`, { status: 'SHORTLISTED' })
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'SHORTLISTED' } : m))
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Failed to shortlist match')
      setError(parsed.message)
    }
  }

  const handleShare = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId)
    if (!match) return
    try {
      await apiClient.patch(`/api/matches/${matchId}`, { status: 'SHARED' })
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'SHARED' } : m))
      setShareToast({ matchId, clientName: match.client_name || 'Client' })
      setTimeout(() => {
        setShareToast(prev => prev?.matchId === matchId ? null : prev)
      }, 3000)
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Failed to share match')
      setError(parsed.message)
    }
  }

  const openRejectDialog = (matchId: string) => {
    setRejectingMatchId(matchId)
    setRejectReason(REJECT_REASONS[0])
    setRejectCustomReason('')
  }

  const handleConfirmReject = async () => {
    if (!rejectingMatchId) return
    const reason = rejectReason === 'Other' ? (rejectCustomReason.trim() || 'Other') : rejectReason
    try {
      await apiClient.patch(`/api/matches/${rejectingMatchId}`, { status: 'REJECTED' })
      setMatches(prev => prev.map(m => m.id === rejectingMatchId ? { ...m, status: 'REJECTED', reject_reason: reason } : m))
      setRejectingMatchId(null)
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Failed to reject match')
      setError(parsed.message)
    }
  }

  const openScheduleVisit = (match: MatchRow) => {
    setSchedulingMatch(match)
    const req = requirements.find(r => r.id === match.requirement_id)
    setVisitAgent(req?.assigned_to_id || MOCK_USERS.filter(u => u.role === 'AGENT')[0]?.id || '')
    setVisitDate('')
    setVisitPurpose('Property Viewing')
    setVisitInstructions(`Property viewing for ${match.client_name} — Match ${match.id}`)
    setVisitTemplate(
      match.property_category?.includes('COMMERCIAL') ? 'Standard Commercial' : 'Standard Residential'
    )
  }

  const handleConfirmVisit = async () => {
    if (!schedulingMatch) return
    const agent = MOCK_USERS.find(u => u.id === visitAgent)
    const req = requirements.find(r => r.id === schedulingMatch.requirement_id)

    // Push mock visit for visits module demo
    const newVisit: VisitRow = {
      id: `V-${Date.now().toString().slice(-4)}`,
      property_id: schedulingMatch.property_id,
      property_short_loc: schedulingMatch.short_loc ?? '',
      client_id: req?.client_id || undefined,
      client_name: schedulingMatch.client_name ?? '',
      agent_id: visitAgent,
      agent_name: agent?.name || 'Unassigned',
      purpose: visitPurpose,
      status: 'Assigned',
      scheduled_date: visitDate || new Date().toISOString(),
      instructions: visitInstructions || undefined,
      checklist_template: visitTemplate,
      created_at: new Date().toISOString(),
    }
    MOCK_VISITS.push(newVisit)

    // Update match status on real backend
    try {
      await apiClient.patch(`/api/matches/${schedulingMatch.id}`, { status: 'VISIT_SCHEDULED' })
      setMatches(prev => prev.map(m => m.id === schedulingMatch.id ? { ...m, status: 'VISIT_SCHEDULED' } : m))
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Failed to update match status')
      setError(parsed.message)
    }
    setSchedulingMatch(null)
  }

  const agentUsers = MOCK_USERS.filter(u => u.role === 'AGENT')

  const getActionState = (match: MatchRow) => {
    const isRejected = match.status === 'REJECTED'
    const isShortlisted = match.status === 'SHORTLISTED'
    const isShared = match.status === 'SHARED'
    const isVisitScheduled = match.status === 'VISIT_SCHEDULED'
    const isUnavailable = match.property_unavailable === true
    return { isRejected, isShortlisted, isShared, isVisitScheduled, isUnavailable }
  }

  return (
    <AppLayout>
      <div className="space-y-5 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Matching Workspace</h1>
          <p className="text-sm text-slate-500 mt-0.5">Select a requirement and compute ranked property matches.</p>
        </div>

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
                  Matching Workspace is restricted to Super Admin and Office Executive roles.
                  Your current role does not have permission to view or run matching engine computations.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!permissionDenied && (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
            {/* ── Left Panel: Requirements List ──────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200 flex-1">
                  <Search size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search ID, client, ShortLoc…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
                  />
                </div>
              </div>
              <Select value={fCategory} onChange={e => setFCategory(e.target.value)} className="w-full">
                <option value="">All Categories</option>
                {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{formatCategory(c)}</option>)}
              </Select>

              <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {loadingReqs ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
                    <span className="text-xs font-medium">Loading requirements…</span>
                  </div>
                ) : filteredReqs.map(req => (
                  <button
                    key={req.id}
                    onClick={() => handleSelect(req.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedReqId === req.id
                        ? 'border-indigo-400 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-semibold text-slate-700">{req.id}</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        req.intent === 'BUY' ? 'bg-emerald-100 text-emerald-700' :
                        req.intent === 'RENT' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {req.intent}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{req.client_name}</p>
                    <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                      <span>{formatCategory(req.category)}</span>
                      <span className="font-medium text-slate-700">{formatBudget(req.min_budget, req.max_budget)}</span>
                    </div>
                    {(req.preferred_short_locs || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {req.preferred_short_locs.slice(0, 2).map(loc => (
                          <span key={loc} className="inline-flex bg-slate-100 text-slate-600 rounded px-1.5 py-0.2 text-[10px] font-mono">
                            {loc}
                          </span>
                        ))}
                        {req.preferred_short_locs.length > 2 && (
                          <span className="text-[10px] text-slate-400">+{req.preferred_short_locs.length - 2}</span>
                        )}
                      </div>
                    )}
                  </button>
                ))}
                {!loadingReqs && filteredReqs.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">No requirements match your search.</p>
                )}
              </div>
            </div>

            {/* ── Right Panel: Match Results ─────────────────────────────────── */}
            <div>
              {!selectedReq ? (
                <Card className="border-slate-200/80">
                  <CardContent className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <Zap size={48} className="mb-3 opacity-30 text-indigo-500" />
                    <p className="text-lg font-medium text-slate-700">Select a Requirement</p>
                    <p className="text-sm mt-1">Choose a requirement from the left panel to view or compute matches.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Selected requirement header */}
                  <Card className="border-slate-200/80 shadow-xs">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-500">{selectedReq.id}</span>
                            <h2 className="text-lg font-bold text-slate-900">{selectedReq.client_name}</h2>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                              {formatCategory(selectedReq.category)}
                            </Badge>
                            <span className="text-xs text-slate-600 font-medium">
                              Budget: {formatBudget(selectedReq.min_budget, selectedReq.max_budget)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(selectedReq.preferred_short_locs || []).map(loc => (
                              <span key={loc} className="inline-flex bg-indigo-50 text-indigo-800 border border-indigo-200 rounded px-1.5 py-0.5 text-[10px] font-mono font-medium">
                                {loc}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Button
                          onClick={handleRunMatching}
                          disabled={running}
                          className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                        >
                          {running ? (
                            <><Loader2 size={16} className="animate-spin mr-1.5" /> Computing…</>
                          ) : (
                            <><Zap size={16} className="mr-1.5" /> Run Matching</>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Summary Banner from Engine */}
                  {summary && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-medium text-indigo-900 flex items-center gap-2">
                      <Zap size={14} className="text-indigo-600 shrink-0" />
                      <span>{summary}</span>
                    </div>
                  )}

                  {/* Show/hide rejected toggle */}
                  {rejectedCount > 0 && (
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => setShowRejected(!showRejected)}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                      >
                        {showRejected ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showRejected ? 'Hide' : 'Show'} {rejectedCount} rejected match{rejectedCount !== 1 ? 'es' : ''}
                      </button>
                    </div>
                  )}

                  {/* Match result cards */}
                  {loadingMatches ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <Loader2 className="h-7 w-7 animate-spin text-indigo-600 mb-2" />
                      <span className="text-sm font-medium">Loading match records…</span>
                    </div>
                  ) : displayedMatches.length > 0 ? (
                    <div className="space-y-3">
                      {displayedMatches.map(match => {
                        const { isRejected, isShortlisted, isShared, isVisitScheduled, isUnavailable } = getActionState(match)

                        return (
                          <Card
                            key={match.id}
                            className={`overflow-hidden transition-all border-slate-200/80 shadow-xs ${
                              isRejected ? 'opacity-60 border-slate-200 bg-slate-50/50' : ''
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  {/* Score circle */}
                                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${
                                    isRejected ? 'bg-slate-100 text-slate-400' :
                                    match.score >= 90 ? 'bg-emerald-100 text-emerald-700' :
                                    match.score >= 75 ? 'bg-blue-100 text-blue-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {Math.round(match.score)}%
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs font-semibold text-slate-600">{match.property_id}</span>
                                      <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-700">
                                        {formatCategory(match.property_category || '')}
                                      </Badge>
                                    </div>
                                    <p className={`font-semibold mt-0.5 ${isRejected ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                      {match.short_loc || match.property_id}
                                    </p>
                                    <p className="text-sm text-slate-600 font-medium mt-0.5">
                                      {match.property_price != null ? formatPrice(match.property_price, match.property_category || undefined) : '—'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                  {match.property_status && (
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${propertyStatusClasses(match.property_status)}`}>
                                      {match.property_status.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tierClasses(match.tier)}`}>
                                    {match.tier}
                                  </span>
                                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClasses(match.status)}`}>
                                    {match.status.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              </div>

                              {/* Property unavailable red alert label */}
                              {match.property_unavailable && (
                                <div className="mt-2 flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
                                    <AlertTriangle size={13} className="shrink-0 text-red-600" />
                                    No longer available
                                  </span>
                                  <span className="text-xs text-red-600 font-medium">
                                    (Property status is {match.property_status ? match.property_status.replace(/_/g, ' ') : 'unavailable'})
                                  </span>
                                </div>
                              )}

                              {/* Reject reason tag */}
                              {isRejected && match.reject_reason && (
                                <div className="mt-2">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-600 border border-red-200">
                                    <ThumbsDown size={11} />
                                    {match.reject_reason}
                                  </span>
                                </div>
                              )}

                              {/* "Why this match?" accordion */}
                              <button
                                onClick={() => toggleExpand(match.id)}
                                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 mt-3 transition-colors"
                              >
                                {expanded.has(match.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                Why this match?
                              </button>

                              {expanded.has(match.id) && match.score_breakdown && (
                                <div className="mt-2 pl-2 border-l-2 border-slate-100 space-y-1.5">
                                  {Object.entries(match.score_breakdown).map(([criteria, result]) => (
                                    <div key={criteria} className="flex items-center gap-2 text-xs">
                                      {result === 'PASS' ? (
                                        <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                                      ) : (
                                        <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                                      )}
                                      <span className="font-medium capitalize text-slate-700">{criteria}:</span>
                                      <span className={result === 'PASS' ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                                        {result}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100 items-center">
                                {/* Shortlist */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isRejected || isShortlisted || isUnavailable}
                                  onClick={() => handleShortlist(match.id)}
                                  title={isUnavailable ? 'Property is no longer available' : undefined}
                                  className={
                                    isShortlisted
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default font-medium'
                                      : isUnavailable
                                      ? 'opacity-50 cursor-not-allowed text-slate-400 border-slate-200'
                                      : 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                                  }
                                >
                                  {isShortlisted ? (
                                    <><Check size={13} className="mr-1" /> Shortlisted ✓</>
                                  ) : (
                                    <><Star size={13} className="mr-1" /> Shortlist</>
                                  )}
                                </Button>

                                {/* Reject */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isRejected}
                                  onClick={() => openRejectDialog(match.id)}
                                  className={
                                    isRejected
                                      ? 'bg-red-50 text-red-400 border-red-200 cursor-default font-medium'
                                      : 'hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                                  }
                                >
                                  {isRejected ? (
                                    <><XCircle size={13} className="mr-1" /> Rejected</>
                                  ) : (
                                    <><XCircle size={13} className="mr-1" /> Reject Match</>
                                  )}
                                </Button>

                                {/* Share */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isRejected || isUnavailable}
                                  onClick={() => handleShare(match.id)}
                                  title={isUnavailable ? 'Property is no longer available' : undefined}
                                  className={
                                    isShared
                                      ? 'bg-blue-50 text-blue-700 border-blue-200 font-medium'
                                      : isUnavailable
                                      ? 'opacity-50 cursor-not-allowed text-slate-400 border-slate-200'
                                      : 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                                  }
                                >
                                  {isShared ? (
                                    <><Share2 size={13} className="mr-1" /> Shared ✓</>
                                  ) : (
                                    <><Share2 size={13} className="mr-1" /> Share</>
                                  )}
                                </Button>

                                {/* Schedule Visit */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isRejected || isUnavailable}
                                  onClick={() => openScheduleVisit(match)}
                                  title={isUnavailable ? 'Property is no longer available' : undefined}
                                  className={
                                    isVisitScheduled
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-medium'
                                      : isUnavailable
                                      ? 'opacity-50 cursor-not-allowed text-slate-400 border-slate-200'
                                      : 'hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                                  }
                                >
                                  {isVisitScheduled ? (
                                    <><CalendarPlus size={13} className="mr-1" /> Visit Scheduled ✓</>
                                  ) : (
                                    <><CalendarPlus size={13} className="mr-1" /> Schedule Visit</>
                                  )}
                                </Button>

                                {isUnavailable && (
                                  <span className="text-xs text-red-600 font-medium ml-auto">
                                    Actions disabled: property is no longer available
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  ) : !running ? (
                    <Card className="border-slate-200/80">
                      <CardContent className="py-12 text-center text-slate-400 text-sm">
                        No matches computed yet. Click &quot;Run Matching&quot; to compute property matches for this requirement.
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Share Toast ──────────────────────────────────────────────────────── */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 text-white shadow-lg">
            <Share2 size={18} />
            <div>
              <p className="text-sm font-medium">Shared with {shareToast.clientName}</p>
              <p className="text-xs text-blue-200">Property details sent (mock notification)</p>
            </div>
            <button
              onClick={() => setShareToast(null)}
              className="ml-2 p-1 rounded hover:bg-blue-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Reject Reason Dialog ──────────────────────────────────────────────── */}
      {rejectingMatchId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setRejectingMatchId(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-red-100 text-red-600">
                  <ThumbsDown size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reject Match</h3>
                  <p className="text-xs text-slate-500">
                    Match {rejectingMatchId} — select a reason below
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectingMatchId(null)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">Rejection Reason</Label>
                <Select
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="mt-1.5"
                >
                  {REJECT_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Select>
              </div>

              {rejectReason === 'Other' && (
                <div>
                  <Label className="text-sm font-medium text-slate-700">Custom Reason</Label>
                  <Input
                    value={rejectCustomReason}
                    onChange={e => setRejectCustomReason(e.target.value)}
                    placeholder="Enter reason…"
                    className="mt-1.5"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2 rounded-b-xl">
              <Button variant="outline" size="sm" onClick={() => setRejectingMatchId(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmReject}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle size={14} className="mr-1.5" />
                Confirm Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule Visit Dialog (Mock visits module) ───────────────────────── */}
      {schedulingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSchedulingMatch(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                  <CalendarPlus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Schedule Visit</h3>
                  <p className="text-xs text-slate-500">
                    {schedulingMatch.property_id} · {schedulingMatch.short_loc} → {schedulingMatch.client_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSchedulingMatch(null)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Pre-filled info banner */}
            <div className="mx-5 mt-4 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-indigo-500 font-medium">Property</span>
                  <p className="font-semibold text-indigo-900">{schedulingMatch.property_id} — {schedulingMatch.short_loc}</p>
                </div>
                <div>
                  <span className="text-indigo-500 font-medium">Client</span>
                  <p className="font-semibold text-indigo-900">{schedulingMatch.client_name}</p>
                </div>
                <div>
                  <span className="text-indigo-500 font-medium">Price</span>
                  <p className="font-semibold text-indigo-900">{schedulingMatch.property_price != null ? formatPrice(schedulingMatch.property_price, schedulingMatch.property_category || undefined) : '—'}</p>
                </div>
                <div>
                  <span className="text-indigo-500 font-medium">Match Score</span>
                  <p className="font-semibold text-indigo-900">{Math.round(schedulingMatch.score)}%</p>
                </div>
              </div>
            </div>

            {/* Form body */}
            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Assign Agent</Label>
                  <Select
                    value={visitAgent}
                    onChange={e => setVisitAgent(e.target.value)}
                    className="mt-1.5"
                  >
                    {agentUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Planned Date/Time</Label>
                  <Input
                    type="datetime-local"
                    value={visitDate}
                    onChange={e => setVisitDate(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Purpose</Label>
                  <Select
                    value={visitPurpose}
                    onChange={e => setVisitPurpose(e.target.value as typeof visitPurpose)}
                    className="mt-1.5"
                  >
                    <option value="Property Viewing">Property Viewing</option>
                    <option value="Owner Meeting">Owner Meeting</option>
                    <option value="Verification">Verification</option>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Checklist Template</Label>
                  <Select
                    value={visitTemplate}
                    onChange={e => setVisitTemplate(e.target.value)}
                    className="mt-1.5"
                  >
                    <option value="Standard Residential">Standard Residential</option>
                    <option value="Standard Commercial">Standard Commercial</option>
                    <option value="Owner Meeting">Owner Meeting</option>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700">Instructions</Label>
                <Textarea
                  value={visitInstructions}
                  onChange={e => setVisitInstructions(e.target.value)}
                  rows={2}
                  className="mt-1.5"
                  placeholder="Any special instructions for the agent..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2 rounded-b-xl">
              <Button variant="outline" size="sm" onClick={() => setSchedulingMatch(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmVisit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <CalendarPlus size={14} className="mr-1.5" />
                Confirm &amp; Assign Visit
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default function MatchingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
          Loading Matching Workspace…
        </div>
      }
    >
      <MatchingContent />
    </Suspense>
  )
}

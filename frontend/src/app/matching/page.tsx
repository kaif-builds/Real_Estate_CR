'use client'

/**
 * Matching Workspace — Spec §1.7
 * Split-panel: Left = requirements list with search/filter. Right = match results with scoring.
 * "Run Matching" simulates 1.5s computation delay. "Why this match?" expandable accordion.
 * Action buttons: Shortlist, Reject Match, Share, Schedule Visit — all update mock data.
 */

import { useCallback, useMemo, useState } from 'react'
import {
  Search, Zap, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle,
  Loader2, Star, XCircle, Share2, CalendarPlus, X, ThumbsDown,
  Check, Eye, EyeOff
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
  formatPrice, formatBudget, formatCategory, tierClasses, statusClasses,
} from '@/lib/formatters'
import {
  MOCK_REQUIREMENTS, MOCK_MATCHES, MOCK_VISITS, MOCK_USERS, MOCK_PROPERTIES, MOCK_PARTIES,
  type FullRequirementRow, type MatchRow, type VisitRow,
} from '@/lib/mockData'

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

export default function MatchingPage() {
  const [search, setSearch] = useState('')
  const [fCategory, setFCategory] = useState('')
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showRejected, setShowRejected] = useState(false)

  // Force re-render when we mutate MOCK_MATCHES in place
  const [, setTick] = useState(0)
  const forceUpdate = useCallback(() => setTick(t => t + 1), [])

  // Reject dialog state
  const [rejectingMatchId, setRejectingMatchId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<string>(REJECT_REASONS[0])
  const [rejectCustomReason, setRejectCustomReason] = useState('')

  // Share toast
  const [shareToast, setShareToast] = useState<{ matchId: string; clientName: string } | null>(null)

  // Schedule Visit dialog state
  const [schedulingMatch, setSchedulingMatch] = useState<MatchRow | null>(null)
  const [visitAgent, setVisitAgent] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [visitPurpose, setVisitPurpose] = useState<'Property Viewing' | 'Owner Meeting' | 'Verification'>('Property Viewing')
  const [visitInstructions, setVisitInstructions] = useState('')
  const [visitTemplate, setVisitTemplate] = useState('Standard Residential')

  // Filtered requirements for left panel
  const filteredReqs = useMemo(() => {
    let items: FullRequirementRow[] = MOCK_REQUIREMENTS
    if (fCategory) items = items.filter(r => r.category === fCategory)
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(r =>
        r.id.toLowerCase().includes(q) || r.client_name.toLowerCase().includes(q)
      )
    }
    return items
  }, [fCategory, search])

  const selectedReq = MOCK_REQUIREMENTS.find(r => r.id === selectedReqId) ?? null

  // Matches for selected requirement
  const matches = useMemo(() => {
    if (!selectedReqId || !showResults) return []
    return MOCK_MATCHES
      .filter(m => m.requirement_id === selectedReqId)
      .filter(m => showRejected || m.status !== 'REJECTED')
      .sort((a, b) => {
        // Put rejected at the bottom
        if (a.status === 'REJECTED' && b.status !== 'REJECTED') return 1
        if (b.status === 'REJECTED' && a.status !== 'REJECTED') return -1
        return b.score - a.score
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReqId, showResults, showRejected, /* tick dependency for re-render */])

  const rejectedCount = useMemo(() => {
    if (!selectedReqId || !showResults) return 0
    return MOCK_MATCHES.filter(m => m.requirement_id === selectedReqId && m.status === 'REJECTED').length
  }, [selectedReqId, showResults])

  const handleRunMatching = () => {
    if (!selectedReqId) return
    setRunning(true)
    setShowResults(false)
    setTimeout(() => {
      setRunning(false)
      setShowResults(true)
      const ids = MOCK_MATCHES.filter(m => m.requirement_id === selectedReqId).map(m => m.id)
      setExpanded(new Set(ids))
    }, 1500)
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
    setShowResults(false)
    setExpanded(new Set())
  }

  // ── Action Handlers ──────────────────────────────────────────────────────

  const handleShortlist = useCallback((matchId: string) => {
    const match = MOCK_MATCHES.find(m => m.id === matchId)
    if (!match || match.status === 'SHORTLISTED') return
    match.status = 'SHORTLISTED'
    forceUpdate()
  }, [forceUpdate])

  const handleShare = useCallback((matchId: string) => {
    const match = MOCK_MATCHES.find(m => m.id === matchId)
    if (!match) return
    match.status = 'SHARED'
    setShareToast({ matchId, clientName: match.client_name })
    forceUpdate()
    // Auto-dismiss toast after 3s
    setTimeout(() => {
      setShareToast(prev => prev?.matchId === matchId ? null : prev)
    }, 3000)
  }, [forceUpdate])

  const openRejectDialog = useCallback((matchId: string) => {
    setRejectingMatchId(matchId)
    setRejectReason(REJECT_REASONS[0])
    setRejectCustomReason('')
  }, [])

  const handleConfirmReject = useCallback(() => {
    if (!rejectingMatchId) return
    const match = MOCK_MATCHES.find(m => m.id === rejectingMatchId)
    if (!match) return
    const reason = rejectReason === 'Other' ? (rejectCustomReason.trim() || 'Other') : rejectReason
    match.status = 'REJECTED'
    match.reject_reason = reason
    setRejectingMatchId(null)
    forceUpdate()
  }, [rejectingMatchId, rejectReason, rejectCustomReason, forceUpdate])

  const openScheduleVisit = useCallback((match: MatchRow) => {
    setSchedulingMatch(match)
    // Pre-fill agent with the requirement's assigned agent
    const req = MOCK_REQUIREMENTS.find(r => r.id === match.requirement_id)
    setVisitAgent(req?.assigned_to_id || MOCK_USERS.filter(u => u.role === 'AGENT')[0]?.id || '')
    setVisitDate('')
    setVisitPurpose('Property Viewing')
    setVisitInstructions(`Property viewing for ${match.client_name} — Match ${match.id}`)
    const prop = MOCK_PROPERTIES.find(p => p.id === match.property_id)
    setVisitTemplate(
      prop?.category.includes('COMMERCIAL') ? 'Standard Commercial' : 'Standard Residential'
    )
  }, [])

  const handleConfirmVisit = useCallback(() => {
    if (!schedulingMatch) return
    const agent = MOCK_USERS.find(u => u.id === visitAgent)
    const prop = MOCK_PROPERTIES.find(p => p.id === schedulingMatch.property_id)
    const req = MOCK_REQUIREMENTS.find(r => r.id === schedulingMatch.requirement_id)
    // Find client party
    const clientParty = MOCK_PARTIES.find(p => p.id === req?.client_id)

    const newVisit: VisitRow = {
      id: `V-${Date.now().toString().slice(-4)}`,
      property_id: schedulingMatch.property_id,
      property_short_loc: prop?.short_loc || schedulingMatch.short_loc,
      client_id: req?.client_id || undefined,
      client_name: clientParty?.name || schedulingMatch.client_name,
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

    // Update match status
    schedulingMatch.status = 'VISIT_SCHEDULED'
    setSchedulingMatch(null)
    forceUpdate()
  }, [schedulingMatch, visitAgent, visitDate, visitPurpose, visitInstructions, visitTemplate, forceUpdate])

  const agentUsers = MOCK_USERS.filter(u => u.role === 'AGENT')

  // ── Helper: get button state for a match ──────────────────────────────────

  const getActionState = (match: MatchRow) => {
    const isRejected = match.status === 'REJECTED'
    const isShortlisted = match.status === 'SHORTLISTED'
    const isShared = match.status === 'SHARED'
    const isVisitScheduled = match.status === 'VISIT_SCHEDULED'
    return { isRejected, isShortlisted, isShared, isVisitScheduled }
  }

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Matching Workspace</h1>
          <p className="text-sm text-slate-500 mt-0.5">Select a requirement and compute ranked property matches.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
          {/* ── Left Panel: Requirements List ──────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200 flex-1">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search ID or client…"
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
              {filteredReqs.map(req => (
                <button
                  key={req.id}
                  onClick={() => handleSelect(req.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedReqId === req.id
                      ? 'border-amber-400 bg-amber-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-slate-500">{req.id}</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      req.intent === 'BUY' ? 'bg-emerald-100 text-emerald-700' :
                      req.intent === 'RENT' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {req.intent}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{req.client_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatCategory(req.category)}</p>
                </button>
              ))}
              {filteredReqs.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No requirements match your search.</p>
              )}
            </div>
          </div>

          {/* ── Right Panel: Match Results ─────────────────────────────────── */}
          <div>
            {!selectedReq ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-24 text-slate-400">
                  <Zap size={48} className="mb-3 opacity-30" />
                  <p className="text-lg font-medium">Select a Requirement</p>
                  <p className="text-sm mt-1">Choose a requirement from the left panel to view or compute matches.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Selected requirement header */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">{selectedReq.client_name}</h2>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{formatCategory(selectedReq.category)}</Badge>
                          <span className="text-xs text-slate-500">
                            Budget: {formatBudget(selectedReq.min_budget, selectedReq.max_budget)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedReq.preferred_short_locs.map(loc => (
                            <span key={loc} className="inline-flex bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 text-[10px] font-mono">
                              {loc}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button
                        onClick={handleRunMatching}
                        disabled={running}
                        className="shrink-0"
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

                {/* Show/hide rejected toggle */}
                {showResults && rejectedCount > 0 && (
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
                {matches.length > 0 ? (
                  <div className="space-y-3">
                    {matches.map(match => {
                      const { isRejected, isShortlisted, isShared, isVisitScheduled } = getActionState(match)

                      return (
                        <Card
                          key={match.id}
                          className={`overflow-hidden transition-all ${
                            isRejected ? 'opacity-60 border-slate-200 bg-slate-50/50' : ''
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                {/* Score circle */}
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${
                                  isRejected ? 'bg-slate-100 text-slate-400' :
                                  match.score >= 90 ? 'bg-emerald-100 text-emerald-700' :
                                  match.score >= 75 ? 'bg-blue-100 text-blue-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {match.score}%
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-slate-500">{match.property_id}</span>
                                    <Badge variant="secondary" className="text-[10px]">{formatCategory(match.property_category)}</Badge>
                                  </div>
                                  <p className={`font-medium mt-0.5 ${isRejected ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                    {match.short_loc}
                                  </p>
                                  <p className="text-sm text-slate-600 mt-0.5">
                                    {formatPrice(match.property_price, match.property_category)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tierClasses(match.tier)}`}>
                                  {match.tier}
                                </span>
                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClasses(match.status)}`}>
                                  {match.status.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </div>

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
                              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 mt-3 transition-colors"
                            >
                              {expanded.has(match.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              Why this match?
                            </button>

                            {expanded.has(match.id) && (
                              <div className="mt-2 pl-2 border-l-2 border-slate-100 space-y-1.5">
                                {Object.entries(match.score_breakdown).map(([criteria, result]) => (
                                  <div key={criteria} className="flex items-center gap-2 text-xs">
                                    {result === 'PASS' ? (
                                      <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                                    ) : (
                                      <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                                    )}
                                    <span className="font-medium capitalize text-slate-700">{criteria}:</span>
                                    <span className={result === 'PASS' ? 'text-green-600' : 'text-amber-600'}>
                                      {result}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                              {/* Shortlist */}
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isRejected || isShortlisted}
                                onClick={() => handleShortlist(match.id)}
                                className={
                                  isShortlisted
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
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
                                    ? 'bg-red-50 text-red-400 border-red-200 cursor-default'
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
                                disabled={isRejected}
                                onClick={() => handleShare(match.id)}
                                className={
                                  isShared
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
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
                                disabled={isRejected}
                                onClick={() => openScheduleVisit(match)}
                                className={
                                  isVisitScheduled
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                                }
                              >
                                {isVisitScheduled ? (
                                  <><CalendarPlus size={13} className="mr-1" /> Visit Scheduled ✓</>
                                ) : (
                                  <><CalendarPlus size={13} className="mr-1" /> Schedule Visit</>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : showResults ? (
                  <Card>
                    <CardContent className="py-12 text-center text-slate-400 text-sm">
                      No matches found for this requirement.
                    </CardContent>
                  </Card>
                ) : !running ? (
                  <Card>
                    <CardContent className="py-12 text-center text-slate-400 text-sm">
                      Click &quot;Run Matching&quot; to compute property matches for this requirement.
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Share Toast ──────────────────────────────────────────────────────── */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 text-white shadow-lg">
            <Share2 size={18} />
            <div>
              <p className="text-sm font-medium">Shared with {shareToast.clientName}</p>
              <p className="text-xs text-blue-200">Property details sent (mock)</p>
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

      {/* ── Schedule Visit Dialog ─────────────────────────────────────────────── */}
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
                  <p className="font-semibold text-indigo-900">{formatPrice(schedulingMatch.property_price, schedulingMatch.property_category)}</p>
                </div>
                <div>
                  <span className="text-indigo-500 font-medium">Match Score</span>
                  <p className="font-semibold text-indigo-900">{schedulingMatch.score}%</p>
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

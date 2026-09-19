'use client'

/**
 * Matching Workspace — Spec §1.7
 * Split-panel: Left = requirements list with search/filter. Right = match results with scoring.
 * "Run Matching" simulates 1.5s computation delay. "Why this match?" expandable accordion.
 * Action buttons: Shortlist, Reject Match, Share, Schedule Visit (all local state).
 */

import { useMemo, useState } from 'react'
import { Search, Zap, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  formatPrice, formatBudget, formatCategory, tierClasses, statusClasses,
} from '@/lib/formatters'
import {
  MOCK_REQUIREMENTS, MOCK_MATCHES,
  type FullRequirementRow, type MatchRow,
} from '@/lib/mockData'

const CATEGORIES = ['', 'RENTAL_RESIDENTIAL', 'RENTAL_COMMERCIAL', 'BUY_SELL_FLAT', 'BUY_SELL_COMMERCIAL', 'PLOT'] as const

export default function MatchingPage() {
  const [search, setSearch] = useState('')
  const [fCategory, setFCategory] = useState('')
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

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
      .sort((a, b) => b.score - a.score)
  }, [selectedReqId, showResults])

  const handleRunMatching = () => {
    if (!selectedReqId) return
    setRunning(true)
    setShowResults(false)
    setTimeout(() => {
      setRunning(false)
      setShowResults(true)
      // Auto-expand all cards
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

                {/* Match result cards */}
                {matches.length > 0 ? (
                  <div className="space-y-3">
                    {matches.map(match => (
                      <Card key={match.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {/* Score circle */}
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${
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
                                <p className="font-medium text-slate-800 mt-0.5">{match.short_loc}</p>
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
                          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                            <Button variant="outline" size="sm">Shortlist</Button>
                            <Button variant="outline" size="sm">Reject Match</Button>
                            <Button variant="outline" size="sm">Share</Button>
                            <Button variant="outline" size="sm">Schedule Visit</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
    </AppLayout>
  )
}

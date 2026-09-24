'use client'

/**
 * Pipeline (Opportunities) Page — Module 12
 *
 * 7-Column Kanban Board with right-side detail drawer, negotiation history,
 * and deal closing actions (Close as Won / Close as Lost).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  GitBranch, Plus, Search, RefreshCw, MapPin, DollarSign,
  User, Calendar, Clock, CheckCircle2, XCircle, ArrowRight,
  TrendingUp, Percent, FileText, ChevronRight, X, Sparkles, Building2, Megaphone
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
  formatPrice, formatDate, formatDateTime,
} from '@/lib/formatters'
import {
  MOCK_PIPELINE_OPPORTUNITIES, MOCK_PROPERTIES, MOCK_PARTIES, MOCK_USERS,
  type PipelineOpportunityRow, type NegotiationRound,
} from '@/lib/mockData'

const PIPELINE_COLUMNS = [
  { id: 'QUALIFIED', label: 'Qualified', color: 'border-slate-300' },
  { id: 'PROPERTY_SHARED', label: 'Property Shared', color: 'border-blue-300' },
  { id: 'SITE_VISIT', label: 'Site Visit', color: 'border-indigo-300' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'border-amber-300' },
  { id: 'DOCUMENTATION', label: 'Documentation', color: 'border-purple-300' },
  { id: 'WON', label: 'Won', color: 'border-emerald-500' },
  { id: 'LOST', label: 'Lost', color: 'border-rose-400' },
] as const

const LOST_REASONS = [
  'Price Issue',
  'Property Issue',
  'Customer Decision',
  'Timing',
  'Other',
] as const

// ── Distinct ShortLoc Badge ───────────────────────────────────────────────────

function ShortLocBadge({ code }: { code: string }) {
  return (
    <span
      title={code}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200 max-w-full overflow-hidden"
    >
      <MapPin size={11} className="text-indigo-600 shrink-0" />
      <span className="truncate">{code}</span>
    </span>
  )
}

export default function OpportunitiesPage() {
  const boardRef = useRef<HTMLDivElement>(null)
  const [opportunities, setOpportunities] = useState<PipelineOpportunityRow[]>([
    ...MOCK_PIPELINE_OPPORTUNITIES,
  ])
  const [selectedOpp, setSelectedOpp] = useState<PipelineOpportunityRow | null>(null)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)

  // Auto-scroll board if requested (e.g. ?scroll=end)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('scroll=end')) {
      const timer = setTimeout(() => {
        if (boardRef.current) {
          boardRef.current.scrollLeft = 850
        }
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [])

  // Deal Closure Forms inside right panel
  const [closingMode, setClosingMode] = useState<'none' | 'won' | 'lost'>('none')
  const [txnValue, setTxnValue] = useState<string>('')
  const [txnStaffId, setTxnStaffId] = useState<string>('u3')
  const [txnCommPct, setTxnCommPct] = useState<string>('2.0')
  const [txnPaymentStatus, setTxnPaymentStatus] = useState<string>('Paid')
  const [lostReasonInput, setLostReasonInput] = useState<PipelineOpportunityRow['lost_reason']>('Price Issue')
  const [lostRemarksInput, setLostRemarksInput] = useState<string>('')

  // Create Form State
  const [formPropertyId, setFormPropertyId] = useState('P-1003')
  const [formClientId, setFormClientId] = useState('p3')
  const [formAgentId, setFormAgentId] = useState('u3')
  const [formExpectedValue, setFormExpectedValue] = useState('5000000')
  const [formProbability, setFormProbability] = useState('20')
  const [formStage, setFormStage] = useState<PipelineOpportunityRow['stage']>('QUALIFIED')

  // Filter Bar
  const [searchQuery, setSearchQuery] = useState('')

  // ── Filtered Opportunities ──────────────────────────────────────────────────

  const filteredOpps = useMemo(() => {
    if (!searchQuery.trim()) return opportunities
    const q = searchQuery.toLowerCase()
    return opportunities.filter(
      (opp) =>
        opp.id.toLowerCase().includes(q) ||
        opp.client_name.toLowerCase().includes(q) ||
        opp.property_short_loc.toLowerCase().includes(q) ||
        opp.agent_name.toLowerCase().includes(q)
    )
  }, [opportunities, searchQuery])

  // ── Deal Closure Actions ────────────────────────────────────────────────────

  const handleCloseAsWon = () => {
    if (!selectedOpp) return
    const updated: PipelineOpportunityRow = {
      ...selectedOpp,
      stage: 'WON',
      probability: 100,
      closed_at: new Date().toISOString(),
    }
    setOpportunities((prev) => prev.map((o) => (o.id === selectedOpp.id ? updated : o)))
    setSelectedOpp(updated)
    setClosingMode('none')
    alert(`Deal ${selectedOpp.id} marked as WON! Transaction created.`)
  }

  const handleCloseAsLost = () => {
    if (!selectedOpp) return
    const updated: PipelineOpportunityRow = {
      ...selectedOpp,
      stage: 'LOST',
      probability: 0,
      lost_reason: lostReasonInput,
      lost_remarks: lostRemarksInput.trim() || 'Deal closed as lost',
      closed_at: new Date().toISOString(),
    }
    setOpportunities((prev) => prev.map((o) => (o.id === selectedOpp.id ? updated : o)))
    setSelectedOpp(updated)
    setClosingMode('none')
  }

  // ── Create Opportunity ──────────────────────────────────────────────────────

  const handleCreateOpp = (e: React.FormEvent) => {
    e.preventDefault()
    const prop = MOCK_PROPERTIES.find((p) => p.id === formPropertyId)
    const client = MOCK_PARTIES.find((p) => p.id === formClientId)
    const agent = MOCK_USERS.find((u) => u.id === formAgentId)

    const newOpp: PipelineOpportunityRow = {
      id: `OPP-${Date.now().toString().slice(-4)}`,
      property_id: formPropertyId,
      property_short_loc: prop?.short_loc || '01-Schm140_Mayank',
      client_id: formClientId,
      client_name: client?.name || 'Client',
      stage: formStage,
      expected_value: parseFloat(formExpectedValue) || 0,
      probability: parseInt(formProbability) || 20,
      agent_id: formAgentId,
      agent_name: agent?.name || 'Ravi Mehta',
      negotiation_history: [],
      created_at: new Date().toISOString(),
    }

    setOpportunities([newOpp, ...opportunities])
    setShowCreateModal(false)
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1500px] mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
              <GitBranch size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Opportunities Pipeline
              </h1>
              <p className="text-sm text-slate-500">
                Visual Kanban board tracking buyer &amp; tenant negotiation stages to closure
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-64">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                type="text"
                placeholder="Search deals, clients, properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
            >
              <Plus size={16} className="mr-1.5" />
              New Opportunity
            </Button>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* 7-COLUMN KANBAN BOARD                                             */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <div ref={boardRef} className="w-full overflow-x-auto pb-6 pt-1">
          <div className="flex gap-4 items-start min-w-max">
            {PIPELINE_COLUMNS.map((col) => {
              const columnOpps = filteredOpps.filter((o) => o.stage === col.id)
              const columnTotalValue = columnOpps.reduce((sum, o) => sum + o.expected_value, 0)

              return (
                <div
                  key={col.id}
                  className="w-[285px] min-w-[285px] shrink-0 bg-slate-50/80 rounded-xl border border-slate-200/80 p-3 space-y-3"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        {col.label}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold font-mono">
                        ₹{(columnTotalValue / 100000).toFixed(1)}L
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-white border text-slate-700 font-bold text-xs h-5 px-1.5"
                    >
                      {columnOpps.length}
                    </Badge>
                  </div>

                  {/* Cards Container */}
                  <div className="space-y-2.5 min-h-[350px]">
                    {columnOpps.map((opp) => {
                      const isWon = opp.stage === 'WON'
                      const isLost = opp.stage === 'LOST'

                      return (
                        <Card
                          key={opp.id}
                          onClick={() => {
                            setSelectedOpp(opp)
                            setClosingMode('none')
                            setTxnValue(opp.expected_value.toString())
                          }}
                          className={`cursor-pointer transition-all hover:shadow-md border border-slate-200/90 shadow-2xs ${
                            isWon
                              ? 'border-l-4 border-l-emerald-500 bg-emerald-50/20'
                              : isLost
                              ? 'opacity-70 bg-slate-100/60 border-slate-200'
                              : 'bg-white hover:border-indigo-300'
                          }`}
                        >
                          <CardContent className="p-3.5 space-y-2.5">
                            {/* Top row: ID & Agent Avatar with dedicated header row and spacing */}
                            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
                              <span className="font-mono text-[11px] font-bold text-slate-700">
                                {opp.id}
                              </span>
                              <div
                                title={`Assigned: ${opp.agent_name}`}
                                className="w-6 h-6 shrink-0 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center text-[10px] font-bold shadow-2xs"
                              >
                                {opp.agent_name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </div>
                            </div>

                            {/* Property ShortLoc */}
                            <div className="pt-0.5 overflow-hidden">
                              <ShortLocBadge code={opp.property_short_loc} />
                            </div>

                            {/* Client Name */}
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {opp.client_name}
                            </p>

                            {/* Attributed Campaign Tag */}
                            {opp.attributed_campaign_name && (
                              <div className="overflow-hidden">
                                <span
                                  className="inline-flex items-center gap-1 text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded truncate max-w-full font-medium"
                                  title={`Attributed Campaign: ${opp.attributed_campaign_name}`}
                                >
                                  <Megaphone size={9} className="shrink-0 text-indigo-500" />
                                  <span className="truncate">{opp.attributed_campaign_name}</span>
                                </span>
                              </div>
                            )}

                            {/* Expected Value */}
                            <div className="text-xs font-bold text-slate-900">
                              {formatPrice(opp.expected_value)}
                            </div>

                            {/* Probability Bar */}
                            <div className="space-y-1 pt-1 border-t border-slate-100">
                              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                                <span>Probability</span>
                                <span
                                  className={
                                    isWon
                                      ? 'text-emerald-700 font-bold'
                                      : isLost
                                      ? 'text-rose-700'
                                      : 'text-indigo-700'
                                  }
                                >
                                  {opp.probability}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isWon
                                      ? 'bg-emerald-500'
                                      : isLost
                                      ? 'bg-rose-400'
                                      : 'bg-indigo-600'
                                  }`}
                                  style={{ width: `${opp.probability}%` }}
                                />
                              </div>
                            </div>

                            {/* Lost Reason Tag if stage is Lost */}
                            {isLost && opp.lost_reason && (
                              <div className="pt-1">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200/80 text-slate-700 border border-slate-300">
                                  {opp.lost_reason}
                                </span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* RIGHT-SIDE DETAIL PANEL (MODAL / DRAWER)                          */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {selectedOpp && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 overflow-hidden">
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/75">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">
                      {selectedOpp.id} — Deal Summary
                    </h3>
                    <Badge
                      variant="secondary"
                      className={`text-xs font-bold ${
                        selectedOpp.stage === 'WON'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedOpp.stage === 'LOST'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {selectedOpp.stage}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Managed by {selectedOpp.agent_name} • Created {formatDate(selectedOpp.created_at)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedOpp(null)
                    setClosingMode('none')
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {/* Key Overview Cards */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Property</span>
                    <div className="mt-1">
                      <ShortLocBadge code={selectedOpp.property_short_loc} />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Client / Buyer</span>
                    <p className="font-bold text-slate-900 text-sm mt-1">{selectedOpp.client_name}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Expected Deal Value</span>
                    <p className="font-bold text-slate-900 text-base mt-0.5">
                      {formatPrice(selectedOpp.expected_value)}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Win Probability</span>
                    <p className="font-bold text-indigo-700 text-base mt-0.5">
                      {selectedOpp.probability}%
                    </p>
                  </div>
                </div>

                {/* Lost Reason Banner if already lost */}
                {selectedOpp.stage === 'LOST' && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs space-y-1">
                    <div className="font-bold text-rose-800 flex items-center gap-1.5">
                      <XCircle size={14} />
                      Lost Deal: {selectedOpp.lost_reason}
                    </div>
                    {selectedOpp.lost_remarks && (
                      <p className="text-rose-700 text-[11px]">{selectedOpp.lost_remarks}</p>
                    )}
                  </div>
                )}

                {/* ───────────────────────────────────────────────────────── */}
                {/* MARKETING ATTRIBUTION & TRACEABILITY (READ-ONLY)         */}
                {/* ───────────────────────────────────────────────────────── */}
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                      <Megaphone size={13} className="text-indigo-600" />
                      Marketing Attribution
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium bg-white px-2 py-0.5 rounded border border-slate-200">
                      Inherited from Lead (Read-only)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Originating Lead</span>
                      {selectedOpp.originating_lead_id ? (
                        <Link
                          href={`/leads?search=${selectedOpp.originating_lead_id}`}
                          className="font-semibold text-indigo-600 hover:underline font-mono text-xs inline-flex items-center gap-0.5"
                          title="View originating lead"
                        >
                          {selectedOpp.originating_lead_id}
                          <ArrowRight size={10} />
                        </Link>
                      ) : (
                        <span className="text-slate-600 font-medium">Direct / Walk-in</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Attributed Campaign</span>
                      <span
                        className="font-semibold text-indigo-700 truncate block"
                        title={selectedOpp.attributed_campaign_name || 'None'}
                      >
                        {selectedOpp.attributed_campaign_name || 'Organic (Unlinked)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Source &amp; Channel</span>
                      <span className="font-medium text-slate-700">
                        {selectedOpp.attributed_channel_type ? `${selectedOpp.attributed_channel_type} — ` : ''}
                        {selectedOpp.attributed_source || 'Direct Outreach'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Marketing Executive</span>
                      <span className="font-medium text-slate-700">
                        {selectedOpp.marketing_executive_name || 'Neha Kapoor'}
                      </span>
                    </div>
                  </div>

                  {(selectedOpp.first_touch_source || selectedOpp.latest_touch_source) && (
                    <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-400 block">First-Touch Source:</span>
                        <span className="text-slate-600 truncate block" title={selectedOpp.first_touch_source || ''}>
                          {selectedOpp.first_touch_source || selectedOpp.attributed_source || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Latest-Touch Source:</span>
                        <span className="text-slate-600 truncate block" title={selectedOpp.latest_touch_source || ''}>
                          {selectedOpp.latest_touch_source || selectedOpp.attributed_source || '—'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ───────────────────────────────────────────────────────── */}
                {/* NEGOTIATION HISTORY ROUNDS                                */}
                {/* ───────────────────────────────────────────────────────── */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp size={14} className="text-indigo-600" />
                    Negotiation Rounds &amp; Price History
                  </h4>

                  {selectedOpp.negotiation_history.length === 0 ? (
                    <div className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                      No formal counter-offer rounds recorded yet for this deal.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedOpp.negotiation_history.map((round) => (
                        <div
                          key={round.round}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between font-semibold text-slate-800">
                            <span>Round {round.round}</span>
                            <span className="text-slate-400 text-[11px]">{round.date}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 py-1.5 border-y border-slate-200/60 font-mono text-[11px]">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-sans">Asking</span>
                              <span className="font-semibold text-slate-800">
                                {formatPrice(round.asking_price)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-sans">Buyer Offer</span>
                              <span className="font-semibold text-blue-700">
                                {formatPrice(round.offer_price)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-sans">Counter/Revised</span>
                              <span className="font-semibold text-emerald-700">
                                {formatPrice(round.revised_offer)}
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-600 italic">
                            &ldquo;{round.remarks}&rdquo;
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ───────────────────────────────────────────────────────── */}
                {/* DEAL CLOSURE SECTIONS (NEAR CLOSURE ACTIONS)               */}
                {/* ───────────────────────────────────────────────────────── */}
                {selectedOpp.stage !== 'WON' && selectedOpp.stage !== 'LOST' && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Deal Closure Actions
                    </h4>

                    {closingMode === 'none' && (
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => setClosingMode('won')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 text-xs shadow-xs"
                        >
                          <CheckCircle2 size={15} className="mr-1.5" />
                          Close as Won
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setClosingMode('lost')}
                          className="border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold h-10 text-xs"
                        >
                          <XCircle size={15} className="mr-1.5" />
                          Close as Lost
                        </Button>
                      </div>
                    )}

                    {/* CLOSE AS WON FORM */}
                    {closingMode === 'won' && (
                      <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-4 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            Finalize Transaction &amp; Brokerage
                          </h5>
                          <button
                            type="button"
                            onClick={() => setClosingMode('none')}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-700">
                              Transaction Value (₹)
                            </Label>
                            <Input
                              type="number"
                              value={txnValue}
                              onChange={(e) => setTxnValue(e.target.value)}
                              className="h-8 text-xs bg-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-700">
                              Commission %
                            </Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={txnCommPct}
                              onChange={(e) => setTxnCommPct(e.target.value)}
                              className="h-8 text-xs bg-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-700">
                              Consultant / Closer
                            </Label>
                            <Select
                              value={txnStaffId}
                              onChange={(e) => setTxnStaffId(e.target.value)}
                              className="h-8 text-xs bg-white"
                            >
                              {MOCK_USERS.filter((u) => u.role !== 'CLIENT').map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name} ({u.role})
                                </option>
                              ))}
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-700">
                              Payment Status
                            </Label>
                            <Select
                              value={txnPaymentStatus}
                              onChange={(e) => setTxnPaymentStatus(e.target.value)}
                              className="h-8 text-xs bg-white"
                            >
                              <option value="Paid">Paid (Immediate)</option>
                              <option value="Partial">Partial</option>
                              <option value="Pending">Pending</option>
                            </Select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setClosingMode('none')}
                            className="h-8 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleCloseAsWon}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs"
                          >
                            Confirm Deal Won ✓
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* CLOSE AS LOST FORM */}
                    {closingMode === 'lost' && (
                      <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-4 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-rose-950 text-xs flex items-center gap-1.5">
                            <XCircle size={14} className="text-rose-600" />
                            Record Lost Deal Reason
                          </h5>
                          <button
                            type="button"
                            onClick={() => setClosingMode('none')}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className="space-y-2 text-xs">
                          <Label className="text-[11px] font-semibold text-slate-700">
                            Lost Reason
                          </Label>
                          <Select
                            value={lostReasonInput || 'Price Issue'}
                            onChange={(e) =>
                              setLostReasonInput(
                                e.target.value as PipelineOpportunityRow['lost_reason']
                              )
                            }
                            className="h-8 text-xs bg-white"
                          >
                            {LOST_REASONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </Select>
                        </div>

                        <div className="space-y-1 text-xs">
                          <Label className="text-[11px] font-semibold text-slate-700">
                            Closure Remarks / Feedback
                          </Label>
                          <Textarea
                            value={lostRemarksInput}
                            onChange={(e) => setLostRemarksInput(e.target.value)}
                            placeholder="Why did the client or owner drop out?"
                            rows={2}
                            className="text-xs bg-white"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setClosingMode('none')}
                            className="h-8 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleCloseAsLost}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-8 text-xs"
                          >
                            Mark Deal Lost
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedOpp(null)
                    setClosingMode('none')
                  }}
                >
                  Close Panel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* NEW OPPORTUNITY MODAL                                             */}
        {/* ================================================================= */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                    <GitBranch size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">New Deal Opportunity</h3>
                    <p className="text-xs text-slate-500">Initiate tracking in the pipeline</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateOpp} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="opp_property" className="text-xs font-semibold text-slate-700">
                    Target Property
                  </Label>
                  <Select
                    id="opp_property"
                    value={formPropertyId}
                    onChange={(e) => setFormPropertyId(e.target.value)}
                    required
                    className="h-10 text-xs font-mono"
                  >
                    {MOCK_PROPERTIES.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.id}] {p.short_loc} — {p.category}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="opp_client" className="text-xs font-semibold text-slate-700">
                    Client / Buyer
                  </Label>
                  <Select
                    id="opp_client"
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    required
                    className="h-10 text-xs"
                  >
                    {MOCK_PARTIES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.mobile})
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="opp_value" className="text-xs font-semibold text-slate-700">
                      Expected Value (₹)
                    </Label>
                    <Input
                      id="opp_value"
                      type="number"
                      value={formExpectedValue}
                      onChange={(e) => setFormExpectedValue(e.target.value)}
                      required
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="opp_prob" className="text-xs font-semibold text-slate-700">
                      Probability (%)
                    </Label>
                    <Input
                      id="opp_prob"
                      type="number"
                      min="0"
                      max="100"
                      value={formProbability}
                      onChange={(e) => setFormProbability(e.target.value)}
                      required
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="opp_agent" className="text-xs font-semibold text-slate-700">
                      Responsible Agent
                    </Label>
                    <Select
                      id="opp_agent"
                      value={formAgentId}
                      onChange={(e) => setFormAgentId(e.target.value)}
                      className="h-10 text-xs"
                    >
                      {MOCK_USERS.filter((u) => u.role !== 'CLIENT').map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="opp_stage" className="text-xs font-semibold text-slate-700">
                      Initial Stage
                    </Label>
                    <Select
                      id="opp_stage"
                      value={formStage}
                      onChange={(e) =>
                        setFormStage(e.target.value as PipelineOpportunityRow['stage'])
                      }
                      className="h-10 text-xs"
                    >
                      {PIPELINE_COLUMNS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                  >
                    Create Deal
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

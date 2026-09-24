'use client'

/**
 * Marketing Traceability & Attribution Module — Marketing Sub-module
 *
 * Provides end-to-end auditability and visibility connecting marketing origin:
 * Marketing Campaign / Source → Lead → Pipeline Opportunity → Closed Deal (Transaction).
 *
 * Features:
 * - Dynamic end-to-end join via getMarketingTraceableChains()
 * - Visual full-funnel conversion summary (Leads → Qualified → Opportunities → Won Deals)
 * - Complete drop-off transparency (Leads not yet Opportunities, Opps not yet Deals)
 * - Interactive filter bar (Campaign, Channel/Source, Lifecycle Stage, and Search)
 * - Traceability detail drawer showing audit trail and first-touch vs latest-touch heritage
 * - URL query parameter pre-filtering support (?campaign=...)
 *
 * Role: SUPER_ADMIN, OFFICE_EXECUTIVE
 */

import React, { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  GitFork, Search, Filter, Megaphone, Users, CheckCircle2,
  TrendingUp, Receipt, DollarSign, ArrowRight, ExternalLink,
  Building2, MapPin, Eye, X, ArrowUpRight, RotateCcw,
  Sparkles, Check, ChevronRight, Layers, Tag, UserCheck, AlertCircle
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { formatPrice, formatDate } from '@/lib/formatters'
import {
  getMarketingTraceableChains,
  MOCK_CAMPAIGNS,
  type TraceableChainRow,
} from '@/lib/mockData'

// ── Lifecycle Stage Badge ───────────────────────────────────────────────────

function DealStatusBadge({ status }: { status: TraceableChainRow['deal_status'] }) {
  switch (status) {
    case 'Won':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 size={12} className="text-emerald-600" />
          Won Deal
        </span>
      )
    case 'Lost':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
          <AlertCircle size={12} className="text-rose-500" />
          Lost
        </span>
      )
    case 'In Progress':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          <TrendingUp size={12} className="text-amber-600" />
          In Pipeline
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
          Lead Only
        </span>
      )
  }
}

function OpportunityStageBadge({ stage }: { stage?: string | null }) {
  if (!stage || stage === 'Not yet an Opportunity') {
    return (
      <span className="text-slate-400 italic text-xs">
        Not an opportunity
      </span>
    )
  }

  const stageColors: Record<string, string> = {
    NEW: 'bg-blue-50 text-blue-700 border-blue-200',
    SITE_VISIT_SCHEDULED: 'bg-purple-50 text-purple-700 border-purple-200',
    COMMERCIAL_OFFER: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    NEGOTIATION: 'bg-amber-50 text-amber-800 border-amber-200',
    UNDER_CONTRACT: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    WON: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    LOST: 'bg-rose-50 text-rose-700 border-rose-200',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
        stageColors[stage] || 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {stage.replace(/_/g, ' ')}
    </span>
  )
}

// ── Inner Page Content (wrapped in Suspense for useSearchParams) ─────────────

function TraceabilityContent() {
  const searchParams = useSearchParams()
  const initialCampaignParam = searchParams.get('campaign') || 'ALL'

  // Filter States
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string>(initialCampaignParam)
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('ALL')
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedChain, setSelectedChain] = useState<TraceableChainRow | null>(null)

  // Full dataset computed dynamically from mock models
  const allChains = useMemo(() => getMarketingTraceableChains(), [])

  // Filtered dataset
  const filteredChains = useMemo(() => {
    return allChains.filter((chain) => {
      // Campaign filter
      if (selectedCampaignFilter !== 'ALL') {
        if (selectedCampaignFilter === 'UNLINKED') {
          if (chain.campaign_id) return false
        } else {
          if (chain.campaign_id !== selectedCampaignFilter) return false
        }
      }

      // Source/Channel filter
      if (selectedSourceFilter !== 'ALL') {
        if (selectedSourceFilter === 'DIGITAL' && chain.channel_type !== 'Digital') return false
        if (selectedSourceFilter === 'OFFLINE' && chain.channel_type !== 'Offline') return false
        if (
          selectedSourceFilter !== 'DIGITAL' &&
          selectedSourceFilter !== 'OFFLINE' &&
          !chain.lead_source.toLowerCase().includes(selectedSourceFilter.toLowerCase())
        ) {
          return false
        }
      }

      // Stage / Status filter
      if (selectedStageFilter !== 'ALL') {
        if (selectedStageFilter === 'WON' && chain.deal_status !== 'Won') return false
        if (selectedStageFilter === 'PIPELINE' && (chain.deal_status !== 'In Progress' && !chain.opportunity_id)) return false
        if (selectedStageFilter === 'DROPPED' && (chain.lead_status !== 'LOST' && chain.deal_status !== 'Lost')) return false
        if (selectedStageFilter === 'LEAD_ONLY' && chain.opportunity_id !== null) return false
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = chain.lead_name.toLowerCase().includes(q)
        const matchLeadId = chain.lead_id.toLowerCase().includes(q)
        const matchOppId = chain.opportunity_id?.toLowerCase().includes(q) || false
        const matchCampaign = chain.campaign_name?.toLowerCase().includes(q) || false
        const matchSource = chain.lead_source.toLowerCase().includes(q)
        const matchOwner = chain.marketing_executive?.toLowerCase().includes(q) || false
        if (!matchName && !matchLeadId && !matchOppId && !matchCampaign && !matchSource && !matchOwner) {
          return false
        }
      }

      return true
    })
  }, [allChains, selectedCampaignFilter, selectedSourceFilter, selectedStageFilter, searchQuery])

  // Aggregate Funnel Metrics
  const metrics = useMemo(() => {
    const totalLeads = allChains.length
    const qualifiedLeads = allChains.filter(
      (c) => c.lead_status === 'QUALIFIED' || c.opportunity_id !== null
    ).length
    const pipelineOpps = allChains.filter((c) => c.opportunity_id !== null).length
    const wonDeals = allChains.filter((c) => c.deal_status === 'Won')
    const wonDealsCount = wonDeals.length
    const totalDealValue = wonDeals.reduce((sum, c) => sum + (c.deal_value || 0), 0)
    const totalCommission = wonDeals.reduce((sum, c) => sum + (c.commission_amount || 0), 0)

    const leadToQualRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0
    const qualToOppRate = qualifiedLeads > 0 ? Math.round((pipelineOpps / qualifiedLeads) * 100) : 0
    const oppToWonRate = pipelineOpps > 0 ? Math.round((wonDealsCount / pipelineOpps) * 100) : 0
    const overallConversion = totalLeads > 0 ? Math.round((wonDealsCount / totalLeads) * 100) : 0

    return {
      totalLeads,
      qualifiedLeads,
      pipelineOpps,
      wonDealsCount,
      totalDealValue,
      totalCommission,
      leadToQualRate,
      qualToOppRate,
      oppToWonRate,
      overallConversion,
    }
  }, [allChains])

  const resetFilters = () => {
    setSelectedCampaignFilter('ALL')
    setSelectedSourceFilter('ALL')
    setSelectedStageFilter('ALL')
    setSearchQuery('')
  }

  const columns: ColumnDef<TraceableChainRow>[] = [
    {
      key: 'lead',
      header: 'Lead / Prospect',
      sortValue: (row: TraceableChainRow) => row.lead_name,
      render: (row: TraceableChainRow) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900">{row.lead_name}</span>
            <Link
              href={`/leads?search=${row.lead_id}`}
              className="text-[11px] font-mono text-indigo-600 hover:underline inline-flex items-center gap-0.5"
              title="Open lead details"
            >
              {row.lead_id}
              <ArrowUpRight size={10} />
            </Link>
          </div>
          <span className="text-[11px] text-slate-400 block">
            Captured {formatDate(row.lead_created_at)}
          </span>
        </div>
      ),
    },
    {
      key: 'origin',
      header: 'Attributed Origin',
      sortValue: (row: TraceableChainRow) => row.campaign_name || row.lead_source,
      render: (row: TraceableChainRow) => (
        <div className="space-y-1">
          {row.campaign_id ? (
            <Link
              href={`/campaigns?search=${row.campaign_id}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              <Megaphone size={10} className="text-indigo-600" />
              <span className="truncate max-w-[130px]">{row.campaign_name || row.campaign_id}</span>
            </Link>
          ) : (
            <span className="text-slate-400 text-xs italic">Organic (Direct)</span>
          )}
          <div className="flex items-center gap-1 text-[11px]">
            {row.channel_type && (
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                  row.channel_type === 'Digital'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {row.channel_type}
              </span>
            )}
            <span className="text-slate-600 truncate max-w-[140px]" title={row.lead_source}>
              {row.lead_source}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'lead_status',
      header: 'Lead Status',
      sortValue: (row: TraceableChainRow) => row.lead_status,
      render: (row: TraceableChainRow) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
            row.lead_status === 'QUALIFIED'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : row.lead_status === 'CONTACTED'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : row.lead_status === 'LOST'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          {row.lead_status}
        </span>
      ),
    },
    {
      key: 'opportunity',
      header: 'Pipeline Opportunity',
      sortValue: (row: TraceableChainRow) => row.opportunity_stage,
      render: (row: TraceableChainRow) => (
        <div>
          {row.opportunity_id ? (
            <div>
              <div className="flex items-center gap-1.5">
                <Link
                  href="/opportunities"
                  className="font-mono text-xs font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  {row.opportunity_id}
                  <ExternalLink size={10} />
                </Link>
              </div>
              <div className="mt-0.5">
                <OpportunityStageBadge stage={row.opportunity_stage} />
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">Drop-off (No opp)</span>
          )}
        </div>
      ),
    },
    {
      key: 'deal_status',
      header: 'Deal Outcome',
      sortValue: (row: TraceableChainRow) => row.deal_status,
      render: (row: TraceableChainRow) => (
        <div>
          <DealStatusBadge status={row.deal_status} />
          {row.closed_date && (
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Closed {formatDate(row.closed_date)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'financials',
      header: 'Deal Value / Comm.',
      sortValue: (row: TraceableChainRow) => row.deal_value || row.opportunity_expected_value || 0,
      render: (row: TraceableChainRow) => (
        <div>
          {row.deal_value ? (
            <div>
              <span className="font-bold text-slate-900 block text-xs">
                {formatPrice(row.deal_value)}
              </span>
              {row.commission_amount ? (
                <span className="text-[11px] font-semibold text-emerald-700 block">
                  + {formatPrice(row.commission_amount)} comm.
                </span>
              ) : null}
            </div>
          ) : row.opportunity_expected_value ? (
            <span className="text-xs text-slate-500 font-medium">
              Exp: {formatPrice(row.opportunity_expected_value)}
            </span>
          ) : (
            <span className="text-xs text-slate-300">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'executive',
      header: 'Marketing Owner',
      sortValue: (row: TraceableChainRow) => row.marketing_executive || '',
      render: (row: TraceableChainRow) => (
        <span className="text-xs font-medium text-slate-700">
          {row.marketing_executive || 'Neha Kapoor'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      render: (row: TraceableChainRow) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedChain(row)}
          className="text-xs h-7 px-2.5 border-slate-200 hover:bg-slate-100 text-slate-700"
        >
          <Eye size={12} className="mr-1" />
          Trace
        </Button>
      ),
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                <GitFork size={20} />
              </span>
              <h1 className="text-2xl font-bold text-slate-900">
                Marketing Traceability &amp; Attribution
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              End-to-end full funnel traceability linking marketing campaigns and channel sources
              through lead progression, pipeline opportunities, to closed transactions and earned commissions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/campaigns">
              <Button variant="outline" size="sm" className="text-xs border-slate-300">
                <Megaphone size={14} className="mr-1.5 text-indigo-600" />
                Campaigns
              </Button>
            </Link>
            <Link href="/lead-sources">
              <Button variant="outline" size="sm" className="text-xs border-slate-300">
                <Layers size={14} className="mr-1.5 text-sky-600" />
                Lead Sources
              </Button>
            </Link>
          </div>
        </div>

        {/* ── KPI Summary Cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Captured Leads */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Attributed Leads
                </span>
                <span className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                  <Users size={16} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{metrics.totalLeads}</span>
                <span className="text-xs text-slate-400">Total volume</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                100% tracked with source origin
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Qualified Leads */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Qualified Leads
                </span>
                <span className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                  <CheckCircle2 size={16} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-600">{metrics.qualifiedLeads}</span>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  {metrics.leadToQualRate}% Conv.
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Validated prospect requirements
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Pipeline Opportunities */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Opportunities Created
                </span>
                <span className="p-1.5 rounded-md bg-amber-50 text-amber-600">
                  <TrendingUp size={16} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600">{metrics.pipelineOpps}</span>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                  {metrics.qualToOppRate}% Conv.
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Active negotiations &amp; visits
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Deals Won & Revenue */}
          <Card className="border border-emerald-200 bg-emerald-50/30 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  Closed Deals Won
                </span>
                <span className="p-1.5 rounded-md bg-emerald-100 text-emerald-700">
                  <Receipt size={16} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-700">{metrics.wonDealsCount}</span>
                <span className="text-xs font-bold text-emerald-800">
                  {formatPrice(metrics.totalDealValue)}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                Comm. Earned: {formatPrice(metrics.totalCommission)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Visual Conversion Funnel Flow ─────────────────────────────────── */}
        <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} />
                Funnel Conversion Architecture
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                End-to-End Marketing Pipeline Conversion Velocity
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                End-to-End Conversion Rate:
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                {metrics.overallConversion}% Lead-to-Deal
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            {/* Step 1 */}
            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/80">
              <div className="text-[10px] text-slate-400 font-bold uppercase">1. Marketing Lead</div>
              <div className="text-xl font-bold text-white mt-1">{metrics.totalLeads}</div>
              <div className="text-[11px] text-slate-300 mt-1">Captured via Ads &amp; Outbound</div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/80">
              <div className="text-[10px] text-slate-400 font-bold uppercase">2. Qualified Prospect</div>
              <div className="text-xl font-bold text-blue-400 mt-1">{metrics.qualifiedLeads}</div>
              <div className="text-[11px] text-blue-300 mt-1">{metrics.leadToQualRate}% progressed</div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/80">
              <div className="text-[10px] text-slate-400 font-bold uppercase">3. Opportunity in Deal Stage</div>
              <div className="text-xl font-bold text-amber-400 mt-1">{metrics.pipelineOpps}</div>
              <div className="text-[11px] text-amber-300 mt-1">{metrics.qualToOppRate}% qualified into opps</div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/80">
              <div className="text-[10px] text-slate-400 font-bold uppercase">4. Deal Closed Won</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{metrics.wonDealsCount}</div>
              <div className="text-[11px] text-emerald-300 mt-1">
                {metrics.oppToWonRate}% deal close rate
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter Bar ───────────────────────────────────────────────────── */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Search lead, ID, opp, owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            {/* Filter by Campaign */}
            <div>
              <Select
                value={selectedCampaignFilter}
                onChange={(e) => setSelectedCampaignFilter(e.target.value)}
                className="text-xs h-9"
              >
                <option value="ALL">All Campaigns</option>
                {MOCK_CAMPAIGNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
                <option value="UNLINKED">Organic / Unlinked Leads</option>
              </Select>
            </div>

            {/* Filter by Channel / Source */}
            <div>
              <Select
                value={selectedSourceFilter}
                onChange={(e) => setSelectedSourceFilter(e.target.value)}
                className="text-xs h-9"
              >
                <option value="ALL">All Sources &amp; Channels</option>
                <option value="DIGITAL">Digital Channels</option>
                <option value="OFFLINE">Offline Channels</option>
                <option value="Website">Website</option>
                <option value="Meta">Meta / Social Ads</option>
                <option value="Google">Google / Search Ads</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Hoarding">Hoardings / Outdoor</option>
                <option value="Telemarketing">Telemarketing</option>
                <option value="Referral">Referral Drive</option>
              </Select>
            </div>

            {/* Filter by Lifecycle Stage */}
            <div>
              <Select
                value={selectedStageFilter}
                onChange={(e) => setSelectedStageFilter(e.target.value)}
                className="text-xs h-9"
              >
                <option value="ALL">All Lifecycle Stages</option>
                <option value="WON">Closed Won Deals</option>
                <option value="PIPELINE">Active Pipeline Opps</option>
                <option value="LEAD_ONLY">Lead Stage Only (No Opp)</option>
                <option value="DROPPED">Dropped / Lost Records</option>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Showing <strong className="text-slate-800">{filteredChains.length}</strong> traceable records
            </span>
            {(selectedCampaignFilter !== 'ALL' ||
              selectedSourceFilter !== 'ALL' ||
              selectedStageFilter !== 'ALL' ||
              searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs h-7 text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <RotateCcw size={11} /> Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* ── Traceability Table ───────────────────────────────────────────── */}
        <DataTable<TraceableChainRow>
          data={filteredChains}
          columns={columns}
          rowKey={(row) => row.id}
          totalCount={allChains.length}
        />

        {/* ── Detail Inspection Drawer / Modal ─────────────────────────────── */}
        {selectedChain && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
                      {selectedChain.lead_id}
                    </span>
                    <DealStatusBadge status={selectedChain.deal_status} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    Traceability Audit: {selectedChain.lead_name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedChain(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 overflow-y-auto">
                {/* 4-Stage Lifecycle Progression Trail */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                    Audit Trail &amp; Lifecycle Progression
                  </h4>
                  <div className="space-y-3">
                    {/* Stage 1: Lead Capture */}
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
                        <Users size={14} />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between font-semibold text-slate-900">
                          <span>Stage 1: Lead Ingestion &amp; Marketing Attribution</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {formatDate(selectedChain.lead_created_at)}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">
                          Source: <strong className="text-slate-800">{selectedChain.lead_source}</strong>
                        </p>
                        <p className="text-slate-600">
                          Campaign:{' '}
                          <strong className="text-indigo-700">
                            {selectedChain.campaign_name || selectedChain.campaign_id || 'Organic Direct'}
                          </strong>
                        </p>
                      </div>
                    </div>

                    {/* Stage 2: Qualification */}
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                        <CheckCircle2 size={14} />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between font-semibold text-slate-900">
                          <span>Stage 2: Lead Qualification</span>
                          <span className="text-[10px] px-2 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">
                            {selectedChain.lead_status}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">
                          Executive in charge:{' '}
                          <strong className="text-slate-800">{selectedChain.marketing_executive}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Stage 3: Opportunity Conversion */}
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                        <TrendingUp size={14} />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between font-semibold text-slate-900">
                          <span>Stage 3: Pipeline Opportunity</span>
                          {selectedChain.opportunity_id ? (
                            <Link
                              href="/opportunities"
                              className="font-mono text-xs font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                              {selectedChain.opportunity_id}
                              <ExternalLink size={10} />
                            </Link>
                          ) : (
                            <span className="text-slate-400 italic">Not converted</span>
                          )}
                        </div>
                        {selectedChain.opportunity_id ? (
                          <div className="mt-1 space-y-0.5 text-slate-600">
                            <p>
                              Stage: <strong className="text-slate-800">{selectedChain.opportunity_stage}</strong>
                            </p>
                            {selectedChain.opportunity_expected_value && (
                              <p>
                                Deal Volume:{' '}
                                <strong className="text-slate-800">
                                  {formatPrice(selectedChain.opportunity_expected_value)}
                                </strong>
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-slate-500 italic mt-1">
                            Lead did not reach the formal opportunity pipeline yet.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stage 4: Deal Closure & Transaction */}
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                        <Receipt size={14} />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between font-semibold text-slate-900">
                          <span>Stage 4: Closed Transaction &amp; Revenue</span>
                          {selectedChain.deal_id ? (
                            <Link
                              href="/transactions"
                              className="font-mono text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-0.5"
                            >
                              {selectedChain.deal_id}
                              <ExternalLink size={10} />
                            </Link>
                          ) : (
                            <span className="text-slate-400 italic">No closed transaction</span>
                          )}
                        </div>
                        {selectedChain.deal_status === 'Won' ? (
                          <div className="mt-1 space-y-0.5 text-slate-600">
                            <p>
                              Final Closed Value:{' '}
                              <strong className="text-slate-900">
                                {formatPrice(selectedChain.deal_value || 0)}
                              </strong>
                            </p>
                            <p>
                              Earned Agency Commission:{' '}
                              <strong className="text-emerald-700">
                                {formatPrice(selectedChain.commission_amount || 0)}
                              </strong>
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Closed on: {formatDate(selectedChain.closed_date || '')}
                            </p>
                          </div>
                        ) : (
                          <p className="text-slate-500 italic mt-1">
                            {selectedChain.deal_status === 'Lost'
                              ? 'Deal was dropped or lost during negotiation.'
                              : 'Deal is either still in pipeline or not yet initiated.'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Touchpoint Source Integrity */}
                <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50 text-xs space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                    Touchpoint Source Integrity
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block">First-Touch Source</span>
                      <span className="font-medium text-slate-900">
                        {selectedChain.first_touch_source || selectedChain.lead_source}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Latest-Touch Source</span>
                      <span className="font-medium text-slate-900">
                        {selectedChain.latest_touch_source || selectedChain.lead_source}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSelectedChain(null)}
                  className="bg-slate-900 text-white text-xs"
                >
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

export default function MarketingTraceabilityPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
          Loading Marketing Traceability Matrix...
        </div>
      }
    >
      <TraceabilityContent />
    </Suspense>
  )
}

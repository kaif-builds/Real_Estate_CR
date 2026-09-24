'use client'

/**
 * Campaign Analytics Sub-Module — Marketing Deep-Dive
 *
 * Surfaces end-to-end attribution, performance, and ROI metrics across all marketing activities.
 * All metrics are computed dynamically from existing mock data records with zero hardcoded values.
 *
 * 7 Core Analytics Sections:
 * 1. Campaign Performance Table (DataTable with Type/Status/Date filters, Leads, Opps, Deals, CPL, CPQL)
 * 2. Source & Channel Comparison (Digital vs Offline, conversion rates, sorted desc by leads)
 * 3. Promoted Property Performance (Inventory IDs, ShortLoc, Campaigns, Enquiries, Deals)
 * 4. Location & Category Breakdown (Residential/Commercial/Plot and ShortLoc micro-markets)
 * 5. Telemarketing Performance (Contacts, Attempts, Connected, Interested, Converted, Conversion Rate)
 * 6. Referral Partner Performance (Consolidated directory performance via getAllPartnersPerformance)
 * 7. Marketing ROI Analysis (Spend vs Revenue/Commission, Net Profit, ROI %, "Insufficient data" handling)
 *
 * Role: SUPER_ADMIN, OFFICE_EXECUTIVE
 */

import React, { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  BarChart3, TrendingUp, DollarSign, Filter, Search, Calendar,
  ArrowRight, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle,
  Building2, MapPin, Users, PhoneCall, Handshake, GitFork,
  ArrowUpRight, ArrowDownRight, Layers, Tag, HelpCircle,
  TrendingDown, RefreshCw, Download, ChevronRight, Check
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
  MOCK_CAMPAIGNS,
  getAllPartnersPerformance,
  getCampaignPerformanceMetrics,
  getSourceChannelMetrics,
  getPromotedPropertyMetrics,
  getLocationAndCategoryMetrics,
  getTelemarketingMetrics,
  type CampaignType,
  type CampaignStatus,
  type CampaignPerformanceMetric,
  type SourceChannelMetric,
  type PromotedPropertyMetric,
  type CategoryMetric,
  type LocationMetric,
  type TelemarketingPerformanceMetric,
  type PartnerPerformanceStats,
} from '@/lib/mockData'

const ALL_CAMPAIGN_TYPES: CampaignType[] = [
  'Property Promotion',
  'Buyer Acquisition',
  'Seller Acquisition',
  'Tenant Acquisition',
  'Landlord Acquisition',
  'Investor Acquisition',
  'Brand Awareness',
  'Lead Generation',
]

const ALL_CAMPAIGN_STATUSES: CampaignStatus[] = [
  'Draft',
  'Planned',
  'Active',
  'Paused',
  'Completed',
  'Cancelled',
]

// ── Status Badge ─────────────────────────────────────────────────────────────

function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  switch (status) {
    case 'Active':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      )
    case 'Planned':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          Planned
        </span>
      )
    case 'Paused':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          Paused
        </span>
      )
    case 'Completed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
          Completed
        </span>
      )
    case 'Draft':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          Draft
        </span>
      )
    case 'Cancelled':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
          Cancelled
        </span>
      )
  }
}

// ── Main Content Component ───────────────────────────────────────────────────

function CampaignAnalyticsContent() {
  const searchParams = useSearchParams()
  const initialSection = searchParams.get('section') || 'all'

  // Section navigation state
  const [activeSection, setActiveSection] = useState<string>(initialSection)

  // Section 1: Filters for Campaign Performance Table
  const [fType, setFType] = useState<string>('')
  const [fStatus, setFStatus] = useState<string>('')
  const [fSearch, setFSearch] = useState<string>('')
  const [fDateRange, setFDateRange] = useState<string>('all')

  // Live computed metrics from mock data
  const campaignMetrics = useMemo(() => getCampaignPerformanceMetrics(), [])
  const sourceMetrics = useMemo(() => getSourceChannelMetrics(), [])
  const propertyMetrics = useMemo(() => getPromotedPropertyMetrics(), [])
  const { categories, locations } = useMemo(() => getLocationAndCategoryMetrics(), [])
  const telemarketingMetrics = useMemo(() => getTelemarketingMetrics(), [])
  const partnerMetrics = useMemo(() => getAllPartnersPerformance(), [])

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaignMetrics.filter((m) => {
      const c = m.campaign
      if (fType && c.type !== fType) return false
      if (fStatus && c.status !== fStatus) return false
      if (fSearch) {
        const q = fSearch.toLowerCase()
        const matches =
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.geography.toLowerCase().includes(q) ||
          c.owner_name.toLowerCase().includes(q)
        if (!matches) return false
      }
      return true
    })
  }, [campaignMetrics, fType, fStatus, fSearch])

  // Aggregated ROI summary metrics across campaigns with recorded spend
  const roiSummary = useMemo(() => {
    const campaignsWithSpend = campaignMetrics.filter(
      (cm) => cm.actualSpend !== null && cm.actualSpend > 0
    )
    const totalSpend = campaignsWithSpend.reduce((sum, cm) => sum + (cm.actualSpend || 0), 0)
    const totalRevenue = campaignsWithSpend.reduce((sum, cm) => sum + cm.totalRevenue, 0)
    const totalCommission = campaignsWithSpend.reduce((sum, cm) => sum + cm.totalCommission, 0)
    const netAgencyProfit = totalCommission - totalSpend
    const overallRoi = totalSpend > 0 ? Math.round((netAgencyProfit / totalSpend) * 1000) / 10 : null

    return {
      campaignsCount: campaignsWithSpend.length,
      totalSpend,
      totalRevenue,
      totalCommission,
      netAgencyProfit,
      overallRoi,
    }
  }, [campaignMetrics])

  // DataTable column definitions for Section 1: Campaign Performance Table
  const campaignColumns = useMemo<ColumnDef<CampaignPerformanceMetric>[]>(
    () => [
      {
        key: 'campaign',
        header: 'Campaign Name & Code',
        render: (row) => (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{row.campaign.name}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                {row.campaign.id}
              </span>
              <span>•</span>
              <span className="truncate max-w-[180px]">{row.campaign.geography}</span>
            </div>
          </div>
        ),
        sortValue: (row) => row.campaign.name,
      },
      {
        key: 'type',
        header: 'Type',
        render: (row) => (
          <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200 whitespace-nowrap">
            {row.campaign.type}
          </span>
        ),
        sortValue: (row) => row.campaign.type,
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <CampaignStatusBadge status={row.campaign.status} />,
        sortValue: (row) => row.campaign.status,
      },
      {
        key: 'totalLeads',
        header: 'Total Leads',
        render: (row) => (
          <span className="font-semibold text-slate-800 text-center block">
            {row.totalLeads}
          </span>
        ),
        sortValue: (row) => row.totalLeads,
      },
      {
        key: 'qualifiedLeads',
        header: 'Qualified Leads',
        render: (row) => (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {row.qualifiedLeads}
          </span>
        ),
        sortValue: (row) => row.qualifiedLeads,
      },
      {
        key: 'opportunities',
        header: 'Opps',
        render: (row) => (
          <span className="font-medium text-indigo-700 block text-center">
            {row.opportunities}
          </span>
        ),
        sortValue: (row) => row.opportunities,
      },
      {
        key: 'closedDeals',
        header: 'Closed Deals',
        render: (row) => (
          <span className="font-semibold text-emerald-800 block text-center">
            {row.closedDeals}
          </span>
        ),
        sortValue: (row) => row.closedDeals,
      },
      {
        key: 'conversionRate',
        header: 'Conversion Rate',
        render: (row) => (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            row.conversionRate > 0
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-slate-100 text-slate-500'
          }`}>
            {row.conversionRate.toFixed(1)}%
          </span>
        ),
        sortValue: (row) => row.conversionRate,
      },
      {
        key: 'plannedBudget',
        header: 'Planned Budget',
        render: (row) => (
          <span className="text-xs text-slate-700 font-mono">
            {formatPrice(row.plannedBudget)}
          </span>
        ),
        sortValue: (row) => row.plannedBudget,
      },
      {
        key: 'actualSpend',
        header: 'Actual Spend',
        render: (row) => (
          <span className={`text-xs font-mono font-medium ${
            row.actualSpend !== null ? 'text-slate-900' : 'text-slate-400'
          }`}>
            {row.actualSpend !== null ? formatPrice(row.actualSpend) : '—'}
          </span>
        ),
        sortValue: (row) => row.actualSpend || 0,
      },
      {
        key: 'cpl',
        header: 'CPL',
        render: (row) => (
          <span className={`text-xs font-mono ${
            row.cpl !== null ? 'text-blue-700 font-semibold' : 'text-slate-400'
          }`}>
            {row.cpl !== null ? formatPrice(row.cpl) : '—'}
          </span>
        ),
        sortValue: (row) => row.cpl || 0,
      },
      {
        key: 'cpql',
        header: 'CPQL',
        render: (row) => (
          <span className={`text-xs font-mono ${
            row.cpql !== null ? 'text-indigo-700 font-semibold' : 'text-slate-400'
          }`}>
            {row.cpql !== null ? formatPrice(row.cpql) : '—'}
          </span>
        ),
        sortValue: (row) => row.cpql || 0,
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="flex items-center gap-1.5">
            <Link
              href={`/campaigns?campaign=${row.campaign.id}`}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="View Campaign Details"
            >
              <ArrowUpRight size={15} />
            </Link>
            <Link
              href={`/marketing-traceability?campaign=${row.campaign.id}`}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="View Attribution Trace"
            >
              <GitFork size={15} />
            </Link>
          </div>
        ),
      },
    ],
    []
  )

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    if (id === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const elem = document.getElementById(id)
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
              <BarChart3 size={20} />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Campaign Analytics & Performance
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Deep-dive performance metrics, source effectiveness, promoted inventory traction, and full ROI calculation.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/marketing-dashboard">
            <Button variant="outline" size="sm" className="gap-1.5 border-slate-200 text-slate-700">
              <ArrowRight size={14} className="rotate-180" />
              Marketing Dashboard
            </Button>
          </Link>
          <Link href="/marketing-traceability">
            <Button variant="outline" size="sm" className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <GitFork size={14} />
              Funnel Traceability
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Executive Top Stats Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tracked Campaigns</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{campaignMetrics.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {campaignMetrics.filter((c) => c.campaign.status === 'Active').length} Active ·{' '}
              {campaignMetrics.filter((c) => c.campaign.status === 'Planned').length} Planned
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Leads Generated</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {campaignMetrics.reduce((sum, c) => sum + c.totalLeads, 0)}
            </p>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">
              {campaignMetrics.reduce((sum, c) => sum + c.qualifiedLeads, 0)} Qualified (
              {Math.round(
                (campaignMetrics.reduce((sum, c) => sum + c.qualifiedLeads, 0) /
                  (campaignMetrics.reduce((sum, c) => sum + c.totalLeads, 0) || 1)) *
                  100
              )}
              %)
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Downstream Opps</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {campaignMetrics.reduce((sum, c) => sum + c.opportunities, 0)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {campaignMetrics.reduce((sum, c) => sum + c.closedDeals, 0)} Closed Won Deals
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Marketing Spend</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {formatPrice(roiSummary.totalSpend)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Across {roiSummary.campaignsCount} active campaigns</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-emerald-800 uppercase tracking-wide">Overall Marketing ROI</p>
            <div className="flex items-center gap-1.5 mt-1">
              <p className="text-2xl font-bold text-emerald-700">
                {roiSummary.overallRoi !== null ? `+${roiSummary.overallRoi}%` : 'Insufficient data'}
              </p>
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
            <p className="text-xs text-emerald-700 mt-0.5">
              Net Agency Gain: {formatPrice(roiSummary.netAgencyProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Section Quick Navigation Pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-b border-slate-200">
        <span className="font-semibold text-slate-500 shrink-0 uppercase tracking-wider text-[11px] mr-1">
          Jump to:
        </span>
        <button
          onClick={() => scrollToSection('all')}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
            activeSection === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All Sections
        </button>
        <button
          onClick={() => scrollToSection('campaign-performance')}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
            activeSection === 'campaign-performance'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          1. Campaign Performance
        </button>
        <button
          onClick={() => scrollToSection('source-comparison')}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
            activeSection === 'source-comparison'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          2. Channels & Sources
        </button>
        <button
          onClick={() => scrollToSection('property-performance')}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
            activeSection === 'property-performance'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          3. Promoted Properties
        </button>
        <button
          onClick={() => scrollToSection('location-category')}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
            activeSection === 'location-category'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          4. Location & Category
        </button>
        <button
          onClick={() => scrollToSection('telemarketing-performance')}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
            activeSection === 'telemarketing-performance'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          5. Telemarketing
        </button>
        <button
          onClick={() => scrollToSection('referral-partners')}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
            activeSection === 'referral-partners'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          6. Referral Partners
        </button>
        <button
          onClick={() => scrollToSection('roi-section')}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
            activeSection === 'roi-section'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          7. ROI Analysis
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 1: Campaign Performance Table                                    */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <section id="campaign-performance" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 inline-flex items-center justify-center text-xs font-bold">
                1
              </span>
              Campaign Performance Table
            </h2>
            <p className="text-xs text-slate-500">
              Live funnel metrics computed from linked mock leads, opportunities, and transactions.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-800">{filteredCampaigns.length}</span> of {campaignMetrics.length} campaigns
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-3.5 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px] flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search campaign name, ID, or geography..."
                value={fSearch}
                onChange={(e) => setFSearch(e.target.value)}
                className="bg-transparent text-xs outline-none w-full placeholder:text-slate-400"
              />
              {fSearch && (
                <button onClick={() => setFSearch('')} className="text-slate-400 hover:text-slate-600 text-xs">
                  ✕
                </button>
              )}
            </div>

            <Select
              value={fType}
              onChange={(e) => setFType(e.target.value)}
              className="w-auto min-w-[170px] text-xs h-8"
            >
              <option value="">All Campaign Types</option>
              {ALL_CAMPAIGN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>

            <Select
              value={fStatus}
              onChange={(e) => setFStatus(e.target.value)}
              className="w-auto min-w-[140px] text-xs h-8"
            >
              <option value="">All Statuses</option>
              {ALL_CAMPAIGN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>

            {(fType || fStatus || fSearch) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFType('')
                  setFStatus('')
                  setFSearch('')
                }}
                className="text-xs text-rose-600 hover:bg-rose-50 h-8"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>

        {/* DataTable */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <DataTable
            columns={campaignColumns}
            data={filteredCampaigns}
            rowKey={(r) => r.campaign.id}
            emptyTitle="No campaigns match your filter criteria"
            emptyDescription="Try adjusting your search terms or filter selections."
          />
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 2: Source & Channel Comparison                                   */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <section id="source-comparison" className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 inline-flex items-center justify-center text-xs font-bold">
                2
              </span>
              Source & Channel Comparison
            </h2>
            <p className="text-xs text-slate-500">
              Comparative lead generation, qualification rates, and deal conversion sorted by volume descending.
            </p>
          </div>
          <Link href="/lead-sources">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-slate-600">
              Manage Lead Sources
              <ArrowRight size={13} />
            </Button>
          </Link>
        </div>

        <Card className="border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Source Name</th>
                  <th className="px-3 py-3">Channel Type</th>
                  <th className="px-3 py-3 text-center">Leads Generated</th>
                  <th className="px-3 py-3 text-center">Share of Volume</th>
                  <th className="px-3 py-3 text-center">Qualified Leads</th>
                  <th className="px-3 py-3 text-center">Opportunities</th>
                  <th className="px-3 py-3 text-center">Closed Deals</th>
                  <th className="px-3 py-3 text-right">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sourceMetrics.map((sm, idx) => {
                  const maxLeads = sourceMetrics[0]?.leadsGenerated || 1
                  const pctOfMax = Math.round((sm.leadsGenerated / maxLeads) * 100)
                  return (
                    <tr key={sm.source} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-400">#{idx + 1}</span>
                          <span>{sm.source}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          sm.channel_type === 'Digital'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {sm.channel_type}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-900">
                        {sm.leadsGenerated}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 max-w-[120px] mx-auto">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${pctOfMax}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono w-6 text-right">
                            {pctOfMax}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-emerald-700">
                        {sm.qualifiedLeads}
                      </td>
                      <td className="px-3 py-3 text-center font-medium text-indigo-700">
                        {sm.opportunities}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-emerald-800">
                        {sm.closedDeals}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold ${
                          sm.conversionRate > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {sm.conversionRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 3: Property Performance                                          */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <section id="property-performance" className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 inline-flex items-center justify-center text-xs font-bold">
                3
              </span>
              Promoted Property Performance
            </h2>
            <p className="text-xs text-slate-500">
              Traction, enquiries, and closed deal volume for properties actively promoted across marketing campaigns.
            </p>
          </div>
          <Link href="/inventory">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-slate-600">
              View Inventory Directory
              <ArrowRight size={13} />
            </Button>
          </Link>
        </div>

        <Card className="border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Property ID</th>
                  <th className="px-3 py-3">Location / ShortLoc</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Benchmark Price</th>
                  <th className="px-3 py-3">Campaign(s) Promoted Under</th>
                  <th className="px-3 py-3 text-center">Enquiries / Leads</th>
                  <th className="px-3 py-3 text-center">Opportunities</th>
                  <th className="px-3 py-3 text-center">Closed Deals</th>
                  <th className="px-3 py-3 text-right">Attributed Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {propertyMetrics.map((pm) => (
                  <tr key={pm.propertyId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                      <Link href={`/inventory?search=${pm.propertyId}`} className="hover:underline">
                        {pm.propertyId}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <MapPin size={11} className="text-slate-400" />
                        {pm.shortLoc}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-700 font-medium">
                      {pm.category}
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-800">
                      {formatPrice(pm.price)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {pm.promotedCampaigns.map((pc) => (
                          <Link
                            key={pc.id}
                            href={`/campaigns?campaign=${pc.id}`}
                            className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100 transition-colors"
                          >
                            <span>{pc.name}</span>
                            <ArrowUpRight size={10} />
                          </Link>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-900">
                      {pm.enquiriesCount}
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-indigo-700">
                      {pm.opportunitiesCount}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-emerald-700">
                      {pm.closedDealsCount}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-slate-900">
                      {pm.totalDealValue > 0 ? formatPrice(pm.totalDealValue) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 4: Location & Category Analysis                                  */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <section id="location-category" className="space-y-4 pt-4 border-t border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 inline-flex items-center justify-center text-xs font-bold">
              4
            </span>
            Location & Category Analysis
          </h2>
          <p className="text-xs text-slate-500">
            Market distribution showing demand volume and deal conversion grouped by property classification and micro-market.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By Category */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                <Building2 size={16} className="text-indigo-600" />
                Performance by Property Category
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-3 py-2.5 text-center">Leads</th>
                    <th className="px-3 py-2.5 text-center">Opps</th>
                    <th className="px-3 py-2.5 text-center">Deals</th>
                    <th className="px-4 py-2.5 text-right">Pipeline Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((cat) => (
                    <tr key={cat.category} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{cat.category}</td>
                      <td className="px-3 py-3 text-center font-bold text-slate-800">{cat.leadsCount}</td>
                      <td className="px-3 py-3 text-center font-semibold text-indigo-700">{cat.opportunitiesCount}</td>
                      <td className="px-3 py-3 text-center font-bold text-emerald-700">{cat.closedDealsCount}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                        {cat.totalValue > 0 ? formatPrice(cat.totalValue) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* By Location / ShortLoc */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                <MapPin size={16} className="text-emerald-600" />
                Performance by Micro-Market / Location
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-2.5">Location (ShortLoc)</th>
                    <th className="px-3 py-2.5 text-center">Leads</th>
                    <th className="px-3 py-2.5 text-center">Opps</th>
                    <th className="px-3 py-2.5 text-center">Deals</th>
                    <th className="px-4 py-2.5 text-right">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {locations.map((loc) => (
                    <tr key={loc.shortLoc} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {loc.shortLoc}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-800">{loc.leadsCount}</td>
                      <td className="px-3 py-3 text-center font-semibold text-indigo-700">{loc.opportunitiesCount}</td>
                      <td className="px-3 py-3 text-center font-bold text-emerald-700">{loc.closedDealsCount}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          loc.conversionRate > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {loc.conversionRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 5: Telemarketing Performance                                     */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <section id="telemarketing-performance" className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 inline-flex items-center justify-center text-xs font-bold">
                5
              </span>
              Telemarketing Performance
            </h2>
            <p className="text-xs text-slate-500">
              Outbound calling campaign engagement, connection efficacy, and converted pipeline leads.
            </p>
          </div>
          <Link href="/telemarketing-campaigns">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-slate-600">
              Telemarketing Lists
              <ArrowRight size={13} />
            </Button>
          </Link>
        </div>

        <Card className="border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Telemarketing Campaign</th>
                  <th className="px-3 py-3">Linked Parent Campaign</th>
                  <th className="px-3 py-3 text-center">Total Contacts</th>
                  <th className="px-3 py-3 text-center">Attempts Made</th>
                  <th className="px-3 py-3 text-center">Connected</th>
                  <th className="px-3 py-3 text-center">Interested</th>
                  <th className="px-3 py-3 text-center">Converted to Lead</th>
                  <th className="px-3 py-3 text-right">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {telemarketingMetrics.map((tm) => (
                  <tr key={tm.campaignId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{tm.campaignName}</div>
                      <span className="font-mono text-[11px] text-slate-500">{tm.campaignId}</span>
                    </td>
                    <td className="px-3 py-3">
                      {tm.linkedCampaignName ? (
                        <Link
                          href={`/campaigns?campaign=${tm.linkedCampaignId}`}
                          className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-indigo-700 px-2 py-0.5 rounded border border-slate-200 hover:bg-indigo-50"
                        >
                          <span className="truncate max-w-[150px]">{tm.linkedCampaignName}</span>
                          <ArrowUpRight size={10} />
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-800">{tm.totalContacts}</td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-700">{tm.attemptsMade}</td>
                    <td className="px-3 py-3 text-center font-semibold text-blue-700">{tm.connected}</td>
                    <td className="px-3 py-3 text-center font-semibold text-amber-700">{tm.interested}</td>
                    <td className="px-3 py-3 text-center font-bold text-emerald-700">{tm.convertedToLead}</td>
                    <td className="px-3 py-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                        {tm.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 6: Referral Partner Performance                                  */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <section id="referral-partners" className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 inline-flex items-center justify-center text-xs font-bold">
                6
              </span>
              Referral Partner Performance
            </h2>
            <p className="text-xs text-slate-500">
              Downstream pipeline traceability across registered brokers, consultants, and corporate partners.
            </p>
          </div>
          <Link href="/referral-partners">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-slate-600">
              Manage Partners
              <ArrowRight size={13} />
            </Button>
          </Link>
        </div>

        <Card className="border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Partner Name</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Referral Code</th>
                  <th className="px-3 py-3 text-center">Leads Generated</th>
                  <th className="px-3 py-3 text-center">Opportunities</th>
                  <th className="px-3 py-3 text-center">Deals Closed</th>
                  <th className="px-3 py-3 text-right">Total Deal Volume</th>
                  <th className="px-4 py-3 text-right">Total Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partnerMetrics.map((pm) => (
                  <tr key={pm.partner.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <Link href={`/referral-partners?partner=${pm.partner.id}`} className="hover:underline">
                        {pm.partner.name}
                      </Link>
                      <div className="text-[11px] text-slate-500">{pm.partner.contact_person}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {pm.partner.category}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-mono text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {pm.partner.referral_code}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-800">{pm.leadsCount}</td>
                    <td className="px-3 py-3 text-center font-semibold text-indigo-700">{pm.opportunitiesCount}</td>
                    <td className="px-3 py-3 text-center font-bold text-emerald-700">{pm.dealsCount}</td>
                    <td className="px-3 py-3 text-right font-mono font-medium text-slate-900">
                      {pm.totalDealValue > 0 ? formatPrice(pm.totalDealValue) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                      {pm.totalCommission > 0 ? formatPrice(pm.totalCommission) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 7: ROI Section                                                   */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <section id="roi-section" className="space-y-4 pt-4 border-t border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 inline-flex items-center justify-center text-xs font-bold">
              7
            </span>
            Marketing ROI & Investment Efficiency
          </h2>
          <p className="text-xs text-slate-500">
            Calculated as <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">((Total Revenue/Commission - Actual Spend) / Actual Spend) * 100</code>. Displays &quot;Insufficient data&quot; if spend or revenue data is missing.
          </p>
        </div>

        {/* ROI Breakdown Table */}
        <Card className="border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Actual Spend</th>
                  <th className="px-3 py-3 text-center">Closed Deals</th>
                  <th className="px-3 py-3 text-right">Attributed Sales Value</th>
                  <th className="px-3 py-3 text-right">Earned Commission</th>
                  <th className="px-3 py-3 text-right">Net Return</th>
                  <th className="px-4 py-3 text-right">ROI (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaignMetrics.map((cm) => {
                  const hasCostAndRevenue = cm.actualSpend !== null && cm.actualSpend > 0
                  const netReturn = hasCostAndRevenue ? cm.totalCommission - cm.actualSpend! : null

                  return (
                    <tr key={cm.campaign.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div>{cm.campaign.name}</div>
                        <span className="font-mono text-[11px] text-slate-400">{cm.campaign.id}</span>
                      </td>
                      <td className="px-3 py-3">
                        <CampaignStatusBadge status={cm.campaign.status} />
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-medium text-slate-900">
                        {cm.actualSpend !== null ? formatPrice(cm.actualSpend) : '—'}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-800">
                        {cm.closedDeals}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-700">
                        {cm.totalRevenue > 0 ? formatPrice(cm.totalRevenue) : '—'}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-slate-900">
                        {cm.totalCommission > 0 ? formatPrice(cm.totalCommission) : '—'}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold">
                        {netReturn !== null ? (
                          <span className={netReturn >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                            {netReturn >= 0 ? '+' : ''}
                            {formatPrice(netReturn)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {cm.roi !== null ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold ${
                            cm.roi >= 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {cm.roi >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                            {cm.roi >= 0 ? `+${cm.roi}%` : `${cm.roi}%`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            Insufficient data
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default function CampaignAnalyticsPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading campaign analytics...</div>}>
        <CampaignAnalyticsContent />
      </Suspense>
    </AppLayout>
  )
}

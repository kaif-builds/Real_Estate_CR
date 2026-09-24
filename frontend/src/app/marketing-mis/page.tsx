'use client'

/**
 * Marketing MIS / Reports Sub-Module
 *
 * Provides formal, structured, report-style management information system (MIS) views.
 * Designed for executive reporting and auditability with consistent global date filtering.
 *
 * 6 Formal Report Tabs (Left-side sub-navigation matching Settings layout):
 * 1. Campaign-wise MIS (Campaign Name, Type, Owner, Period, Leads, Qualified, Opps, Deals, Value, Commission, Spend, CPL, CPQL, ROI + Grand Totals)
 * 2. Source/Channel-wise Lead MIS (Source, Channel Type, Leads, Qualified, Opps, Deals, Conversion Rate + Grand Totals)
 * 3. Property Promotion Performance (Property ID, ShortLoc, Campaigns Promoted Under, Enquiries, Opps, Deals Closed + Grand Totals)
 * 4. Telemarketing Campaign Reports (Campaign, Telecaller(s), Period, Contacts, Attempts, Connected, Interested, Converted, Conversion Rate + Grand Totals)
 * 5. Referral & Partner Reports (Partner, Category, Leads, Opps, Deals, Revenue Generated, Commission Earned + Grand Totals)
 * 6. Marketing Funnel Report (Visual descending funnel with stage counts, % of top-of-funnel, stage drop-off %, and single Campaign/Source scoping)
 *
 * Role: SUPER_ADMIN, OFFICE_EXECUTIVE
 */

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  FileSpreadsheet, Calendar, Download, Filter, Search,
  ArrowRight, Building2, MapPin, Users, PhoneCall, Handshake,
  TrendingUp, ArrowUpRight, ArrowDownRight, CheckCircle2,
  AlertCircle, ChevronRight, Layers, Target, RefreshCw,
  GitFork, BarChart3, HelpCircle, X, ShieldAlert, Check
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatPrice, formatDate } from '@/lib/formatters'
import {
  MOCK_CAMPAIGNS,
  MOCK_LEADS,
  MOCK_PIPELINE_OPPORTUNITIES,
  MOCK_TRANSACTIONS,
  MOCK_CAMPAIGN_PROMOTIONS,
  MOCK_PROPERTIES,
  MOCK_TELEMARKETING_CAMPAIGNS,
  MOCK_TELEMARKETING_CONTACTS,
  MOCK_REFERRAL_PARTNERS,
  getAllPartnersPerformance,
  isDateInRange,
  isPeriodInRange,
  getMarketingFunnelMetrics,
  type CampaignRow,
  type CampaignStatus,
  type PartnerPerformanceStats,
  type FunnelStageData
} from '@/lib/mockData'

type MISTab =
  | 'campaigns'
  | 'sources'
  | 'property'
  | 'telemarketing'
  | 'partners'
  | 'funnel'

export default function MarketingMISPage() {
  const [activeTab, setActiveTab] = useState<MISTab>('campaigns')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // ── Global Date-Range Filter State ──
  const [datePreset, setDatePreset] = useState<string>('all')
  const [customStart, setCustomStart] = useState<string>('2026-09-01')
  const [customEnd, setCustomEnd] = useState<string>('2026-09-30')

  // Toast trigger for export actions
  const triggerExportToast = () => {
    setToastMessage('Export coming soon: Formal report export to CSV and PDF will be available in the next release.')
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Determine effective start and end dates from preset
  const { effectiveStart, effectiveEnd, label: filterLabel } = useMemo(() => {
    switch (datePreset) {
      case 'this_month':
        return { effectiveStart: '2026-09-01', effectiveEnd: '2026-09-30', label: 'This Month (Sep 2026)' }
      case 'last_month':
        return { effectiveStart: '2026-08-01', effectiveEnd: '2026-08-31', label: 'Last Month (Aug 2026)' }
      case 'q3':
        return { effectiveStart: '2026-07-01', effectiveEnd: '2026-09-30', label: 'Q3 2026 (Jul - Sep 2026)' }
      case 'custom':
        return { effectiveStart: customStart || null, effectiveEnd: customEnd || null, label: `Custom (${customStart || '…'} to ${customEnd || '…'})` }
      case 'all':
      default:
        return { effectiveStart: null, effectiveEnd: null, label: 'All Time Activity' }
    }
  }, [datePreset, customStart, customEnd])

  // ── 1. Tab 1: Campaign-wise MIS Data ──
  const campaignsMIS = useMemo(() => {
    // Filter campaigns whose active period touches the date range
    const activeCampaigns = MOCK_CAMPAIGNS.filter((c) =>
      isPeriodInRange(c.start_date, c.end_date, effectiveStart, effectiveEnd)
    )

    return activeCampaigns.map((c) => {
      // Leads for this campaign filtered by date
      const campaignLeads = MOCK_LEADS.filter(
        (l) => l.campaign_id === c.id && isDateInRange(l.created_at, effectiveStart, effectiveEnd)
      )
      const leadIds = new Set(campaignLeads.map((l) => l.id))
      const partyIds = new Set(campaignLeads.map((l) => l.party_id))

      // Qualified Leads
      const qualified = campaignLeads.filter((l) => {
        if (l.status === 'QUALIFIED' || l.status === 'WON' || l.status === 'CLOSED') return true
        return MOCK_PIPELINE_OPPORTUNITIES.some(
          (o) => o.originating_lead_id === l.id || o.client_id === l.party_id
        )
      }).length

      // Opps
      const opps = MOCK_PIPELINE_OPPORTUNITIES.filter(
        (o) =>
          (o.attributed_campaign_id === c.id ||
            (o.originating_lead_id && leadIds.has(o.originating_lead_id)) ||
            partyIds.has(o.client_id)) &&
          isDateInRange(o.created_at || o.closed_at, effectiveStart, effectiveEnd)
      )
      const oppIds = new Set(opps.map((o) => o.id))

      // Deals
      const txns = MOCK_TRANSACTIONS.filter(
        (t) =>
          (t.attributed_campaign_id === c.id ||
            oppIds.has(t.opportunity_id) ||
            (t.originating_lead_id && leadIds.has(t.originating_lead_id))) &&
          isDateInRange(t.closed_date, effectiveStart, effectiveEnd)
      )
      const wonOpps = opps.filter((o) => o.stage === 'WON')
      const closedDeals = Math.max(txns.length, wonOpps.length)

      const dealValue =
        txns.reduce((sum, t) => sum + (t.transaction_value || 0), 0) ||
        wonOpps.reduce((sum, o) => sum + (o.expected_value || 0), 0)

      const commission =
        txns.reduce((sum, t) => sum + (t.commission_amount || 0), 0) ||
        Math.round(dealValue * 0.02)

      const totalLeads = campaignLeads.length
      const spend = c.actual_spend !== undefined ? c.actual_spend : null
      const cpl = spend !== null && totalLeads > 0 ? Math.round(spend / totalLeads) : null
      const cpql = spend !== null && qualified > 0 ? Math.round(spend / qualified) : null

      let roi: number | null = null
      if (spend !== null && spend > 0) {
        roi = Math.round(((commission - spend) / spend) * 1000) / 10
      }

      return {
        campaign: c,
        totalLeads,
        qualified,
        opportunities: opps.length,
        closedDeals,
        dealValue,
        commission,
        spend,
        cpl,
        cpql,
        roi,
      }
    })
  }, [effectiveStart, effectiveEnd])

  // ── 2. Tab 2: Source/Channel MIS Data ──
  const sourcesMIS = useMemo(() => {
    // Unique sources from filtered leads
    const filteredLeads = MOCK_LEADS.filter((l) =>
      isDateInRange(l.created_at, effectiveStart, effectiveEnd)
    )

    const map = new Map<string, { channel: string; leads: typeof MOCK_LEADS }>()
    for (const lead of filteredLeads) {
      const src = lead.source || 'Direct Outreach'
      const ch = lead.channel_type || (src.includes('Website') || src.includes('Social') ? 'Digital' : 'Offline')
      if (!map.has(src)) {
        map.set(src, { channel: ch, leads: [] })
      }
      map.get(src)!.leads.push(lead)
    }

    const rows = Array.from(map.entries()).map(([source, data]) => {
      const leads = data.leads
      const leadIds = new Set(leads.map((l) => l.id))
      const partyIds = new Set(leads.map((l) => l.party_id))

      const qualified = leads.filter((l) => {
        if (l.status === 'QUALIFIED' || l.status === 'WON' || l.status === 'CLOSED') return true
        return MOCK_PIPELINE_OPPORTUNITIES.some(
          (o) => o.originating_lead_id === l.id || o.client_id === l.party_id
        )
      }).length

      const opps = MOCK_PIPELINE_OPPORTUNITIES.filter(
        (o) =>
          ((o.originating_lead_id && leadIds.has(o.originating_lead_id)) ||
            partyIds.has(o.client_id) ||
            (o.first_touch_source && o.first_touch_source.includes(source))) &&
          isDateInRange(o.created_at || o.closed_at, effectiveStart, effectiveEnd)
      )
      const oppIds = new Set(opps.map((o) => o.id))

      const txns = MOCK_TRANSACTIONS.filter(
        (t) =>
          (oppIds.has(t.opportunity_id) ||
            (t.originating_lead_id && leadIds.has(t.originating_lead_id))) &&
          isDateInRange(t.closed_date, effectiveStart, effectiveEnd)
      )
      const closed = Math.max(txns.length, opps.filter((o) => o.stage === 'WON').length)
      const convRate = leads.length > 0 ? Math.round((closed / leads.length) * 1000) / 10 : 0

      return {
        source,
        channel: data.channel,
        leads: leads.length,
        qualified,
        opportunities: opps.length,
        closed,
        convRate,
      }
    })

    return rows.sort((a, b) => b.leads - a.leads)
  }, [effectiveStart, effectiveEnd])

  // ── 3. Tab 3: Property Promotion MIS Data ──
  const propertyMIS = useMemo(() => {
    const uniquePropIds = Array.from(new Set(MOCK_CAMPAIGN_PROMOTIONS.map((p) => p.property_id)))

    return uniquePropIds.map((propId) => {
      const prop = MOCK_PROPERTIES.find((p) => p.id === propId)
      const promos = MOCK_CAMPAIGN_PROMOTIONS.filter((p) => p.property_id === propId)
      const campaignIds = new Set(promos.map((p) => p.campaign_id))
      const campaignNames = MOCK_CAMPAIGNS.filter((c) => campaignIds.has(c.id)).map((c) => c.name)

      // Enquiries count (adjusted proportionally if date filtered)
      const totalEnquiries = promos.reduce((sum, p) => sum + (p.enquiries_count || 0), 0)

      // Opps for this property within date range
      const opps = MOCK_PIPELINE_OPPORTUNITIES.filter(
        (o) => o.property_id === propId && isDateInRange(o.created_at, effectiveStart, effectiveEnd)
      )
      const oppIds = new Set(opps.map((o) => o.id))

      // Deals
      const txns = MOCK_TRANSACTIONS.filter(
        (t) =>
          (t.property_id === propId || oppIds.has(t.opportunity_id)) &&
          isDateInRange(t.closed_date, effectiveStart, effectiveEnd)
      )
      const closedCount = Math.max(txns.length, opps.filter((o) => o.stage === 'WON').length)
      const volume =
        txns.reduce((sum, t) => sum + (t.transaction_value || 0), 0) ||
        (closedCount > 0 ? (prop?.price || 0) : 0)

      return {
        propertyId: propId,
        shortLoc: prop?.short_loc || 'Indore Prime',
        category: prop?.category || 'Residential',
        price: prop?.price || 0,
        campaigns: campaignNames,
        enquiries: totalEnquiries,
        opportunities: opps.length,
        closed: closedCount,
        volume,
      }
    })
  }, [effectiveStart, effectiveEnd])

  // ── 4. Tab 4: Telemarketing Campaign Reports Data ──
  const telemarketingMIS = useMemo(() => {
    const campaigns = MOCK_TELEMARKETING_CAMPAIGNS.filter((tmc) =>
      isPeriodInRange(tmc.start_date, tmc.end_date, effectiveStart, effectiveEnd)
    )

    return campaigns.map((tmc) => {
      const contacts = MOCK_TELEMARKETING_CONTACTS.filter(
        (c) => c.campaign_id === tmc.id && isDateInRange(c.created_at, effectiveStart, effectiveEnd)
      )
      const attempts = contacts.reduce((sum, c) => sum + (c.attempts_count || 0), 0)
      const connected = contacts.filter(
        (c) =>
          c.attempts_count > 0 &&
          c.status !== 'Not Called' &&
          c.status !== 'Busy' &&
          c.status !== 'Wrong Number'
      ).length
      const interested = contacts.filter(
        (c) => c.status === 'Interested' || c.status === 'Converted to Lead'
      ).length
      const converted = contacts.filter((c) => c.status === 'Converted to Lead').length
      const convRate = contacts.length > 0 ? Math.round((converted / contacts.length) * 1000) / 10 : 0

      return {
        id: tmc.id,
        name: tmc.name,
        telecallers: tmc.assigned_telecallers.join(', '),
        period: `${formatDate(tmc.start_date)} - ${formatDate(tmc.end_date)}`,
        contacts: contacts.length,
        attempts,
        connected,
        interested,
        converted,
        convRate,
      }
    })
  }, [effectiveStart, effectiveEnd])

  // ── 5. Tab 5: Referral & Partner Reports Data ──
  const partnersMIS = useMemo(() => {
    return MOCK_REFERRAL_PARTNERS.map((partner) => {
      const leads = MOCK_LEADS.filter(
        (l) =>
          (l.referral_partner_id === partner.id || l.referral_code === partner.referral_code) &&
          isDateInRange(l.created_at, effectiveStart, effectiveEnd)
      )
      const leadIds = new Set(leads.map((l) => l.id))
      const partyIds = new Set(leads.map((l) => l.party_id))

      const opps = MOCK_PIPELINE_OPPORTUNITIES.filter(
        (o) =>
          ((o.originating_lead_id && leadIds.has(o.originating_lead_id)) ||
            partyIds.has(o.client_id)) &&
          isDateInRange(o.created_at || o.closed_at, effectiveStart, effectiveEnd)
      )
      const oppIds = new Set(opps.map((o) => o.id))

      const deals = MOCK_TRANSACTIONS.filter(
        (t) =>
          (oppIds.has(t.opportunity_id) ||
            (t.originating_lead_id && leadIds.has(t.originating_lead_id))) &&
          isDateInRange(t.closed_date, effectiveStart, effectiveEnd)
      )

      const totalDealValue = deals.reduce((sum, d) => sum + (d.transaction_value || 0), 0)
      const totalCommission = deals.reduce((sum, d) => sum + (d.commission_amount || 0), 0)

      return {
        partner,
        leads: leads.length,
        opportunities: opps.length,
        deals: deals.length,
        totalDealValue,
        totalCommission,
      }
    })
  }, [effectiveStart, effectiveEnd])

  // ── 6. Tab 6: Marketing Funnel Scope State & Computation ──
  const [funnelScopeType, setFunnelScopeType] = useState<'all' | 'campaign' | 'source'>('all')
  const [funnelScopeId, setFunnelScopeId] = useState<string>('')

  const funnelStages = useMemo(() => {
    return getMarketingFunnelMetrics(
      funnelScopeType,
      funnelScopeId || null,
      effectiveStart,
      effectiveEnd
    )
  }, [funnelScopeType, funnelScopeId, effectiveStart, effectiveEnd])

  // Grand totals for active tab
  const campaignTotals = useMemo(() => {
    return {
      leads: campaignsMIS.reduce((sum, c) => sum + c.totalLeads, 0),
      qualified: campaignsMIS.reduce((sum, c) => sum + c.qualified, 0),
      opps: campaignsMIS.reduce((sum, c) => sum + c.opportunities, 0),
      deals: campaignsMIS.reduce((sum, c) => sum + c.closedDeals, 0),
      dealValue: campaignsMIS.reduce((sum, c) => sum + c.dealValue, 0),
      commission: campaignsMIS.reduce((sum, c) => sum + c.commission, 0),
      spend: campaignsMIS.reduce((sum, c) => sum + (c.spend || 0), 0),
    }
  }, [campaignsMIS])

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <p className="text-xs font-medium">{toastMessage}</p>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white ml-auto"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                <FileSpreadsheet size={20} />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Marketing MIS & Reports
              </h1>
              <Badge className="bg-slate-100 text-slate-700 border-slate-300 text-xs">
                Audit & MIS
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              Structured, exportable management reports with unified global date filtering and funnel velocity tracking.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              onClick={triggerExportToast}
              className="gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 shadow-xs"
            >
              <Download size={14} />
              Export MIS Report
            </Button>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────── */}
        {/* GLOBAL DATE-RANGE FILTER BAR (Applies to all 6 reports)             */}
        {/* ──────────────────────────────────────────────────────────────────── */}
        <Card className="border-indigo-100 bg-indigo-50/30">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 uppercase tracking-wider">
                <Calendar size={15} className="text-indigo-600" />
                Global MIS Period:
              </div>

              {/* Preset Selector */}
              <Select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                className="w-auto min-w-[190px] text-xs h-8 bg-white"
              >
                <option value="all">All Time Activity</option>
                <option value="this_month">This Month (Sep 2026)</option>
                <option value="last_month">Last Month (Aug 2026)</option>
                <option value="q3">Q3 2026 (Jul - Sep 2026)</option>
                <option value="custom">Custom Date Range…</option>
              </Select>

              {/* Custom Date Pickers */}
              {datePreset === 'custom' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-auto text-xs h-8 bg-white"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-auto text-xs h-8 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Active Date Indicator Pill */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Active Scope:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-indigo-800 border border-indigo-200 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {filterLabel}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ──────────────────────────────────────────────────────────────────── */}
        {/* MAIN LAYOUT: Left-Side Sub-Navigation + Report Content               */}
        {/* ──────────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Left-Side Sub-Navigation (Tabs) */}
          <div className="w-full md:w-64 shrink-0 space-y-1">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === 'campaigns'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Target size={15} />
                <span>1. Campaign-wise MIS</span>
              </div>
              <ChevronRight size={14} className={activeTab === 'campaigns' ? 'text-white' : 'text-slate-400'} />
            </button>

            <button
              onClick={() => setActiveTab('sources')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === 'sources'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GitFork size={15} />
                <span>2. Source & Channel MIS</span>
              </div>
              <ChevronRight size={14} className={activeTab === 'sources' ? 'text-white' : 'text-slate-400'} />
            </button>

            <button
              onClick={() => setActiveTab('property')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === 'property'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 size={15} />
                <span>3. Property Performance</span>
              </div>
              <ChevronRight size={14} className={activeTab === 'property' ? 'text-white' : 'text-slate-400'} />
            </button>

            <button
              onClick={() => setActiveTab('telemarketing')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === 'telemarketing'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PhoneCall size={15} />
                <span>4. Telemarketing Reports</span>
              </div>
              <ChevronRight size={14} className={activeTab === 'telemarketing' ? 'text-white' : 'text-slate-400'} />
            </button>

            <button
              onClick={() => setActiveTab('partners')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === 'partners'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Handshake size={15} />
                <span>5. Referral & Partners</span>
              </div>
              <ChevronRight size={14} className={activeTab === 'partners' ? 'text-white' : 'text-slate-400'} />
            </button>

            <button
              onClick={() => setActiveTab('funnel')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === 'funnel'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers size={15} />
                <span>6. Marketing Funnel</span>
              </div>
              <ChevronRight size={14} className={activeTab === 'funnel' ? 'text-white' : 'text-slate-400'} />
            </button>

            {/* Quick Link Card to Detailed Analytics */}
            <div className="pt-4">
              <Card className="border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-600 space-y-2">
                <p className="font-semibold text-slate-800">Need interactive drill-down?</p>
                <p className="text-[11px] text-slate-500">
                  Switch to Campaign Analytics for visual comparisons, cross-filtering, and granular audit trails.
                </p>
                <Link href="/campaign-analytics" className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline">
                  Open Campaign Analytics →
                </Link>
              </Card>
            </div>
          </div>

          {/* Right-Side Report Area */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {/* ────────────────────────────────────────────────────────────────── */}
            {/* TAB 1: Campaign-wise MIS                                          */}
            {/* ────────────────────────────────────────────────────────────────── */}
            {activeTab === 'campaigns' && (
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Campaign-wise Performance MIS
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Formal campaign ledger reflecting period {filterLabel}.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerExportToast}
                    className="text-xs gap-1.5 text-slate-700 h-8"
                  >
                    <Download size={13} />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 font-semibold uppercase tracking-wider">
                          <th className="px-4 py-3">Campaign</th>
                          <th className="px-3 py-3">Type</th>
                          <th className="px-3 py-3">Owner</th>
                          <th className="px-3 py-3">Period</th>
                          <th className="px-3 py-3 text-center">Leads</th>
                          <th className="px-3 py-3 text-center">Qualified</th>
                          <th className="px-3 py-3 text-center">Opps</th>
                          <th className="px-3 py-3 text-center">Deals</th>
                          <th className="px-3 py-3 text-right">Deal Value</th>
                          <th className="px-3 py-3 text-right">Commission</th>
                          <th className="px-3 py-3 text-right">Spend</th>
                          <th className="px-3 py-3 text-right">CPL</th>
                          <th className="px-3 py-3 text-right">CPQL</th>
                          <th className="px-4 py-3 text-right">ROI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {campaignsMIS.length === 0 ? (
                          <tr>
                            <td colSpan={14} className="px-4 py-8 text-center text-slate-400">
                              No campaigns active within the selected date range.
                            </td>
                          </tr>
                        ) : (
                          campaignsMIS.map((row) => (
                            <tr key={row.campaign.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-4 py-3 font-semibold text-slate-900">
                                <div>{row.campaign.name}</div>
                                <span className="font-mono text-[10px] text-slate-400">{row.campaign.id}</span>
                              </td>
                              <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{row.campaign.type}</td>
                              <td className="px-3 py-3 text-slate-700 whitespace-nowrap">{row.campaign.owner_name}</td>
                              <td className="px-3 py-3 text-[11px] text-slate-500 whitespace-nowrap font-mono">
                                {formatDate(row.campaign.start_date)} - {formatDate(row.campaign.end_date)}
                              </td>
                              <td className="px-3 py-3 text-center font-bold text-slate-900">{row.totalLeads}</td>
                              <td className="px-3 py-3 text-center font-semibold text-emerald-700">{row.qualified}</td>
                              <td className="px-3 py-3 text-center font-medium text-indigo-700">{row.opportunities}</td>
                              <td className="px-3 py-3 text-center font-bold text-emerald-800">{row.closedDeals}</td>
                              <td className="px-3 py-3 text-right font-mono font-medium text-slate-900">
                                {row.dealValue > 0 ? formatPrice(row.dealValue) : '—'}
                              </td>
                              <td className="px-3 py-3 text-right font-mono font-semibold text-emerald-700">
                                {row.commission > 0 ? formatPrice(row.commission) : '—'}
                              </td>
                              <td className="px-3 py-3 text-right font-mono text-slate-800">
                                {row.spend !== null ? formatPrice(row.spend) : '—'}
                              </td>
                              <td className="px-3 py-3 text-right font-mono text-blue-700">
                                {row.cpl !== null ? formatPrice(row.cpl) : '—'}
                              </td>
                              <td className="px-3 py-3 text-right font-mono text-indigo-700">
                                {row.cpql !== null ? formatPrice(row.cpql) : '—'}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {row.roi !== null ? (
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                    row.roi >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {row.roi >= 0 ? `+${row.roi}%` : `${row.roi}%`}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {/* Grand Totals Footer */}
                      {campaignsMIS.length > 0 && (
                        <tfoot>
                          <tr className="border-t-2 border-slate-300 bg-slate-100/80 font-bold text-slate-900">
                            <td className="px-4 py-3" colSpan={4}>
                              Grand Total ({campaignsMIS.length} Campaigns)
                            </td>
                            <td className="px-3 py-3 text-center">{campaignTotals.leads}</td>
                            <td className="px-3 py-3 text-center text-emerald-800">{campaignTotals.qualified}</td>
                            <td className="px-3 py-3 text-center text-indigo-800">{campaignTotals.opps}</td>
                            <td className="px-3 py-3 text-center text-emerald-900">{campaignTotals.deals}</td>
                            <td className="px-3 py-3 text-right font-mono">{formatPrice(campaignTotals.dealValue)}</td>
                            <td className="px-3 py-3 text-right font-mono text-emerald-800">{formatPrice(campaignTotals.commission)}</td>
                            <td className="px-3 py-3 text-right font-mono">{formatPrice(campaignTotals.spend)}</td>
                            <td className="px-3 py-3 text-right font-mono text-blue-800">
                              {campaignTotals.leads > 0 && campaignTotals.spend > 0
                                ? formatPrice(Math.round(campaignTotals.spend / campaignTotals.leads))
                                : '—'}
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-indigo-800">
                              {campaignTotals.qualified > 0 && campaignTotals.spend > 0
                                ? formatPrice(Math.round(campaignTotals.spend / campaignTotals.qualified))
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              {campaignTotals.spend > 0
                                ? `+${Math.round(((campaignTotals.commission - campaignTotals.spend) / campaignTotals.spend) * 1000) / 10}%`
                                : '—'}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ────────────────────────────────────────────────────────────────── */}
            {/* TAB 2: Source/Channel-wise Lead MIS                               */}
            {/* ────────────────────────────────────────────────────────────────── */}
            {activeTab === 'sources' && (
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Source & Channel-wise Lead MIS
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Comparative acquisition performance across channels for {filterLabel}.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerExportToast}
                    className="text-xs gap-1.5 text-slate-700 h-8"
                  >
                    <Download size={13} />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 font-semibold uppercase tracking-wider">
                          <th className="px-5 py-3">Source Name</th>
                          <th className="px-4 py-3">Channel Type</th>
                          <th className="px-4 py-3 text-center">Total Leads</th>
                          <th className="px-4 py-3 text-center">Qualified Leads</th>
                          <th className="px-4 py-3 text-center">Opportunities</th>
                          <th className="px-4 py-3 text-center">Deals Closed</th>
                          <th className="px-5 py-3 text-right">Conversion Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sourcesMIS.map((row) => (
                          <tr key={row.source} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3 font-semibold text-slate-900">{row.source}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                                row.channel === 'Digital'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {row.channel}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-slate-900">{row.leads}</td>
                            <td className="px-4 py-3 text-center font-semibold text-emerald-700">{row.qualified}</td>
                            <td className="px-4 py-3 text-center font-semibold text-indigo-700">{row.opportunities}</td>
                            <td className="px-4 py-3 text-center font-bold text-emerald-800">{row.closed}</td>
                            <td className="px-5 py-3 text-right">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold ${
                                row.convRate > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {row.convRate.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-300 bg-slate-100/80 font-bold text-slate-900">
                          <td className="px-5 py-3" colSpan={2}>Grand Total</td>
                          <td className="px-4 py-3 text-center">{sourcesMIS.reduce((s, r) => s + r.leads, 0)}</td>
                          <td className="px-4 py-3 text-center text-emerald-800">{sourcesMIS.reduce((s, r) => s + r.qualified, 0)}</td>
                          <td className="px-4 py-3 text-center text-indigo-800">{sourcesMIS.reduce((s, r) => s + r.opportunities, 0)}</td>
                          <td className="px-4 py-3 text-center text-emerald-900">{sourcesMIS.reduce((s, r) => s + r.closed, 0)}</td>
                          <td className="px-5 py-3 text-right">
                            {sourcesMIS.reduce((s, r) => s + r.leads, 0) > 0
                              ? `${((sourcesMIS.reduce((s, r) => s + r.closed, 0) / sourcesMIS.reduce((s, r) => s + r.leads, 0)) * 100).toFixed(1)}%`
                              : '0.0%'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ────────────────────────────────────────────────────────────────── */}
            {/* TAB 3: Property Promotion Performance                             */}
            {/* ────────────────────────────────────────────────────────────────── */}
            {activeTab === 'property' && (
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Property Promotion Performance MIS
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Attributed enquiries and deal closures for promoted inventory assets.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerExportToast}
                    className="text-xs gap-1.5 text-slate-700 h-8"
                  >
                    <Download size={13} />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 font-semibold uppercase tracking-wider">
                          <th className="px-5 py-3">Property ID</th>
                          <th className="px-4 py-3">ShortLoc</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Campaign(s) Promoted Under</th>
                          <th className="px-4 py-3 text-center">Total Enquiries</th>
                          <th className="px-4 py-3 text-center">Opportunities</th>
                          <th className="px-4 py-3 text-center">Deals Closed</th>
                          <th className="px-5 py-3 text-right">Attributed Volume</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {propertyMIS.map((row) => (
                          <tr key={row.propertyId} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3 font-mono font-bold text-indigo-700">{row.propertyId}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{row.shortLoc}</td>
                            <td className="px-4 py-3 text-slate-600">{row.category}</td>
                            <td className="px-4 py-3 text-slate-700">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {row.campaigns.map((c) => (
                                  <span key={c} className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-slate-900">{row.enquiries}</td>
                            <td className="px-4 py-3 text-center font-semibold text-indigo-700">{row.opportunities}</td>
                            <td className="px-4 py-3 text-center font-bold text-emerald-800">{row.closed}</td>
                            <td className="px-5 py-3 text-right font-mono font-semibold text-slate-900">
                              {row.volume > 0 ? formatPrice(row.volume) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-300 bg-slate-100/80 font-bold text-slate-900">
                          <td className="px-5 py-3" colSpan={4}>Grand Total</td>
                          <td className="px-4 py-3 text-center">{propertyMIS.reduce((s, r) => s + r.enquiries, 0)}</td>
                          <td className="px-4 py-3 text-center text-indigo-800">{propertyMIS.reduce((s, r) => s + r.opportunities, 0)}</td>
                          <td className="px-4 py-3 text-center text-emerald-900">{propertyMIS.reduce((s, r) => s + r.closed, 0)}</td>
                          <td className="px-5 py-3 text-right font-mono">{formatPrice(propertyMIS.reduce((s, r) => s + r.volume, 0))}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ────────────────────────────────────────────────────────────────── */}
            {/* TAB 4: Telemarketing Campaign Reports                             */}
            {/* ────────────────────────────────────────────────────────────────── */}
            {activeTab === 'telemarketing' && (
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Telemarketing Campaign Reports MIS
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Outbound call disposition and contact-to-lead conversion records.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerExportToast}
                    className="text-xs gap-1.5 text-slate-700 h-8"
                  >
                    <Download size={13} />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 font-semibold uppercase tracking-wider">
                          <th className="px-5 py-3">Campaign Name</th>
                          <th className="px-4 py-3">Telecaller(s)</th>
                          <th className="px-4 py-3">Period</th>
                          <th className="px-4 py-3 text-center">Contacts</th>
                          <th className="px-4 py-3 text-center">Attempts</th>
                          <th className="px-4 py-3 text-center">Connected</th>
                          <th className="px-4 py-3 text-center">Interested</th>
                          <th className="px-4 py-3 text-center">Converted</th>
                          <th className="px-5 py-3 text-right">Conversion Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {telemarketingMIS.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3 font-semibold text-slate-900">{row.name}</td>
                            <td className="px-4 py-3 text-slate-600">{row.telecallers}</td>
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{row.period}</td>
                            <td className="px-4 py-3 text-center font-bold text-slate-900">{row.contacts}</td>
                            <td className="px-4 py-3 text-center font-medium text-slate-700">{row.attempts}</td>
                            <td className="px-4 py-3 text-center font-semibold text-blue-700">{row.connected}</td>
                            <td className="px-4 py-3 text-center font-semibold text-amber-700">{row.interested}</td>
                            <td className="px-4 py-3 text-center font-bold text-emerald-800">{row.converted}</td>
                            <td className="px-5 py-3 text-right">
                              <span className="inline-flex items-center px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                                {row.convRate.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-300 bg-slate-100/80 font-bold text-slate-900">
                          <td className="px-5 py-3" colSpan={3}>Grand Total</td>
                          <td className="px-4 py-3 text-center">{telemarketingMIS.reduce((s, r) => s + r.contacts, 0)}</td>
                          <td className="px-4 py-3 text-center">{telemarketingMIS.reduce((s, r) => s + r.attempts, 0)}</td>
                          <td className="px-4 py-3 text-center text-blue-800">{telemarketingMIS.reduce((s, r) => s + r.connected, 0)}</td>
                          <td className="px-4 py-3 text-center text-amber-800">{telemarketingMIS.reduce((s, r) => s + r.interested, 0)}</td>
                          <td className="px-4 py-3 text-center text-emerald-900">{telemarketingMIS.reduce((s, r) => s + r.converted, 0)}</td>
                          <td className="px-5 py-3 text-right">
                            {telemarketingMIS.reduce((s, r) => s + r.contacts, 0) > 0
                              ? `${((telemarketingMIS.reduce((s, r) => s + r.converted, 0) / telemarketingMIS.reduce((s, r) => s + r.contacts, 0)) * 100).toFixed(1)}%`
                              : '0.0%'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ────────────────────────────────────────────────────────────────── */}
            {/* TAB 5: Referral & Partner Reports                                 */}
            {/* ────────────────────────────────────────────────────────────────── */}
            {activeTab === 'partners' && (
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Referral & Partner Performance MIS
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Attributed revenue, opportunities, and commissions earned by partner agencies.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerExportToast}
                    className="text-xs gap-1.5 text-slate-700 h-8"
                  >
                    <Download size={13} />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 font-semibold uppercase tracking-wider">
                          <th className="px-5 py-3">Partner Name</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Referral Code</th>
                          <th className="px-4 py-3 text-center">Leads Generated</th>
                          <th className="px-4 py-3 text-center">Opportunities</th>
                          <th className="px-4 py-3 text-center">Deals Closed</th>
                          <th className="px-4 py-3 text-right">Revenue Generated</th>
                          <th className="px-5 py-3 text-right">Commission Earned</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {partnersMIS.map((row) => (
                          <tr key={row.partner.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3 font-semibold text-slate-900">{row.partner.name}</td>
                            <td className="px-4 py-3 text-slate-600">{row.partner.category}</td>
                            <td className="px-4 py-3 font-mono text-slate-800">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {row.partner.referral_code}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-slate-900">{row.leads}</td>
                            <td className="px-4 py-3 text-center font-semibold text-indigo-700">{row.opportunities}</td>
                            <td className="px-4 py-3 text-center font-bold text-emerald-800">{row.deals}</td>
                            <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                              {row.totalDealValue > 0 ? formatPrice(row.totalDealValue) : '—'}
                            </td>
                            <td className="px-5 py-3 text-right font-mono font-bold text-emerald-700">
                              {row.totalCommission > 0 ? formatPrice(row.totalCommission) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-300 bg-slate-100/80 font-bold text-slate-900">
                          <td className="px-5 py-3" colSpan={3}>Grand Total</td>
                          <td className="px-4 py-3 text-center">{partnersMIS.reduce((s, r) => s + r.leads, 0)}</td>
                          <td className="px-4 py-3 text-center text-indigo-800">{partnersMIS.reduce((s, r) => s + r.opportunities, 0)}</td>
                          <td className="px-4 py-3 text-center text-emerald-900">{partnersMIS.reduce((s, r) => s + r.deals, 0)}</td>
                          <td className="px-4 py-3 text-right font-mono">{formatPrice(partnersMIS.reduce((s, r) => s + r.totalDealValue, 0))}</td>
                          <td className="px-5 py-3 text-right font-mono text-emerald-800">{formatPrice(partnersMIS.reduce((s, r) => s + r.totalCommission, 0))}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ────────────────────────────────────────────────────────────────── */}
            {/* TAB 6: Marketing Funnel Report                                    */}
            {/* ────────────────────────────────────────────────────────────────── */}
            {activeTab === 'funnel' && (
              <div className="space-y-6">
                <Card className="border-slate-200 bg-white shadow-sm">
                  <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Layers size={18} className="text-indigo-600" />
                        Marketing Conversion Funnel
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-0.5">
                        End-to-end stage volume and drop-off analysis. Strict hierarchy: Leads ≥ Qualified ≥ Opps ≥ Deals.
                      </CardDescription>
                    </div>

                    {/* Funnel Scope Filter Dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Funnel Scope:</span>
                      <Select
                        value={`${funnelScopeType}:${funnelScopeId}`}
                        onChange={(e) => {
                          const [type, id] = e.target.value.split(':')
                          setFunnelScopeType(type as any)
                          setFunnelScopeId(id || '')
                        }}
                        className="text-xs h-8 bg-white min-w-[200px]"
                      >
                        <option value="all:">All Campaigns & Sources Combined</option>
                        <optgroup label="Filter by Campaign">
                          {MOCK_CAMPAIGNS.map((c) => (
                            <option key={c.id} value={`campaign:${c.id}`}>
                              Campaign: {c.name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Filter by Source">
                          {sourcesMIS.map((s) => (
                            <option key={s.source} value={`source:${s.source}`}>
                              Source: {s.source}
                            </option>
                          ))}
                        </optgroup>
                      </Select>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* Visual Funnel Representation */}
                    <div className="max-w-2xl mx-auto space-y-3">
                      {funnelStages.map((stage, idx) => {
                        const widthPct = Math.max(stage.conversionFromTotal, 20)
                        const colors = [
                          'bg-indigo-600 text-white',
                          'bg-blue-600 text-white',
                          'bg-indigo-700 text-white',
                          'bg-emerald-600 text-white',
                        ]
                        const borderColors = [
                          'border-indigo-700',
                          'border-blue-700',
                          'border-indigo-800',
                          'border-emerald-700',
                        ]

                        return (
                          <div key={stage.stage} className="space-y-1">
                            {/* Funnel Block */}
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1 px-1">
                              <span>
                                {idx + 1}. {stage.stage}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900 text-sm">
                                  {stage.count}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  ({stage.conversionFromTotal.toFixed(1)}% of top)
                                </span>
                              </div>
                            </div>

                            {/* Stepped Visual Funnel Bar */}
                            <div className="w-full bg-slate-100 rounded-lg p-1 border border-slate-200">
                              <div
                                className={`h-11 rounded-md flex items-center justify-between px-4 transition-all duration-500 shadow-xs ${colors[idx]}`}
                                style={{ width: `${widthPct}%`, margin: '0 auto' }}
                              >
                                <span className="text-xs font-bold tracking-wide truncate">
                                  {stage.stage}
                                </span>
                                <span className="text-sm font-black font-mono">
                                  {stage.count}
                                </span>
                              </div>
                            </div>

                            {/* Drop-off Indicator between stages */}
                            {idx < funnelStages.length - 1 && (
                              <div className="flex items-center justify-center gap-1.5 py-1">
                                <span className="h-3 w-px bg-slate-300" />
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                  <ArrowDownRight size={12} />
                                  Drop-off: {funnelStages[idx + 1].dropOffRate.toFixed(1)}%
                                </span>
                                <span className="h-3 w-px bg-slate-300" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Funnel Breakdown Table */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden mt-6">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-500 font-semibold uppercase">
                            <th className="px-4 py-2.5">Lifecycle Stage</th>
                            <th className="px-4 py-2.5 text-center">Volume</th>
                            <th className="px-4 py-2.5 text-center">Overall Conversion</th>
                            <th className="px-4 py-2.5 text-right">Drop-off from Prior Stage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {funnelStages.map((stg, i) => (
                            <tr key={stg.stage} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2.5 font-semibold text-slate-900">
                                {i + 1}. {stg.stage}
                              </td>
                              <td className="px-4 py-2.5 text-center font-bold font-mono text-slate-800">
                                {stg.count}
                              </td>
                              <td className="px-4 py-2.5 text-center font-mono text-indigo-700">
                                {stg.conversionFromTotal.toFixed(1)}%
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono">
                                {i === 0 ? (
                                  <span className="text-slate-400">Baseline (0.0%)</span>
                                ) : (
                                  <span className="text-rose-600 font-semibold">
                                    -{stg.dropOffRate.toFixed(1)}%
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

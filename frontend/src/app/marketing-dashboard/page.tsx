'use client'

/**
 * Marketing Dashboard — Centralized "At a Glance" Overview
 *
 * Placed at the top of the MARKETING navigation group.
 * Provides high-level visibility across campaigns, source channels, lead generation velocity,
 * marketing pipeline value, spend efficiency, and referral partner traction.
 *
 * Core Features:
 * 1. Top Summary Cards (Clickable tile pattern matching Office Executive Dashboard):
 *    - Active Campaigns (with Planned / Paused / Completed sub-counts)
 *    - Leads Generated (interactive Today / This Week / This Month toggle)
 *    - Qualified Leads (marketing origin, this month)
 *    - Opportunities from Marketing (this month)
 *    - Closed Deals from Marketing (this month)
 *    - Total Marketing Pipeline Value (sum of Expected Value)
 * 2. "Leads by Source" bar chart / ranked distribution list (clickable to Campaign Analytics #source-comparison)
 * 3. "Campaign Status Overview" breakdown by status (clickable to /campaigns?status=...)
 * 4. "Top Performing Campaigns" ranked leaderboard (top 5, clickable to campaign detail)
 * 5. "Marketing Spend & CPL Summary" (total spend, blended CPL, blended CPQL, with graceful "No budget data recorded yet" empty state)
 * 6. "Referral Partner Snapshot" top 3 partners with "View All Partners" action
 * 7. Universal drill-down support on every card/row.
 *
 * Role: SUPER_ADMIN, OFFICE_EXECUTIVE
 */

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Megaphone, Users, UserCheck, TrendingUp,
  Receipt, DollarSign, ArrowRight, ExternalLink, BarChart3,
  Calendar, Handshake, GitFork, ShieldCheck, CheckCircle2,
  AlertCircle, ChevronRight, ArrowUpRight, Clock, Target,
  Sparkles, Layers, Building2, MapPin, Share2, HelpCircle
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDate } from '@/lib/formatters'
import {
  getMarketingDashboardMetrics,
  type CampaignStatus,
} from '@/lib/mockData'

// ── Clickable Stat Card (Matching Main Dashboard Pattern) ─────────────────────

function DashboardClickableTile({
  label,
  value,
  subtext,
  icon: Icon,
  href,
  colorScheme = 'indigo',
  extraBadge,
}: {
  label: string
  value: string | number
  subtext?: React.ReactNode
  icon: React.ElementType
  href: string
  colorScheme?: 'indigo' | 'emerald' | 'blue' | 'purple' | 'amber'
  extraBadge?: React.ReactNode
}) {
  const colorMap = {
    indigo: {
      border: 'hover:border-indigo-300',
      iconBg: 'bg-indigo-50 text-indigo-700',
      text: 'text-slate-900 group-hover:text-indigo-900',
      arrow: 'text-indigo-500',
    },
    emerald: {
      border: 'hover:border-emerald-300',
      iconBg: 'bg-emerald-50 text-emerald-700',
      text: 'text-slate-900 group-hover:text-emerald-900',
      arrow: 'text-emerald-500',
    },
    blue: {
      border: 'hover:border-blue-300',
      iconBg: 'bg-blue-50 text-blue-700',
      text: 'text-slate-900 group-hover:text-blue-900',
      arrow: 'text-blue-500',
    },
    purple: {
      border: 'hover:border-purple-300',
      iconBg: 'bg-purple-50 text-purple-700',
      text: 'text-slate-900 group-hover:text-purple-900',
      arrow: 'text-purple-500',
    },
    amber: {
      border: 'hover:border-amber-300',
      iconBg: 'bg-amber-50 text-amber-700',
      text: 'text-slate-900 group-hover:text-amber-900',
      arrow: 'text-amber-500',
    },
  }

  const theme = colorMap[colorScheme]

  return (
    <Link href={href} className="block group">
      <Card className={`h-full border-slate-200 transition-all duration-200 cursor-pointer hover:shadow-md hover:bg-slate-50/60 ${theme.border}`}>
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {label}
                </span>
                <ArrowRight
                  size={12}
                  className={`opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${theme.arrow}`}
                />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold tracking-tight transition-colors ${theme.text}`}>
                  {value}
                </span>
                {extraBadge}
              </div>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${theme.iconBg}`}>
              <Icon size={22} />
            </div>
          </div>
          {subtext && (
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              {subtext}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

export default function MarketingDashboardPage() {
  const router = useRouter()
  const [leadsTimeframe, setLeadsTimeframe] = useState<'today' | 'week' | 'month'>('month')

  // Live computed metrics from underlying mock records
  const dashboardData = useMemo(() => getMarketingDashboardMetrics(), [])

  // Leads count based on selected timeframe
  const currentLeadsCount =
    leadsTimeframe === 'today'
      ? dashboardData.leadsSummary.today
      : leadsTimeframe === 'week'
      ? dashboardData.leadsSummary.thisWeek
      : dashboardData.leadsSummary.thisMonth

  const timeframeLabel =
    leadsTimeframe === 'today'
      ? 'Today'
      : leadsTimeframe === 'week'
      ? 'This Week'
      : 'This Month'

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                <LayoutDashboard size={20} />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Marketing Dashboard
              </h1>
              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs">
                Overview
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              High-level marketing velocity, conversion efficiency, pipeline attribution, and ROI snapshot.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/campaigns">
              <Button variant="outline" size="sm" className="gap-1.5 border-slate-200 text-slate-700">
                <Megaphone size={14} />
                Campaigns
              </Button>
            </Link>
            <Link href="/campaign-analytics">
              <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
                <BarChart3 size={14} />
                Detailed Analytics
              </Button>
            </Link>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────────── */}
        {/* 1. TOP SUMMARY TILES (Clickable Drill-down Pattern)                     */}
        {/* ──────────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Tile 1: Active Campaigns */}
          <DashboardClickableTile
            label="Active Campaigns"
            value={dashboardData.campaignSummary.activeCount}
            href="/campaigns?status=Active"
            icon={Megaphone}
            colorScheme="indigo"
            subtext={
              <span className="truncate">
                {dashboardData.campaignSummary.plannedCount} Planned ·{' '}
                {dashboardData.campaignSummary.pausedCount} Paused ·{' '}
                {dashboardData.campaignSummary.completedCount} Done
              </span>
            }
          />

          {/* Tile 2: Leads Generated (with interactive timeframe toggle) */}
          <div className="block group">
            <Card className="h-full border-slate-200 transition-all duration-200 hover:shadow-md hover:border-blue-300 hover:bg-slate-50/60 flex flex-col justify-between">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Leads Generated
                      </span>
                      <Link href="/leads">
                        <ArrowRight
                          size={12}
                          className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-blue-500"
                        />
                      </Link>
                    </div>
                    <Link href="/leads">
                      <div className="text-3xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors">
                        {currentLeadsCount}
                      </div>
                    </Link>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-700 transition-transform group-hover:scale-105">
                    <Users size={22} />
                  </div>
                </div>

                {/* Interactive Timeframe Toggle */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-medium text-slate-600">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setLeadsTimeframe('today')
                      }}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        leadsTimeframe === 'today'
                          ? 'bg-white text-blue-700 font-bold shadow-xs'
                          : 'hover:text-slate-900'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setLeadsTimeframe('week')
                      }}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        leadsTimeframe === 'week'
                          ? 'bg-white text-blue-700 font-bold shadow-xs'
                          : 'hover:text-slate-900'
                      }`}
                    >
                      Week
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setLeadsTimeframe('month')
                      }}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        leadsTimeframe === 'month'
                          ? 'bg-white text-blue-700 font-bold shadow-xs'
                          : 'hover:text-slate-900'
                      }`}
                    >
                      Month
                    </button>
                  </div>
                  <Link
                    href="/leads"
                    className="text-[11px] text-blue-600 hover:underline font-medium shrink-0"
                  >
                    View All →
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tile 3: Qualified Leads (This Month) */}
          <DashboardClickableTile
            label="Qualified Leads"
            value={dashboardData.qualifiedLeadsThisMonth}
            href="/leads?status=QUALIFIED"
            icon={UserCheck}
            colorScheme="emerald"
            subtext={<span>Attributed marketing leads</span>}
          />

          {/* Tile 4: Opportunities from Marketing */}
          <DashboardClickableTile
            label="Marketing Opps"
            value={dashboardData.opportunitiesThisMonth}
            href="/opportunities"
            icon={TrendingUp}
            colorScheme="purple"
            subtext={<span>Downstream pipeline deals</span>}
          />

          {/* Tile 5: Closed Deals from Marketing */}
          <DashboardClickableTile
            label="Closed Deals"
            value={dashboardData.closedDealsThisMonth}
            href="/transactions"
            icon={Receipt}
            colorScheme="emerald"
            subtext={<span>Won marketing transactions</span>}
          />

          {/* Tile 6: Total Marketing Pipeline Value */}
          <DashboardClickableTile
            label="Pipeline Value"
            value={formatPrice(dashboardData.totalMarketingPipelineValue)}
            href="/opportunities"
            icon={DollarSign}
            colorScheme="amber"
            subtext={<span>Expected gross value</span>}
          />
        </div>

        {/* ──────────────────────────────────────────────────────────────────────── */}
        {/* 2 & 3. LEADS BY SOURCE & CAMPAIGN STATUS OVERVIEW                       */}
        {/* ──────────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SECTION 2: Leads by Source (2 Cols) */}
          <Card className="lg:col-span-2 border-slate-200 bg-white shadow-sm flex flex-col justify-between">
            <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Share2 size={18} className="text-indigo-600" />
                  Leads by Source & Channel
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Volume distribution across digital and offline acquisition channels.
                </CardDescription>
              </div>
              <Link
                href="/campaign-analytics#source-comparison"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 group"
              >
                Detailed Comparison
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5">
              {dashboardData.leadsBySource.slice(0, 6).map((item) => (
                <div key={item.source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{item.source}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                          item.channel_type === 'Digital'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {item.channel_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono">{item.count} leads</span>
                      <span className="text-slate-400 text-[11px] w-8 text-right font-mono">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  {/* Visual Bar Chart */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        item.channel_type === 'Digital' ? 'bg-blue-600' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.max(item.percentage, 4)}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-2 text-center">
                <Link
                  href="/campaign-analytics#source-comparison"
                  className="text-xs text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1 font-medium"
                >
                  Click to inspect full conversion rates and opp breakdown in Campaign Analytics →
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3: Campaign Status Overview (1 Col) */}
          <Card className="border-slate-200 bg-white shadow-sm flex flex-col justify-between">
            <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={18} className="text-indigo-600" />
                  Campaign Status
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Click any status to filter the Campaigns list.
                </CardDescription>
              </div>
              <Link
                href="/campaigns"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                All Campaigns
              </Link>
            </CardHeader>
            <CardContent className="p-5 space-y-2.5">
              {dashboardData.campaignStatusList.map((cs) => {
                const statusStyles: Record<CampaignStatus, { bg: string; text: string; badge: string }> = {
                  Active: { bg: 'hover:bg-emerald-50/70 border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-500' },
                  Planned: { bg: 'hover:bg-blue-50/70 border-blue-200', text: 'text-blue-800', badge: 'bg-blue-500' },
                  Paused: { bg: 'hover:bg-amber-50/70 border-amber-200', text: 'text-amber-800', badge: 'bg-amber-500' },
                  Completed: { bg: 'hover:bg-purple-50/70 border-purple-200', text: 'text-purple-800', badge: 'bg-purple-500' },
                  Draft: { bg: 'hover:bg-slate-100/70 border-slate-200', text: 'text-slate-800', badge: 'bg-slate-400' },
                  Cancelled: { bg: 'hover:bg-rose-50/70 border-rose-200', text: 'text-rose-800', badge: 'bg-rose-500' },
                }
                const style = statusStyles[cs.status]

                return (
                  <Link
                    key={cs.status}
                    href={`/campaigns?status=${cs.status}`}
                    className={`flex items-center justify-between p-2.5 rounded-lg border border-slate-100 transition-all duration-150 group cursor-pointer ${style.bg}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${style.badge}`} />
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-900">
                        {cs.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 font-mono px-2 py-0.5 rounded-full bg-slate-100 group-hover:bg-white shadow-2xs">
                        {cs.count}
                      </span>
                      <ChevronRight size={13} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* ──────────────────────────────────────────────────────────────────────── */}
        {/* 4 & 5. TOP PERFORMING CAMPAIGNS & MARKETING SPEND/CPL SUMMARY            */}
        {/* ──────────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SECTION 4: Top Performing Campaigns Leaderboard (2 Cols) */}
          <Card className="lg:col-span-2 border-slate-200 bg-white shadow-sm flex flex-col justify-between">
            <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Target size={18} className="text-indigo-600" />
                  Top Performing Campaigns
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Ranked by deal conversion rate and attributed leads generated.
                </CardDescription>
              </div>
              <Link
                href="/campaigns"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 group"
              >
                View All
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {dashboardData.topPerformingCampaigns.map((tc, idx) => (
                  <Link
                    key={tc.campaign.id}
                    href={`/campaigns?campaign=${tc.campaign.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-700'
                          : idx === 2
                          ? 'bg-amber-50 text-amber-900'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {tc.campaign.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 rounded">
                            {tc.campaign.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span>{tc.campaign.type}</span>
                          <span>•</span>
                          <span>Owner: {tc.campaign.owner_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-800">{tc.leadsCount} leads</div>
                        <div className="text-[11px] text-emerald-700 font-medium">
                          {tc.closedDealsCount} {tc.closedDealsCount === 1 ? 'deal closed' : 'deals closed'}
                        </div>
                      </div>
                      <div className="text-right min-w-[70px]">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          tc.conversionRate > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {tc.conversionRate.toFixed(1)}%
                        </span>
                      </div>
                      <ArrowUpRight size={15} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SECTION 5: Marketing Spend & CPL Summary (1 Col) */}
          <Card className="border-slate-200 bg-white shadow-sm flex flex-col justify-between">
            <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign size={18} className="text-indigo-600" />
                  Spend & CPL Summary
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Blended lead acquisition efficiency.
                </CardDescription>
              </div>
              <Link
                href="/campaign-analytics#roi-section"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                ROI View
              </Link>
            </CardHeader>
            <CardContent className="p-5 flex flex-col justify-between flex-1">
              {dashboardData.spendAndCpl.hasBudgetData ? (
                <div className="space-y-4">
                  {/* Total Spend */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Active Marketing Spend
                    </p>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {formatPrice(dashboardData.spendAndCpl.totalSpend)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Recorded across campaigns with active budget
                    </p>
                  </div>

                  {/* Blended CPL & CPQL */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200">
                      <p className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">
                        Blended CPL
                      </p>
                      <p className="text-lg font-bold text-blue-900 mt-1">
                        {dashboardData.spendAndCpl.blendedCPL !== null
                          ? formatPrice(dashboardData.spendAndCpl.blendedCPL)
                          : '—'}
                      </p>
                      <p className="text-[10px] text-blue-700 mt-0.5">Cost per lead</p>
                    </div>

                    <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-200">
                      <p className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider">
                        Blended CPQL
                      </p>
                      <p className="text-lg font-bold text-indigo-900 mt-1">
                        {dashboardData.spendAndCpl.blendedCPQL !== null
                          ? formatPrice(dashboardData.spendAndCpl.blendedCPQL)
                          : '—'}
                      </p>
                      <p className="text-[10px] text-indigo-700 mt-0.5">Per qualified lead</p>
                    </div>
                  </div>

                  <Link href="/campaign-analytics#roi-section" className="block pt-1">
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1 text-slate-700 border-slate-200 hover:bg-slate-50">
                      Detailed ROI Breakdown
                      <ArrowRight size={13} />
                    </Button>
                  </Link>
                </div>
              ) : (
                /* Graceful Empty State handling: No budget data recorded yet */
                <div className="py-8 px-4 text-center my-auto">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <AlertCircle size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    No budget data recorded yet
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-[220px] mx-auto">
                    Record actual spend on campaigns to automatically calculate blended CPL and CPQL.
                  </p>
                  <Link href="/campaigns" className="inline-block mt-4">
                    <Button variant="outline" size="sm" className="text-xs">
                      View Campaigns
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ──────────────────────────────────────────────────────────────────────── */}
        {/* 6. REFERRAL PARTNER SNAPSHOT (Full Width)                                */}
        {/* ──────────────────────────────────────────────────────────────────────── */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Handshake size={18} className="text-indigo-600" />
                Referral Partner Snapshot (Top 3)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Top external partners generating qualified leads and closed deal volume.
              </CardDescription>
            </div>
            <Link
              href="/referral-partners"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 group"
            >
              View All Partners
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-5 py-3">Partner Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Referral Code</th>
                    <th className="px-4 py-3 text-center">Leads Generated</th>
                    <th className="px-4 py-3 text-center">Deals Closed</th>
                    <th className="px-4 py-3 text-right">Deal Volume Generated</th>
                    <th className="px-5 py-3 text-right">Earned Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboardData.topReferralPartners.map((rp, idx) => (
                    <tr
                      key={rp.partner.id}
                      onClick={() => router.push(`/referral-partners?partner=${rp.partner.id}`)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono text-[11px]">#{idx + 1}</span>
                          <span className="group-hover:text-indigo-600 transition-colors">
                            {rp.partner.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {rp.partner.contact_person} · {rp.partner.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {rp.partner.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {rp.partner.referral_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800">
                        {rp.leadsCount}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-700">
                        {rp.dealsCount}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                        {rp.totalDealValue > 0 ? formatPrice(rp.totalDealValue) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-emerald-700">
                        {rp.totalCommission > 0 ? formatPrice(rp.totalCommission) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

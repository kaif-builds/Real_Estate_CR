'use client'

/**
 * Referral & Partner Management Module — Marketing Sub-module
 *
 * Directory of external brokers, developers, consultants, and corporate partners.
 * Tracks unique referral codes and downstream business generated:
 * Partner Referral Code → Lead → Opportunity → Deal (Transaction).
 *
 * Features:
 * - Live computed counts for Leads, Opportunities, and Closed Deals via getPartnerPerformance()
 * - Category and Status filtering + full-text search
 * - "+ Add Partner" modal with auto-generated referral code (editable)
 * - Partner Detail Drawer with financial summary banner and 3 drill-down tabs:
 *   1. Leads Generated
 *   2. Opportunities
 *   3. Deals Closed (with total volume and agency commission)
 * - Active / Inactive status toggle
 *
 * Role: SUPER_ADMIN, OFFICE_EXECUTIVE
 */

import React, { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import {
  Handshake, Plus, Search, Filter, Phone, Mail,
  CheckCircle2, XCircle, Users, TrendingUp, Receipt,
  Building2, MapPin, Eye, X, ArrowUpRight, RotateCcw,
  Sparkles, Check, ChevronRight, Copy, ExternalLink,
  ShieldCheck, AlertCircle, Calendar, DollarSign
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog } from '@/components/ui/dialog'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { formatPrice, formatDate } from '@/lib/formatters'
import {
  MOCK_REFERRAL_PARTNERS,
  getPartnerPerformance,
  type ReferralPartnerRow,
  type PartnerCategory,
  type PartnerStatus,
  type PartnerPerformanceStats,
} from '@/lib/mockData'

const PARTNER_CATEGORIES: PartnerCategory[] = [
  'Property Consultant',
  'Broker',
  'Developer',
  'Investor',
  'Corporate Contact',
  'Referral Partner',
  'Other',
]

// Auto-generate referral code utility
function generateReferralCode(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5)
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  return cleanName ? `REF-${cleanName}-${randomSuffix}` : `REF-${randomSuffix}`
}

function PartnerCategoryBadge({ category }: { category: PartnerCategory }) {
  const styles: Record<PartnerCategory, string> = {
    'Broker': 'bg-blue-50 text-blue-700 border-blue-200',
    'Developer': 'bg-amber-50 text-amber-800 border-amber-200',
    'Corporate Contact': 'bg-purple-50 text-purple-700 border-purple-200',
    'Investor': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Property Consultant': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Referral Partner': 'bg-sky-50 text-sky-700 border-sky-200',
    'Other': 'bg-slate-100 text-slate-700 border-slate-200',
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${styles[category] || styles['Other']}`}>
      {category}
    </span>
  )
}

function ReferralPartnersContent() {
  const [partners, setPartners] = useState<ReferralPartnerRow[]>([...MOCK_REFERRAL_PARTNERS])
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Detail Modal
  const [selectedPartner, setSelectedPartner] = useState<ReferralPartnerRow | null>(null)
  const [detailTab, setDetailTab] = useState<'leads' | 'opportunities' | 'deals'>('leads')

  // Add Partner Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState<PartnerCategory>('Broker')
  const [formContactPerson, setFormContactPerson] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formReferralCode, setFormReferralCode] = useState('')
  const [formStatus, setFormStatus] = useState<PartnerStatus>('Active')
  const [formNotes, setFormNotes] = useState('')

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Pre-calculate performance stats for all partners
  const partnerStatsMap = useMemo(() => {
    const map = new Map<string, PartnerPerformanceStats>()
    for (const p of partners) {
      const stats = getPartnerPerformance(p.id)
      if (stats) map.set(p.id, stats)
    }
    return map
  }, [partners])

  // Aggregate KPI summary
  const summaryKpis = useMemo(() => {
    const totalPartners = partners.length
    const activePartners = partners.filter((p) => p.status === 'Active').length
    let totalLeads = 0
    let totalOpps = 0
    let totalDeals = 0
    let totalDealValue = 0
    let totalCommission = 0

    for (const stats of Array.from(partnerStatsMap.values())) {
      totalLeads += stats.leadsCount
      totalOpps += stats.opportunitiesCount
      totalDeals += stats.dealsCount
      totalDealValue += stats.totalDealValue
      totalCommission += stats.totalCommission
    }

    return {
      totalPartners,
      activePartners,
      totalLeads,
      totalOpps,
      totalDeals,
      totalDealValue,
      totalCommission,
    }
  }, [partners, partnerStatsMap])

  // Filtered partners
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false
      if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = p.name.toLowerCase().includes(q)
        const matchContact = (p.contact_person || '').toLowerCase().includes(q)
        const matchCode = p.referral_code.toLowerCase().includes(q)
        const matchPhone = p.phone.toLowerCase().includes(q)
        const matchEmail = p.email.toLowerCase().includes(q)
        if (!matchName && !matchContact && !matchCode && !matchPhone && !matchEmail) return false
      }
      return true
    })
  }, [partners, selectedCategory, selectedStatus, searchQuery])

  // Open add modal and initialize code
  const handleOpenAdd = () => {
    setFormName('')
    setFormCategory('Broker')
    setFormContactPerson('')
    setFormPhone('')
    setFormEmail('')
    setFormReferralCode(generateReferralCode(''))
    setFormStatus('Active')
    setFormNotes('')
    setShowAddModal(true)
  }

  // Name change auto-generates referral code if untouched
  const handleNameChange = (val: string) => {
    setFormName(val)
    if (!formReferralCode || formReferralCode.startsWith('REF-')) {
      setFormReferralCode(generateReferralCode(val))
    }
  }

  // Handle Add Partner Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formReferralCode.trim()) return

    const newPartner: ReferralPartnerRow = {
      id: `RP-${Date.now().toString(36).toUpperCase().slice(-5)}`,
      name: formName.trim(),
      category: formCategory,
      contact_person: formContactPerson.trim() || undefined,
      phone: formPhone.trim(),
      email: formEmail.trim(),
      referral_code: formReferralCode.trim().toUpperCase(),
      status: formStatus,
      notes: formNotes.trim() || undefined,
      created_at: new Date().toISOString(),
    }

    setPartners((prev) => [newPartner, ...prev])
    setShowAddModal(false)
    showToast(`Partner "${newPartner.name}" registered successfully with code ${newPartner.referral_code}.`)
  }

  // Toggle Partner Status
  const handleToggleStatus = (partnerId: string) => {
    setPartners((prev) =>
      prev.map((p) => {
        if (p.id === partnerId) {
          const nextStatus: PartnerStatus = p.status === 'Active' ? 'Inactive' : 'Active'
          showToast(`Partner "${p.name}" marked as ${nextStatus}.`)
          return { ...p, status: nextStatus }
        }
        return p
      })
    )
  }

  // Selected partner performance stats
  const activePartnerStats = selectedPartner ? partnerStatsMap.get(selectedPartner.id) : null

  // Columns definition for DataTable
  const columns: ColumnDef<ReferralPartnerRow>[] = [
    {
      key: 'name',
      header: 'Partner Name',
      sortValue: (p) => p.name,
      render: (p) => (
        <div>
          <div className="flex items-center gap-2">
            <span
              onClick={() => {
                setSelectedPartner(p)
                setDetailTab('leads')
              }}
              className="font-semibold text-slate-900 text-xs hover:text-indigo-600 cursor-pointer"
            >
              {p.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <PartnerCategoryBadge category={p.category} />
            {p.contact_person && (
              <span className="text-[11px] text-slate-500">• {p.contact_person}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Info',
      sortValue: (p) => p.phone,
      render: (p) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Phone size={11} className="text-slate-400 shrink-0" />
            <a href={`tel:${p.phone}`} className="hover:underline">
              {p.phone}
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Mail size={11} className="text-slate-400 shrink-0" />
            <a href={`mailto:${p.email}`} className="hover:underline truncate max-w-[140px]">
              {p.email}
            </a>
          </div>
        </div>
      ),
    },
    {
      key: 'referral_code',
      header: 'Referral Code',
      sortValue: (p) => p.referral_code,
      render: (p) => (
        <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
          {p.referral_code}
        </span>
      ),
    },
    {
      key: 'leads_count',
      header: 'Leads Generated',
      sortValue: (p) => partnerStatsMap.get(p.id)?.leadsCount || 0,
      render: (p) => {
        const stats = partnerStatsMap.get(p.id)
        const count = stats?.leadsCount || 0
        return (
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded bg-indigo-50 text-indigo-600">
              <Users size={12} />
            </span>
            <span className="font-bold text-xs text-slate-900">{count}</span>
            <span className="text-[10px] text-slate-400">leads</span>
          </div>
        )
      },
    },
    {
      key: 'opportunities_count',
      header: 'Opportunities',
      sortValue: (p) => partnerStatsMap.get(p.id)?.opportunitiesCount || 0,
      render: (p) => {
        const stats = partnerStatsMap.get(p.id)
        const count = stats?.opportunitiesCount || 0
        return (
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded bg-amber-50 text-amber-600">
              <TrendingUp size={12} />
            </span>
            <span className="font-bold text-xs text-amber-700">{count}</span>
            <span className="text-[10px] text-slate-400">opps</span>
          </div>
        )
      },
    },
    {
      key: 'deals_count',
      header: 'Deals Closed',
      sortValue: (p) => partnerStatsMap.get(p.id)?.dealsCount || 0,
      render: (p) => {
        const stats = partnerStatsMap.get(p.id)
        const count = stats?.dealsCount || 0
        const volume = stats?.totalDealValue || 0
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={12} />
              </span>
              <span className="font-bold text-xs text-emerald-700">{count}</span>
              <span className="text-[10px] text-slate-400">deals</span>
            </div>
            {volume > 0 && (
              <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                {formatPrice(volume)}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (p) => p.status,
      render: (p) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            p.status === 'Active'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {p.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      render: (p) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedPartner(p)
              setDetailTab('leads')
            }}
            className="text-xs h-7 px-2 border-slate-200 hover:bg-slate-100 text-slate-700"
          >
            <Eye size={12} className="mr-1" />
            Inspect
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(p.id)}
            className={`text-xs h-7 px-2 ${
              p.status === 'Active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {p.status === 'Active' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                <Handshake size={20} />
              </span>
              <h1 className="text-2xl font-bold text-slate-900">
                Referral &amp; Partner Management
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Register marketing, broker, developer, and corporate partners. Track their unique referral codes,
              monitor downstream business generation, and link them to collaborative campaigns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/marketing-traceability">
              <Button variant="outline" size="sm" className="text-xs border-slate-300">
                <TrendingUp size={14} className="mr-1.5 text-indigo-600" />
                Traceability Matrix
              </Button>
            </Link>
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs shadow-xs"
            >
              <Plus size={14} className="mr-1.5" />
              Add Partner
            </Button>
          </div>
        </div>

        {/* ── KPI Summary Cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Registered Partners */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Referral Partners
                </span>
                <span className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                  <Handshake size={16} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{summaryKpis.totalPartners}</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {summaryKpis.activePartners} Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Brokers, consultants &amp; affiliates
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Partner Leads */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Partner-Referred Leads
                </span>
                <span className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                  <Users size={16} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-600">{summaryKpis.totalLeads}</span>
                <span className="text-xs text-slate-400">Total volume</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Attributed via referral codes
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Opportunities Created */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Downstream Opps
                </span>
                <span className="p-1.5 rounded-md bg-amber-50 text-amber-600">
                  <TrendingUp size={16} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600">{summaryKpis.totalOpps}</span>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                  Pipeline Deals
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Active negotiations &amp; visits
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Closed Deals & Revenue */}
          <Card className="border border-emerald-200 bg-emerald-50/30 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  Closed Deals Volume
                </span>
                <span className="p-1.5 rounded-md bg-emerald-100 text-emerald-700">
                  <Receipt size={16} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-700">{summaryKpis.totalDeals}</span>
                <span className="text-xs font-bold text-emerald-800">
                  {formatPrice(summaryKpis.totalDealValue)}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                Agency Comm: {formatPrice(summaryKpis.totalCommission)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Filter Bar ───────────────────────────────────────────────────── */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Search name, code, contact, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            {/* Category Filter */}
            <div>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs h-9"
              >
                <option value="ALL">All Partner Categories</option>
                {PARTNER_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs h-9"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active Partners</option>
                <option value="Inactive">Inactive Partners</option>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Showing <strong className="text-slate-800">{filteredPartners.length}</strong> registered partners
            </span>
            {(selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategory('ALL')
                  setSelectedStatus('ALL')
                  setSearchQuery('')
                }}
                className="text-xs h-7 text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <RotateCcw size={11} /> Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* ── Partners Data Table ─────────────────────────────────────────── */}
        <DataTable<ReferralPartnerRow>
          data={filteredPartners}
          columns={columns}
          rowKey={(p) => p.id}
          totalCount={partners.length}
        />

        {/* ── Partner Detail Drawer / Modal ───────────────────────────────── */}
        {selectedPartner && activePartnerStats && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
                      {selectedPartner.referral_code}
                    </span>
                    <PartnerCategoryBadge category={selectedPartner.category} />
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        selectedPartner.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {selectedPartner.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {selectedPartner.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedPartner(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 overflow-y-auto">
                {/* Financial Overview Banner */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-4 shadow-sm border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={13} /> Business Generated Overview
                    </span>
                    <span className="text-xs text-slate-300">
                      Partner ID: <strong className="text-white font-mono">{selectedPartner.id}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                    <div className="bg-white/10 rounded-lg p-2.5 border border-white/10">
                      <span className="text-[10px] text-slate-300 block uppercase font-medium">Attributed Leads</span>
                      <span className="text-xl font-black text-white">{activePartnerStats.leadsCount}</span>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2.5 border border-white/10">
                      <span className="text-[10px] text-slate-300 block uppercase font-medium">Opportunities</span>
                      <span className="text-xl font-black text-amber-400">{activePartnerStats.opportunitiesCount}</span>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2.5 border border-white/10">
                      <span className="text-[10px] text-slate-300 block uppercase font-medium">Deals Closed</span>
                      <span className="text-xl font-black text-emerald-400">{activePartnerStats.dealsCount}</span>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2.5 border border-white/10">
                      <span className="text-[10px] text-slate-300 block uppercase font-medium">Closed Volume</span>
                      <span className="text-lg font-bold text-emerald-400">
                        {formatPrice(activePartnerStats.totalDealValue)}
                      </span>
                    </div>
                  </div>

                  {activePartnerStats.totalCommission > 0 && (
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-emerald-300">
                      <span>Agency Commission Realized:</span>
                      <span className="font-bold text-white text-sm">
                        {formatPrice(activePartnerStats.totalCommission)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Profile Contact info */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Contact Person</span>
                    <span className="font-semibold text-slate-800">{selectedPartner.contact_person || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Phone Number</span>
                    <a href={`tel:${selectedPartner.phone}`} className="font-semibold text-indigo-600 hover:underline">
                      {selectedPartner.phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Email Address</span>
                    <a href={`mailto:${selectedPartner.email}`} className="font-semibold text-indigo-600 hover:underline truncate block">
                      {selectedPartner.email}
                    </a>
                  </div>
                </div>

                {selectedPartner.notes && (
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    &ldquo;{selectedPartner.notes}&rdquo;
                  </p>
                )}

                {/* 3 Detail Tabs */}
                <div className="border-b border-slate-200 flex gap-4 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDetailTab('leads')}
                    className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                      detailTab === 'leads'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Users size={14} /> Leads Generated ({activePartnerStats.leadsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('opportunities')}
                    className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                      detailTab === 'opportunities'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <TrendingUp size={14} /> Opportunities ({activePartnerStats.opportunitiesCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('deals')}
                    className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                      detailTab === 'deals'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Receipt size={14} /> Deals Closed ({activePartnerStats.dealsCount})
                  </button>
                </div>

                {/* Tab 1: Leads Generated */}
                {detailTab === 'leads' && (
                  <div className="space-y-3">
                    {activePartnerStats.leads.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                          {activePartnerStats.leads.map((lead) => (
                            <div key={lead.id} className="p-3 hover:bg-slate-50 flex items-center justify-between text-xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900">{lead.party_name}</span>
                                  <Link
                                    href={`/leads?search=${lead.id}`}
                                    className="font-mono text-[10px] text-indigo-600 hover:underline"
                                  >
                                    {lead.id}
                                  </Link>
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                                    {lead.lead_type}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                  <span>Status: <strong className="text-slate-700">{lead.status}</strong></span>
                                  <span>•</span>
                                  <span>Assigned: {lead.assigned_to_name || 'Unassigned'}</span>
                                  <span>•</span>
                                  <span>Captured: {formatDate(lead.created_at || '')}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-semibold text-slate-900 block">
                                  {lead.value ? formatPrice(lead.value) : '—'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
                        No leads have been attributed to this partner yet.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Opportunities */}
                {detailTab === 'opportunities' && (
                  <div className="space-y-3">
                    {activePartnerStats.opportunities.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                          {activePartnerStats.opportunities.map((opp) => (
                            <div key={opp.id} className="p-3 hover:bg-slate-50 flex items-center justify-between text-xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    href="/opportunities"
                                    className="font-mono font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                                  >
                                    {opp.id}
                                    <ExternalLink size={10} />
                                  </Link>
                                  <span className="font-semibold text-slate-900">{opp.client_name}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                  <span>Location: <strong className="text-slate-700">{opp.property_short_loc}</strong></span>
                                  <span>•</span>
                                  <span>Stage: <strong className="text-amber-700">{opp.stage}</strong></span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-slate-900 block">
                                  {formatPrice(opp.expected_value)}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Prob: {opp.probability}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
                        No downstream opportunities traced from this partner&apos;s leads yet.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Deals Closed */}
                {detailTab === 'deals' && (
                  <div className="space-y-3">
                    {activePartnerStats.deals.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                          {activePartnerStats.deals.map((deal) => (
                            <div key={deal.id} className="p-3 hover:bg-slate-50 flex items-center justify-between text-xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    href="/transactions"
                                    className="font-mono font-semibold text-emerald-700 hover:underline flex items-center gap-0.5"
                                  >
                                    {deal.id}
                                    <ExternalLink size={10} />
                                  </Link>
                                  <span className="font-semibold text-slate-900">{deal.client_name}</span>
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                                    {deal.payment_status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                  <span>Property: <strong className="text-slate-700">{deal.property_short_loc}</strong></span>
                                  <span>•</span>
                                  <span>Closed: {formatDate(deal.closed_date)}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-slate-900 block text-xs">
                                  {formatPrice(deal.transaction_value)}
                                </span>
                                <span className="text-[11px] font-semibold text-emerald-700">
                                  Comm: {formatPrice(deal.commission_amount)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
                        No closed transactions recorded for this partner yet.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSelectedPartner(null)}
                  className="bg-slate-900 text-white text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── "+ Add Partner" Modal ────────────────────────────────────────── */}
        <Dialog
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Register Referral Partner"
          className="max-w-lg"
        >
          <form onSubmit={handleAddSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Partner Name */}
            <div>
              <Label htmlFor="partner_name">Partner / Agency Name *</Label>
              <Input
                id="partner_name"
                required
                placeholder="e.g. Apex Property Consultants"
                value={formName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            {/* Category & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="partner_category">Partner Category *</Label>
                <Select
                  id="partner_category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as PartnerCategory)}
                  className="mt-1 text-xs"
                >
                  {PARTNER_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="partner_status">Initial Status</Label>
                <Select
                  id="partner_status"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as PartnerStatus)}
                  className="mt-1 text-xs"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Select>
              </div>
            </div>

            {/* Contact Person */}
            <div>
              <Label htmlFor="contact_person">Key Contact Person</Label>
              <Input
                id="contact_person"
                placeholder="e.g. Rajesh Sharma"
                value={formContactPerson}
                onChange={(e) => setFormContactPerson(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="partner_phone">Phone Number *</Label>
                <Input
                  id="partner_phone"
                  required
                  placeholder="+91 98260 12345"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="partner_email">Email Address *</Label>
                <Input
                  id="partner_email"
                  type="email"
                  required
                  placeholder="contact@agency.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            {/* Referral Code (Auto-generated & editable) */}
            <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="referral_code" className="text-xs font-bold text-indigo-900">
                  Unique Referral Code *
                </Label>
                <button
                  type="button"
                  onClick={() => setFormReferralCode(generateReferralCode(formName))}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  Regenerate
                </button>
              </div>
              <Input
                id="referral_code"
                required
                placeholder="e.g. REF-APEX-101"
                value={formReferralCode}
                onChange={(e) => setFormReferralCode(e.target.value.toUpperCase())}
                className="font-mono font-bold text-xs bg-white text-indigo-900"
              />
              <p className="text-[10px] text-slate-500">
                This code can be entered on digital forms, landing pages, or lead creation to attribute business to this partner.
              </p>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="partner_notes">Notes / Collaboration Remarks</Label>
              <Textarea
                id="partner_notes"
                rows={2}
                placeholder="e.g. Specialist in Scheme 140 luxury high-rise units; 2% referral fee contract."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                Register Partner
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  )
}

export default function ReferralPartnersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
          Loading Referral Partners Directory...
        </div>
      }
    >
      <ReferralPartnersContent />
    </Suspense>
  )
}

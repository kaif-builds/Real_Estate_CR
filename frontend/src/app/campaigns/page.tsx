'use client'

/**
 * Marketing Module — Campaigns Page
 *
 * Dedicated sub-module for creating, managing, and tracking marketing campaigns.
 * Features:
 * - Sortable & filterable DataTable (Type, Status, Owner, Date Range, Search)
 * - Computed "Leads Generated" count from linked mock leads
 * - "+ New Campaign" modal form with multi-select fields (Audience, Category, Transaction Type)
 * - Campaign Detail View with Overview metrics and placeholder tabs:
 *   "Promoted Properties" and "Leads Generated"
 * - Preserves immutable campaign history: NO delete action, only status transitions
 *
 * Role: SUPER_ADMIN, OFFICE_EXECUTIVE
 */

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Megaphone, Plus, Search, Calendar, Users, Target, Building2,
  TrendingUp, CheckCircle2, Clock, AlertCircle, PauseCircle,
  XCircle, Eye, ArrowRight, Layers, Tag, MapPin, IndianRupee,
  FileText, Check, ChevronRight, BarChart3, ShieldCheck
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
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
  MOCK_CAMPAIGNS, MOCK_LEADS, MOCK_USERS, MOCK_PROPERTIES,
  type CampaignRow, type CampaignType, type CampaignStatus,
  type TargetAudienceType, type PropertyCategoryType, type TransactionType,
  type LeadRow
} from '@/lib/mockData'

// ── Dropdown Constants ────────────────────────────────────────────────────────

const CAMPAIGN_TYPES: CampaignType[] = [
  'Property Promotion',
  'Buyer Acquisition',
  'Seller Acquisition',
  'Tenant Acquisition',
  'Landlord Acquisition',
  'Investor Acquisition',
  'Brand Awareness',
  'Lead Generation',
]

const CAMPAIGN_STATUSES: CampaignStatus[] = [
  'Draft',
  'Planned',
  'Active',
  'Paused',
  'Completed',
  'Cancelled',
]

const AUDIENCE_OPTIONS: TargetAudienceType[] = [
  'Buyers',
  'Sellers',
  'Owners',
  'Tenants',
  'Landlords',
  'Investors',
  'Developers',
  'Brokers',
]

const CATEGORY_OPTIONS: PropertyCategoryType[] = [
  'Residential',
  'Commercial',
  'Industrial',
  'Agricultural',
]

const TRANSACTION_OPTIONS: TransactionType[] = [
  'Sale',
  'Purchase',
  'Rent',
  'Lease',
]

const DATE_RANGE_OPTIONS = [
  { value: 'ALL', label: 'All Dates' },
  { value: 'ACTIVE_NOW', label: 'Currently Active' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'COMPLETED_PAST', label: 'Completed / Past' },
] as const

const COMMON_SHORT_LOCS = [
  '01-Schm140_Mayank',
  '09-Super_Corridor',
  '05-MG_Road',
  '04-Vijay_Nagar',
  '07-Geeta_Bhawan',
  '08-SAPNA_SANGEETA',
]

// ── Status Badge Helper ───────────────────────────────────────────────────────

function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  switch (status) {
    case 'Active':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Active
        </span>
      )
    case 'Planned':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
          <Clock size={12} className="text-blue-600" />
          Planned
        </span>
      )
    case 'Paused':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <PauseCircle size={12} className="text-amber-600" />
          Paused
        </span>
      )
    case 'Completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
          <CheckCircle2 size={12} className="text-purple-600" />
          Completed
        </span>
      )
    case 'Cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          <XCircle size={12} className="text-rose-600" />
          Cancelled
        </span>
      )
    case 'Draft':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          <FileText size={12} className="text-slate-500" />
          Draft
        </span>
      )
  }
}

// ── Main Campaigns Component ──────────────────────────────────────────────────

function CampaignsContent() {
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get('status') || ''
  const initialSearch = searchParams.get('search') || ''
  const initialCreate = searchParams.get('create') === 'true'
  const initialCampaignId = searchParams.get('campaign') || ''
  const initialTab = (searchParams.get('tab') as 'overview' | 'properties' | 'leads') || 'overview'

  // State
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([...MOCK_CAMPAIGNS])
  const [leads] = useState<LeadRow[]>([...MOCK_LEADS])

  // Filters
  const [fType, setFType] = useState<string>('')
  const [fStatus, setFStatus] = useState<string>(initialStatus)
  const [fOwner, setFOwner] = useState<string>('')
  const [fDateRange, setFDateRange] = useState<string>('ALL')

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(initialCreate)
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignRow | null>(() => {
    if (initialCampaignId) {
      return MOCK_CAMPAIGNS.find(c => c.id === initialCampaignId) || null
    }
    return null
  })
  const [detailTab, setDetailTab] = useState<'overview' | 'properties' | 'leads'>(initialTab)

  // "+ New Campaign" form local state
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<CampaignType>('Property Promotion')
  const [formObjective, setFormObjective] = useState('')
  const [formAudience, setFormAudience] = useState<TargetAudienceType[]>(['Buyers', 'Investors'])
  const [formGeography, setFormGeography] = useState('')
  const [formCategories, setFormCategories] = useState<PropertyCategoryType[]>(['Residential'])
  const [formTransactions, setFormTransactions] = useState<TransactionType[]>(['Sale'])
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0])
  const [formEndDate, setFormEndDate] = useState('')
  const [formOwnerId, setFormOwnerId] = useState(MOCK_USERS[1]?.id || 'u2')
  const [formBudget, setFormBudget] = useState('50000')
  const [formTargetLeads, setFormTargetLeads] = useState('50')
  const [formTargetQualified, setFormTargetQualified] = useState('20')
  const [formTargetOpps, setFormTargetOpps] = useState('8')
  const [formStatus, setFormStatus] = useState<CampaignStatus>('Planned')

  useEffect(() => {
    if (initialStatus) {
      setFStatus(initialStatus)
    }
    if (initialCreate) {
      setShowCreateModal(true)
    }
    if (initialCampaignId) {
      const match = campaigns.find(c => c.id === initialCampaignId)
      if (match) {
        setSelectedCampaign(match)
        if (initialTab) setDetailTab(initialTab)
      }
    }
  }, [initialStatus, initialCreate, initialCampaignId, initialTab, campaigns])

  // Distinct Owners for Filter
  const distinctOwners = useMemo(() => {
    const map = new Map<string, string>()
    campaigns.forEach(c => map.set(c.owner_id, c.owner_name))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [campaigns])

  // Compute linked leads count for a campaign
  const getLinkedLeads = useCallback((campaignId: string) => {
    return leads.filter(l => l.campaign_id === campaignId)
  }, [leads])

  // Inline status updater (Strictly preserves campaign history — no delete)
  const updateCampaignStatus = useCallback((id: string, newStatus: CampaignStatus) => {
    setCampaigns(prev =>
      prev.map(c =>
        c.id === id ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c
      )
    )
    setSelectedCampaign(prev =>
      prev && prev.id === id ? { ...prev, status: newStatus, updated_at: new Date().toISOString() } : prev
    )
  }, [])

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]

    return campaigns.filter(c => {
      if (fType && c.type !== fType) return false
      if (fStatus && c.status !== fStatus) return false
      if (fOwner && c.owner_id !== fOwner) return false

      if (fDateRange === 'ACTIVE_NOW') {
        if (c.status !== 'Active') return false
        if (c.start_date && c.start_date > today) return false
        if (c.end_date && c.end_date < today) return false
      } else if (fDateRange === 'UPCOMING') {
        if (c.start_date && c.start_date <= today) return false
      } else if (fDateRange === 'COMPLETED_PAST') {
        if (c.status !== 'Completed' && (!c.end_date || c.end_date >= today)) return false
      }

      return true
    })
  }, [campaigns, fType, fStatus, fOwner, fDateRange])

  // ── Create Campaign Form Handlers ──────────────────────────────────────────

  const toggleAudience = (aud: TargetAudienceType) => {
    setFormAudience(prev =>
      prev.includes(aud) ? prev.filter(a => a !== aud) : [...prev, aud]
    )
  }

  const toggleCategory = (cat: PropertyCategoryType) => {
    setFormCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const toggleTransaction = (txn: TransactionType) => {
    setFormTransactions(prev =>
      prev.includes(txn) ? prev.filter(t => t !== txn) : [...prev, txn]
    )
  }

  const handleAddShortLoc = (loc: string) => {
    if (!formGeography) {
      setFormGeography(loc)
    } else if (!formGeography.includes(loc)) {
      setFormGeography(`${formGeography}, ${loc}`)
    }
  }

  const resetCreateForm = () => {
    setFormName('')
    setFormType('Property Promotion')
    setFormObjective('')
    setFormAudience(['Buyers', 'Investors'])
    setFormGeography('')
    setFormCategories(['Residential'])
    setFormTransactions(['Sale'])
    setFormStartDate(new Date().toISOString().split('T')[0])
    setFormEndDate('')
    setFormOwnerId(MOCK_USERS[1]?.id || 'u2')
    setFormBudget('50000')
    setFormTargetLeads('50')
    setFormTargetQualified('20')
    setFormTargetOpps('8')
    setFormStatus('Planned')
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    const ownerUser = MOCK_USERS.find(u => u.id === formOwnerId)
    const newId = `CMP-${new Date().getFullYear()}-${String(campaigns.length + 1).padStart(3, '0')}`

    const newCampaign: CampaignRow = {
      id: newId,
      name: formName.trim(),
      type: formType,
      status: formStatus,
      start_date: formStartDate,
      end_date: formEndDate || formStartDate,
      owner_id: formOwnerId,
      owner_name: ownerUser?.name || 'Aman Desai',
      objective: formObjective.trim(),
      target_audience: formAudience.length > 0 ? formAudience : ['Buyers'],
      geography: formGeography.trim() || 'Indore Metro Region',
      categories: formCategories.length > 0 ? formCategories : ['Residential'],
      transaction_types: formTransactions.length > 0 ? formTransactions : ['Sale'],
      planned_budget: parseFloat(formBudget) || 0,
      target_leads: parseInt(formTargetLeads, 10) || 0,
      target_qualified_leads: parseInt(formTargetQualified, 10) || 0,
      target_opportunities: parseInt(formTargetOpps, 10) || 0,
      promoted_properties: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setCampaigns(prev => [newCampaign, ...prev])
    setShowCreateModal(false)
    resetCreateForm()
  }

  // ── DataTable Columns ──────────────────────────────────────────────────────

  const columns: ColumnDef<CampaignRow>[] = useMemo(() => [
    {
      key: 'id',
      header: 'Campaign ID',
      sortValue: (r) => r.id,
      render: (r) => (
        <button
          onClick={() => { setSelectedCampaign(r); setDetailTab('overview') }}
          className="font-mono text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
        >
          {r.id}
        </button>
      ),
    },
    {
      key: 'name',
      header: 'Campaign Name',
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <button
            onClick={() => { setSelectedCampaign(r); setDetailTab('overview') }}
            className="font-medium text-slate-900 hover:text-indigo-600 text-left line-clamp-1 block transition-colors"
          >
            {r.name}
          </button>
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{r.objective || '—'}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortValue: (r) => r.type,
      render: (r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 whitespace-nowrap">
          {r.type}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.status,
      render: (r) => <CampaignStatusBadge status={r.status} />,
    },
    {
      key: 'start_date',
      header: 'Start Date',
      sortValue: (r) => r.start_date,
      render: (r) => <span className="text-xs text-slate-600 whitespace-nowrap">{formatDate(r.start_date)}</span>,
    },
    {
      key: 'end_date',
      header: 'End Date',
      sortValue: (r) => r.end_date,
      render: (r) => <span className="text-xs text-slate-600 whitespace-nowrap">{formatDate(r.end_date)}</span>,
    },
    {
      key: 'owner',
      header: 'Owner',
      sortValue: (r) => r.owner_name,
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
            {r.owner_name.charAt(0)}
          </div>
          <span className="text-xs text-slate-700 font-medium whitespace-nowrap">{r.owner_name}</span>
        </div>
      ),
    },
    {
      key: 'leads_generated',
      header: 'Leads Generated',
      align: 'center',
      sortValue: (r) => getLinkedLeads(r.id).length,
      render: (r) => {
        const count = getLinkedLeads(r.id).length
        return (
          <button
            onClick={() => { setSelectedCampaign(r); setDetailTab('leads') }}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200"
            title="Click to view linked leads"
          >
            <Users size={12} />
            <span>{count}</span>
            <span className="text-slate-400 font-normal">/ {r.target_leads}</span>
          </button>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setSelectedCampaign(r); setDetailTab('overview') }}
            className="h-7 text-xs px-2 text-slate-600 hover:text-slate-900"
            title="View Campaign Details"
          >
            <Eye size={13} className="mr-1" /> View
          </Button>

          {/* Status Quick Changer (Strictly preserves history - NO delete action) */}
          <Select
            value={r.status}
            onChange={(e) => updateCampaignStatus(r.id, e.target.value as CampaignStatus)}
            className="h-7 text-xs px-1.5 w-auto min-w-[100px]"
            title="Update Campaign Status"
          >
            {CAMPAIGN_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
      ),
    },
  ], [getLinkedLeads, updateCampaignStatus])

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Megaphone size={22} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Plan, execute, and monitor multi-channel marketing campaigns across properties and audiences.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => { resetCreateForm(); setShowCreateModal(true) }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              <Plus size={16} className="mr-1.5" /> New Campaign
            </Button>
          </div>
        </div>

        {/* Metrics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Campaigns</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{campaigns.length}</p>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
              <span className="text-emerald-600 font-semibold">{campaigns.filter(c => c.status === 'Active').length} Active</span>
              <span>•</span>
              <span>{campaigns.filter(c => c.status === 'Planned').length} Planned</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Budget Planned</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {formatPrice(campaigns.reduce((acc, c) => acc + c.planned_budget, 0))}
            </p>
            <p className="text-xs text-slate-500 mt-1.5">Across {campaigns.length} campaigns</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Leads Generated</span>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {campaigns.reduce((acc, c) => acc + getLinkedLeads(c.id).length, 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1.5">Directly attributed to campaigns</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Pipeline Leads</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {campaigns.reduce((acc, c) => acc + c.target_leads, 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1.5">Cumulative goal across active/planned</p>
          </div>
        </div>

        {/* DataTable with Filters */}
        <DataTable<CampaignRow>
          columns={columns}
          data={filteredCampaigns}
          totalCount={campaigns.length}
          initialSearch={initialSearch}
          rowKey={(r) => r.id}
          searchFields={[
            (r) => r.name,
            (r) => r.id,
            (r) => r.owner_name,
            (r) => r.geography,
            (r) => r.objective,
            (r) => r.type,
          ]}
          searchPlaceholder="Search campaigns by name, ID, owner, location…"
          hasActiveFilters={!!fType || !!fStatus || !!fOwner || fDateRange !== 'ALL'}
          onClearFilters={() => {
            setFType('')
            setFStatus('')
            setFOwner('')
            setFDateRange('ALL')
          }}
          emptyTitle="No campaigns found"
          emptyDescription='Try adjusting your search and filter criteria or click "+ New Campaign" to create one.'
          filterSlot={
            <>
              {/* Type Filter */}
              <Select
                value={fType}
                onChange={e => setFType(e.target.value)}
                className="h-8 text-sm min-w-[140px] w-auto"
              >
                <option value="">All Types</option>
                {CAMPAIGN_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>

              {/* Status Filter */}
              <Select
                value={fStatus}
                onChange={e => setFStatus(e.target.value)}
                className="h-8 text-sm min-w-[120px] w-auto"
              >
                <option value="">All Statuses</option>
                {CAMPAIGN_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>

              {/* Owner Filter */}
              <Select
                value={fOwner}
                onChange={e => setFOwner(e.target.value)}
                className="h-8 text-sm min-w-[130px] w-auto"
              >
                <option value="">All Owners</option>
                {distinctOwners.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </Select>

              {/* Date Range Filter */}
              <Select
                value={fDateRange}
                onChange={e => setFDateRange(e.target.value)}
                className="h-8 text-sm min-w-[130px] w-auto"
              >
                {DATE_RANGE_OPTIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </Select>
            </>
          }
        />

        {/* ── "+ New Campaign" Modal Form ─────────────────────────────────── */}
        <Dialog
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Campaign"
          className="max-w-2xl"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Campaign Name */}
            <div>
              <Label htmlFor="campaign_name">Campaign Name *</Label>
              <Input
                id="campaign_name"
                required
                placeholder="e.g. Scheme 140 Luxury High-Rise Influx"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Type & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="campaign_type">Campaign Type *</Label>
                <Select
                  id="campaign_type"
                  value={formType}
                  onChange={e => setFormType(e.target.value as CampaignType)}
                  className="mt-1"
                >
                  {CAMPAIGN_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="campaign_status">Initial Status</Label>
                <Select
                  id="campaign_status"
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as CampaignStatus)}
                  className="mt-1"
                >
                  {CAMPAIGN_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Objective / Description */}
            <div>
              <Label htmlFor="campaign_objective">Objective / Description</Label>
              <Textarea
                id="campaign_objective"
                rows={2}
                placeholder="Describe the main goal, channel plan, or target outcome…"
                value={formObjective}
                onChange={e => setFormObjective(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Target Audience (Multi-Select Pills) */}
            <div>
              <Label className="block mb-1.5">Target Audience (Multi-select)</Label>
              <div className="flex flex-wrap gap-1.5">
                {AUDIENCE_OPTIONS.map(aud => {
                  const selected = formAudience.includes(aud)
                  return (
                    <button
                      key={aud}
                      type="button"
                      onClick={() => toggleAudience(aud)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        selected
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {selected && <Check size={12} />}
                      {aud}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Geography / Location */}
            <div>
              <Label htmlFor="campaign_geography">Geography / Location</Label>
              <Input
                id="campaign_geography"
                placeholder="e.g. 01-Schm140_Mayank, Indore or Super Corridor"
                value={formGeography}
                onChange={e => setFormGeography(e.target.value)}
                className="mt-1"
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="text-[11px] text-slate-400">Quick add:</span>
                {COMMON_SHORT_LOCS.map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => handleAddShortLoc(loc)}
                    className="text-[11px] font-mono bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 transition-colors"
                  >
                    +{loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Category & Transaction Type (Multi-Select) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="block mb-1.5">Property Category</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_OPTIONS.map(cat => {
                    const selected = formCategories.includes(cat)
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                          selected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {selected && <Check size={10} />}
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <Label className="block mb-1.5">Transaction Type</Label>
                <div className="flex flex-wrap gap-1.5">
                  {TRANSACTION_OPTIONS.map(txn => {
                    const selected = formTransactions.includes(txn)
                    return (
                      <button
                        key={txn}
                        type="button"
                        onClick={() => toggleTransaction(txn)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                          selected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {selected && <Check size={10} />}
                        {txn}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Dates & Owner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="campaign_start_date">Start Date</Label>
                <Input
                  id="campaign_start_date"
                  type="date"
                  value={formStartDate}
                  onChange={e => setFormStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="campaign_end_date">End Date</Label>
                <Input
                  id="campaign_end_date"
                  type="date"
                  value={formEndDate}
                  onChange={e => setFormEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="campaign_owner">Owner (Staff) *</Label>
                <Select
                  id="campaign_owner"
                  value={formOwnerId}
                  onChange={e => setFormOwnerId(e.target.value)}
                  className="mt-1"
                >
                  {MOCK_USERS.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Budget & Goals */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Budget & Target Goals
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label htmlFor="form_budget" className="text-xs">Planned Budget (₹)</Label>
                  <Input
                    id="form_budget"
                    type="number"
                    min="0"
                    step="5000"
                    value={formBudget}
                    onChange={e => setFormBudget(e.target.value)}
                    className="mt-1 h-8 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="form_leads" className="text-xs">Target Leads</Label>
                  <Input
                    id="form_leads"
                    type="number"
                    min="0"
                    value={formTargetLeads}
                    onChange={e => setFormTargetLeads(e.target.value)}
                    className="mt-1 h-8 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="form_qualified" className="text-xs">Target Qualified</Label>
                  <Input
                    id="form_qualified"
                    type="number"
                    min="0"
                    value={formTargetQualified}
                    onChange={e => setFormTargetQualified(e.target.value)}
                    className="mt-1 h-8 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="form_opps" className="text-xs">Target Deals</Label>
                  <Input
                    id="form_opps"
                    type="number"
                    min="0"
                    value={formTargetOpps}
                    onChange={e => setFormTargetOpps(e.target.value)}
                    className="mt-1 h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Create Campaign
              </Button>
            </div>
          </form>
        </Dialog>

        {/* ── Campaign Detail View Modal ───────────────────────────────────── */}
        {selectedCampaign && (
          <Dialog
            open={!!selectedCampaign}
            onClose={() => setSelectedCampaign(null)}
            title="Campaign Details"
            className="max-w-3xl"
          >
            <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
              {/* Header Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
                        {selectedCampaign.id}
                      </span>
                      <CampaignStatusBadge status={selectedCampaign.status} />
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                        {selectedCampaign.type}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-1.5">{selectedCampaign.name}</h2>
                  </div>

                  {/* Quick Status Transition (NO delete action) */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor="detail_status_change" className="text-xs text-slate-500 whitespace-nowrap">
                      Change Status:
                    </Label>
                    <Select
                      id="detail_status_change"
                      value={selectedCampaign.status}
                      onChange={(e) => updateCampaignStatus(selectedCampaign.id, e.target.value as CampaignStatus)}
                      className="h-8 text-xs font-semibold w-auto min-w-[110px]"
                    >
                      {CAMPAIGN_STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <p className="text-sm text-slate-600">
                  {selectedCampaign.objective || 'No campaign objective provided.'}
                </p>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-slate-200 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    <span>Timeline: <strong>{formatDate(selectedCampaign.start_date)}</strong> – <strong>{formatDate(selectedCampaign.end_date)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={13} className="text-slate-400" />
                    <span>Owner: <strong className="text-slate-700">{selectedCampaign.owner_name}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400" />
                    <span>Location: <strong className="text-slate-700">{selectedCampaign.geography}</strong></span>
                  </div>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Budget</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{formatPrice(selectedCampaign.planned_budget)}</p>
                  <span className="text-[11px] text-slate-500">Planned expenditure</span>
                </div>

                <div className="p-3 rounded-lg border border-indigo-100 bg-indigo-50/50">
                  <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">Leads Generated</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-bold text-indigo-700">{getLinkedLeads(selectedCampaign.id).length}</span>
                    <span className="text-xs text-slate-400">/ {selectedCampaign.target_leads} target</span>
                  </div>
                  <span className="text-[11px] text-indigo-600">
                    {Math.round((getLinkedLeads(selectedCampaign.id).length / (selectedCampaign.target_leads || 1)) * 100)}% achieved
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Target Qualified</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{selectedCampaign.target_qualified_leads}</p>
                  <span className="text-[11px] text-slate-500">Qualified leads goal</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Target Deals</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{selectedCampaign.target_opportunities}</p>
                  <span className="text-[11px] text-slate-500">Deal closures goal</span>
                </div>
              </div>

              {/* Detail Tabs Navigation */}
              <div className="flex items-center gap-1 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setDetailTab('overview')}
                  className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    detailTab === 'overview'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Layers size={14} /> Overview & Targeting
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('properties')}
                  className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    detailTab === 'properties'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Building2 size={14} /> Promoted Properties
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
                    {selectedCampaign.promoted_properties?.length || 0}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('leads')}
                  className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    detailTab === 'leads'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users size={14} /> Leads Generated
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700">
                    {getLinkedLeads(selectedCampaign.id).length}
                  </span>
                </button>
              </div>

              {/* Tab 1: Overview */}
              {detailTab === 'overview' && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Targeting Specifications */}
                    <div className="border border-slate-200 rounded-lg p-3.5 space-y-3 bg-white">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Target size={14} className="text-indigo-600" /> Audience & Targeting
                      </h4>
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-1">Target Audience</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedCampaign.target_audience.map(aud => (
                            <span key={aud} className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {aud}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-1">Target Geography</span>
                        <div className="flex items-center gap-1 text-xs text-slate-800 font-medium">
                          <MapPin size={13} className="text-rose-500" />
                          <span>{selectedCampaign.geography}</span>
                        </div>
                      </div>
                    </div>

                    {/* Property & Transaction Filters */}
                    <div className="border border-slate-200 rounded-lg p-3.5 space-y-3 bg-white">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Building2 size={14} className="text-indigo-600" /> Segment & Offer
                      </h4>
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-1">Property Categories</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedCampaign.categories.map(cat => (
                            <span key={cat} className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-1">Transaction Types</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedCampaign.transaction_types.map(txn => (
                            <span key={txn} className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {txn}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Audit / Metadata */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <span>Created: {new Date(selectedCampaign.created_at).toLocaleString()}</span>
                    <span>Last Updated: {new Date(selectedCampaign.updated_at).toLocaleString()}</span>
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-600" /> Audit Preserved (Immutable History)
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 2: Promoted Properties (Placeholder) */}
              {detailTab === 'properties' && (
                <div className="space-y-4 pt-1">
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center space-y-3 bg-slate-50/50">
                    <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Promoted Properties</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Link specific inventory units to promote in this campaign. This module will allow selecting properties from the inventory and tracking impressions, clicks, and property-specific inquiries.
                      </p>
                    </div>

                    {selectedCampaign.promoted_properties && selectedCampaign.promoted_properties.length > 0 ? (
                      <div className="pt-2">
                        <span className="text-xs font-semibold text-slate-700 block mb-2">Attached Inventory Units:</span>
                        <div className="flex flex-wrap justify-center gap-2">
                          {selectedCampaign.promoted_properties.map(pid => {
                            const prop = MOCK_PROPERTIES.find(p => p.id === pid)
                            return (
                              <div key={pid} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-left text-xs shadow-sm">
                                <span className="font-mono font-bold text-indigo-600">{pid}</span>
                                <span className="text-slate-600 ml-2">{prop?.short_loc || 'Indore Property'}</span>
                                <span className="text-slate-400 ml-2">({prop ? formatPrice(prop.price, prop.category) : '—'})</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 pt-1">
                        No specific properties currently linked. General campaign for area & category promotion.
                      </div>
                    )}

                    <div className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                      Feature expansion: Promoted property inventory linkage coming in the next release
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Leads Generated (Placeholder / Attributed Mock Leads) */}
              {detailTab === 'leads' && (
                <div className="space-y-4 pt-1">
                  {getLinkedLeads(selectedCampaign.id).length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Attributed Leads ({getLinkedLeads(selectedCampaign.id).length})
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Auto-tracked via campaign source & UTM tagging
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                        {getLinkedLeads(selectedCampaign.id).map(lead => (
                          <div key={lead.id} className="p-3 hover:bg-slate-50 flex items-center justify-between text-xs">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">{lead.party_name}</span>
                                <span className="font-mono text-[10px] text-slate-400">{lead.id}</span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                                  {lead.lead_type}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Source: <strong>{lead.source || 'Campaign Direct'}</strong> • Assigned: {lead.assigned_to_name || 'Unassigned'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-slate-800 block">
                                {lead.value ? formatPrice(lead.value) : '—'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatDate(lead.created_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center space-y-3 bg-slate-50/50">
                      <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <Users size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">Leads Generated</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                          Leads acquired through landing pages, telecalling, or ad attribution will be automatically linked to this campaign.
                        </p>
                      </div>
                      <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                        0 leads currently attributed to this campaign
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-3 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setSelectedCampaign(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </Dialog>
        )}
      </div>
    </AppLayout>
  )
}

export default function CampaignsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
          Loading Campaigns…
        </div>
      }
    >
      <CampaignsContent />
    </Suspense>
  )
}

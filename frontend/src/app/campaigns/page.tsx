'use client'

/**
 * Marketing Module — Campaigns Page & Property Promotion
 *
 * Dedicated sub-module for creating, managing, and tracking marketing campaigns
 * and property-specific promotions.
 *
 * Features:
 * - Sortable & filterable DataTable (Type, Status, Owner, Date Range, Search)
 * - Computed "Leads Generated" count from linked mock leads
 * - "+ New Campaign" modal form with multi-select fields (Audience, Category, Transaction Type)
 * - Campaign Detail View with Overview metrics and tabs:
 *   - "Promoted Properties" tab with real inventory linking, multi-campaign associations,
 *     campaign-specific marketing headlines, CTA, media tags, and remove action
 *   - "Leads Generated" tab with attributed leads
 * - "+ Add Property to Campaign" picker with filters, multi-select, and Property Collection shortcut
 * - "Suggest Properties from Demand Gaps" helper pre-filling campaign creation
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
  FileText, Check, ChevronRight, BarChart3, ShieldCheck,
  Trash2, Edit3, Image, Video, Sparkles, Filter, CheckSquare,
  Square, AlertTriangle, ExternalLink, ArrowUpRight
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
import { formatPrice, formatDate, formatCategory } from '@/lib/formatters'
import {
  MOCK_CAMPAIGNS, MOCK_LEADS, MOCK_USERS, MOCK_PROPERTIES,
  MOCK_CAMPAIGN_PROMOTIONS, getDemandGaps,
  type CampaignRow, type CampaignType, type CampaignStatus,
  type TargetAudienceType, type PropertyCategoryType, type TransactionType,
  type LeadRow, type CampaignPropertyPromotion, type DemandGapItem, type PropertyRow
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

const CTA_PRESETS = [
  'Book a site visit today',
  'Schedule an exclusive preview',
  'Enquire for festive pricing',
  'Call for best negotiable deal',
  'Apply for tenancy screening',
  'Register your interest now',
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

function ShortLocBadge({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200">
      <MapPin size={11} className="text-indigo-600 shrink-0" />
      <span>{code}</span>
    </span>
  )
}

function getVerificationStatus(iso: string | null) {
  if (!iso) return { label: 'Never Verified', isStale: true }
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 2) return { label: 'Verified', isStale: false }
  if (days <= 5) return { label: `${days}d ago`, isStale: false }
  return { label: `${days}d ago (Stale)`, isStale: true }
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
  const [promotions, setPromotions] = useState<CampaignPropertyPromotion[]>([...MOCK_CAMPAIGN_PROMOTIONS])
  const [demandGaps] = useState<DemandGapItem[]>(getDemandGaps())

  // Filters
  const [fType, setFType] = useState<string>('')
  const [fStatus, setFStatus] = useState<string>(initialStatus)
  const [fOwner, setFOwner] = useState<string>('')
  const [fDateRange, setFDateRange] = useState<string>('ALL')

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(initialCreate)
  const [showPropertyPicker, setShowPropertyPicker] = useState(false)
  const [showDemandGapsModal, setShowDemandGapsModal] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<CampaignPropertyPromotion | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignRow | null>(() => {
    if (initialCampaignId) {
      return MOCK_CAMPAIGNS.find(c => c.id === initialCampaignId) || null
    }
    return null
  })
  const [detailTab, setDetailTab] = useState<'overview' | 'properties' | 'leads'>(initialTab)

  // Property Picker State
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerCategory, setPickerCategory] = useState('')
  const [pickerLocation, setPickerLocation] = useState('')
  const [selectedPropIds, setSelectedPropIds] = useState<string[]>([])
  const [pickerHeadline, setPickerHeadline] = useState('')
  const [pickerDescription, setPickerDescription] = useState('')
  const [pickerCta, setPickerCta] = useState('Book a site visit today')
  const [pickerMedia, setPickerMedia] = useState('elevation.jpg, floor_plan.pdf')

  // Edit Marketing Content Form State
  const [editHeadline, setEditHeadline] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCta, setEditCta] = useState('')
  const [editMedia, setEditMedia] = useState('')

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
    if (initialStatus) setFStatus(initialStatus)
    if (initialCreate) setShowCreateModal(true)
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

  // Get active promotions for a campaign
  const campaignPromotions = useMemo(() => {
    if (!selectedCampaign) return []
    return promotions.filter(p => p.campaign_id === selectedCampaign.id)
  }, [selectedCampaign, promotions])

  // Get all campaigns promoting a specific property
  const getPropertyCampaigns = useCallback((propertyId: string) => {
    const matchedPromos = promotions.filter(p => p.property_id === propertyId)
    return matchedPromos.map(pr => {
      const cmp = campaigns.find(c => c.id === pr.campaign_id)
      return { promotion: pr, campaign: cmp }
    }).filter(item => Boolean(item.campaign))
  }, [promotions, campaigns])

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

  // ── Property Picker Logic ──────────────────────────────────────────────────

  const currentlyPromotedPropIds = useMemo(() => {
    if (!selectedCampaign) return new Set<string>()
    return new Set(promotions.filter(p => p.campaign_id === selectedCampaign.id).map(p => p.property_id))
  }, [selectedCampaign, promotions])

  const filteredInventoryProperties = useMemo(() => {
    return MOCK_PROPERTIES.filter(prop => {
      if (pickerSearch) {
        const q = pickerSearch.toLowerCase()
        const matchesId = prop.id.toLowerCase().includes(q)
        const matchesLoc = prop.short_loc.toLowerCase().includes(q)
        const matchesAddr = prop.address?.toLowerCase().includes(q)
        if (!matchesId && !matchesLoc && !matchesAddr) return false
      }
      if (pickerCategory && prop.category !== pickerCategory) return false
      if (pickerLocation && prop.short_loc !== pickerLocation) return false
      return true
    })
  }, [pickerSearch, pickerCategory, pickerLocation])

  const availableFilteredProperties = useMemo(() => {
    return filteredInventoryProperties.filter(p => !currentlyPromotedPropIds.has(p.id))
  }, [filteredInventoryProperties, currentlyPromotedPropIds])

  const toggleSelectProperty = (id: string) => {
    setSelectedPropIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSelectAllFiltered = () => {
    const unaddedIds = availableFilteredProperties.map(p => p.id)
    const allSelected = unaddedIds.every(id => selectedPropIds.includes(id))
    if (allSelected) {
      setSelectedPropIds(prev => prev.filter(id => !unaddedIds.includes(id)))
    } else {
      setSelectedPropIds(prev => Array.from(new Set([...prev, ...unaddedIds])))
    }
  }

  // Handle adding selected properties to campaign with marketing content
  const handleAddPropertiesSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCampaign || selectedPropIds.length === 0) return

    const mediaList = pickerMedia
      .split(',')
      .map(m => m.trim())
      .filter(Boolean)

    const newPromos: CampaignPropertyPromotion[] = selectedPropIds.map((propId, idx) => {
      const prop = MOCK_PROPERTIES.find(p => p.id === propId)
      return {
        id: `PROM-${Date.now().toString(36).toUpperCase()}-${idx}`,
        campaign_id: selectedCampaign.id,
        property_id: propId,
        marketing_headline: pickerHeadline.trim() || `Featured ${formatCategory(prop?.category || '')} in ${prop?.short_loc || 'Indore'}`,
        marketing_description: pickerDescription.trim() || `Prime ${formatCategory(prop?.category || '')} offered under ${selectedCampaign.name}.`,
        cta_text: pickerCta.trim() || 'Book a site visit today',
        media_attachments: mediaList.length > 0 ? mediaList : ['property_showcase.jpg'],
        enquiries_count: 0,
        added_at: new Date().toISOString(),
      }
    })

    setPromotions(prev => [...prev, ...newPromos])

    // Update campaign's promoted_properties array
    setCampaigns(prev =>
      prev.map(c =>
        c.id === selectedCampaign.id
          ? {
              ...c,
              promoted_properties: Array.from(new Set([...(c.promoted_properties || []), ...selectedPropIds])),
              updated_at: new Date().toISOString(),
            }
          : c
      )
    )

    setSelectedCampaign(prev =>
      prev
        ? {
            ...prev,
            promoted_properties: Array.from(new Set([...(prev.promoted_properties || []), ...selectedPropIds])),
            updated_at: new Date().toISOString(),
          }
        : prev
    )

    // Reset picker
    setSelectedPropIds([])
    setPickerHeadline('')
    setPickerDescription('')
    setShowPropertyPicker(false)
  }

  // Handle removing a property from a campaign
  const handleRemovePromotion = (promotionId: string, propertyId: string) => {
    if (!selectedCampaign) return

    setPromotions(prev => prev.filter(p => p.id !== promotionId))

    setCampaigns(prev =>
      prev.map(c =>
        c.id === selectedCampaign.id
          ? {
              ...c,
              promoted_properties: (c.promoted_properties || []).filter(pid => pid !== propertyId),
              updated_at: new Date().toISOString(),
            }
          : c
      )
    )

    setSelectedCampaign(prev =>
      prev
        ? {
            ...prev,
            promoted_properties: (prev.promoted_properties || []).filter(pid => pid !== propertyId),
            updated_at: new Date().toISOString(),
          }
        : prev
    )
  }

  // Handle editing marketing content
  const openEditContentModal = (promo: CampaignPropertyPromotion) => {
    setEditingPromotion(promo)
    setEditHeadline(promo.marketing_headline || '')
    setEditDescription(promo.marketing_description || '')
    setEditCta(promo.cta_text || 'Book a site visit today')
    setEditMedia((promo.media_attachments || []).join(', '))
  }

  const handleSaveEditContent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPromotion) return

    const mediaList = editMedia
      .split(',')
      .map(m => m.trim())
      .filter(Boolean)

    setPromotions(prev =>
      prev.map(p =>
        p.id === editingPromotion.id
          ? {
              ...p,
              marketing_headline: editHeadline.trim(),
              marketing_description: editDescription.trim(),
              cta_text: editCta.trim(),
              media_attachments: mediaList,
            }
          : p
      )
    )

    setEditingPromotion(null)
  }

  // ── Demand-Led Helper ──────────────────────────────────────────────────────

  const handleApplyDemandGap = (gap: DemandGapItem) => {
    setFormName(gap.suggested_campaign_name)
    setFormType(gap.suggested_campaign_type)
    setFormObjective(gap.suggested_objective)
    setFormAudience(gap.suggested_audience)
    setFormGeography(`${gap.short_loc}, Indore`)
    setFormCategories([gap.suggested_category])
    setFormTransactions([gap.suggested_transaction])
    setFormStatus('Planned')
    setFormBudget('60000')
    setFormTargetLeads('40')
    setFormTargetQualified('15')
    setFormTargetOpps('6')

    setShowDemandGapsModal(false)
    setShowCreateModal(true)
  }

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
            {/* Demand-Led Promotion Helper Button */}
            <Button
              variant="outline"
              onClick={() => setShowDemandGapsModal(true)}
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 shadow-xs"
              title="Suggest new campaigns based on market demand-supply gaps"
            >
              <TrendingUp size={16} className="mr-1.5 text-indigo-600" /> Suggest from Demand Gaps
            </Button>

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

        {/* ── Demand Gaps Helper Modal ────────────────────────────────────── */}
        <Dialog
          open={showDemandGapsModal}
          onClose={() => setShowDemandGapsModal(false)}
          title="Demand-Led Campaign Recommendations"
          className="max-w-2xl"
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex items-start gap-3">
              <TrendingUp size={20} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-indigo-900">Unmet Market Demand Detected</h4>
                <p className="text-xs text-indigo-700 mt-0.5">
                  The Demand-Supply engine analyzed active buyer/tenant requirements against available inventory.
                  These micro-locations have high demand deficits—prime candidates for targeted acquisition campaigns.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {demandGaps.map(gap => (
                <div
                  key={gap.id}
                  className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-xs transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShortLocBadge code={gap.short_loc} />
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {gap.category_label}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">
                          Gap: +{gap.gap} Unmet
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5">{gap.suggested_campaign_name}</h4>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleApplyDemandGap(gap)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs shrink-0"
                    >
                      <Sparkles size={13} className="mr-1" /> Create Campaign
                    </Button>
                  </div>

                  <p className="text-xs text-slate-600">{gap.suggested_objective}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>Active Requirements: <strong className="text-slate-700">{gap.demand_count}</strong></span>
                    <span>Available Properties: <strong className="text-slate-700">{gap.supply_count}</strong></span>
                    <span>Target Audience: <strong className="text-indigo-600">{gap.suggested_audience.join(', ')}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <Button variant="outline" onClick={() => setShowDemandGapsModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Dialog>

        {/* ── Campaign Detail View Modal ───────────────────────────────────── */}
        {selectedCampaign && (
          <Dialog
            open={!!selectedCampaign}
            onClose={() => setSelectedCampaign(null)}
            title="Campaign Details"
            className="max-w-4xl"
          >
            <div className="space-y-5 max-h-[82vh] overflow-y-auto pr-1">
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
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-bold">
                    {campaignPromotions.length}
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

              {/* Tab 2: Promoted Properties (Full Interactive Table) */}
              {detailTab === 'properties' && (
                <div className="space-y-4 pt-1">
                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Promoted Properties ({campaignPromotions.length})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Properties attached to this campaign receive custom marketing headlines, CTAs, and attribution tracking.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDemandGapsModal(true)}
                        className="text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                      >
                        <TrendingUp size={13} className="mr-1 text-indigo-600" /> Demand Gaps
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedPropIds([])
                          setShowPropertyPicker(true)
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs shadow-xs"
                      >
                        <Plus size={14} className="mr-1" /> Add Property to Campaign
                      </Button>
                    </div>
                  </div>

                  {/* Promoted Properties Table */}
                  {campaignPromotions.length > 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">Property ID</th>
                              <th className="py-2.5 px-3">ShortLoc</th>
                              <th className="py-2.5 px-3">Category</th>
                              <th className="py-2.5 px-3 text-right">Price / Rent</th>
                              <th className="py-2.5 px-3">Verification</th>
                              <th className="py-2.5 px-3 text-center">Enquiries</th>
                              <th className="py-2.5 px-3">Marketing Headline & CTA</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {campaignPromotions.map(promo => {
                              const prop = MOCK_PROPERTIES.find(p => p.id === promo.property_id)
                              const v = getVerificationStatus(prop?.last_verified_at || null)
                              const allAssocs = getPropertyCampaigns(promo.property_id)

                              return (
                                <tr key={promo.id} className="hover:bg-slate-50/80 transition-colors">
                                  {/* Property ID */}
                                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                                    <div className="flex flex-col">
                                      <span>{promo.property_id}</span>
                                      {allAssocs.length > 1 && (
                                        <span className="text-[10px] text-purple-600 font-normal">
                                          In {allAssocs.length} campaigns
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* ShortLoc */}
                                  <td className="py-2.5 px-3">
                                    <div>
                                      <ShortLocBadge code={prop?.short_loc || '—'} />
                                      {prop?.address && (
                                        <p className="text-[11px] text-slate-400 truncate max-w-[160px] mt-0.5">
                                          {prop.address}
                                        </p>
                                      )}
                                    </div>
                                  </td>

                                  {/* Category */}
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                                      {prop ? formatCategory(prop.category) : '—'}
                                    </span>
                                  </td>

                                  {/* Price / Rent */}
                                  <td className="py-2.5 px-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                                    {prop ? formatPrice(prop.price, prop.category) : '—'}
                                  </td>

                                  {/* Verification Status */}
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        v.isStale
                                          ? 'bg-red-50 text-red-700 border border-red-200'
                                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      }`}
                                    >
                                      {v.isStale && <AlertTriangle size={10} />}
                                      {v.label}
                                    </span>
                                  </td>

                                  {/* Enquiries / Leads Count */}
                                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200">
                                      <Users size={11} /> {promo.enquiries_count || 0}
                                    </span>
                                  </td>

                                  {/* Marketing Headline & CTA */}
                                  <td className="py-2.5 px-3">
                                    <div className="max-w-xs">
                                      <p className="font-semibold text-slate-800 line-clamp-1 text-xs">
                                        {promo.marketing_headline || '—'}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                                          CTA: {promo.cta_text || 'Default'}
                                        </span>
                                        {promo.media_attachments && promo.media_attachments.length > 0 && (
                                          <span className="text-[10px] text-slate-400">
                                            • {promo.media_attachments.length} media
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Actions */}
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => openEditContentModal(promo)}
                                        className="h-7 px-2 text-xs text-slate-600 hover:text-indigo-600"
                                        title="Edit Marketing Content"
                                      >
                                        <Edit3 size={13} className="mr-1" /> Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRemovePromotion(promo.id, promo.property_id)}
                                        className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                        title="Remove property association from this campaign"
                                      >
                                        <Trash2 size={13} className="mr-1" /> Remove
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center space-y-3 bg-slate-50/50">
                      <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">No Properties Promoted Yet</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                          Attach existing inventory units to promote in this campaign. Properties can have campaign-specific marketing headlines, custom CTAs, and multi-campaign exposure.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPropIds([])
                            setShowPropertyPicker(true)
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                        >
                          <Plus size={14} className="mr-1" /> Add Property to Campaign
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Leads Generated (Attributed Mock Leads) */}
              {detailTab === 'leads' && (
                <div className="space-y-4 pt-1">
                  {getLinkedLeads(selectedCampaign.id).length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Attributed Leads ({getLinkedLeads(selectedCampaign.id).length})
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Auto-tracked via campaign source & UTM attribution
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

        {/* ── "+ Add Property to Campaign" Picker Dialog ──────────────────── */}
        <Dialog
          open={showPropertyPicker}
          onClose={() => setShowPropertyPicker(false)}
          title={`Add Properties to Campaign: ${selectedCampaign?.name || ''}`}
          className="max-w-3xl"
        >
          <form onSubmit={handleAddPropertiesSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {/* Filter Bar */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search ShortLoc, ID, address…"
                    value={pickerSearch}
                    onChange={e => setPickerSearch(e.target.value)}
                    className="h-8 text-xs pl-8"
                  />
                </div>

                <Select
                  value={pickerCategory}
                  onChange={e => setPickerCategory(e.target.value)}
                  className="h-8 text-xs w-full"
                >
                  <option value="">All Categories</option>
                  <option value="BUY_SELL_FLAT">Buy-Sell Flat</option>
                  <option value="RENTAL_RESIDENTIAL">Rental Residential</option>
                  <option value="RENTAL_COMMERCIAL">Rental Commercial</option>
                  <option value="PLOT">Plot/Jameen</option>
                </Select>

                <Select
                  value={pickerLocation}
                  onChange={e => setPickerLocation(e.target.value)}
                  className="h-8 text-xs w-full"
                >
                  <option value="">All Locations</option>
                  {COMMON_SHORT_LOCS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </Select>
              </div>

              {/* Property Collection Shortcut Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-slate-200/80">
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-600 shrink-0" />
                  <span>
                    Collection Match: <strong>{availableFilteredProperties.length}</strong> available properties match filter.
                  </span>
                </div>

                {availableFilteredProperties.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllFiltered}
                    className="h-7 text-xs text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                  >
                    <CheckSquare size={13} className="mr-1 text-indigo-600" />
                    {availableFilteredProperties.every(p => selectedPropIds.includes(p.id))
                      ? 'Deselect Matching'
                      : `Select Entire Collection (${availableFilteredProperties.length})`}
                  </Button>
                )}
              </div>
            </div>

            {/* Inventory Property Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={
                          availableFilteredProperties.length > 0 &&
                          availableFilteredProperties.every(p => selectedPropIds.includes(p.id))
                        }
                        onChange={handleSelectAllFiltered}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="py-2 px-3">Property ID</th>
                    <th className="py-2 px-3">ShortLoc</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-right">Price/Rent</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Campaign Associations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventoryProperties.map(prop => {
                    const isAlreadyInThis = currentlyPromotedPropIds.has(prop.id)
                    const isChecked = selectedPropIds.includes(prop.id)
                    const otherCampaigns = getPropertyCampaigns(prop.id).filter(
                      c => c.campaign?.id !== selectedCampaign?.id
                    )

                    return (
                      <tr
                        key={prop.id}
                        onClick={() => {
                          if (!isAlreadyInThis) toggleSelectProperty(prop.id)
                        }}
                        className={`transition-colors cursor-pointer ${
                          isAlreadyInThis
                            ? 'bg-slate-50/60 opacity-60 cursor-not-allowed'
                            : isChecked
                            ? 'bg-indigo-50/50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            disabled={isAlreadyInThis}
                            checked={isChecked}
                            onChange={() => toggleSelectProperty(prop.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">
                          {prop.id}
                        </td>
                        <td className="py-2 px-3">
                          <ShortLocBadge code={prop.short_loc} />
                        </td>
                        <td className="py-2 px-3">
                          {formatCategory(prop.category)}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                          {formatPrice(prop.price, prop.category)}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            {prop.status}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {isAlreadyInThis ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                              <Check size={12} /> In this campaign
                            </span>
                          ) : otherCampaigns.length > 0 ? (
                            <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              Also in {otherCampaigns.map(o => o.campaign?.id).join(', ')}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Available</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {filteredInventoryProperties.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-400 text-xs">
                        No properties found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Campaign-Specific Marketing Content (Per-Property-Per-Campaign) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Campaign-Specific Marketing Content
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  This marketing copy is isolated to this campaign and does not overwrite inventory records.
                </p>
              </div>

              <div>
                <Label htmlFor="picker_headline" className="text-xs">Marketing Headline</Label>
                <Input
                  id="picker_headline"
                  placeholder="e.g. Exclusive 3BHK High-Rise Near Tech Corridor"
                  value={pickerHeadline}
                  onChange={e => setPickerHeadline(e.target.value)}
                  className="mt-1 h-8 text-xs bg-white"
                />
              </div>

              <div>
                <Label htmlFor="picker_desc" className="text-xs">Marketing Brief / Description</Label>
                <Textarea
                  id="picker_desc"
                  rows={2}
                  placeholder="Special pitch, key highlights, or campaign-specific concessions…"
                  value={pickerDescription}
                  onChange={e => setPickerDescription(e.target.value)}
                  className="mt-1 text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="picker_cta" className="text-xs">Call-to-Action (CTA) Text</Label>
                  <Input
                    id="picker_cta"
                    placeholder="e.g. Book a site visit today"
                    value={pickerCta}
                    onChange={e => setPickerCta(e.target.value)}
                    className="mt-1 h-8 text-xs bg-white"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {CTA_PRESETS.slice(0, 3).map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPickerCta(preset)}
                        className="text-[10px] bg-slate-200/80 hover:bg-indigo-100 hover:text-indigo-800 text-slate-600 px-1.5 py-0.5 rounded transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="picker_media" className="text-xs">Media Filename References (Comma separated)</Label>
                  <Input
                    id="picker_media"
                    placeholder="elevation.jpg, floor_plan.pdf, walkthrough.mp4"
                    value={pickerMedia}
                    onChange={e => setPickerMedia(e.target.value)}
                    className="mt-1 h-8 text-xs bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Mock references: photos, videos, or brochures attached to promotion.
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-xs font-semibold text-slate-700">
                {selectedPropIds.length} propert{selectedPropIds.length === 1 ? 'y' : 'ies'} selected
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPropertyPicker(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={selectedPropIds.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Add Selected Properties ({selectedPropIds.length})
                </Button>
              </div>
            </div>
          </form>
        </Dialog>

        {/* ── Edit Marketing Content Modal ─────────────────────────────────── */}
        {editingPromotion && (
          <Dialog
            open={!!editingPromotion}
            onClose={() => setEditingPromotion(null)}
            title={`Edit Marketing Content — ${editingPromotion.property_id}`}
            className="max-w-lg"
          >
            <form onSubmit={handleSaveEditContent} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">Campaign: </span>
                <span className="text-slate-900">{selectedCampaign?.name}</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-600">{editingPromotion.property_id}</span>
                  <span>•</span>
                  <span>Enquiries: {editingPromotion.enquiries_count}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="edit_headline" className="text-xs">Marketing Headline</Label>
                <Input
                  id="edit_headline"
                  required
                  value={editHeadline}
                  onChange={e => setEditHeadline(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="edit_desc" className="text-xs">Marketing Description / Brief</Label>
                <Textarea
                  id="edit_desc"
                  rows={3}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="edit_cta" className="text-xs">Call-to-Action (CTA)</Label>
                <Input
                  id="edit_cta"
                  value={editCta}
                  onChange={e => setEditCta(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="edit_media" className="text-xs">Media Attachments (Comma separated)</Label>
                <Input
                  id="edit_media"
                  value={editMedia}
                  onChange={e => setEditMedia(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingPromotion(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Save Marketing Copy
                </Button>
              </div>
            </form>
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

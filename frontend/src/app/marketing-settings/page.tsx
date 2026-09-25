'use client'

/**
 * Marketing Settings & Configuration Module — Module 7 Part 11 (Super Admin Only)
 *
 * Provides master data management for 6 configurable lists:
 * 1. Campaign Types & Objectives
 * 2. Target Audience Categories
 * 3. Digital & Offline Lead Source Types (unified master list)
 * 4. Referral Source & Partner Types
 * 5. Calling Campaign Purposes & Call Dispositions
 * 6. Content Types (collateral & creative assets)
 * + Real-time Marketing Config Audit Trail
 *
 * Core Principles:
 * - Super Admin Only access control (with in-page guard for unauthorized roles)
 * - Strict rule: Deactivate, NEVER delete — preserving all historical records & analytics
 * - Live computed item usage counters across Campaigns, Leads, Partners, Contacts, Collateral
 * - Real-time audit logging directly into the CRM audit log system
 */

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Settings, Megaphone, Users, Share2, Handshake, PhoneCall,
  FolderOpen, Shield, ShieldAlert, Plus, Edit2, CheckCircle2,
  XCircle, Search, AlertCircle, Clock, Check, Eye, EyeOff,
  Info, Filter, ArrowRight, ExternalLink, Sparkles, RefreshCw
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/auth-context'
import {
  DEFAULT_CAMPAIGN_TYPES,
  DEFAULT_TARGET_AUDIENCES,
  DEFAULT_LEAD_SOURCES,
  DEFAULT_PARTNER_CATEGORIES,
  DEFAULT_TELEMARKETING_PURPOSES,
  DEFAULT_CALL_DISPOSITIONS,
  DEFAULT_CONTENT_TYPES,
  MOCK_CAMPAIGNS,
  MOCK_LEADS,
  MOCK_REFERRAL_PARTNERS,
  MOCK_TELEMARKETING_CAMPAIGNS,
  MOCK_TELEMARKETING_CONTACTS,
  MOCK_CONTENT_ITEMS,
  MOCK_AUDIT_LOGS,
  logMarketingConfigAudit,
  type MarketingConfigItem,
  type LeadSourceItem,
  type AuditLogRow,
} from '@/lib/mockData'

// ── Tab Types ─────────────────────────────────────────────────────────────────

type SettingsTab =
  | 'campaign_types'
  | 'audiences'
  | 'sources'
  | 'partners'
  | 'telemarketing'
  | 'content_types'
  | 'audit_trail'

export default function MarketingSettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('campaign_types')

  // Search & Filters per view
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3800)
  }

  // ── Master State for the 6 Configurable Lists ───────────────────────────────

  const [campaignTypes, setCampaignTypes] = useState<MarketingConfigItem[]>([...DEFAULT_CAMPAIGN_TYPES])
  const [targetAudiences, setTargetAudiences] = useState<MarketingConfigItem[]>([...DEFAULT_TARGET_AUDIENCES])
  const [leadSources, setLeadSources] = useState<LeadSourceItem[]>([...DEFAULT_LEAD_SOURCES])
  const [partnerCategories, setPartnerCategories] = useState<MarketingConfigItem[]>([...DEFAULT_PARTNER_CATEGORIES])
  const [telemarketingPurposes, setTelemarketingPurposes] = useState<MarketingConfigItem[]>([...DEFAULT_TELEMARKETING_PURPOSES])
  const [callDispositions, setCallDispositions] = useState<MarketingConfigItem[]>([...DEFAULT_CALL_DISPOSITIONS])
  const [contentTypes, setContentTypes] = useState<MarketingConfigItem[]>([...DEFAULT_CONTENT_TYPES])

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([
    ...MOCK_AUDIT_LOGS.filter((l) => l.entity_type === 'Marketing Config'),
  ])

  // ── Modals State ────────────────────────────────────────────────────────────

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedItemToEdit, setSelectedItemToEdit] = useState<{
    id: string
    name: string
    category?: string
    description?: string
  } | null>(null)

  // Form Fields for Add / Edit
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formDescription, setFormDescription] = useState('')

  // ── Dynamic Live Usage Computations ─────────────────────────────────────────

  // 1. Campaign Types usage in MOCK_CAMPAIGNS
  const campaignTypeUsage = useMemo(() => {
    const map: Record<string, number> = {}
    MOCK_CAMPAIGNS.forEach((c) => {
      map[c.type] = (map[c.type] || 0) + 1
    })
    return map
  }, [])

  // 2. Target Audiences usage in Campaigns & Telemarketing
  const targetAudienceUsage = useMemo(() => {
    const map: Record<string, number> = {}
    MOCK_CAMPAIGNS.forEach((c) => {
      c.target_audience?.forEach((aud) => {
        map[aud] = (map[aud] || 0) + 1
      })
    })
    MOCK_TELEMARKETING_CAMPAIGNS.forEach((tc) => {
      if (tc.target_audience) {
        map[tc.target_audience] = (map[tc.target_audience] || 0) + 1
      }
    })
    return map
  }, [])

  // 3. Lead Sources usage in MOCK_LEADS
  const leadSourceUsage = useMemo(() => {
    const map: Record<string, number> = {}
    MOCK_LEADS.forEach((l) => {
      if (l.source) {
        map[l.source] = (map[l.source] || 0) + 1
      }
    })
    return map
  }, [])

  // 4. Partner Categories usage in MOCK_REFERRAL_PARTNERS
  const partnerCategoryUsage = useMemo(() => {
    const map: Record<string, number> = {}
    MOCK_REFERRAL_PARTNERS.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1
    })
    return map
  }, [])

  // 5. Telemarketing Purposes & Dispositions usage
  const telemarketingUsage = useMemo(() => {
    const purposeMap: Record<string, number> = {}
    MOCK_TELEMARKETING_CAMPAIGNS.forEach((tc) => {
      if (tc.purpose) {
        purposeMap[tc.purpose] = (purposeMap[tc.purpose] || 0) + 1
      }
    })

    const dispositionMap: Record<string, number> = {}
    MOCK_TELEMARKETING_CONTACTS.forEach((ct) => {
      if (ct.status) {
        dispositionMap[ct.status] = (dispositionMap[ct.status] || 0) + 1
      }
    })

    return { purposeMap, dispositionMap }
  }, [])

  // 6. Content Types usage in MOCK_CONTENT_ITEMS
  const contentTypeUsage = useMemo(() => {
    const map: Record<string, number> = {}
    MOCK_CONTENT_ITEMS.forEach((ci) => {
      map[ci.type] = (map[ci.type] || 0) + 1
    })
    return map
  }, [])

  // ── Active / Inactive Status Toggle Handler ─────────────────────────────────

  const handleToggleStatus = (
    tab: SettingsTab,
    itemId: string,
    currentActive: boolean,
    itemName: string,
    categoryName?: string
  ) => {
    const nextStatus = !currentActive
    const actionLabel = nextStatus ? 'Activated' : 'Deactivated'
    const statusText = nextStatus ? 'Active' : 'Inactive'

    let configTypeName = ''
    switch (tab) {
      case 'campaign_types':
        configTypeName = 'Campaign Type'
        setCampaignTypes((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, active: nextStatus } : item))
        )
        break
      case 'audiences':
        configTypeName = 'Target Audience'
        setTargetAudiences((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, active: nextStatus } : item))
        )
        break
      case 'sources':
        configTypeName = 'Lead Source'
        setLeadSources((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, is_active: nextStatus } : item))
        )
        // Also update DEFAULT_LEAD_SOURCES in-memory
        const defaultSource = DEFAULT_LEAD_SOURCES.find((s) => s.id === itemId)
        if (defaultSource) defaultSource.is_active = nextStatus
        break
      case 'partners':
        configTypeName = 'Partner Category'
        setPartnerCategories((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, active: nextStatus } : item))
        )
        break
      case 'telemarketing':
        if (categoryName === 'Purpose') {
          configTypeName = 'Calling Purpose'
          setTelemarketingPurposes((prev) =>
            prev.map((item) => (item.id === itemId ? { ...item, active: nextStatus } : item))
          )
        } else {
          configTypeName = 'Call Disposition'
          setCallDispositions((prev) =>
            prev.map((item) => (item.id === itemId ? { ...item, active: nextStatus } : item))
          )
        }
        break
      case 'content_types':
        configTypeName = 'Content Type'
        setContentTypes((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, active: nextStatus } : item))
        )
        break
    }

    // Record in global Audit Log
    const newAudit = logMarketingConfigAudit({
      action: 'Status Changed',
      entityId: itemId,
      itemName,
      configType: configTypeName,
      summary: `${actionLabel} ${configTypeName}: "${itemName}" (${statusText})`,
      details: {
        config_group: configTypeName,
        item_id: itemId,
        name: itemName,
        new_status: statusText,
        historical_records_protected: true,
      },
      user: {
        id: user?.id,
        name: user?.name,
        role: user?.role,
      },
    })

    setAuditLogs((prev) => [newAudit, ...prev])
    showToast(`${configTypeName} "${itemName}" marked as ${statusText}. Historical records preserved.`)
  }

  // ── Open Add Modal ──────────────────────────────────────────────────────────

  const handleOpenAdd = () => {
    setFormName('')
    setFormDescription('')
    if (activeTab === 'sources') setFormCategory('Digital')
    else if (activeTab === 'telemarketing') setFormCategory('Purpose')
    else if (activeTab === 'content_types') setFormCategory('Text')
    else setFormCategory('')
    setIsAddModalOpen(true)
  }

  // ── Submit Add Item ─────────────────────────────────────────────────────────

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = formName.trim()
    if (!trimmed) return

    const newId = `cfg-${Date.now()}`
    const nowIso = new Date().toISOString()
    let configTypeName = ''

    switch (activeTab) {
      case 'campaign_types': {
        configTypeName = 'Campaign Type'
        const newItem: MarketingConfigItem = {
          id: newId,
          name: trimmed,
          active: true,
          description: formDescription.trim() || 'Custom campaign objective.',
          is_system: false,
          created_at: nowIso,
        }
        setCampaignTypes((prev) => [newItem, ...prev])
        break
      }
      case 'audiences': {
        configTypeName = 'Target Audience'
        const newItem: MarketingConfigItem = {
          id: newId,
          name: trimmed,
          active: true,
          description: formDescription.trim() || 'Custom audience segment.',
          is_system: false,
          created_at: nowIso,
        }
        setTargetAudiences((prev) => [newItem, ...prev])
        break
      }
      case 'sources': {
        configTypeName = 'Lead Source'
        const channelType = (formCategory as 'Digital' | 'Offline') || 'Digital'
        const newItem: LeadSourceItem = {
          id: newId,
          name: trimmed,
          channel_type: channelType,
          is_active: true,
          description: formDescription.trim() || `Custom ${channelType} acquisition channel.`,
          created_at: nowIso,
        }
        setLeadSources((prev) => [newItem, ...prev])
        DEFAULT_LEAD_SOURCES.unshift(newItem)
        break
      }
      case 'partners': {
        configTypeName = 'Partner Category'
        const newItem: MarketingConfigItem = {
          id: newId,
          name: trimmed,
          active: true,
          description: formDescription.trim() || 'Custom referral partner type.',
          is_system: false,
          created_at: nowIso,
        }
        setPartnerCategories((prev) => [newItem, ...prev])
        break
      }
      case 'telemarketing': {
        if (formCategory === 'Disposition') {
          configTypeName = 'Call Disposition'
          const newItem: MarketingConfigItem = {
            id: newId,
            name: trimmed,
            category: 'Disposition',
            active: true,
            description: formDescription.trim() || 'Custom call disposition outcome.',
            is_system: false,
            created_at: nowIso,
          }
          setCallDispositions((prev) => [newItem, ...prev])
        } else {
          configTypeName = 'Calling Purpose'
          const newItem: MarketingConfigItem = {
            id: newId,
            name: trimmed,
            category: 'Purpose',
            active: true,
            description: formDescription.trim() || 'Custom outbound calling campaign purpose.',
            is_system: false,
            created_at: nowIso,
          }
          setTelemarketingPurposes((prev) => [newItem, ...prev])
        }
        break
      }
      case 'content_types': {
        configTypeName = 'Content Type'
        const newItem: MarketingConfigItem = {
          id: newId,
          name: trimmed,
          category: formCategory || 'Other',
          active: true,
          description: formDescription.trim() || 'Custom marketing collateral asset type.',
          is_system: false,
          created_at: nowIso,
        }
        setContentTypes((prev) => [newItem, ...prev])
        break
      }
    }

    // Log to Audit Log
    const newAudit = logMarketingConfigAudit({
      action: 'Created',
      entityId: newId,
      itemName: trimmed,
      configType: configTypeName,
      summary: `Created ${configTypeName}: "${trimmed}"`,
      details: {
        config_group: configTypeName,
        name: trimmed,
        category: formCategory || undefined,
        description: formDescription.trim(),
        status: 'Active',
      },
      user: {
        id: user?.id,
        name: user?.name,
        role: user?.role,
      },
    })

    setAuditLogs((prev) => [newAudit, ...prev])
    setIsAddModalOpen(false)
    showToast(`Added new ${configTypeName}: "${trimmed}" (Logged to audit trail)`)
  }

  // ── Open Edit Modal ─────────────────────────────────────────────────────────

  const handleOpenEdit = (item: { id: string; name: string; category?: string; description?: string }) => {
    setSelectedItemToEdit(item)
    setFormName(item.name)
    setFormCategory(item.category || '')
    setFormDescription(item.description || '')
    setIsEditModalOpen(true)
  }

  // ── Submit Edit Item ────────────────────────────────────────────────────────

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItemToEdit || !formName.trim()) return

    const trimmed = formName.trim()
    const oldName = selectedItemToEdit.name
    const itemId = selectedItemToEdit.id
    let configTypeName = ''

    switch (activeTab) {
      case 'campaign_types':
        configTypeName = 'Campaign Type'
        setCampaignTypes((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? { ...i, name: trimmed, description: formDescription.trim() || i.description }
              : i
          )
        )
        break
      case 'audiences':
        configTypeName = 'Target Audience'
        setTargetAudiences((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? { ...i, name: trimmed, description: formDescription.trim() || i.description }
              : i
          )
        )
        break
      case 'sources':
        configTypeName = 'Lead Source'
        setLeadSources((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  name: trimmed,
                  channel_type: (formCategory as any) || i.channel_type,
                  description: formDescription.trim() || i.description,
                }
              : i
          )
        )
        const def = DEFAULT_LEAD_SOURCES.find((s) => s.id === itemId)
        if (def) {
          def.name = trimmed
          if (formCategory) def.channel_type = formCategory as any
          if (formDescription) def.description = formDescription
        }
        break
      case 'partners':
        configTypeName = 'Partner Category'
        setPartnerCategories((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? { ...i, name: trimmed, description: formDescription.trim() || i.description }
              : i
          )
        )
        break
      case 'telemarketing':
        if (selectedItemToEdit.category === 'Purpose') {
          configTypeName = 'Calling Purpose'
          setTelemarketingPurposes((prev) =>
            prev.map((i) =>
              i.id === itemId
                ? { ...i, name: trimmed, description: formDescription.trim() || i.description }
                : i
            )
          )
        } else {
          configTypeName = 'Call Disposition'
          setCallDispositions((prev) =>
            prev.map((i) =>
              i.id === itemId
                ? { ...i, name: trimmed, description: formDescription.trim() || i.description }
                : i
            )
          )
        }
        break
      case 'content_types':
        configTypeName = 'Content Type'
        setContentTypes((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  name: trimmed,
                  category: formCategory || i.category,
                  description: formDescription.trim() || i.description,
                }
              : i
          )
        )
        break
    }

    // Log edit to Audit Log
    const newAudit = logMarketingConfigAudit({
      action: 'Updated',
      entityId: itemId,
      itemName: trimmed,
      configType: configTypeName,
      summary: `Updated ${configTypeName}: "${oldName}" ${oldName !== trimmed ? `→ "${trimmed}"` : ''}`,
      details: {
        config_group: configTypeName,
        item_id: itemId,
        old_name: oldName,
        new_name: trimmed,
        updated_description: formDescription.trim(),
      },
      user: {
        id: user?.id,
        name: user?.name,
        role: user?.role,
      },
    })

    setAuditLogs((prev) => [newAudit, ...prev])
    setIsEditModalOpen(false)
    setSelectedItemToEdit(null)
    showToast(`Updated ${configTypeName}: "${trimmed}" (Logged to audit trail)`)
  }

  // ── Access Control Guard ────────────────────────────────────────────────────
  // If user role is not SUPER_ADMIN, show access denied UI

  if (user && user.role !== 'SUPER_ADMIN') {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-12 min-h-[65vh]">
          <div className="bg-white border border-rose-200 shadow-md rounded-2xl p-8 max-w-lg w-full text-center">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Access Denied — Super Admin Only</h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Marketing Admin & Configuration is restricted to <strong>Super Admin</strong> personnel. Your current authenticated role is <Badge variant="outline" className="font-mono text-xs">{user.role}</Badge>.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link href="/">
                <Button variant="outline" className="text-xs">
                  Return to Dashboard
                </Button>
              </Link>
              <Link href="/campaigns">
                <Button variant="default" className="text-xs bg-slate-900 text-white">
                  Go to Campaigns
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // ── Sub-Navigation Items Configuration ──────────────────────────────────────

  const navTabs: { id: SettingsTab; label: string; icon: React.ElementType; count: number; badgeColor?: string }[] = [
    { id: 'campaign_types', label: 'Campaign Types & Objectives', icon: Megaphone, count: campaignTypes.length },
    { id: 'audiences',      label: 'Target Audience Categories',  icon: Users,     count: targetAudiences.length },
    { id: 'sources',        label: 'Digital & Offline Sources',   icon: Share2,    count: leadSources.length },
    { id: 'partners',       label: 'Referral Partner Types',      icon: Handshake, count: partnerCategories.length },
    { id: 'telemarketing',  label: 'Calling Purposes & Dispositions', icon: PhoneCall, count: telemarketingPurposes.length + callDispositions.length },
    { id: 'content_types',  label: 'Marketing Content Types',     icon: FolderOpen,count: contentTypes.length },
    { id: 'audit_trail',    label: 'Recent Audit Trail',          icon: Shield,    count: auditLogs.length, badgeColor: 'bg-pink-100 text-pink-700' },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl text-xs font-medium border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-900 text-white rounded-lg shadow-sm">
                <Settings size={20} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Marketing Settings & Admin</h1>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs font-semibold">
                Super Admin Only
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Configure marketing channels, campaign objectives, audience categories, call outcomes, and collateral types.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              <Shield size={14} className="text-amber-600" />
              <span>Immutable historical records: Deactivate, never delete</span>
            </div>
            <Link href="/audit?entity=Marketing+Config">
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5 border-slate-300">
                <ExternalLink size={13} />
                Global Audit Log
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content Layout: Left Nav + Right Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left-Side Sub-Navigation */}
          <div className="lg:col-span-3">
            <Card className="border-slate-200 shadow-sm overflow-hidden sticky top-6">
              <div className="p-3 bg-slate-50 border-b border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Marketing Master Data
                </span>
              </div>
              <div className="p-2 space-y-1">
                {navTabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id)
                        setSearchQuery('')
                        setStatusFilter('ALL')
                        setCategoryFilter('ALL')
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 text-left">
                        <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
                        <span className="truncate">{tab.label}</span>
                      </div>
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                          isActive
                            ? 'bg-slate-800 text-slate-200'
                            : tab.badgeColor || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Security & Integrity Note */}
              <div className="p-3.5 m-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Info size={13} className="text-blue-600" />
                  <span>Historical Traceability</span>
                </div>
                <p className="leading-relaxed">
                  Deactivated items are excluded from future drop-down forms, but remain permanently linked to past Leads, Campaigns, and Deals.
                </p>
              </div>
            </Card>
          </div>

          {/* Right-Side Tab Panel */}
          <div className="lg:col-span-9 space-y-4">
            {/* TAB 1: Campaign Types & Objectives */}
            {activeTab === 'campaign_types' && (
              <ConfigListTable
                title="Campaign Types & Objectives"
                description="Governs the Campaign Type choices and default marketing objectives in the Campaign Creation modal."
                addLabel="Add Campaign Type"
                onAdd={handleOpenAdd}
                items={campaignTypes}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                usageMap={campaignTypeUsage}
                usageLabel="Campaigns"
                onToggleStatus={(item) =>
                  handleToggleStatus('campaign_types', item.id, item.active, item.name)
                }
                onEdit={handleOpenEdit}
              />
            )}

            {/* TAB 2: Target Audience Categories */}
            {activeTab === 'audiences' && (
              <ConfigListTable
                title="Target Audience Categories"
                description="Audience segments used for campaign targeting and telemarketing calling lists (e.g. Buyers, Sellers, Investors)."
                addLabel="Add Audience Category"
                onAdd={handleOpenAdd}
                items={targetAudiences}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                usageMap={targetAudienceUsage}
                usageLabel="Campaigns / Lists"
                onToggleStatus={(item) =>
                  handleToggleStatus('audiences', item.id, item.active, item.name)
                }
                onEdit={handleOpenEdit}
              />
            )}

            {/* TAB 3: Digital & Offline Lead Sources */}
            {activeTab === 'sources' && (
              <ConfigListTable
                title="Digital & Offline Marketing Source Types"
                description="Master catalog of inbound lead acquisition channels. Shared directly with the Lead Sources and CRM Lead creation modules."
                addLabel="Add Lead Source"
                onAdd={handleOpenAdd}
                items={leadSources.map((s) => ({
                  id: s.id,
                  name: s.name,
                  category: s.channel_type,
                  active: s.is_active,
                  description: s.description,
                  created_at: s.created_at,
                  is_system: true,
                }))}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                categoryOptions={['Digital', 'Offline']}
                usageMap={leadSourceUsage}
                usageLabel="Leads Attributed"
                onToggleStatus={(item) =>
                  handleToggleStatus('sources', item.id, item.active, item.name)
                }
                onEdit={handleOpenEdit}
              />
            )}

            {/* TAB 4: Referral Partner Types */}
            {activeTab === 'partners' && (
              <ConfigListTable
                title="Referral Source & Partner Categories"
                description="Classification categories for external channel partners, brokers, corporate referral desks, and consultants."
                addLabel="Add Partner Category"
                onAdd={handleOpenAdd}
                items={partnerCategories}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                usageMap={partnerCategoryUsage}
                usageLabel="Registered Partners"
                onToggleStatus={(item) =>
                  handleToggleStatus('partners', item.id, item.active, item.name)
                }
                onEdit={handleOpenEdit}
              />
            )}

            {/* TAB 5: Calling Campaign Purposes & Call Dispositions */}
            {activeTab === 'telemarketing' && (
              <div className="space-y-6">
                {/* Section A: Calling Purposes */}
                <ConfigListTable
                  title="Calling Campaign Purposes"
                  description="High-level operational objectives assigned to outbound telemarketing calling lists (e.g. Cold Calling, Owner Acquisition)."
                  addLabel="Add Calling Purpose"
                  onAdd={() => {
                    setFormCategory('Purpose')
                    handleOpenAdd()
                  }}
                  items={telemarketingPurposes}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  usageMap={telemarketingUsage.purposeMap}
                  usageLabel="Telemarketing Campaigns"
                  onToggleStatus={(item) =>
                    handleToggleStatus('telemarketing', item.id, item.active, item.name, 'Purpose')
                  }
                  onEdit={(item) => handleOpenEdit({ ...item, category: 'Purpose' })}
                />

                {/* Section B: Call Dispositions */}
                <ConfigListTable
                  title="Call Dispositions & Outcomes"
                  description="Standardized call outcome statuses logged by telecallers (e.g. Connected, Call Later, Interested, Converted to Lead)."
                  addLabel="Add Call Disposition"
                  onAdd={() => {
                    setFormCategory('Disposition')
                    handleOpenAdd()
                  }}
                  items={callDispositions}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  usageMap={telemarketingUsage.dispositionMap}
                  usageLabel="Contact Attempts"
                  onToggleStatus={(item) =>
                    handleToggleStatus('telemarketing', item.id, item.active, item.name, 'Disposition')
                  }
                  onEdit={(item) => handleOpenEdit({ ...item, category: 'Disposition' })}
                />
              </div>
            )}

            {/* TAB 6: Marketing Content Types */}
            {activeTab === 'content_types' && (
              <ConfigListTable
                title="Marketing Content Types"
                description="Collateral classifications used in the Content Library (e.g. Ad Copy, High-Res Photos, Drone Videos, Call Scripts)."
                addLabel="Add Content Type"
                onAdd={handleOpenAdd}
                items={contentTypes}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                categoryOptions={['Text', 'Media', 'Document', 'Script', 'Other']}
                usageMap={contentTypeUsage}
                usageLabel="Collateral Items"
                onToggleStatus={(item) =>
                  handleToggleStatus('content_types', item.id, item.active, item.name)
                }
                onEdit={handleOpenEdit}
              />
            )}

            {/* TAB 7: Recent Audit Trail */}
            {activeTab === 'audit_trail' && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200 bg-slate-50/50 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="text-pink-600" size={18} />
                        Marketing Configuration Audit Trail
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-0.5">
                        Immutable security log tracking all marketing configuration mutations in real time.
                      </CardDescription>
                    </div>
                    <Link href="/audit?entity=Marketing+Config">
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-slate-300">
                        View in Global Audit
                        <ArrowRight size={12} />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                          <th className="py-2.5 px-4">Event ID / Time</th>
                          <th className="py-2.5 px-4">Action</th>
                          <th className="py-2.5 px-4">Performed By</th>
                          <th className="py-2.5 px-4">Summary Description</th>
                          <th className="py-2.5 px-4">Details Payload</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">
                              No marketing configuration audit logs recorded yet.
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="font-mono text-xs font-semibold text-slate-900 block">
                                  {log.id}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {log.timestamp}
                                </span>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                    log.action === 'Created'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : log.action === 'Status Changed'
                                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}
                                >
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="font-medium text-slate-800 block">
                                  {log.user_name}
                                </span>
                                <span className="text-[10px] text-slate-500 uppercase">
                                  {log.user_role}
                                </span>
                              </td>
                              <td className="py-3 px-4 max-w-sm">
                                <p className="font-medium text-slate-800 text-xs">
                                  {log.summary}
                                </p>
                              </td>
                              <td className="py-3 px-4">
                                {log.details && Object.keys(log.details).length > 0 ? (
                                  <pre className="text-[10px] bg-slate-100 text-slate-700 p-1.5 rounded max-w-xs overflow-x-auto font-mono">
                                    {JSON.stringify(log.details, null, 1)}
                                  </pre>
                                ) : (
                                  <span className="text-slate-400 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ── Add Item Modal ─────────────────────────────────────────────────── */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
              <form onSubmit={handleSaveAdd}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Plus className="text-slate-700" size={18} />
                    <h3 className="text-base font-bold text-slate-900">
                      Add New Config Value
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700 block mb-1">
                      Display Name <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      required
                      placeholder="e.g. Student Housing Drive, NRI Investors..."
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="h-9 text-xs"
                      autoFocus
                    />
                  </div>

                  {/* Optional Category dropdown depending on tab */}
                  {activeTab === 'sources' && (
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 block mb-1">
                        Channel Type <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="h-9 text-xs"
                      >
                        <option value="Digital">Digital Channel</option>
                        <option value="Offline">Offline Channel</option>
                      </Select>
                    </div>
                  )}

                  {activeTab === 'telemarketing' && (
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 block mb-1">
                        Classification <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="h-9 text-xs"
                      >
                        <option value="Purpose">Calling Campaign Purpose</option>
                        <option value="Disposition">Call Outcome Disposition</option>
                      </Select>
                    </div>
                  )}

                  {activeTab === 'content_types' && (
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 block mb-1">
                        Asset Format <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="h-9 text-xs"
                      >
                        <option value="Text">Text Narrative / Copy</option>
                        <option value="Media">Visual Media (Photo / Video)</option>
                        <option value="Document">PDF / Brochure / Document</option>
                        <option value="Script">Call / Pitch Script</option>
                        <option value="Other">Other / Unclassified</option>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs font-semibold text-slate-700 block mb-1">
                      Description & Strategic Objective
                    </Label>
                    <Textarea
                      rows={3}
                      placeholder="Explain how this option will be used across marketing campaigns..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="text-xs resize-none"
                    />
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-[11px] text-blue-800">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <span>
                      This item will be saved with <strong>Active</strong> status and immediately recorded in the security audit log.
                    </span>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddModalOpen(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Save & Activate
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Edit Item Modal ────────────────────────────────────────────────── */}
        {isEditModalOpen && selectedItemToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
              <form onSubmit={handleSaveEdit}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Edit2 className="text-slate-700" size={18} />
                    <h3 className="text-base font-bold text-slate-900">
                      Edit Configuration Value
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false)
                      setSelectedItemToEdit(null)
                    }}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700 block mb-1">
                      Display Name <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="h-9 text-xs"
                      autoFocus
                    />
                  </div>

                  {activeTab === 'sources' && (
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 block mb-1">
                        Channel Type
                      </Label>
                      <Select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="h-9 text-xs"
                      >
                        <option value="Digital">Digital Channel</option>
                        <option value="Offline">Offline Channel</option>
                      </Select>
                    </div>
                  )}

                  {activeTab === 'content_types' && (
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 block mb-1">
                        Asset Format
                      </Label>
                      <Select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="h-9 text-xs"
                      >
                        <option value="Text">Text Narrative / Copy</option>
                        <option value="Media">Visual Media (Photo / Video)</option>
                        <option value="Document">PDF / Brochure / Document</option>
                        <option value="Script">Call / Pitch Script</option>
                        <option value="Other">Other / Unclassified</option>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs font-semibold text-slate-700 block mb-1">
                      Description & Objective
                    </Label>
                    <Textarea
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="text-xs resize-none"
                    />
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-[11px] text-amber-800">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <span>
                      Renaming this option will update its label for future selections while preserving reference IDs for existing records.
                    </span>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditModalOpen(false)
                      setSelectedItemToEdit(null)
                    }}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Save Changes
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

// ── Reusable Config List Table Component ──────────────────────────────────────

interface ConfigListTableProps {
  title: string
  description: string
  addLabel: string
  onAdd: () => void
  items: (MarketingConfigItem | {
    id: string
    name: string
    category?: string
    active: boolean
    description?: string
    created_at?: string
    is_system?: boolean
  })[]
  searchQuery: string
  setSearchQuery: (q: string) => void
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE'
  setStatusFilter: (s: 'ALL' | 'ACTIVE' | 'INACTIVE') => void
  categoryFilter?: string
  setCategoryFilter?: (c: string) => void
  categoryOptions?: string[]
  usageMap: Record<string, number>
  usageLabel: string
  onToggleStatus: (item: any) => void
  onEdit: (item: any) => void
}

function ConfigListTable({
  title,
  description,
  addLabel,
  onAdd,
  items,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  categoryOptions,
  usageMap,
  usageLabel,
  onToggleStatus,
  onEdit,
}: ConfigListTableProps) {
  // Filtered Items
  const filtered = useMemo(() => {
    return items.filter((item) => {
      // Status filter
      if (statusFilter === 'ACTIVE' && !item.active) return false
      if (statusFilter === 'INACTIVE' && item.active) return false

      // Category filter
      if (categoryFilter && categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = item.name.toLowerCase().includes(q)
        const matchDesc = item.description?.toLowerCase().includes(q) || false
        const matchCat = item.category?.toLowerCase().includes(q) || false
        if (!matchName && !matchDesc && !matchCat) return false
      }

      return true
    })
  }, [items, statusFilter, categoryFilter, searchQuery])

  const activeCount = items.filter((i) => i.active).length
  const inactiveCount = items.length - activeCount

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header & Controls */}
      <CardHeader className="border-b border-slate-200 bg-slate-50/50 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-900">{title}</CardTitle>
              <Badge variant="secondary" className="font-mono text-xs">
                {items.length} Total
              </Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">
                {activeCount} Active
              </Badge>
              {inactiveCount > 0 && (
                <Badge className="bg-zinc-100 text-zinc-600 border-zinc-200 text-[11px]">
                  {inactiveCount} Inactive
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              {description}
            </CardDescription>
          </div>

          <Button
            onClick={onAdd}
            size="sm"
            className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white shrink-0 gap-1.5"
          >
            <Plus size={14} />
            {addLabel}
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5 mt-3 pt-3 border-t border-slate-200/80">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Status:</span>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-8 text-xs w-28"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </Select>
          </div>

          {categoryOptions && setCategoryFilter && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium">Category:</span>
              <Select
                value={categoryFilter || 'ALL'}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 text-xs w-32"
              >
                <option value="ALL">All Categories</option>
                {categoryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Table Body */}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                <th className="py-2.5 px-4 w-1/3">Name & Objective / Narrative</th>
                {items.some((i) => i.category) && (
                  <th className="py-2.5 px-4">Category / Type</th>
                )}
                <th className="py-2.5 px-4">Status & Visibility</th>
                <th className="py-2.5 px-4">Usage in App</th>
                <th className="py-2.5 px-4">Class</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No matching configuration values found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const usage = usageMap[item.name] || 0
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        !item.active ? 'bg-slate-50/40 text-slate-400' : ''
                      }`}
                    >
                      {/* Name & Description */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2">
                          <div>
                            <span
                              className={`font-semibold text-xs block ${
                                item.active ? 'text-slate-900' : 'text-slate-500 line-through'
                              }`}
                            >
                              {item.name}
                            </span>
                            {item.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 max-w-sm">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category / Type Column */}
                      {items.some((i) => i.category) && (
                        <td className="py-3 px-4 whitespace-nowrap">
                          {item.category ? (
                            <Badge
                              variant="outline"
                              className={`text-[11px] font-normal ${
                                item.category === 'Digital'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : item.category === 'Offline'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : item.category === 'Media'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : item.category === 'Text'
                                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {item.category}
                            </Badge>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      )}

                      {/* Active Status Badge + Toggle */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleStatus(item)}
                            title={
                              item.active
                                ? 'Click to deactivate (hide from new records)'
                                : 'Click to reactivate'
                            }
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              item.active ? 'bg-emerald-600' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                item.active ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span
                            className={`text-xs font-semibold ${
                              item.active ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {item.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>

                      {/* Usage Count */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono text-xs font-semibold ${
                              usage > 0 ? 'text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {usage}
                          </span>
                          <span className="text-[11px] text-slate-500">{usageLabel}</span>
                        </div>
                      </td>

                      {/* System / Custom */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className="text-[10px] text-slate-600 bg-slate-100 border-slate-200"
                        >
                          {item.is_system !== false ? 'System' : 'Custom'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(item)}
                            className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 gap-1"
                          >
                            <Edit2 size={12} />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleStatus(item)}
                            className={`h-7 px-2 text-xs ${
                              item.active
                                ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                                : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {item.active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

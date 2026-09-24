'use client'

/**
 * Leads List page — Spec §1.2.2 & Lead Sources Attribution Extension
 * Filters: Status, Type, Priority, Channel Type (Digital/Offline), Source + Search
 * Table: Name, Source & Channel (with campaign & ad tags), Type, Status, Priority, Assigned To, Value, Enquiry Date, Next Follow-up, Actions
 * "+ New Lead" form with Channel Type toggle, dynamic Source dropdown, Linked Campaign, Referral/Campaign Code, Ad Reference, Enquiry Date/Time
 * Role: SUPER_ADMIN, OFFICE_EXECUTIVE only
 *
 * TEMPORARY: Uses mock data from mockData.ts.
 * Will be swapped to real API calls during the backend-wiring pass.
 */

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Globe, Building2, Megaphone, Tag, Calendar, ExternalLink, Handshake } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog } from '@/components/ui/dialog'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import {
  formatPrice, formatDateTime, priorityClasses, statusClasses,
} from '@/lib/formatters'
import {
  MOCK_LEADS,
  MOCK_PARTIES,
  MOCK_USERS,
  MOCK_CAMPAIGNS,
  DEFAULT_LEAD_SOURCES,
  MOCK_REFERRAL_PARTNERS,
  type LeadRow,
  type ChannelType,
} from '@/lib/mockData'

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUSES   = ['', 'ACTIVE', 'NEW', 'CONTACTED', 'QUALIFIED', 'LOST'] as const
const TYPES      = ['', 'BUYER', 'SELLER', 'TENANT', 'LANDLORD', 'INVESTOR', 'CONSULTANT'] as const
const PRIORITIES = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
const CHANNELS   = ['', 'Digital', 'Offline'] as const

// ── Main component ────────────────────────────────────────────────────────────

function LeadsContent() {
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get('status') || ''
  const initialSearch = searchParams.get('search') || ''

  // Local mutable copy of leads (supports create + inline patch)
  const [leads, setLeads] = useState<LeadRow[]>([...MOCK_LEADS])

  // Page-specific filters (search handled by DataTable)
  const [fStatus, setFStatus]     = useState(initialStatus)
  const [fType, setFType]         = useState('')
  const [fPriority, setFPriority] = useState('')
  const [fChannel, setFChannel]   = useState('')
  const [fSource, setFSource]     = useState('')

  useEffect(() => {
    if (initialStatus) {
      setFStatus(initialStatus)
    }
  }, [initialStatus])

  // Create Modal State
  const [showCreate, setShowCreate] = useState(false)
  const [newChannelType, setNewChannelType] = useState<ChannelType>('Digital')
  const [newSource, setNewSource] = useState<string>('Website')
  const [newCampaignId, setNewCampaignId] = useState<string>('')
  const [newPartnerId, setNewPartnerId] = useState<string>('')
  const [newReferralCode, setNewReferralCode] = useState<string>('')

  // Handle Channel Type toggle in "+ New Lead" modal
  const handleChannelTypeChange = (type: ChannelType) => {
    setNewChannelType(type)
    const firstMatchingSource = DEFAULT_LEAD_SOURCES.find(
      s => s.channel_type === type && s.is_active
    )
    setNewSource(firstMatchingSource ? firstMatchingSource.name : (type === 'Digital' ? 'Website' : 'Newspaper'))
    setNewPartnerId('')
    setNewReferralCode('')
  }

  // Filter sources available in the filter bar based on selected Channel Type
  const availableSourcesForFilter = useMemo(() => {
    const list = DEFAULT_LEAD_SOURCES.filter(s => s.is_active)
    if (fChannel) {
      return list.filter(s => s.channel_type === fChannel).map(s => s.name)
    }
    return Array.from(new Set(list.map(s => s.name)))
  }, [fChannel])

  // Filtered view (page-specific filters only — search is in DataTable)
  const filtered = useMemo(() => {
    let items = leads
    if (fStatus) {
      if (fStatus === 'ACTIVE') {
        items = items.filter(l => l.status !== 'LOST' && l.status !== 'Lost')
      } else {
        items = items.filter(l => l.status === fStatus)
      }
    }
    if (fType)      items = items.filter(l => l.lead_type === fType)
    if (fPriority)  items = items.filter(l => l.priority === fPriority)
    if (fChannel)   items = items.filter(l => l.channel_type === fChannel)
    if (fSource)    items = items.filter(l => l.source === fSource)
    return items
  }, [leads, fStatus, fType, fPriority, fChannel, fSource])

  // ── Create lead ──────────────────────────────────────────────────────────
  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const partyId = fd.get('party_id') as string
    const party = MOCK_PARTIES.find(p => p.id === partyId)
    const assignedId = (fd.get('assigned_to_id') as string) || null
    const assigned = MOCK_USERS.find(u => u.id === assignedId)
    const campaignId = newCampaignId || null
    const campaign = campaignId ? MOCK_CAMPAIGNS.find(c => c.id === campaignId) : null
    const enquiryAtInput = fd.get('enquiry_at') as string
    const partner = newPartnerId ? MOCK_REFERRAL_PARTNERS.find(p => p.id === newPartnerId) : null

    const newLead: LeadRow = {
      id: `L-${Date.now().toString(36).toUpperCase().slice(-8)}`,
      party_id: partyId,
      party_name: party?.name ?? '—',
      channel_type: newChannelType,
      source: newSource,
      lead_type: fd.get('lead_type') as string,
      status: 'NEW',
      priority: (fd.get('priority') as string) || 'MEDIUM',
      assigned_to_id: assignedId,
      assigned_to_name: assigned?.name ?? null,
      value: fd.get('value') ? parseFloat(fd.get('value') as string) : null,
      remarks: (fd.get('remarks') as string) || null,
      campaign_id: campaignId,
      campaign_name: campaign?.name ?? null,
      referral_partner_id: partner ? partner.id : null,
      referral_partner_name: partner ? partner.name : null,
      referral_code: newReferralCode || (fd.get('referral_code') as string) || (partner?.referral_code ?? null),
      ad_reference: newChannelType === 'Digital' ? ((fd.get('ad_reference') as string) || null) : null,
      enquiry_at: enquiryAtInput ? new Date(enquiryAtInput).toISOString() : new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      next_follow_up_at: null,
      created_at: new Date().toISOString(),
    }

    setLeads(prev => [newLead, ...prev])
    setShowCreate(false)
    setNewPartnerId('')
    setNewReferralCode('')
    // Reset form state defaults
    setNewChannelType('Digital')
    setNewSource('Website')
    setNewCampaignId('')
  }

  // ── Inline status change ─────────────────────────────────────────────────
  const patchStatus = useCallback((id: string, newStatus: string) => {
    setLeads(prev => prev.map(l =>
      l.id === id ? { ...l, status: newStatus, last_activity_at: new Date().toISOString() } : l
    ))
  }, [])

  // ── Column definitions ──────────────────────────────────────────────────
  const columns: ColumnDef<LeadRow>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Name',
      sortValue: (r) => r.party_name,
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900">{r.party_name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-slate-400 font-mono">{r.id}</span>
            {r.enquiry_at && (
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5" title={`Enquiry Date: ${formatDateTime(r.enquiry_at)}`}>
                • {new Date(r.enquiry_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source & Channel',
      sortValue: (r) => `${r.channel_type || ''} ${r.source || ''}`,
      render: (r) => (
        <div className="space-y-1 max-w-[210px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {r.channel_type && (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                  r.channel_type === 'Digital'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {r.channel_type === 'Digital' ? <Globe size={10} /> : <Building2 size={10} />}
                {r.channel_type}
              </span>
            )}
            <span className="font-semibold text-slate-800 text-xs">{r.source || '—'}</span>
          </div>

          {/* Partner Referral Badge */}
          {r.referral_partner_name && (
            <div className="flex items-center gap-1">
              <span
                className="inline-flex items-center gap-1 text-[10px] text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-medium truncate max-w-[190px]"
                title={`Referred by Partner: ${r.referral_partner_name}`}
              >
                <Handshake size={10} className="shrink-0 text-indigo-600" />
                <span className="truncate">{r.referral_partner_name}</span>
              </span>
            </div>
          )}

          {/* Linked Campaign Badge */}
          {r.campaign_name && (
            <div className="flex items-center gap-1">
              <span
                className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-medium truncate max-w-[190px]"
                title={`Linked Campaign: ${r.campaign_name}`}
              >
                <Megaphone size={10} className="shrink-0 text-indigo-500" />
                <span className="truncate">{r.campaign_name}</span>
              </span>
            </div>
          )}

          {/* Attribution: Referral Code & Ad Reference */}
          {(r.ad_reference || r.referral_code) && (
            <div className="text-[10px] text-slate-500 truncate" title={`${r.referral_code ? `Code: ${r.referral_code} ` : ''}${r.ad_reference || ''}`}>
              {r.referral_code && (
                <span className="font-mono bg-slate-100 text-slate-700 px-1 py-0.2 rounded border border-slate-200 mr-1">
                  {r.referral_code}
                </span>
              )}
              {r.ad_reference && (
                <span className="text-slate-400 truncate">{r.ad_reference}</span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortValue: (r) => r.lead_type,
      render: (r) => <Badge variant="secondary" className="text-xs">{r.lead_type}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.status,
      render: (r) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(r.status)}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortValue: (r) => ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].indexOf(r.priority),
      render: (r) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${priorityClasses(r.priority)}`}>
          {r.priority}
        </span>
      ),
    },
    {
      key: 'assigned',
      header: 'Assigned To',
      sortValue: (r) => r.assigned_to_name || '',
      render: (r) => <span className="text-slate-600 text-xs">{r.assigned_to_name || '—'}</span>,
    },
    {
      key: 'value',
      header: 'Value',
      align: 'right',
      sortValue: (r) => r.value ?? 0,
      render: (r) => (
        <span className="text-slate-700 whitespace-nowrap font-medium">{r.value ? formatPrice(r.value) : '—'}</span>
      ),
    },
    {
      key: 'last_activity',
      header: 'Last Activity',
      sortValue: (r) => r.last_activity_at ? new Date(r.last_activity_at).getTime() : 0,
      render: (r) => <span className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(r.last_activity_at)}</span>,
    },
    {
      key: 'next_followup',
      header: 'Next Follow-up',
      sortValue: (r) => r.next_follow_up_at ? new Date(r.next_follow_up_at).getTime() : 0,
      render: (r) => <span className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(r.next_follow_up_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (r) => (
        <Select
          value={r.status}
          onChange={e => patchStatus(r.id, e.target.value)}
          className="h-7 text-xs px-2 w-auto min-w-[95px]"
        >
          {STATUSES.filter(Boolean).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      ),
    },
  ], [patchStatus])

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage and track your sales pipeline leads and acquisition channels</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} className="mr-1.5" /> New Lead
          </Button>
        </div>

        {/* DataTable with sorting, search, and page-specific filters */}
        <DataTable<LeadRow>
          columns={columns}
          data={filtered}
          totalCount={leads.length}
          initialSearch={initialSearch}
          rowKey={(r) => r.id}
          searchFields={[
            (r) => r.party_name,
            (r) => r.id,
            (r) => r.source,
            (r) => r.channel_type,
            (r) => r.campaign_name,
            (r) => r.referral_code,
            (r) => r.ad_reference,
            (r) => r.assigned_to_name,
          ]}
          searchPlaceholder="Search by name, ID, source, channel, campaign…"
          hasActiveFilters={!!fStatus || !!fType || !!fPriority || !!fChannel || !!fSource}
          onClearFilters={() => {
            setFStatus('')
            setFType('')
            setFPriority('')
            setFChannel('')
            setFSource('')
          }}
          emptyTitle="No leads found"
          emptyDescription='Click "+ New Lead" to create one.'
          filterSlot={
            <>
              {/* Status Filter */}
              <Select value={fStatus} onChange={e => setFStatus(e.target.value)} className="h-8 text-sm min-w-[110px]">
                <option value="">All Status</option>
                <option value="ACTIVE">Active (All)</option>
                {STATUSES.filter(s => Boolean(s) && s !== 'ACTIVE').map(s => <option key={s} value={s}>{s}</option>)}
              </Select>

              {/* Type Filter */}
              <Select value={fType} onChange={e => setFType(e.target.value)} className="h-8 text-sm min-w-[110px]">
                <option value="">All Types</option>
                {TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
              </Select>

              {/* Priority Filter */}
              <Select value={fPriority} onChange={e => setFPriority(e.target.value)} className="h-8 text-sm min-w-[110px]">
                <option value="">All Priority</option>
                {PRIORITIES.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
              </Select>

              {/* Channel Type Filter */}
              <Select
                value={fChannel}
                onChange={e => {
                  setFChannel(e.target.value)
                  setFSource('') // reset source when channel changes
                }}
                className="h-8 text-sm min-w-[120px]"
              >
                <option value="">All Channels</option>
                {CHANNELS.filter(Boolean).map(ch => <option key={ch} value={ch}>{ch}</option>)}
              </Select>

              {/* Source Filter (Filtered dynamically) */}
              <Select value={fSource} onChange={e => setFSource(e.target.value)} className="h-8 text-sm min-w-[130px]">
                <option value="">All Sources</option>
                {availableSourcesForFilter.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </>
          }
        />

        {/* ── Create Lead Dialog ──────────────────────────────────────────── */}
        <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="New Lead">
          <form onSubmit={handleCreate} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {/* Party Selection */}
            <div>
              <Label htmlFor="party_id">Party *</Label>
              <Select name="party_id" id="party_id" required className="mt-1">
                <option value="">Select party…</option>
                {MOCK_PARTIES.map(p => <option key={p.id} value={p.id}>{p.name} ({p.mobile})</option>)}
              </Select>
            </div>

            {/* Type & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lead_type">Type *</Label>
                <Select name="lead_type" id="lead_type" required className="mt-1">
                  {TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" id="priority" defaultValue="MEDIUM" className="mt-1">
                  {PRIORITIES.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
                </Select>
              </div>
            </div>

            {/* ── Channel & Lead Source Section ── */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Acquisition Channel & Source *
                </Label>
                <span className="text-[11px] text-slate-500">Track origin for attribution</span>
              </div>

              {/* Channel Type Toggle */}
              <div>
                <Label className="text-xs text-slate-600 block mb-1.5">Channel Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChannelTypeChange('Digital')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                      newChannelType === 'Digital'
                        ? 'bg-sky-50 text-sky-700 border-sky-300 ring-2 ring-sky-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Globe size={14} className={newChannelType === 'Digital' ? 'text-sky-600' : 'text-slate-400'} />
                    Digital Channel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChannelTypeChange('Offline')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                      newChannelType === 'Offline'
                        ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 size={14} className={newChannelType === 'Offline' ? 'text-amber-600' : 'text-slate-400'} />
                    Offline Channel
                  </button>
                </div>
              </div>

              {/* Dynamic Source Dropdown */}
              <div>
                <Label htmlFor="source" className="text-xs text-slate-600">
                  {newChannelType} Source *
                </Label>
                <Select
                  name="source"
                  id="source"
                  value={newSource}
                  onChange={e => {
                    const src = e.target.value
                    setNewSource(src)
                    if (src !== 'Referral Partner') {
                      setNewPartnerId('')
                      setNewReferralCode('')
                    }
                  }}
                  required
                  className="mt-1"
                >
                  {DEFAULT_LEAD_SOURCES
                    .filter(s => s.channel_type === newChannelType && s.is_active)
                    .map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                </Select>
              </div>

              {/* Conditional Partner Picker when Source is Referral Partner */}
              {newSource === 'Referral Partner' && (
                <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="referral_partner" className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Handshake size={14} className="text-indigo-600" />
                      Referred by Partner *
                    </Label>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-full">
                      Partner Attribution
                    </span>
                  </div>
                  <Select
                    id="referral_partner"
                    value={newPartnerId}
                    onChange={(e) => {
                      const pId = e.target.value
                      setNewPartnerId(pId)
                      const partner = MOCK_REFERRAL_PARTNERS.find(p => p.id === pId)
                      if (partner) {
                        setNewReferralCode(partner.referral_code)
                      }
                    }}
                    required
                    className="mt-1 bg-white text-xs"
                  >
                    <option value="">-- Choose Referral Partner --</option>
                    {MOCK_REFERRAL_PARTNERS.filter(p => p.status === 'Active').map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category} • {p.referral_code})
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {/* Optional Linked Campaign */}
              <div>
                <Label htmlFor="campaign_id" className="text-xs text-slate-600">
                  Linked Marketing Campaign (Optional)
                </Label>
                <Select
                  name="campaign_id"
                  id="campaign_id"
                  value={newCampaignId}
                  onChange={e => setNewCampaignId(e.target.value)}
                  className="mt-1"
                >
                  <option value="">None (Organic / Unlinked)</option>
                  {MOCK_CAMPAIGNS.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type} • {c.status})
                    </option>
                  ))}
                </Select>
              </div>

              {/* Campaign / Referral Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="referral_code" className="text-xs text-slate-600">
                    Campaign / Referral Code
                  </Label>
                  <Input
                    name="referral_code"
                    id="referral_code"
                    placeholder="e.g. META-INSTA-01, REF-BALAJI"
                    value={newReferralCode}
                    onChange={e => setNewReferralCode(e.target.value)}
                    className="mt-1 font-mono text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="enquiry_at" className="text-xs text-slate-600">
                    Enquiry Date & Time
                  </Label>
                  <Input
                    type="datetime-local"
                    name="enquiry_at"
                    id="enquiry_at"
                    defaultValue={new Date().toISOString().slice(0, 16)}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              {/* Landing Page / Ad Reference (Digital Only) */}
              {newChannelType === 'Digital' && (
                <div>
                  <Label htmlFor="ad_reference" className="text-xs text-slate-600">
                    Landing Page / Ad Reference (Optional)
                  </Label>
                  <Input
                    name="ad_reference"
                    id="ad_reference"
                    placeholder="e.g. /lp/super-corridor or Google Search Ad #2"
                    className="mt-1 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Value & Assigned To */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">Estimated Value (₹)</Label>
                <Input name="value" id="value" type="number" step="1000" placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="assigned_to_id">Assigned To</Label>
                <Select name="assigned_to_id" id="assigned_to_id" className="mt-1">
                  <option value="">Unassigned</option>
                  {MOCK_USERS.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </Select>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <Label htmlFor="remarks">Remarks / Initial Notes</Label>
              <Textarea name="remarks" id="remarks" placeholder="Client requirements, preferred micro-locations, budget notes…" className="mt-1" rows={2} />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit">Create Lead</Button>
            </div>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  )
}

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
          Loading Leads…
        </div>
      }
    >
      <LeadsContent />
    </Suspense>
  )
}

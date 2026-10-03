'use client'

/**
 * Leads List page — Spec §1.2.2 & Lead Sources Attribution Extension
 * Filters: Status, Type, Priority, Channel Type (Digital/Offline), Source + Search
 * Table: Name, Source & Channel (with campaign & ad tags), Type, Status, Priority, Assigned To, Value, Enquiry Date, Next Follow-up, Actions
 * "+ New Lead" form with Channel Type toggle, dynamic Source dropdown, Linked Campaign, Referral/Campaign Code, Ad Reference, Enquiry Date/Time
 * Role: SUPER_ADMIN, OFFICE_EXECUTIVE only
 *
 * DATA SOURCE: Real FastAPI backend via apiClient.ts
 */

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Plus, Globe, Building2, Megaphone, Calendar, ExternalLink,
  Handshake, Loader2, AlertCircle, Trash2, ShieldAlert, RefreshCw
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
import {
  formatPrice, formatDateTime, priorityClasses, statusClasses,
} from '@/lib/formatters'
import { apiClient } from '@/lib/apiClient'
import {
  DEFAULT_LEAD_SOURCES,
  type LeadRow,
  type PartyRow,
  type ChannelType,
} from '@/lib/mockData'

// ── Constants ─────────────────────────────────────────────────────────────────

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'WON', 'STALE', 'CLOSED'] as const
const TYPES         = ['', 'BUYER', 'SELLER', 'TENANT', 'LANDLORD', 'INVESTOR', 'CONSULTANT'] as const
const PRIORITIES    = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
const CHANNELS      = ['', 'Digital', 'Offline'] as const

// ── Error Helper ─────────────────────────────────────────────────────────────

function parseApiError(err: unknown, defaultMsg: string): { status?: number; message: string; isForbidden?: boolean } {
  if (!(err instanceof Error)) return { message: defaultMsg }
  const raw = err.message
  const match = raw.match(/API (\d{3}):/)
  const status = match ? parseInt(match[1], 10) : undefined

  let detail = raw
  try {
    const jsonStart = raw.indexOf('{')
    if (jsonStart !== -1) {
      const parsed = JSON.parse(raw.slice(jsonStart))
      if (parsed.detail) {
        if (typeof parsed.detail === 'string') {
          detail = parsed.detail
        } else if (Array.isArray(parsed.detail)) {
          detail = parsed.detail.map((d: any) => `${d.loc?.slice(-1)[0] || 'field'}: ${d.msg}`).join(', ')
        }
      }
    }
  } catch {
    // ignore JSON parsing issues
  }

  if (status === 403) {
    return {
      status: 403,
      message: "You don't have permission to perform this action (requires SUPER_ADMIN or OFFICE_EXECUTIVE).",
      isForbidden: true,
    }
  }
  if (status === 401) {
    return { status: 401, message: "Not authenticated — provide a valid session or mock role header." }
  }

  return { status, message: detail || defaultMsg }
}

// ── Main component ────────────────────────────────────────────────────────────

function LeadsContent() {
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get('status') || ''
  const initialSearch = searchParams.get('search') || ''

  // Real backend state
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Parties for create modal picker
  const [parties, setParties] = useState<PartyRow[]>([])
  const [partiesLoading, setPartiesLoading] = useState(false)

  // Active agents for assignment picker
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([])

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
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [newChannelType, setNewChannelType] = useState<ChannelType>('Digital')
  const [newSource, setNewSource] = useState<string>('Website')
  const [newReferralCode, setNewReferralCode] = useState<string>('')

  // ── Fetch Leads from Real Backend ──────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const data = await apiClient.get<{ items: LeadRow[]; total: number }>('/api/leads?limit=200')
      setLeads(data.items || [])
      setTotalCount(data.total || 0)
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Failed to load leads')
      if (parsed.status === 403) {
        setPermissionDenied(true)
      } else {
        setError(parsed.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Fetch Parties for Picker ───────────────────────────────────────────────
  const fetchParties = useCallback(async () => {
    setPartiesLoading(true)
    try {
      const data = await apiClient.get<{ items: PartyRow[]; total: number }>('/api/parties?limit=200')
      setParties(data.items || [])
    } catch {
      // Non-critical: form will show fallback or error if parties can't load
    } finally {
      setPartiesLoading(false)
    }
  }, [])

  // ── Fetch Active Agents for Assignment ──────────────────────────────────────
  const fetchAgents = useCallback(async () => {
    try {
      const data = await apiClient.get<{ items: { id: string; name: string }[]; total: number }>(
        '/api/users?role=AGENT&active=true&limit=100'
      )
      setAgents(data.items || [])
    } catch {
      // Non-critical: form fallback
    }
  }, [])

  useEffect(() => {
    fetchLeads()
    fetchParties()
    fetchAgents()
  }, [fetchLeads, fetchParties, fetchAgents])

  // Handle Channel Type toggle in "+ New Lead" modal
  const handleChannelTypeChange = (type: ChannelType) => {
    setNewChannelType(type)
    const firstMatchingSource = DEFAULT_LEAD_SOURCES.find(
      s => s.channel_type === type && s.is_active
    )
    setNewSource(firstMatchingSource ? firstMatchingSource.name : (type === 'Digital' ? 'Website' : 'Newspaper'))
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
        items = items.filter(l => l.status !== 'LOST' && l.status !== 'WON' && l.status !== 'CLOSED')
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

  // ── Create lead (Real Backend POST /api/leads) ─────────────────────────────
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError(null)

    const fd = new FormData(e.currentTarget)
    const partyId = fd.get('party_id') as string
    const enquiryAtInput = fd.get('enquiry_at') as string
    const assignedToVal = fd.get('assigned_to_id') as string

    const payload = {
      party_id: partyId,
      channel_type: newChannelType,
      source: newSource,
      lead_type: fd.get('lead_type') as string,
      status: 'NEW',
      priority: (fd.get('priority') as string) || 'MEDIUM',
      assigned_to_id: assignedToVal ? assignedToVal : null,
      value: fd.get('value') ? parseFloat(fd.get('value') as string) : null,
      remarks: (fd.get('remarks') as string) || null,
      campaign_id: null, // Decision 4: Send null until Marketing is live
      referral_partner_id: null, // Decision 4: Send null until Marketing is live
      referral_code: newReferralCode || (fd.get('referral_code') as string) || null,
      ad_reference: newChannelType === 'Digital' ? ((fd.get('ad_reference') as string) || null) : null,
      enquiry_at: enquiryAtInput ? new Date(enquiryAtInput).toISOString() : new Date().toISOString(),
    }

    try {
      await apiClient.post('/api/leads', payload)
      setShowCreate(false)
      setNewReferralCode('')
      setNewChannelType('Digital')
      setNewSource('Website')
      await fetchLeads()
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Failed to create lead')
      setCreateError(parsed.message)
    } finally {
      setCreateLoading(false)
    }
  }

  // ── Inline status change (Real Backend PATCH /api/leads/{id}) ──────────────
  const patchStatus = useCallback(async (id: string, newStatus: string) => {
    const current = leads.find(l => l.id === id)
    const oldStatus = current?.status
    if (!oldStatus || oldStatus === newStatus) return

    // Optimistic UI update
    setLeads(prev => prev.map(l =>
      l.id === id ? { ...l, status: newStatus, last_activity_at: new Date().toISOString() } : l
    ))
    setError(null)

    try {
      await apiClient.patch(`/api/leads/${id}`, { status: newStatus })
    } catch (err: unknown) {
      // Rollback on failure
      setLeads(prev => prev.map(l =>
        l.id === id ? { ...l, status: oldStatus } : l
      ))
      const parsed = parseApiError(err, `Failed to update status for lead ${id}`)
      setError(parsed.message)
    }
  }, [leads])

  // ── Delete lead (Real Backend DELETE /api/leads/{id}) ──────────────────────
  const handleDelete = useCallback(async (id: string, partyName: string) => {
    if (!confirm(`Are you sure you want to delete lead ${id} for ${partyName}?`)) return
    setDeletingId(id)
    setError(null)

    try {
      await apiClient.delete(`/api/leads/${id}`)
      await fetchLeads()
    } catch (err: unknown) {
      const parsed = parseApiError(err, `Failed to delete lead ${id}`)
      setError(parsed.message)
    } finally {
      setDeletingId(null)
    }
  }, [fetchLeads])

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
        <div className="flex items-center gap-1.5">
          <Select
            value={r.status}
            onChange={e => patchStatus(r.id, e.target.value)}
            className="h-7 text-xs px-2 w-auto min-w-[95px]"
          >
            {LEAD_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <button
            type="button"
            onClick={() => handleDelete(r.id, r.party_name)}
            disabled={deletingId === r.id}
            title={`Delete lead ${r.id}`}
            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === r.id ? (
              <Loader2 size={13} className="animate-spin text-red-500" />
            ) : (
              <Trash2 size={13} />
            )}
          </button>
        </div>
      ),
    },
  ], [patchStatus, deletingId, handleDelete])

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading ? 'Loading…' : `${totalCount} leads`} · Manage and track your sales pipeline leads and acquisition channels
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLeads()}
              disabled={loading}
              title="Refresh list from backend"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Button onClick={() => { setShowCreate(true); setCreateError(null) }}>
              <Plus size={16} className="mr-1.5" /> New Lead
            </Button>
          </div>
        </div>

        {/* Permission Denied (403) Banner */}
        {permissionDenied && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-6 py-8 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>
            <h2 className="text-lg font-bold">Access Restricted</h2>
            <p className="text-sm text-amber-800 max-w-md mx-auto">
              You don&apos;t have permission to view Leads. Leads management requires the Super Admin or Office Executive role.
            </p>
          </div>
        )}

        {/* Global Error Banner */}
        {error && !permissionDenied && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
          </div>
        )}

        {/* Main Content: Loading vs DataTable */}
        {!permissionDenied && (
          loading && leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-sm bg-white rounded-lg border border-slate-200">
              <Loader2 size={24} className="animate-spin mb-2 text-indigo-600" />
              <span>Loading leads from backend…</span>
            </div>
          ) : (
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
                    {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
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
          )
        )}

        {/* ── Create Lead Dialog ──────────────────────────────────────────── */}
        <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="New Lead">
          <form onSubmit={handleCreate} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {/* Create Error Banner */}
            {createError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span className="flex-1">{createError}</span>
              </div>
            )}

            {/* Party Selection (Real Backend /api/parties) */}
            <div>
              <Label htmlFor="party_id">Party *</Label>
              <Select name="party_id" id="party_id" required className="mt-1" disabled={partiesLoading}>
                <option value="">{partiesLoading ? 'Loading parties…' : 'Select party…'}</option>
                {parties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.mobile || p.id})
                  </option>
                ))}
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

              {/* Referral Partner Picker note (Decision 4) */}
              {newSource === 'Referral Partner' && (
                <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Handshake size={14} className="text-indigo-600" />
                    Referral Partner
                  </div>
                  <p className="text-xs text-indigo-700">
                    Partner directory selection will be available once Marketing is live. Enter the partner referral code below.
                  </p>
                </div>
              )}

              {/* Optional Linked Campaign (Decision 4) */}
              <div>
                <Label htmlFor="campaign_id" className="text-xs text-slate-600">
                  Linked Marketing Campaign (Optional)
                </Label>
                <Select name="campaign_id" id="campaign_id" disabled className="mt-1 bg-slate-100 text-slate-400 cursor-not-allowed">
                  <option value="">Available once Marketing is live</option>
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

            {/* Value & Assigned To (Decision 1) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">Estimated Value (₹)</Label>
                <Input name="value" id="value" type="number" step="1000" placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="assigned_to_id">Assigned To</Label>
                <Select name="assigned_to_id" id="assigned_to_id" className="mt-1">
                  <option value="">Unassigned</option>
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name}
                    </option>
                  ))}
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
              <Button type="submit" disabled={createLoading}>
                {createLoading && <Loader2 size={14} className="animate-spin mr-1.5" />}
                Create Lead
              </Button>
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

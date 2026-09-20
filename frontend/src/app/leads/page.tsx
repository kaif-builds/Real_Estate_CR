'use client'

/**
 * Leads List page — Spec §1.2.2
 * Filters: Status, Type, Priority (page-specific) + Search (DataTable)
 * Table: Name, Source, Type, Status, Priority, Assigned To, Value, Last Activity, Next Follow-up, Actions
 * "+ New Lead" form
 * Role: SUPER_ADMIN, OFFICE_EXECUTIVE only
 *
 * TEMPORARY: Uses mock data from mockData.ts.
 * Will be swapped to real API calls during the backend-wiring pass.
 */

import { useCallback, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
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
import { MOCK_LEADS, MOCK_PARTIES, MOCK_USERS, type LeadRow } from '@/lib/mockData'

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUSES   = ['', 'NEW', 'CONTACTED', 'QUALIFIED', 'LOST'] as const
const TYPES      = ['', 'BUYER', 'SELLER', 'TENANT', 'LANDLORD', 'INVESTOR', 'CONSULTANT'] as const
const PRIORITIES = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const

// ── Main component ────────────────────────────────────────────────────────────

export default function LeadsPage() {
  // Local mutable copy of leads (supports create + inline patch)
  const [leads, setLeads] = useState<LeadRow[]>([...MOCK_LEADS])

  // Page-specific filters (search handled by DataTable)
  const [fStatus, setFStatus]     = useState('')
  const [fType, setFType]         = useState('')
  const [fPriority, setFPriority] = useState('')

  // Modal
  const [showCreate, setShowCreate] = useState(false)

  // Filtered view (page-specific filters only — search is in DataTable)
  const filtered = useMemo(() => {
    let items = leads
    if (fStatus)   items = items.filter(l => l.status === fStatus)
    if (fType)     items = items.filter(l => l.lead_type === fType)
    if (fPriority) items = items.filter(l => l.priority === fPriority)
    return items
  }, [leads, fStatus, fType, fPriority])

  // ── Create lead ──────────────────────────────────────────────────────────
  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const partyId = fd.get('party_id') as string
    const party = MOCK_PARTIES.find(p => p.id === partyId)
    const assignedId = (fd.get('assigned_to_id') as string) || null
    const assigned = MOCK_USERS.find(u => u.id === assignedId)

    const newLead: LeadRow = {
      id: `L-${Date.now().toString(36).toUpperCase().slice(-8)}`,
      party_id: partyId,
      party_name: party?.name ?? '—',
      source: (fd.get('source') as string) || null,
      lead_type: fd.get('lead_type') as string,
      status: 'NEW',
      priority: (fd.get('priority') as string) || 'MEDIUM',
      assigned_to_id: assignedId,
      assigned_to_name: assigned?.name ?? null,
      value: fd.get('value') ? parseFloat(fd.get('value') as string) : null,
      remarks: (fd.get('remarks') as string) || null,
      last_activity_at: new Date().toISOString(),
      next_follow_up_at: null,
      created_at: new Date().toISOString(),
    }
    setLeads(prev => [newLead, ...prev])
    setShowCreate(false)
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
          <p className="font-medium text-slate-800">{r.party_name}</p>
          <p className="text-xs text-slate-400 font-mono">{r.id}</p>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      sortValue: (r) => r.source || '',
      render: (r) => <span className="text-slate-600">{r.source || '—'}</span>,
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
        <span className="text-slate-700 whitespace-nowrap">{r.value ? formatPrice(r.value) : '—'}</span>
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
            <p className="text-sm text-slate-500 mt-0.5">Manage and track your sales pipeline leads</p>
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
          rowKey={(r) => r.id}
          searchFields={[
            (r) => r.party_name,
            (r) => r.id,
            (r) => r.source,
            (r) => r.assigned_to_name,
          ]}
          searchPlaceholder="Search by name, ID, source…"
          hasActiveFilters={!!fStatus || !!fType || !!fPriority}
          onClearFilters={() => { setFStatus(''); setFType(''); setFPriority('') }}
          emptyTitle="No leads found"
          emptyDescription='Click "+ New Lead" to create one.'
          filterSlot={
            <>
              <Select value={fStatus} onChange={e => setFStatus(e.target.value)} className="h-8 text-sm min-w-[120px]">
                <option value="">All Status</option>
                {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Select value={fType} onChange={e => setFType(e.target.value)} className="h-8 text-sm min-w-[120px]">
                <option value="">All Types</option>
                {TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
              <Select value={fPriority} onChange={e => setFPriority(e.target.value)} className="h-8 text-sm min-w-[120px]">
                <option value="">All Priority</option>
                {PRIORITIES.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            </>
          }
        />

        {/* ── Create Lead Dialog ──────────────────────────────────────────── */}
        <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="New Lead">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="party_id">Party *</Label>
              <Select name="party_id" id="party_id" required className="mt-1">
                <option value="">Select party…</option>
                {MOCK_PARTIES.map(p => <option key={p.id} value={p.id}>{p.name} ({p.mobile})</option>)}
              </Select>
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="source">Source</Label>
                <Input name="source" id="source" placeholder="e.g. Website, Referral" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="value">Value (₹)</Label>
                <Input name="value" id="value" type="number" step="0.01" placeholder="0" className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="assigned_to_id">Assigned To</Label>
              <Select name="assigned_to_id" id="assigned_to_id" className="mt-1">
                <option value="">Unassigned</option>
                {MOCK_USERS.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </Select>
            </div>

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea name="remarks" id="remarks" placeholder="Optional notes…" className="mt-1" rows={2} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit">Create Lead</Button>
            </div>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  )
}

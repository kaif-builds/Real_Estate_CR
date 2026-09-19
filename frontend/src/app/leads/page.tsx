'use client'

/**
 * Leads List page — Spec §1.2.2
 * Filters: Status, Type, Priority, Search
 * Table: Name, Source, Type, Status, Priority, Assigned To, Value, Last Activity, Next Follow-up, Actions
 * "+ New Lead" form
 * Role: SUPER_ADMIN, OFFICE_EXECUTIVE only
 *
 * TEMPORARY: Uses mock data from mockData.ts.
 * Will be swapped to real API calls during the backend-wiring pass.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search, RefreshCw } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog } from '@/components/ui/dialog'
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

  // Filters
  const [fStatus, setFStatus]     = useState('')
  const [fType, setFType]         = useState('')
  const [fPriority, setFPriority] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]       = useState('')

  // Modal
  const [showCreate, setShowCreate] = useState(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // Filtered view
  const filtered = useMemo(() => {
    let items = leads
    if (fStatus)   items = items.filter(l => l.status === fStatus)
    if (fType)     items = items.filter(l => l.lead_type === fType)
    if (fPriority) items = items.filter(l => l.priority === fPriority)
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(l => l.party_name.toLowerCase().includes(q))
    }
    return items
  }, [leads, fStatus, fType, fPriority, search])

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
  const patchStatus = (id: string, newStatus: string) => {
    setLeads(prev => prev.map(l =>
      l.id === id ? { ...l, status: newStatus, last_activity_at: new Date().toISOString() } : l
    ))
  }

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
            <p className="text-sm text-slate-500 mt-0.5">{filtered.length} of {leads.length} total</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} className="mr-1.5" /> New Lead
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-3 px-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200 flex-1 min-w-[180px] max-w-xs">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search by party name…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
              />
            </div>

            <Select value={fStatus} onChange={e => setFStatus(e.target.value)} className="w-auto min-w-[120px]">
              <option value="">All Status</option>
              {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
            </Select>

            <Select value={fType} onChange={e => setFType(e.target.value)} className="w-auto min-w-[120px]">
              <option value="">All Types</option>
              {TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
            </Select>

            <Select value={fPriority} onChange={e => setFPriority(e.target.value)} className="w-auto min-w-[120px]">
              <option value="">All Priority</option>
              {PRIORITIES.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
            </Select>

            <button onClick={() => { setFStatus(''); setFType(''); setFPriority(''); setSearchInput('') }}
              className="p-2 text-slate-500 hover:text-slate-800 transition-colors" title="Reset filters">
              <RefreshCw size={16} />
            </button>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                No leads found. Click &quot;+ New Lead&quot; to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="px-5 py-3">Name</th>
                      <th className="px-3 py-3">Source</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Priority</th>
                      <th className="px-3 py-3">Assigned To</th>
                      <th className="px-3 py-3 text-right">Value</th>
                      <th className="px-3 py-3">Last Activity</th>
                      <th className="px-3 py-3">Next Follow-up</th>
                      <th className="px-3 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((lead, i) => (
                      <tr key={lead.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-800">{lead.party_name}</p>
                          <p className="text-xs text-slate-400 font-mono">{lead.id}</p>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{lead.source || '—'}</td>
                        <td className="px-3 py-3">
                          <Badge variant="secondary" className="text-xs">{lead.lead_type}</Badge>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${priorityClasses(lead.priority)}`}>
                            {lead.priority}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-600 text-xs">{lead.assigned_to_name || '—'}</td>
                        <td className="px-3 py-3 text-right text-slate-700 whitespace-nowrap">
                          {lead.value ? formatPrice(lead.value) : '—'}
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(lead.last_activity_at)}
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(lead.next_follow_up_at)}
                        </td>
                        <td className="px-3 py-3">
                          <Select
                            value={lead.status}
                            onChange={e => patchStatus(lead.id, e.target.value)}
                            className="h-7 text-xs px-2 w-auto min-w-[95px]"
                          >
                            {STATUSES.filter(Boolean).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

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

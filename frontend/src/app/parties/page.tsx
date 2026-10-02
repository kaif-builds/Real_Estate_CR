'use client'

/**
 * Parties list page — master contact directory. Spec §3.3 Party.
 * Search-only list. Click row → detail view with tabs (Leads/Requirements/Opportunities).
 * "+ New Party" form with multi-role selection.
 * Role: SUPER_ADMIN, OFFICE_EXECUTIVE only.
 *
 * DATA SOURCE: Real FastAPI backend via apiClient.ts
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search, RefreshCw, ArrowLeft, User2, Loader2, AlertCircle, Trash2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog } from '@/components/ui/dialog'
import {
  formatDateTime, statusClasses, priorityClasses, formatPrice,
} from '@/lib/formatters'
import { apiClient } from '@/lib/apiClient'
import type { PartyRow, PartyDetail } from '@/lib/mockData'

const PARTY_ROLES = ['OWNER', 'BUYER', 'SELLER', 'TENANT', 'LANDLORD', 'INVESTOR', 'BROKER', 'CONSULTANT'] as const

const ROLE_COLORS: Record<string, string> = {
  OWNER:      'bg-violet-100 text-violet-700',
  BUYER:      'bg-blue-100 text-blue-700',
  SELLER:     'bg-amber-100 text-amber-700',
  TENANT:     'bg-teal-100 text-teal-700',
  LANDLORD:   'bg-orange-100 text-orange-700',
  INVESTOR:   'bg-emerald-100 text-emerald-700',
  BROKER:     'bg-pink-100 text-pink-700',
  CONSULTANT: 'bg-slate-200 text-slate-700',
  CLIENT:     'bg-cyan-100 text-cyan-700',
  BUILDER:    'bg-rose-100 text-rose-700',
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PartiesPage() {
  const [parties, setParties] = useState<PartyRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  // Loading & error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Detail view
  const [detail, setDetail] = useState<PartyDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTab, setDetailTab] = useState<'leads' | 'requirements' | 'opportunities'>('leads')

  // Create dialog
  const [showCreate, setShowCreate] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // ── Fetch parties from API ───────────────────────────────────────────────
  const fetchParties = useCallback(async (searchQuery?: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      params.set('limit', '200')
      const url = `/api/parties${params.toString() ? `?${params}` : ''}`
      const data = await apiClient.get<{ items: PartyRow[]; total: number }>(url)
      setParties(data.items)
      setTotalCount(data.total)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load parties'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount and whenever debounced search changes
  useEffect(() => {
    fetchParties(search || undefined)
  }, [search, fetchParties])

  // ── Open detail ──────────────────────────────────────────────────────────
  const openDetail = async (partyId: string) => {
    setDetailLoading(true)
    setError(null)
    try {
      const data = await apiClient.get<PartyDetail>(`/api/parties/${partyId}`)
      setDetail(data)
      setDetailTab('leads')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load party detail'
      setError(msg)
    } finally {
      setDetailLoading(false)
    }
  }

  // ── Create party ─────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError(null)
    const fd = new FormData(e.currentTarget)
    try {
      await apiClient.post('/api/parties', {
        name: fd.get('name') as string,
        mobile: fd.get('mobile') as string,
        email: (fd.get('email') as string) || undefined,
        city: (fd.get('city') as string) || undefined,
        roles: [...selectedRoles],
        source: (fd.get('source') as string) || undefined,
        status: 'Active',
      })
      setShowCreate(false)
      setSelectedRoles([])
      // Refresh the list from the backend to show the new party
      await fetchParties(search || undefined)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create party'
      setCreateError(msg)
    } finally {
      setCreateLoading(false)
    }
  }

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  // ── Delete party ─────────────────────────────────────────────────────────
  const handleDelete = async (partyId: string, partyName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!confirm(`Are you sure you want to delete ${partyName}?`)) return

    setDeletingId(partyId)
    setError(null)
    try {
      await apiClient.delete(`/api/parties/${partyId}`)
      if (detail?.party.id === partyId) {
        setDetail(null)
      }
      await fetchParties(search || undefined)
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : 'Failed to delete party'
      try {
        const jsonStart = msg.indexOf('{')
        if (jsonStart !== -1) {
          const parsed = JSON.parse(msg.slice(jsonStart))
          if (parsed.detail) msg = parsed.detail
        }
      } catch {
        // ignore JSON parse error
      }
      setError(msg)
    } finally {
      setDeletingId(null)
    }
  }

  // ── Detail view ─────────────────────────────────────────────────────────
  if (detailLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" />
          Loading party details…
        </div>
      </AppLayout>
    )
  }

  if (detail) {
    const p = detail.party
    return (
      <AppLayout>
        <div className="space-y-5">
          <button onClick={() => setDetail(null)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={16} /> Back to Parties
          </button>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
            </div>
          )}

          {/* Party header card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                    <User2 size={28} className="text-slate-400" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">{p.name}</h1>
                    <p className="text-sm text-slate-500">{p.mobile}{p.email ? ` · ${p.email}` : ''}</p>
                    {p.city && <p className="text-xs text-slate-400 mt-0.5">{p.city}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {(p.roles || []).map(r => (
                      <span key={r} className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[r] || 'bg-slate-100 text-slate-600'}`}>
                        {r}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 ml-2"
                    disabled={deletingId === p.id}
                    onClick={() => handleDelete(p.id, p.name)}
                  >
                    {deletingId === p.id ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Trash2 size={14} className="mr-1.5" />}
                    Delete
                  </Button>
                </div>
              </div>
              {p.remarks && <p className="text-sm text-slate-500 mt-3 border-t border-slate-100 pt-3">{p.remarks}</p>}
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-200">
            {(['leads', 'requirements', 'opportunities'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setDetailTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  detailTab === tab
                    ? 'border-amber-500 text-amber-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab} ({detail[tab].length})
              </button>
            ))}
          </div>

          {/* Tab content */}
          <Card>
            <CardContent className="p-0">
              {detailTab === 'leads' && (
                detail.leads.length === 0 ? (
                  <p className="text-sm text-slate-400 p-5">No linked leads.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        <th className="px-5 py-3">ID</th>
                        <th className="px-3 py-3">Type</th>
                        <th className="px-3 py-3">Source</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Priority</th>
                        <th className="px-3 py-3">Assigned</th>
                        <th className="px-3 py-3 text-right">Value</th>
                        <th className="px-3 py-3">Last Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.leads.map((l, i) => (
                        <tr key={l.id} className={`border-b border-slate-50 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                          <td className="px-5 py-3 font-mono text-xs text-slate-600">{l.id}</td>
                          <td className="px-3 py-3"><Badge variant="secondary" className="text-xs">{l.lead_type}</Badge></td>
                          <td className="px-3 py-3 text-slate-600">{l.source || '—'}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(l.status)}`}>{l.status}</span>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold border ${priorityClasses(l.priority)}`}>{l.priority}</span>
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-500">{l.assigned_to_name || '—'}</td>
                          <td className="px-3 py-3 text-right text-slate-700">{l.value ? formatPrice(l.value) : '—'}</td>
                          <td className="px-3 py-3 text-xs text-slate-500">{formatDateTime(l.last_activity_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {detailTab === 'requirements' && (
                detail.requirements.length === 0 ? (
                  <p className="text-sm text-slate-400 p-5">No linked requirements.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        <th className="px-5 py-3">ID</th>
                        <th className="px-3 py-3">Category</th>
                        <th className="px-3 py-3">Intent</th>
                        <th className="px-3 py-3">Locations</th>
                        <th className="px-3 py-3">Budget</th>
                        <th className="px-3 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.requirements.map((r, i) => (
                        <tr key={r.id} className={`border-b border-slate-50 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                          <td className="px-5 py-3 font-mono text-xs text-slate-600">{r.id}</td>
                          <td className="px-3 py-3 text-slate-700">{r.category}</td>
                          <td className="px-3 py-3 text-slate-600">{r.intent}</td>
                          <td className="px-3 py-3 text-xs text-slate-500">{(r.preferred_short_locs || []).join(', ') || '—'}</td>
                          <td className="px-3 py-3 text-slate-700">
                            {r.min_budget || r.max_budget
                              ? `${r.min_budget ? formatPrice(r.min_budget) : '—'} – ${r.max_budget ? formatPrice(r.max_budget) : '—'}`
                              : '—'}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(r.status)}`}>{r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {detailTab === 'opportunities' && (
                detail.opportunities.length === 0 ? (
                  <p className="text-sm text-slate-400 p-5">No linked opportunities.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        <th className="px-5 py-3">ID</th>
                        <th className="px-3 py-3">Stage</th>
                        <th className="px-3 py-3 text-right">Value</th>
                        <th className="px-3 py-3 text-right">Probability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.opportunities.map((o, i) => (
                        <tr key={o.id} className={`border-b border-slate-50 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                          <td className="px-5 py-3 font-mono text-xs text-slate-600">{o.id}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(o.stage)}`}>{o.stage}</span>
                          </td>
                          <td className="px-3 py-3 text-right text-slate-700">{o.expected_value ? formatPrice(o.expected_value) : '—'}</td>
                          <td className="px-3 py-3 text-right text-slate-600">{o.probability ? `${o.probability}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  // ── List view ───────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Parties</h1>
            <p className="text-sm text-slate-500 mt-0.5">{totalCount} contacts</p>
          </div>
          <Button onClick={() => { setShowCreate(true); setSelectedRoles([]); setCreateError(null) }}>
            <Plus size={16} className="mr-1.5" /> New Party
          </Button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
          </div>
        )}

        {/* Search */}
        <Card>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200 flex-1 max-w-sm">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search name, email, or mobile…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
              />
            </div>
            <button onClick={() => { setSearchInput(''); fetchParties() }} className="p-2 text-slate-500 hover:text-slate-800 transition-colors" title="Clear & refresh">
              <RefreshCw size={16} />
            </button>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
                <Loader2 size={20} className="animate-spin mr-2" />
                Loading parties…
              </div>
            ) : parties.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                No parties found. Click &quot;+ New Party&quot; to add a contact.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="px-5 py-3">Name &amp; Email</th>
                      <th className="px-3 py-3">Roles</th>
                      <th className="px-3 py-3">City</th>
                      <th className="px-3 py-3 text-center">Leads</th>
                      <th className="px-3 py-3 text-center">Req</th>
                      <th className="px-3 py-3 text-center">Opp</th>
                      <th className="px-3 py-3">Last Updated</th>
                      <th className="px-3 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parties.map((p, i) => (
                      <tr key={p.id}
                        className={`border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}
                        onClick={() => openDetail(p.id)}>
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.email || p.mobile}</p>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(p.roles || []).map(r => (
                              <span key={r} className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_COLORS[r] || 'bg-slate-100 text-slate-600'}`}>
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{p.city || '—'}</td>
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{p.leads_count}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold">{p.requirements_count}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">{p.opportunities_count}</span>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(p.updated_at)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openDetail(p.id) }}>
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 h-8 w-8"
                              disabled={deletingId === p.id}
                              onClick={(e) => handleDelete(p.id, p.name, e)}
                              title="Delete Party"
                            >
                              {deletingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Create Party Dialog ─────────────────────────────────────────── */}
        <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="New Party">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input name="name" id="name" required placeholder="Full name" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile *</Label>
                <Input name="mobile" id="mobile" required placeholder="+91 9876543210" className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input name="email" id="email" type="email" placeholder="email@example.com" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input name="city" id="city" placeholder="e.g. Indore" className="mt-1" />
              </div>
            </div>

            {/* Multi-role selector */}
            <div>
              <Label>Roles *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PARTY_ROLES.map(role => (
                  <button
                    type="button"
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      selectedRoles.includes(role)
                        ? `${ROLE_COLORS[role] || 'bg-slate-200 text-slate-700'} border-current`
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="source">Source</Label>
              <Input name="source" id="source" placeholder="e.g. Referral, Walk-in" className="mt-1" />
            </div>

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea name="remarks" id="remarks" placeholder="Optional notes…" className="mt-1" rows={2} />
            </div>

            {/* Create error banner */}
            {createError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                <AlertCircle size={14} className="shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading && <Loader2 size={14} className="animate-spin mr-1.5" />}
                Create Party
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  )
}

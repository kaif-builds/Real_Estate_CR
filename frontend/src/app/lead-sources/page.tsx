'use client'

/**
 * Lead Sources Module — Marketing Sub-module
 * Administrative configuration for Digital and Offline acquisition channels.
 * Features:
 * - Active/Inactive toggle preserving historical lead attribution (no hard delete)
 * - Source breakdown by Channel Type (Digital vs. Offline)
 * - Dynamic lead attribution count computed from mock leads
 * - Filter by Channel Type and Active status + Search
 * - "+ Add Source" modal
 *
 * Role: SUPER_ADMIN, OFFICE_EXECUTIVE
 */

import React, { useState, useMemo } from 'react'
import {
  Share2, Plus, Globe, Building2, ShieldAlert,
  Search, CheckCircle2, XCircle, Users, Megaphone,
  ArrowUpDown, Filter, Sparkles
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
import {
  DEFAULT_LEAD_SOURCES,
  MOCK_LEADS,
  type LeadSourceItem,
  type ChannelType,
} from '@/lib/mockData'

export default function LeadSourcesPage() {
  // Local state for lead sources list
  const [sources, setSources] = useState<LeadSourceItem[]>([...DEFAULT_LEAD_SOURCES])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterChannel, setFilterChannel] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  // Add Source Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSourceName, setNewSourceName] = useState('')
  const [newChannelType, setNewChannelType] = useState<ChannelType>('Digital')
  const [newDescription, setNewDescription] = useState('')

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Calculate leads count per source
  const leadsCountBySource = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const lead of MOCK_LEADS) {
      if (lead.source) {
        counts[lead.source] = (counts[lead.source] || 0) + 1
      }
    }
    return counts
  }, [])

  // Toggle active/inactive state
  const handleToggleStatus = (sourceId: string) => {
    setSources(prev =>
      prev.map(item => {
        if (item.id === sourceId) {
          const nextActive = !item.is_active
          showToast(`Source "${item.name}" marked as ${nextActive ? 'Active' : 'Inactive'}.`)
          return { ...item, is_active: nextActive }
        }
        return item
      })
    )
  }

  // Handle adding new source
  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSourceName.trim()) return

    const newSource: LeadSourceItem = {
      id: `src-custom-${Date.now()}`,
      name: newSourceName.trim(),
      channel_type: newChannelType,
      is_active: true,
      description: newDescription.trim() || undefined,
      created_at: new Date().toISOString(),
    }

    setSources(prev => [newSource, ...prev])
    setShowAddModal(false)
    setNewSourceName('')
    setNewDescription('')
    setNewChannelType('Digital')
    showToast(`New source "${newSource.name}" added successfully.`)
  }

  // Summary Metrics
  const digitalSources = sources.filter(s => s.channel_type === 'Digital')
  const offlineSources = sources.filter(s => s.channel_type === 'Offline')
  const activeDigitalCount = digitalSources.filter(s => s.is_active).length
  const activeOfflineCount = offlineSources.filter(s => s.is_active).length
  const totalAttributedLeads = MOCK_LEADS.filter(l => l.source).length

  // Filtered source items
  const filteredSources = useMemo(() => {
    return sources.filter(item => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesName = item.name.toLowerCase().includes(q)
        const matchesDesc = item.description?.toLowerCase().includes(q)
        if (!matchesName && !matchesDesc) return false
      }
      if (filterChannel && item.channel_type !== filterChannel) {
        return false
      }
      if (filterStatus) {
        const isActive = filterStatus === 'active'
        if (item.is_active !== isActive) return false
      }
      return true
    })
  }, [sources, searchQuery, filterChannel, filterStatus])

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Lead Sources</h1>
              <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                Marketing Master Data
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Configure and manage digital and offline acquisition channels for source attribution across Leads and Campaigns.
            </p>
          </div>

          <Button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
            <Plus size={16} className="mr-1.5" /> Add Source
          </Button>
        </div>

        {/* Attribution Guard Notice */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 flex items-start gap-3 shadow-xs">
          <ShieldAlert size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-blue-950">Historical Attribution Guard:</span>
            <p className="text-blue-800 leading-relaxed">
              In accordance with CRM audit integrity, lead sources cannot be deleted. Deactivating a source safely hides it from new lead creation forms while preserving all historical attribution, conversions, and campaign reporting.
            </p>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Total Configured Sources */}
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Configured Sources</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <Share2 size={16} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{sources.length}</span>
                <span className="text-xs text-slate-500">Channels</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Digital Sources */}
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Digital Sources</span>
                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                  <Globe size={16} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-sky-700">{activeDigitalCount}</span>
                <span className="text-xs text-slate-500">/ {digitalSources.length} active</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Offline Sources */}
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Offline Sources</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <Building2 size={16} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-700">{activeOfflineCount}</span>
                <span className="text-xs text-slate-500">/ {offlineSources.length} active</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Attributed Leads */}
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Attributed Leads</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Users size={16} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-indigo-700">{totalAttributedLeads}</span>
                <span className="text-xs text-slate-500">across pipeline</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search source by name or description…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Channel Filter */}
            <Select
              value={filterChannel}
              onChange={e => setFilterChannel(e.target.value)}
              className="h-9 text-xs min-w-[130px]"
            >
              <option value="">All Channels</option>
              <option value="Digital">Digital Only</option>
              <option value="Offline">Offline Only</option>
            </Select>

            {/* Status Filter */}
            <Select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="h-9 text-xs min-w-[120px]"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </Select>

            {(searchQuery || filterChannel || filterStatus) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setFilterChannel('')
                  setFilterStatus('')
                }}
                className="text-xs text-slate-500 hover:text-slate-800 h-9 px-2.5"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Sources Data Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Source Name & Guidelines</th>
                  <th className="py-3 px-4">Channel Type</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Attributed Leads</th>
                  <th className="py-3 px-4">Added Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSources.length > 0 ? (
                  filteredSources.map((source) => {
                    const leadCount = leadsCountBySource[source.name] || 0

                    return (
                      <tr key={source.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Source Name & Description */}
                        <td className="py-3 px-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 text-sm">{source.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({source.id})</span>
                            </div>
                            {source.description && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                {source.description}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Channel Type Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                              source.channel_type === 'Digital'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {source.channel_type === 'Digital' ? (
                              <Globe size={12} className="text-sky-600" />
                            ) : (
                              <Building2 size={12} className="text-amber-600" />
                            )}
                            {source.channel_type}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              source.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                source.is_active ? 'bg-emerald-600' : 'bg-slate-400'
                              }`}
                            />
                            {source.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Attributed Leads */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                              leadCount > 0
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'text-slate-400 bg-slate-50'
                            }`}
                          >
                            <Users size={11} /> {leadCount}
                          </span>
                        </td>

                        {/* Added Date */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-xs">
                          {new Date(source.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Actions (Active/Inactive Toggle) */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(source.id)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                              source.is_active
                                ? 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                                : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                            }`}
                            title={source.is_active ? 'Deactivate source' : 'Activate source'}
                          >
                            {source.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Share2 size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-700">No lead sources match your filter</p>
                      <p className="text-xs text-slate-400 mt-1">Try resetting search or channel filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Add Source Modal ────────────────────────────────────────────── */}
        <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Lead Source">
          <form onSubmit={handleAddSource} className="space-y-4">
            <div>
              <Label htmlFor="source_name">Source Name *</Label>
              <Input
                id="source_name"
                value={newSourceName}
                onChange={e => setNewSourceName(e.target.value)}
                placeholder="e.g. YouTube Sponsored Video, Bus Shelter Hoarding"
                required
                className="mt-1"
              />
            </div>

            {/* Channel Type Choice */}
            <div>
              <Label className="text-xs font-medium text-slate-700 block mb-1.5">Channel Type *</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewChannelType('Digital')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                    newChannelType === 'Digital'
                      ? 'bg-sky-50 text-sky-700 border-sky-300 ring-2 ring-sky-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Globe size={15} />
                  Digital Channel
                </button>
                <button
                  type="button"
                  onClick={() => setNewChannelType('Offline')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                    newChannelType === 'Offline'
                      ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Building2 size={15} />
                  Offline Channel
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="source_desc">Description / Guidelines (Optional)</Label>
              <Textarea
                id="source_desc"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Describe this channel, UTM tag convention, or physical placement details…"
                rows={3}
                className="mt-1 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Add Lead Source
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  )
}

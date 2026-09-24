'use client'

/**
 * Marketing Content Library — Module 7 Sub-Module
 *
 * Lightweight repository for promotional collateral linked to marketing campaigns.
 * Intentionally simple per spec (no heavy CMS, approval workflows, or rich-text editors).
 *
 * Core Features:
 * 1. Grid & Table View Toggles
 * 2. Visual rendering by type:
 *    - Image/Video: thumbnail placeholder with media dimensions/type badge
 *    - Text-based (Ad Copy, Call Script, Property Description): stylized text snippet preview
 *    - PDF/Brochure/Flyer: document icon with file name & page/format badge
 * 3. Filter Bar: Content Type dropdown, Linked Campaign dropdown, Search
 * 4. Multi-Campaign Associations: creatives can be reused across 2+ campaigns
 * 5. "+ Add Content" modal with file-based (mock upload) or text-based inputs
 * 6. View/Preview Modal, Edit, and Remove actions
 *
 * Role: SUPER_ADMIN, OFFICE_EXECUTIVE
 */

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  FolderOpen, Plus, Search, Filter, LayoutGrid, List,
  Image as ImageIcon, Video, FileText, Share2, Megaphone,
  Building2, Phone, Calendar, User, Tag, Eye, Trash2, Edit3,
  X, Check, ExternalLink, Download, Sparkles, Copy, CheckCircle2,
  FileCode, Layers
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog } from '@/components/ui/dialog'
import { formatDate } from '@/lib/formatters'
import {
  MOCK_CONTENT_ITEMS,
  MOCK_CAMPAIGNS,
  MOCK_PROPERTIES,
  type MarketingContentItem,
  type MarketingContentType,
} from '@/lib/mockData'

const ALL_CONTENT_TYPES: MarketingContentType[] = [
  'Property Description',
  'Ad Copy',
  'Image',
  'Video',
  'Brochure',
  'Flyer',
  'Social Media Creative',
  'Campaign Message',
  'Call Script',
  'Other',
]

// ── Content Type Icon & Badge ────────────────────────────────────────────────

function ContentTypeBadge({ type }: { type: MarketingContentType }) {
  switch (type) {
    case 'Image':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ImageIcon size={11} /> Image
        </span>
      )
    case 'Video':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Video size={11} /> Video
        </span>
      )
    case 'Ad Copy':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <FileText size={11} /> Ad Copy
        </span>
      )
    case 'Brochure':
    case 'Flyer':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <FileCode size={11} /> {type}
        </span>
      )
    case 'Social Media Creative':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-pink-50 text-pink-700 border border-pink-200">
          <Share2 size={11} /> Social Creative
        </span>
      )
    case 'Call Script':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Phone size={11} /> Call Script
        </span>
      )
    case 'Property Description':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
          <Building2 size={11} /> Description
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          {type}
        </span>
      )
  }
}

export default function ContentLibraryPage() {
  const [contentItems, setContentItems] = useState<MarketingContentItem[]>(MOCK_CONTENT_ITEMS)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Filters
  const [fType, setFType] = useState<string>('')
  const [fCampaign, setFCampaign] = useState<string>('')
  const [fSearch, setFSearch] = useState<string>('')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [previewItem, setPreviewItem] = useState<MarketingContentItem | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Form State for + Add Content
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<MarketingContentType>('Ad Copy')
  const [formCampaignIds, setFormCampaignIds] = useState<string[]>([])
  const [formPropertyId, setFormPropertyId] = useState<string>('')
  const [formFileName, setFormFileName] = useState('')
  const [formTextContent, setFormTextContent] = useState('')
  const [formTags, setFormTags] = useState('')

  const isFileBased = ['Image', 'Video', 'Brochure', 'Flyer', 'Social Media Creative'].includes(formType)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Filtered Items
  const filteredItems = useMemo(() => {
    return contentItems.filter((item) => {
      if (fType && item.type !== fType) return false
      if (fCampaign && !item.linked_campaign_ids.includes(fCampaign)) return false
      if (fSearch) {
        const q = fSearch.toLowerCase()
        const match =
          item.name.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          (item.text_content && item.text_content.toLowerCase().includes(q)) ||
          (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
        if (!match) return false
      }
      return true
    })
  }, [contentItems, fType, fCampaign, fSearch])

  // Handle Save
  const handleSaveContent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      alert('Please enter a content item name.')
      return
    }

    const newItem: MarketingContentItem = {
      id: `CNT-${Date.now().toString().slice(-4)}`,
      name: formName.trim(),
      type: formType,
      linked_campaign_ids: formCampaignIds,
      linked_property_id: formPropertyId || null,
      uploaded_by: 'Super Admin',
      date_added: new Date().toISOString(),
      file_name: isFileBased ? (formFileName.trim() || `${formName.toLowerCase().replace(/\s+/g, '_')}.dat`) : null,
      file_url: isFileBased ? `/assets/mock/${formFileName.trim() || 'asset.dat'}` : null,
      text_content: !isFileBased ? formTextContent.trim() : null,
      tags: formTags ? formTags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    }

    setContentItems([newItem, ...contentItems])
    setIsAddOpen(false)
    // Reset Form
    setFormName('')
    setFormType('Ad Copy')
    setFormCampaignIds([])
    setFormPropertyId('')
    setFormFileName('')
    setFormTextContent('')
    setFormTags('')
    showToast(`Content item "${newItem.name}" added successfully.`)
  }

  // Handle Remove
  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to remove this content item from the library?')) {
      setContentItems(contentItems.filter((i) => i.id !== id))
      if (previewItem?.id === id) setPreviewItem(null)
      showToast('Content item removed.')
    }
  }

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    showToast('Copied content to clipboard!')
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <p className="text-xs font-medium">{toastMessage}</p>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-auto">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                <FolderOpen size={20} />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Marketing Content Library
              </h1>
              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs">
                Collateral Hub
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              Lightweight repository of promotional copies, banners, brochures, and call scripts linked to campaigns.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table List View"
              >
                <List size={16} />
              </button>
            </div>

            <Button
              onClick={() => setIsAddOpen(true)}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 shadow-xs"
            >
              <Plus size={14} />
              + Add Content
            </Button>
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-3.5 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px] flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search content name, tags, or text..."
                value={fSearch}
                onChange={(e) => setFSearch(e.target.value)}
                className="bg-transparent text-xs outline-none w-full placeholder:text-slate-400"
              />
              {fSearch && (
                <button onClick={() => setFSearch('')} className="text-slate-400 hover:text-slate-600 text-xs">
                  ✕
                </button>
              )}
            </div>

            <Select
              value={fType}
              onChange={(e) => setFType(e.target.value)}
              className="w-auto min-w-[170px] text-xs h-8"
            >
              <option value="">All Content Types</option>
              {ALL_CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>

            <Select
              value={fCampaign}
              onChange={(e) => setFCampaign(e.target.value)}
              className="w-auto min-w-[200px] text-xs h-8"
            >
              <option value="">All Linked Campaigns</option>
              {MOCK_CAMPAIGNS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            {(fType || fCampaign || fSearch) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFType('')
                  setFCampaign('')
                  setFSearch('')
                }}
                className="text-xs text-rose-600 hover:bg-rose-50 h-8"
              >
                Clear Filters
              </Button>
            )}

            <div className="ml-auto text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-900">{filteredItems.length}</span> items
            </div>
          </CardContent>
        </Card>

        {/* ── View: Grid Mode ── */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              const isMedia = item.type === 'Image' || item.type === 'Video'
              const isText = ['Ad Copy', 'Call Script', 'Property Description', 'Campaign Message'].includes(item.type)
              const isDoc = item.type === 'Brochure' || item.type === 'Flyer'

              return (
                <Card
                  key={item.id}
                  onClick={() => setPreviewItem(item)}
                  className="border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group bg-white"
                >
                  <div>
                    {/* Top Preview Area based on Type */}
                    {isMedia ? (
                      <div className="h-40 bg-slate-900 flex flex-col items-center justify-center relative p-4 text-center">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
                          {item.type === 'Image' ? <ImageIcon size={24} /> : <Video size={24} />}
                        </div>
                        <span className="text-xs font-mono text-slate-300 max-w-[200px] truncate">
                          {item.file_name}
                        </span>
                        <span className="absolute top-2 right-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full font-mono">
                          {item.type === 'Image' ? 'High-Res JPG' : '4K MP4'}
                        </span>
                      </div>
                    ) : isText ? (
                      <div className="h-40 bg-slate-50 border-b border-slate-100 p-4 relative flex flex-col justify-between overflow-hidden">
                        <p className="text-xs font-sans text-slate-700 italic line-clamp-4 leading-relaxed">
                          &ldquo;{item.text_content}&rdquo;
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px] text-slate-400">
                          <span>Snippet Preview</span>
                          <span className="font-mono">{item.text_content?.length || 0} chars</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 bg-amber-50/50 border-b border-amber-100 p-4 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2">
                          <FileCode size={24} />
                        </div>
                        <span className="text-xs font-semibold text-amber-950 max-w-[200px] truncate">
                          {item.file_name}
                        </span>
                        <span className="text-[10px] text-amber-700 font-mono mt-0.5">PDF Document</span>
                      </div>
                    )}

                    {/* Content Details */}
                    <div className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {item.name}
                        </h3>
                        <ContentTypeBadge type={item.type} />
                      </div>

                      {/* Linked Campaigns (Multi-campaign support) */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Linked Campaigns:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {item.linked_campaign_ids.length > 0 ? (
                            item.linked_campaign_ids.map((cid) => {
                              const c = MOCK_CAMPAIGNS.find((cam) => cam.id === cid)
                              return (
                                <span
                                  key={cid}
                                  className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-medium px-1.5 py-0.5 rounded border border-slate-200"
                                >
                                  <Megaphone size={9} className="text-slate-400" />
                                  <span className="truncate max-w-[130px]">{c?.name || cid}</span>
                                </span>
                              )
                            })
                          ) : (
                            <span className="text-[11px] text-slate-400">Unassigned</span>
                          )}
                        </div>
                      </div>

                      {/* Linked Property (if any) */}
                      {item.linked_property_id && (
                        <div className="text-[11px] text-slate-600 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                          <Building2 size={12} className="text-indigo-600 shrink-0" />
                          <span className="truncate">
                            Property ID: <strong>{item.linked_property_id}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Added {formatDate(item.date_added)}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewItem(item)
                        }}
                        className="p-1 hover:text-indigo-600 rounded"
                        title="View Preview"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={(e) => handleRemove(item.id, e)}
                        className="p-1 hover:text-rose-600 rounded"
                        title="Remove Content"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* ── View: Table Mode ── */}
        {viewMode === 'table' && (
          <Card className="border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-5 py-3">Content Item Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Linked Campaign(s)</th>
                    <th className="px-4 py-3">Linked Property</th>
                    <th className="px-4 py-3">Uploaded By</th>
                    <th className="px-4 py-3">Date Added</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setPreviewItem(item)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="group-hover:text-indigo-600 transition-colors">{item.name}</span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 rounded">{item.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ContentTypeBadge type={item.type} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.linked_campaign_ids.map((cid) => {
                            const c = MOCK_CAMPAIGNS.find((cam) => cam.id === cid)
                            return (
                              <span key={cid} className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                                {c?.name || cid}
                              </span>
                            )
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {item.linked_property_id || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.uploaded_by}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{formatDate(item.date_added)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setPreviewItem(item)
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded"
                            title="Preview Content"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={(e) => handleRemove(item.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                            title="Remove Content"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ──────────────────────────────────────────────────────────────────── */}
        {/* MODAL: + Add Content Form                                            */}
        {/* ──────────────────────────────────────────────────────────────────── */}
        <Dialog
          open={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          title="Add Content Item to Library"
          className="max-w-xl"
        >
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">

              <form onSubmit={handleSaveContent} className="space-y-4 text-xs">
                {/* Name */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Content Name *</Label>
                  <Input
                    placeholder="e.g. Scheme 140 Luxury 3BHK Social Banner"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>

                {/* Type & Property */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Content Type *</Label>
                    <Select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as MarketingContentType)}
                      className="text-xs h-9"
                    >
                      {ALL_CONTENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Linked Property (Optional)</Label>
                    <Select
                      value={formPropertyId}
                      onChange={(e) => setFormPropertyId(e.target.value)}
                      className="text-xs h-9"
                    >
                      <option value="">None (General Campaign Content)</option>
                      {MOCK_PROPERTIES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.id} — {p.short_loc} ({p.category})
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Multi-Campaign Selection */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Linked Campaign(s) (Multi-Select Allowed)
                  </Label>
                  <div className="border border-slate-200 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1 bg-slate-50/50">
                    {MOCK_CAMPAIGNS.map((c) => {
                      const isSelected = formCampaignIds.includes(c.id)
                      return (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormCampaignIds([...formCampaignIds, c.id])
                              } else {
                                setFormCampaignIds(formCampaignIds.filter((id) => id !== c.id))
                              }
                            }}
                            className="rounded text-indigo-600"
                          />
                          <span className="text-slate-800 font-medium">{c.name}</span>
                          <span className="font-mono text-[10px] text-slate-400 ml-auto">{c.id}</span>
                        </label>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Content items can be shared and linked across multiple campaigns.
                  </p>
                </div>

                {/* File-based vs Text-based inputs */}
                {isFileBased ? (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Mock File Attachment *</Label>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center bg-slate-50/50">
                      <Input
                        type="text"
                        placeholder="Enter mock filename e.g. tower_a_elevation.jpg"
                        value={formFileName}
                        onChange={(e) => setFormFileName(e.target.value)}
                        className="text-xs h-8 bg-white"
                      />
                      <p className="text-[11px] text-slate-500 mt-2">
                        Upload filename reference for mock storage.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Content / Script Body *</Label>
                    <Textarea
                      placeholder="Write or paste your promotional ad copy, campaign message, or telemarketing script here..."
                      value={formTextContent}
                      onChange={(e) => setFormTextContent(e.target.value)}
                      rows={4}
                      required
                      className="text-xs font-sans"
                    />
                  </div>
                )}

                {/* Tags */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Tags (Comma-separated)</Label>
                  <Input
                    placeholder="e.g. Super Corridor, Luxury, Festive Offer"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                    Save to Library
                  </Button>
                </div>
              </form>
            </div>
        </Dialog>

        {/* ──────────────────────────────────────────────────────────────────── */}
        {/* MODAL: Content Preview Dialog                                        */}
        {/* ──────────────────────────────────────────────────────────────────── */}
        <Dialog
          open={Boolean(previewItem)}
          onClose={() => setPreviewItem(null)}
          title={previewItem?.name || 'Content Preview'}
          className="max-w-2xl"
        >
          {previewItem && (
            <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
              <div className="flex items-center gap-2">
                <ContentTypeBadge type={previewItem.type} />
                <span className="text-xs text-slate-400 font-mono">{previewItem.id}</span>
              </div>

                {/* Preview Content Body */}
                <div className="space-y-3">
                  {previewItem.text_content ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 relative">
                      <pre className="text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {previewItem.text_content}
                      </pre>
                      <button
                        onClick={() => handleCopyText(previewItem.text_content!, previewItem.id)}
                        className="absolute top-3 right-3 text-xs inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded shadow-xs hover:bg-slate-50"
                      >
                        {copiedId === previewItem.id ? (
                          <>
                            <Check size={12} className="text-emerald-600" />
                            <span className="text-emerald-700 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} className="text-slate-500" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-900 rounded-lg p-8 text-center text-white space-y-2">
                      <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto text-indigo-300">
                        {previewItem.type === 'Image' ? (
                          <ImageIcon size={28} />
                        ) : previewItem.type === 'Video' ? (
                          <Video size={28} />
                        ) : (
                          <FileCode size={28} />
                        )}
                      </div>
                      <p className="font-mono text-sm font-semibold">{previewItem.file_name}</p>
                      <p className="text-xs text-slate-400">Mock asset reference ready for distribution.</p>
                    </div>
                  )}

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Uploaded By
                      </span>
                      <span className="font-semibold text-slate-800">{previewItem.uploaded_by}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Date Added
                      </span>
                      <span className="font-semibold text-slate-800">{formatDate(previewItem.date_added)}</span>
                    </div>
                    {previewItem.linked_property_id && (
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                          Linked Inventory Property
                        </span>
                        <span className="font-mono text-indigo-700 font-bold">
                          {previewItem.linked_property_id}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Associated Campaigns */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700">Associated Campaigns:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {previewItem.linked_campaign_ids.map((cid) => {
                        const camp = MOCK_CAMPAIGNS.find((c) => c.id === cid)
                        return (
                          <Link
                            key={cid}
                            href={`/campaigns?campaign=${cid}`}
                            className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded hover:bg-indigo-100"
                          >
                            <span>{camp?.name || cid}</span>
                            <ExternalLink size={11} />
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button variant="outline" size="sm" onClick={() => setPreviewItem(null)} className="text-xs">
                    Close
                  </Button>
                </div>
              </div>
          )}
        </Dialog>
      </div>
    </AppLayout>
  )
}

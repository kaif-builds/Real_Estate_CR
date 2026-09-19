'use client'

/**
 * Settings (Master Data) Module — Module 16 (Super Admin Only)
 * Left-side sub-navigation with master data tabs:
 * 1. Property Categories & Subcategories
 * 2. Lead Sources
 * 3. Follow-up & Task Types
 * 4. Matching Weights (live sum to 100% validator)
 * 5. Visit Checklist Templates (expandable items)
 * 6. Geo-fence & Staleness Thresholds
 */

import React, { useState } from 'react'
import {
  Settings as SettingsIcon, Building2, Users, CheckSquare, Zap,
  CheckCircle2, MapPin, Sliders, Shield, Plus, Trash2,
  AlertTriangle, RotateCcw, ChevronDown, ChevronRight, Info,
  Layers, PhoneCall, AlertCircle
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ── Tab Type Definition ───────────────────────────────────────────────────────

type SettingsTab =
  | 'categories'
  | 'lead_sources'
  | 'task_types'
  | 'matching_weights'
  | 'checklists'
  | 'thresholds'

interface CategoryItem {
  id: string
  name: string
  active: boolean
  subcategories: { id: string; name: string; active: boolean }[]
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('categories')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // ── Tab 1: Categories State ─────────────────────────────────────────────────

  const [categories, setCategories] = useState<CategoryItem[]>([
    {
      id: 'cat_rent_res',
      name: 'Rental Residential',
      active: true,
      subcategories: [
        { id: 'sub_1', name: '1 BHK Apartment', active: true },
        { id: 'sub_2', name: '2 BHK Apartment', active: true },
        { id: 'sub_3', name: '3 BHK Apartment', active: true },
        { id: 'sub_4', name: 'Independent Villa', active: true },
        { id: 'sub_5', name: 'Studio / 1 RK', active: true },
      ],
    },
    {
      id: 'cat_rent_comm',
      name: 'Rental Commercial',
      active: true,
      subcategories: [
        { id: 'sub_6', name: 'Bare Shell Office', active: true },
        { id: 'sub_7', name: 'Fully Furnished IT Office', active: true },
        { id: 'sub_8', name: 'Retail High-Street Shop', active: true },
        { id: 'sub_9', name: 'Commercial Showroom', active: true },
        { id: 'sub_10', name: 'Warehouse / Godown', active: true },
      ],
    },
    {
      id: 'cat_buy_res',
      name: 'Buy-Sell Flat/Duplex',
      active: true,
      subcategories: [
        { id: 'sub_11', name: '2 BHK Resale Flat', active: true },
        { id: 'sub_12', name: '3 BHK Luxury Flat', active: true },
        { id: 'sub_13', name: '4 BHK Penthouse', active: true },
        { id: 'sub_14', name: 'Duplex Bungalow', active: true },
      ],
    },
    {
      id: 'cat_buy_comm',
      name: 'Buy-Sell Commercial',
      active: true,
      subcategories: [
        { id: 'sub_15', name: 'Office Floor', active: true },
        { id: 'sub_16', name: 'Retail Outlet', active: true },
        { id: 'sub_17', name: 'Hotel / Hospitality Plot', active: true },
      ],
    },
    {
      id: 'cat_plot',
      name: 'Plot/Jameen',
      active: true,
      subcategories: [
        { id: 'sub_18', name: 'Residential Colony Plot', active: true },
        { id: 'sub_19', name: 'Commercial Land (Main Road)', active: true },
        { id: 'sub_20', name: 'Agricultural Land', active: true },
        { id: 'sub_21', name: 'Industrial Belt Plot', active: true },
      ],
    },
  ])

  const [newSubcatInput, setNewSubcatInput] = useState<{ [catId: string]: string }>({})

  const toggleCategory = (catId: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, active: !c.active } : c))
    )
  }

  const toggleSubcategory = (catId: string, subId: string) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== catId) return c
        return {
          ...c,
          subcategories: c.subcategories.map((s) =>
            s.id === subId ? { ...s, active: !s.active } : s
          ),
        }
      })
    )
  }

  const handleAddSubcat = (catId: string) => {
    const val = newSubcatInput[catId]?.trim()
    if (!val) return
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== catId) return c
        return {
          ...c,
          subcategories: [
            ...c.subcategories,
            { id: `sub_${Date.now()}`, name: val, active: true },
          ],
        }
      })
    )
    setNewSubcatInput({ ...newSubcatInput, [catId]: '' })
  }

  // ── Tab 2: Lead Sources State ───────────────────────────────────────────────

  const [leadSources, setLeadSources] = useState<Array<{ id: string; name: string; active: boolean }>>([
    { id: 'ls_1', name: 'Owner', active: true },
    { id: 'ls_2', name: 'Broker', active: true },
    { id: 'ls_3', name: 'Builder-Marketing', active: true },
    { id: 'ls_4', name: 'Referral', active: true },
    { id: 'ls_5', name: 'Website', active: true },
    { id: 'ls_6', name: 'Cold Call', active: true },
    { id: 'ls_7', name: 'Other', active: true },
  ])
  const [newSourceInput, setNewSourceInput] = useState('')

  const toggleLeadSource = (id: string) => {
    setLeadSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    )
  }

  const handleAddLeadSource = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSourceInput.trim()) return
    setLeadSources([
      ...leadSources,
      { id: `ls_${Date.now()}`, name: newSourceInput.trim(), active: true },
    ])
    setNewSourceInput('')
  }

  // ── Tab 3: Follow-up & Task Types State ─────────────────────────────────────

  const [taskTypes, setTaskTypes] = useState<Array<{ id: string; name: string; active: boolean }>>([
    { id: 'tt_1', name: 'Call', active: true },
    { id: 'tt_2', name: 'Follow-up', active: true },
    { id: 'tt_3', name: 'WhatsApp', active: true },
    { id: 'tt_4', name: 'Meeting', active: true },
    { id: 'tt_5', name: 'Property Sharing', active: true },
    { id: 'tt_6', name: 'Internal Task', active: true },
  ])
  const [newTaskTypeInput, setNewTaskTypeInput] = useState('')

  const toggleTaskType = (id: string) => {
    setTaskTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    )
  }

  const handleAddTaskType = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTypeInput.trim()) return
    setTaskTypes([
      ...taskTypes,
      { id: `tt_${Date.now()}`, name: newTaskTypeInput.trim(), active: true },
    ])
    setNewTaskTypeInput('')
  }

  // ── Tab 4: Matching Weights State ───────────────────────────────────────────

  const [weightLocation, setWeightLocation] = useState<number>(35)
  const [weightBudget, setWeightBudget] = useState<number>(30)
  const [weightTypeBhk, setWeightTypeBhk] = useState<number>(20)
  const [weightAvailability, setWeightAvailability] = useState<number>(15)

  const totalWeight =
    (Number(weightLocation) || 0) +
    (Number(weightBudget) || 0) +
    (Number(weightTypeBhk) || 0) +
    (Number(weightAvailability) || 0)

  const isWeightValid = totalWeight === 100

  const handleResetWeights = () => {
    setWeightLocation(35)
    setWeightBudget(30)
    setWeightTypeBhk(20)
    setWeightAvailability(15)
  }

  // ── Tab 5: Visit Checklist Templates State ───────────────────────────────────

  const [checklistTemplates, setChecklistTemplates] = useState([
    {
      id: 'tpl_res',
      name: 'Standard Residential',
      description: 'Used for apartment, duplex, and bungalow site visits',
      items: [
        'Confirm owner/tenant access and keys availability',
        'Verify electric meter reading and water connection pressure',
        'Inspect wall paint, dampness, and seepage signs in washrooms/kitchen',
        'Check lift operation, dedicated parking bay, and society security',
        'Capture at least 4 clear photos (living, kitchen, master bed, balcony)',
        'Document possession handover timeline and furniture inventory',
      ],
    },
    {
      id: 'tpl_comm',
      name: 'Standard Commercial',
      description: 'Used for retail shops, showrooms, and corporate office spaces',
      items: [
        'Verify property facade, street frontage, and signage clearance',
        'Check sanctioned 3-phase power load and DG backup capacity',
        'Inspect fire fighting sprinklers, extinguishers, and emergency stairs',
        'Measure clear ceiling height, carpet vs super-built ratio',
        'Verify property tax receipts, occupancy certificate, and commercial zoning',
        'Photograph entrance, floor plate, washrooms, and reserved parking',
      ],
    },
    {
      id: 'tpl_owner',
      name: 'Owner Meeting',
      description: 'Used for initial mandate agreements and property onboarding',
      items: [
        'Review original registry deed and title chain documentation',
        'Document asking price, expected security deposit, and lock-in period',
        'Collect keys / access permissions and contact details of caretaker',
        'Agree on exclusive mandate terms and brokerage payment structure',
        'Confirm client visiting hours, society NOC, and tenant preferences',
      ],
    },
  ])

  const [expandedTplId, setExpandedTplId] = useState<string>('tpl_res')
  const [newItemText, setNewItemText] = useState<{ [tplId: string]: string }>({})

  const toggleTplExpand = (tplId: string) => {
    setExpandedTplId(expandedTplId === tplId ? '' : tplId)
  }

  const handleAddChecklistItem = (tplId: string) => {
    const text = newItemText[tplId]?.trim()
    if (!text) return
    setChecklistTemplates((prev) =>
      prev.map((tpl) => (tpl.id === tplId ? { ...tpl, items: [...tpl.items, text] } : tpl))
    )
    setNewItemText({ ...newItemText, [tplId]: '' })
  }

  const handleRemoveChecklistItem = (tplId: string, itemIdx: number) => {
    setChecklistTemplates((prev) =>
      prev.map((tpl) =>
        tpl.id === tplId
          ? { ...tpl, items: tpl.items.filter((_, idx) => idx !== itemIdx) }
          : tpl
      )
    )
  }

  // ── Tab 6: Geo-fence & Staleness Thresholds State ───────────────────────────

  const [geofenceRadius, setGeofenceRadius] = useState<number>(150)
  const [leadStalenessDays, setLeadStalenessDays] = useState<number>(7)
  const [inventoryVerifyDays, setInventoryVerifyDays] = useState<number>(30)

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Toast Feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Settings & Master Data</h1>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                Super Admin Only
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Configure system taxonomies, matching engine parameters, checklist templates, and geo-fence rules.
            </p>
          </div>
        </div>

        {/* Master Data Container with Left Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* Left Sub-Navigation */}
          <Card className="border-slate-200 shadow-sm p-2 space-y-1">
            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-semibold transition-colors text-left ${
                activeTab === 'categories'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 size={15} />
              <span>Property Categories</span>
            </button>

            <button
              onClick={() => setActiveTab('lead_sources')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-semibold transition-colors text-left ${
                activeTab === 'lead_sources'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users size={15} />
              <span>Lead Sources</span>
            </button>

            <button
              onClick={() => setActiveTab('task_types')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-semibold transition-colors text-left ${
                activeTab === 'task_types'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckSquare size={15} />
              <span>Task & Follow-up Types</span>
            </button>

            <button
              onClick={() => setActiveTab('matching_weights')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors text-left ${
                activeTab === 'matching_weights'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Zap size={15} />
                <span>Matching Weights</span>
              </div>
              {!isWeightValid && (
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('checklists')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-semibold transition-colors text-left ${
                activeTab === 'checklists'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers size={15} />
              <span>Visit Checklist Templates</span>
            </button>

            <button
              onClick={() => setActiveTab('thresholds')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-semibold transition-colors text-left ${
                activeTab === 'thresholds'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sliders size={15} />
              <span>Geo-fence & Staleness</span>
            </button>
          </Card>

          {/* Right Content Panel */}
          <div className="md:col-span-3 space-y-6">
            {/* ── 1. Property Categories & Subcategories ── */}
            {activeTab === 'categories' && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        Property Categories & Subcategories
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-1">
                        Deactivate rather than delete categories to preserve historical transaction and matching records.
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => showToast('Category configurations saved successfully.')}
                      className="bg-slate-900 text-white text-xs"
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-indigo-600" />
                          <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            cat.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border-slate-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cat.active ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          />
                          {cat.active ? 'Active' : 'Inactive'}
                        </button>
                      </div>

                      {/* Subcategories */}
                      <div className="pl-4 border-l-2 border-slate-200 space-y-2">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Subcategories
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {cat.subcategories.map((sub) => (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => toggleSubcategory(cat.id, sub.id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors border ${
                                sub.active
                                  ? 'bg-white text-slate-800 border-slate-300 hover:border-slate-400'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                              }`}
                              title={sub.active ? 'Click to deactivate' : 'Click to activate'}
                            >
                              <span>{sub.name}</span>
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  sub.active ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>

                        {/* Add subcategory input */}
                        <div className="flex items-center gap-2 pt-2 max-w-sm">
                          <Input
                            placeholder="New subcategory name..."
                            value={newSubcatInput[cat.id] || ''}
                            onChange={(e) =>
                              setNewSubcatInput({
                                ...newSubcatInput,
                                [cat.id]: e.target.value,
                              })
                            }
                            className="h-8 text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddSubcat(cat.id)}
                            className="h-8 text-xs px-2.5 shrink-0"
                          >
                            <Plus size={13} className="mr-1" /> Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ── 2. Lead Sources ── */}
            {activeTab === 'lead_sources' && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        Lead Sources
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-1">
                        Active origin channels used for attribution in Leads and Demand-Supply analytics.
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => showToast('Lead sources updated successfully.')}
                      className="bg-slate-900 text-white text-xs"
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white">
                    {leadSources.map((source) => (
                      <div
                        key={source.id}
                        className="flex items-center justify-between p-3.5 hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-slate-900">
                            {source.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleLeadSource(source.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            source.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              source.active ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          />
                          {source.active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddLeadSource} className="flex items-center gap-2 pt-2 max-w-md">
                    <Input
                      placeholder="Add custom lead source (e.g. Newspaper Ad)..."
                      value={newSourceInput}
                      onChange={(e) => setNewSourceInput(e.target.value)}
                      className="h-9 text-xs"
                    />
                    <Button type="submit" size="sm" className="h-9 bg-slate-900 text-white text-xs px-3">
                      <Plus size={14} className="mr-1" /> Add Source
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ── 3. Follow-up & Task Types ── */}
            {activeTab === 'task_types' && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        Follow-up & Task Types
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-1">
                        Activity categories available for scheduling client interactions and staff tasks.
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => showToast('Activity types updated successfully.')}
                      className="bg-slate-900 text-white text-xs"
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white">
                    {taskTypes.map((type) => (
                      <div
                        key={type.id}
                        className="flex items-center justify-between p-3.5 hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <CheckSquare size={16} className="text-slate-500" />
                          <span className="font-medium text-sm text-slate-900">
                            {type.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleTaskType(type.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            type.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              type.active ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          />
                          {type.active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddTaskType} className="flex items-center gap-2 pt-2 max-w-md">
                    <Input
                      placeholder="Add task type (e.g. Legal Verification)..."
                      value={newTaskTypeInput}
                      onChange={(e) => setNewTaskTypeInput(e.target.value)}
                      className="h-9 text-xs"
                    />
                    <Button type="submit" size="sm" className="h-9 bg-slate-900 text-white text-xs px-3">
                      <Plus size={14} className="mr-1" /> Add Type
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ── 4. Matching Weights ── */}
            {activeTab === 'matching_weights' && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        Matching Weights Engine
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-1">
                        Relative weight factors used by the automated Property-Requirement matching algorithm.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleResetWeights}
                        className="text-xs text-slate-600"
                      >
                        <RotateCcw size={13} className="mr-1" /> Reset Defaults
                      </Button>
                      <Button
                        size="sm"
                        disabled={!isWeightValid}
                        onClick={() => showToast('Matching weights updated successfully.')}
                        className="bg-slate-900 text-white text-xs disabled:opacity-50"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Live Total Indicator */}
                  <div
                    className={`p-4 rounded-lg border flex items-center justify-between transition-colors ${
                      isWeightValid
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isWeightValid ? (
                        <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle size={20} className="text-rose-600 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-bold">
                          {isWeightValid
                            ? 'Weights Valid — Total: 100%'
                            : `Invalid Total: ${totalWeight}%`}
                        </p>
                        <p className="text-xs opacity-80">
                          {isWeightValid
                            ? 'All parameters sum to exactly 100%. Matching engine is balanced.'
                            : 'The sum of all four parameter weights must equal exactly 100% before saving.'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xl font-mono font-extrabold px-3 py-1 rounded border ${
                        isWeightValid
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      {totalWeight}%
                    </span>
                  </div>

                  {/* 4 Number Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Location 35% */}
                    <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-900">
                          Location Proximity & Zone
                        </Label>
                        <span className="text-xs font-mono font-semibold text-indigo-600">
                          {weightLocation}%
                        </span>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={weightLocation}
                        onChange={(e) => setWeightLocation(Number(e.target.value))}
                        className="h-9 font-mono text-sm"
                      />
                      <p className="text-[11px] text-slate-500">
                        Default: 35%. Evaluates ShortLoc match, ward vicinity, and distance.
                      </p>
                    </div>

                    {/* Budget 30% */}
                    <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-900">
                          Budget & Price Alignment
                        </Label>
                        <span className="text-xs font-mono font-semibold text-indigo-600">
                          {weightBudget}%
                        </span>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={weightBudget}
                        onChange={(e) => setWeightBudget(Number(e.target.value))}
                        className="h-9 font-mono text-sm"
                      />
                      <p className="text-[11px] text-slate-500">
                        Default: 30%. Evaluates price overlap within buyer budget min/max limits.
                      </p>
                    </div>

                    {/* Type / BHK 20% */}
                    <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-900">
                          Property Type / BHK Configuration
                        </Label>
                        <span className="text-xs font-mono font-semibold text-indigo-600">
                          {weightTypeBhk}%
                        </span>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={weightTypeBhk}
                        onChange={(e) => setWeightTypeBhk(Number(e.target.value))}
                        className="h-9 font-mono text-sm"
                      />
                      <p className="text-[11px] text-slate-500">
                        Default: 20%. Exact category and BHK compatibility.
                      </p>
                    </div>

                    {/* Availability 15% */}
                    <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-900">
                          Immediate Availability & Possession
                        </Label>
                        <span className="text-xs font-mono font-semibold text-indigo-600">
                          {weightAvailability}%
                        </span>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={weightAvailability}
                        onChange={(e) => setWeightAvailability(Number(e.target.value))}
                        className="h-9 font-mono text-sm"
                      />
                      <p className="text-[11px] text-slate-500">
                        Default: 15%. Ready-to-move status and vacancy timeline.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── 5. Visit Checklist Templates ── */}
            {activeTab === 'checklists' && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        Visit Checklist Templates
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-1">
                        Mandatory inspection checklists enforced on mobile app during field agent visits.
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => showToast('Checklist templates saved successfully.')}
                      className="bg-slate-900 text-white text-xs"
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {checklistTemplates.map((tpl) => {
                    const isExpanded = expandedTplId === tpl.id
                    return (
                      <div
                        key={tpl.id}
                        className="border border-slate-200 rounded-lg overflow-hidden bg-white transition-all shadow-xs"
                      >
                        <div
                          onClick={() => toggleTplExpand(tpl.id)}
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="text-slate-400 hover:text-slate-600"
                            >
                              {isExpanded ? (
                                <ChevronDown size={18} className="text-indigo-600" />
                              ) : (
                                <ChevronRight size={18} />
                              )}
                            </button>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">{tpl.name}</h4>
                              <p className="text-xs text-slate-500">{tpl.description}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="font-mono text-xs">
                            {tpl.items.length} items
                          </Badge>
                        </div>

                        {isExpanded && (
                          <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/60 space-y-3">
                            <div className="space-y-2">
                              {tpl.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2.5 bg-white rounded border border-slate-200 text-xs text-slate-800"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] flex items-center justify-center font-bold">
                                      {idx + 1}
                                    </span>
                                    <span>{item}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveChecklistItem(tpl.id, idx)}
                                    className="text-slate-400 hover:text-rose-600 p-1 rounded"
                                    title="Remove item"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Add item input */}
                            <div className="flex items-center gap-2 pt-2">
                              <Input
                                placeholder="Add checklist verification task..."
                                value={newItemText[tpl.id] || ''}
                                onChange={(e) =>
                                  setNewItemText({ ...newItemText, [tpl.id]: e.target.value })
                                }
                                className="h-8 text-xs"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddChecklistItem(tpl.id)}
                                className="h-8 text-xs px-2.5 shrink-0"
                              >
                                <Plus size={13} className="mr-1" /> Add Task
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}

            {/* ── 6. Geo-fence & Staleness Thresholds ── */}
            {activeTab === 'thresholds' && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        Geo-fence & Staleness Thresholds
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-1">
                        Operational tolerance settings for agent GPS check-ins and CRM decay triggers.
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => showToast('Threshold parameters saved successfully.')}
                      className="bg-slate-900 text-white text-xs"
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Geo-fence radius */}
                  <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-indigo-600" />
                        <Label className="text-sm font-bold text-slate-900">
                          Geo-fence Check-in Radius (meters)
                        </Label>
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {geofenceRadius} meters
                      </span>
                    </div>
                    <Input
                      type="number"
                      min="50"
                      max="1000"
                      step="25"
                      value={geofenceRadius}
                      onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                      className="h-9 font-mono text-sm max-w-xs"
                    />
                    <p className="text-xs text-slate-500">
                      Distance tolerance within which field agents must arrive to enable the &apos;Visit Started&apos; button in the field app.
                    </p>
                  </div>

                  {/* Lead staleness */}
                  <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-amber-600" />
                        <Label className="text-sm font-bold text-slate-900">
                          Lead Staleness Threshold (days)
                        </Label>
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {leadStalenessDays} days
                      </span>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={leadStalenessDays}
                      onChange={(e) => setLeadStalenessDays(Number(e.target.value))}
                      className="h-9 font-mono text-sm max-w-xs"
                    />
                    <p className="text-xs text-slate-500">
                      Leads with no telecalls, follow-ups, or notes logged within this duration trigger a stale warning on executive dashboards.
                    </p>
                  </div>

                  {/* Inventory verification frequency */}
                  <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-emerald-600" />
                        <Label className="text-sm font-bold text-slate-900">
                          Inventory Verification Frequency (days)
                        </Label>
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {inventoryVerifyDays} days
                      </span>
                    </div>
                    <Input
                      type="number"
                      min="7"
                      max="180"
                      value={inventoryVerifyDays}
                      onChange={(e) => setInventoryVerifyDays(Number(e.target.value))}
                      className="h-9 font-mono text-sm max-w-xs"
                    />
                    <p className="text-xs text-slate-500">
                      Properties whose availability and pricing have not been confirmed by an agent within this period are flagged as unverified.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

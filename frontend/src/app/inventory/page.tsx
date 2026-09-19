'use client'

/**
 * Inventory (Properties) Page — Module 1
 *
 * VIEW 1 — List:
 * - Filter bar: Category dropdown (Rental Residential, Rental Commercial, Buy-Sell Flat/Duplex, Buy-Sell Commercial, Plot/Jameen),
 *   Status dropdown (New, Available, Under Negotiation, Sold/Rented/Leased, On Hold), text search, "+ Add Property" button.
 * - Table columns: Property ID, ShortLoc (distinct badge/icon matching key), Category, Price/Rent, Status (colored badge),
 *   Last Verified (highlight red if 5+ days old), Actions.
 *
 * VIEW 2 — Add Property Form:
 * - Common fields: Category (required), ShortLoc (with helper text), Address, Price/Rent, Source dropdown, Availability Date, Status.
 * - Category-specific fields:
 *   - Rental Residential / Buy-Sell Flat/Duplex: BHK, Furnishing, Built-up Area, Floor, Parking
 *   - Rental Commercial / Buy-Sell Commercial: Seater Capacity, Cabins, Conference Room (yes/no), Washroom (yes/no), Pantry (yes/no), Built-up Area
 *   - Plot/Jameen: Facing, Plot Number, Size with unit dropdown (sqft/acre/bigha)
 * - Save & Cancel buttons.
 */

import { useMemo, useState } from 'react'
import {
  Plus, Search, RefreshCw, ArrowLeft, Building2, MapPin,
  AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Home,
  LandPlot, Building, Eye, Edit3, X
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  formatPrice, formatDate, formatCategory, propertyStatusClasses,
} from '@/lib/formatters'
import { MOCK_PROPERTIES, MOCK_PARTIES, type PropertyRow } from '@/lib/mockData'

// ── Category & Status Definitions ─────────────────────────────────────────────

type PropertyCategory =
  | 'RENTAL_RESIDENTIAL'
  | 'RENTAL_COMMERCIAL'
  | 'BUY_SELL_FLAT'
  | 'BUY_SELL_COMMERCIAL'
  | 'PLOT'

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'RENTAL_RESIDENTIAL', label: 'Rental Residential' },
  { value: 'RENTAL_COMMERCIAL', label: 'Rental Commercial' },
  { value: 'BUY_SELL_FLAT', label: 'Buy-Sell Flat/Duplex' },
  { value: 'BUY_SELL_COMMERCIAL', label: 'Buy-Sell Commercial' },
  { value: 'PLOT', label: 'Plot/Jameen' },
] as const

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'NEW', label: 'New' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'UNDER_NEGOTIATION', label: 'Under Negotiation' },
  { value: 'SOLD_RENTED_LEASED', label: 'Sold/Rented/Leased' },
  { value: 'ON_HOLD', label: 'On Hold' },
] as const

const STATUS_ALL_OPTIONS = [
  'NEW',
  'AVAILABLE',
  'UNDER_NEGOTIATION',
  'ON_HOLD',
  'SOLD',
  'RENTED',
  'LEASED',
  'WITHDRAWN',
] as const

const SOURCE_OPTIONS = ['Owner', 'Broker', 'Builder-Marketing'] as const

// ── Distinct ShortLoc Badge ───────────────────────────────────────────────────

function ShortLocBadge({ code, className = '' }: { code: string; className?: string }) {
  return (
    <span
      title="Hyperlocal matching key"
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold tracking-tight border bg-indigo-50/90 text-indigo-900 border-indigo-200/80 shadow-xs group transition-all hover:bg-indigo-100 ${className}`}
    >
      <MapPin size={12} className="text-indigo-600 shrink-0 group-hover:scale-110 transition-transform" />
      <span>{code}</span>
    </span>
  )
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function InventoryPage() {
  const [properties, setProperties] = useState<PropertyRow[]>([...MOCK_PROPERTIES])
  const [view, setView] = useState<'list' | 'add'>('list')

  // List View Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // View Details Modal / Preview
  const [selectedProperty, setSelectedProperty] = useState<PropertyRow | null>(null)

  // Add Property Form State
  const [formCategory, setFormCategory] = useState<PropertyCategory>('RENTAL_RESIDENTIAL')
  const [formShortLoc, setFormShortLoc] = useState<string>('')
  const [formAddress, setFormAddress] = useState<string>('')
  const [formPrice, setFormPrice] = useState<string>('')
  const [formSource, setFormSource] = useState<string>('Owner')
  const [formAvailabilityDate, setFormAvailabilityDate] = useState<string>('Immediate')
  const [formStatus, setFormStatus] = useState<string>('NEW')
  const [formOwnerId, setFormOwnerId] = useState<string>('p1')

  // Category-specific: Residential / Flat
  const [formBhk, setFormBhk] = useState<string>('2 BHK')
  const [formFurnishing, setFormFurnishing] = useState<string>('Semi-Furnished')
  const [formResArea, setFormResArea] = useState<string>('1100')
  const [formFloor, setFormFloor] = useState<string>('2nd')
  const [formParking, setFormParking] = useState<string>('1 Covered')

  // Category-specific: Commercial
  const [formSeater, setFormSeater] = useState<string>('20')
  const [formCabins, setFormCabins] = useState<string>('2')
  const [formConference, setFormConference] = useState<string>('yes')
  const [formWashroom, setFormWashroom] = useState<string>('yes')
  const [formPantry, setFormPantry] = useState<string>('yes')
  const [formCommArea, setFormCommArea] = useState<string>('1500')

  // Category-specific: Plot/Jameen
  const [formFacing, setFormFacing] = useState<string>('East')
  const [formPlotNumber, setFormPlotNumber] = useState<string>('')
  const [formPlotSize, setFormPlotSize] = useState<string>('1500')
  const [formPlotUnit, setFormPlotUnit] = useState<string>('sqft')

  // ── Filter Logic ────────────────────────────────────────────────────────────

  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      // Category filter
      if (categoryFilter && prop.category !== categoryFilter) {
        return false
      }

      // Status filter
      if (statusFilter) {
        if (statusFilter === 'SOLD_RENTED_LEASED') {
          if (!['SOLD', 'RENTED', 'LEASED'].includes(prop.status)) return false
        } else if (prop.status !== statusFilter) {
          return false
        }
      }

      // Text search: matches ID, ShortLoc, Address, Owner, or Category
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchId = prop.id.toLowerCase().includes(q)
        const matchLoc = prop.short_loc.toLowerCase().includes(q)
        const matchAddr = (prop.address || '').toLowerCase().includes(q)
        const matchOwner = (prop.owner_name || '').toLowerCase().includes(q)
        const matchCat = formatCategory(prop.category).toLowerCase().includes(q)
        if (!matchId && !matchLoc && !matchAddr && !matchOwner && !matchCat) {
          return false
        }
      }

      return true
    })
  }, [properties, categoryFilter, statusFilter, searchQuery])

  // ── Last Verified Helper (5+ days highlight red) ───────────────────────────

  const getVerificationStatus = (lastVerifiedAt: string | null) => {
    if (!lastVerifiedAt) {
      return {
        isStale: true,
        days: null,
        label: 'Unverified',
      }
    }

    const verifiedDate = new Date(lastVerifiedAt)
    const now = new Date()
    const diffMs = now.getTime() - verifiedDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    return {
      isStale: diffDays >= 5,
      days: diffDays,
      label: diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`,
    }
  }

  // ── Form Handlers ───────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormCategory('RENTAL_RESIDENTIAL')
    setFormShortLoc('')
    setFormAddress('')
    setFormPrice('')
    setFormSource('Owner')
    setFormAvailabilityDate('Immediate')
    setFormStatus('NEW')
    setFormOwnerId('p1')
    setFormBhk('2 BHK')
    setFormFurnishing('Semi-Furnished')
    setFormResArea('1100')
    setFormFloor('2nd')
    setFormParking('1 Covered')
    setFormSeater('20')
    setFormCabins('2')
    setFormConference('yes')
    setFormWashroom('yes')
    setFormPantry('yes')
    setFormCommArea('1500')
    setFormFacing('East')
    setFormPlotNumber('')
    setFormPlotSize('1500')
    setFormPlotUnit('sqft')
  }

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault()

    const owner = MOCK_PARTIES.find((p) => p.id === formOwnerId)
    let detailsJson: Record<string, unknown> = {}

    if (formCategory === 'RENTAL_RESIDENTIAL' || formCategory === 'BUY_SELL_FLAT') {
      detailsJson = {
        bhk: formBhk,
        furnishing: formFurnishing,
        built_up_area: Number(formResArea) || 0,
        floor: formFloor,
        parking: formParking,
      }
    } else if (formCategory === 'RENTAL_COMMERCIAL' || formCategory === 'BUY_SELL_COMMERCIAL') {
      detailsJson = {
        seater_capacity: Number(formSeater) || 0,
        cabins: Number(formCabins) || 0,
        conference_room: formConference === 'yes',
        washroom: formWashroom === 'yes',
        pantry: formPantry === 'yes',
        built_up_area: Number(formCommArea) || 0,
      }
    } else if (formCategory === 'PLOT') {
      detailsJson = {
        facing: formFacing,
        plot_number: formPlotNumber,
        size: Number(formPlotSize) || 0,
        unit: formPlotUnit,
      }
    }

    const newProperty: PropertyRow = {
      id: `P-${Date.now().toString().slice(-4)}`,
      category: formCategory,
      short_loc: formShortLoc.trim() || '01-Schm140_Mayank',
      address: formAddress.trim() || null,
      price: parseFloat(formPrice) || 0,
      status: formStatus,
      owner_id: formOwnerId,
      owner_name: owner?.name || 'Ramesh Patel',
      source: formSource,
      availability_date: formAvailabilityDate || 'Immediate',
      details_json: detailsJson,
      last_verified_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    setProperties([newProperty, ...properties])
    resetForm()
    setView('list')
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* ================================================================= */}
        {/* VIEW 1: PROPERTY LIST                                             */}
        {/* ================================================================= */}
        {view === 'list' && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Property Inventory</h1>
                    <p className="text-sm text-slate-500">
                      Manage real estate listings, pricing, and hyperlocal matching keys
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setView('add')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
              >
                <Plus size={16} className="mr-1.5" />
                Add Property
              </Button>
            </div>

            {/* Filter Bar */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardContent className="p-4 flex flex-wrap items-center gap-3">
                {/* Text Search */}
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ID, ShortLoc, address, or owner..."
                    className="pl-9 text-sm h-9"
                  />
                </div>

                {/* Category Dropdown */}
                <div className="w-full sm:w-auto min-w-[180px]">
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-9 text-sm"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Status Dropdown */}
                <div className="w-full sm:w-auto min-w-[180px]">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-9 text-sm"
                  >
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Reset Filters */}
                {(categoryFilter || statusFilter || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCategoryFilter('')
                      setStatusFilter('')
                      setSearchQuery('')
                    }}
                    className="text-slate-500 hover:text-slate-800 h-9 px-2.5"
                    title="Clear filters"
                  >
                    <RefreshCw size={14} className="mr-1.5" />
                    Reset
                  </Button>
                )}

                <div className="ml-auto text-xs text-slate-400 font-medium">
                  Showing {filteredProperties.length} of {properties.length} properties
                </div>
              </CardContent>
            </Card>

            {/* Property Table */}
            <Card className="border-slate-200/80 shadow-xs overflow-hidden">
              <CardContent className="p-0">
                {filteredProperties.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <h3 className="text-base font-semibold text-slate-800">No properties found</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                      No property listings match your current search and filter criteria. Try clearing filters or add a new property.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCategoryFilter('')
                        setStatusFilter('')
                        setSearchQuery('')
                      }}
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4">Property ID</th>
                          <th className="py-3 px-4">
                            <span className="inline-flex items-center gap-1">
                              <span>ShortLoc</span>
                              <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal uppercase text-indigo-600 border-indigo-200">
                                Match Key
                              </Badge>
                            </span>
                          </th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4 text-right">Price / Rent</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Last Verified</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredProperties.map((prop) => {
                          const vStatus = getVerificationStatus(prop.last_verified_at)

                          return (
                            <tr
                              key={prop.id}
                              className="hover:bg-slate-50/80 transition-colors group"
                            >
                              {/* Property ID */}
                              <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-800">
                                {prop.id}
                              </td>

                              {/* ShortLoc (Visually Distinct Core Key) */}
                              <td className="py-3.5 px-4">
                                <ShortLocBadge code={prop.short_loc} />
                                {prop.address && (
                                  <p className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5" title={prop.address}>
                                    {prop.address}
                                  </p>
                                )}
                              </td>

                              {/* Category */}
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                  {prop.category.includes('RENTAL') ? (
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200/60 font-medium text-[11px]">
                                      {formatCategory(prop.category)}
                                    </Badge>
                                  ) : prop.category.includes('PLOT') ? (
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200/60 font-medium text-[11px]">
                                      {formatCategory(prop.category)}
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200/60 font-medium text-[11px]">
                                      {formatCategory(prop.category)}
                                    </Badge>
                                  )}
                                </span>
                              </td>

                              {/* Price / Rent */}
                              <td className="py-3.5 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                                {formatPrice(prop.price, prop.category)}
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${propertyStatusClasses(
                                    prop.status
                                  )}`}
                                >
                                  {prop.status.replace(/_/g, ' ')}
                                </span>
                              </td>

                              {/* Last Verified (Highlight RED if 5+ days old) */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {vStatus.isStale ? (
                                  <div
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200 shadow-xs"
                                    title={`Needs reverification! Last verified: ${formatDate(prop.last_verified_at)}`}
                                  >
                                    <AlertTriangle size={13} className="text-red-600 shrink-0" />
                                    <span>
                                      {vStatus.days !== null ? `${vStatus.days}d ago (Stale)` : 'Never Verified'}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                    <span>{vStatus.label}</span>
                                    <span className="text-[11px] text-slate-400">
                                      ({formatDate(prop.last_verified_at)})
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedProperty(prop)}
                                    className="h-8 px-2.5 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-100"
                                  >
                                    <Eye size={12} className="mr-1 text-slate-400" />
                                    View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedProperty(prop)}
                                    className="h-8 px-2.5 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-100"
                                  >
                                    <Edit3 size={12} className="mr-1 text-slate-400" />
                                    Edit
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: ADD PROPERTY FORM                                         */}
        {/* ================================================================= */}
        {view === 'add' && (
          <div className="space-y-6">
            {/* Top Navigation Back Bar */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetForm()
                  setView('list')
                }}
                className="text-slate-600 hover:text-slate-900 -ml-2"
              >
                <ArrowLeft size={16} className="mr-1.5" />
                Back to Inventory List
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetForm()
                    setView('list')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="add-property-form"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Save Property
                </Button>
              </div>
            </div>

            {/* Form Container */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
                    <Building2 size={22} />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      Add New Property Listing
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500">
                      Enter common listing parameters and category-specific property attributes
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <form id="add-property-form" onSubmit={handleSaveProperty} className="space-y-8">
                  {/* ───────────────────────────────────────────────────────── */}
                  {/* SECTION 1: COMMON LISTING FIELDS                          */}
                  {/* ───────────────────────────────────────────────────────── */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-2">
                      <Sparkles size={16} className="text-indigo-600" />
                      Common Listing Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {/* Category (Dropdown, required) */}
                      <div className="space-y-1.5">
                        <Label htmlFor="category" className="text-xs font-semibold text-slate-700">
                          Category <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          id="category"
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value as PropertyCategory)}
                          required
                          className="h-10 text-sm"
                        >
                          <option value="RENTAL_RESIDENTIAL">Rental Residential</option>
                          <option value="RENTAL_COMMERCIAL">Rental Commercial</option>
                          <option value="BUY_SELL_FLAT">Buy-Sell Flat/Duplex</option>
                          <option value="BUY_SELL_COMMERCIAL">Buy-Sell Commercial</option>
                          <option value="PLOT">Plot/Jameen</option>
                        </Select>
                      </div>

                      {/* ShortLoc (Required, visually distinct with helper text) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="short_loc" className="text-xs font-semibold text-slate-700">
                            ShortLoc (Core Key) <span className="text-red-500">*</span>
                          </Label>
                          <Badge variant="outline" className="text-[10px] py-0 px-1 text-indigo-600 border-indigo-200 font-mono">
                            Required
                          </Badge>
                        </div>
                        <div className="relative">
                          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 pointer-events-none" />
                          <Input
                            id="short_loc"
                            value={formShortLoc}
                            onChange={(e) => setFormShortLoc(e.target.value)}
                            placeholder="e.g. 01-Schm140_Mayank"
                            required
                            className="pl-9 font-mono text-sm h-10 border-indigo-200 focus-visible:ring-indigo-500 bg-indigo-50/20"
                          />
                        </div>
                        <p className="text-[11px] text-amber-700 font-medium">
                          Hyperlocal code, e.g. 01-Schm140_Mayank — NOT a generic city area
                        </p>
                      </div>

                      {/* Price / Rent */}
                      <div className="space-y-1.5">
                        <Label htmlFor="price" className="text-xs font-semibold text-slate-700">
                          Price / Rent (₹) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          step="any"
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value)}
                          placeholder="e.g. 25000 or 5500000"
                          required
                          className="h-10 text-sm"
                        />
                        <p className="text-[11px] text-slate-400">
                          {formCategory.includes('RENTAL') ? 'Monthly rental in ₹' : 'Total selling price in ₹'}
                        </p>
                      </div>

                      {/* Source */}
                      <div className="space-y-1.5">
                        <Label htmlFor="source" className="text-xs font-semibold text-slate-700">
                          Source
                        </Label>
                        <Select
                          id="source"
                          value={formSource}
                          onChange={(e) => setFormSource(e.target.value)}
                          className="h-10 text-sm"
                        >
                          {SOURCE_OPTIONS.map((src) => (
                            <option key={src} value={src}>
                              {src}
                            </option>
                          ))}
                        </Select>
                      </div>

                      {/* Availability Date */}
                      <div className="space-y-1.5">
                        <Label htmlFor="availability_date" className="text-xs font-semibold text-slate-700">
                          Availability Date
                        </Label>
                        <Input
                          id="availability_date"
                          value={formAvailabilityDate}
                          onChange={(e) => setFormAvailabilityDate(e.target.value)}
                          placeholder="Immediate or YYYY-MM-DD"
                          className="h-10 text-sm"
                        />
                      </div>

                      {/* Status */}
                      <div className="space-y-1.5">
                        <Label htmlFor="status" className="text-xs font-semibold text-slate-700">
                          Listing Status
                        </Label>
                        <Select
                          id="status"
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value)}
                          className="h-10 text-sm"
                        >
                          {STATUS_ALL_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>

                    {/* Full Address & Owner */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                      <div className="md:col-span-2 space-y-1.5">
                        <Label htmlFor="address" className="text-xs font-semibold text-slate-700">
                          Complete Address
                        </Label>
                        <Input
                          id="address"
                          value={formAddress}
                          onChange={(e) => setFormAddress(e.target.value)}
                          placeholder="Building / Project, Unit / Flat No., Landmark, Locality"
                          className="h-10 text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="owner" className="text-xs font-semibold text-slate-700">
                          Linked Party / Owner
                        </Label>
                        <Select
                          id="owner"
                          value={formOwnerId}
                          onChange={(e) => setFormOwnerId(e.target.value)}
                          className="h-10 text-sm"
                        >
                          {MOCK_PARTIES.map((party) => (
                            <option key={party.id} value={party.id}>
                              {party.name} ({party.mobile})
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* ───────────────────────────────────────────────────────── */}
                  {/* SECTION 2: CATEGORY-SPECIFIC ATTRIBUTES                   */}
                  {/* ───────────────────────────────────────────────────────── */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        {formCategory.includes('PLOT') ? (
                          <LandPlot size={16} className="text-emerald-600" />
                        ) : formCategory.includes('COMMERCIAL') ? (
                          <Building size={16} className="text-purple-600" />
                        ) : (
                          <Home size={16} className="text-blue-600" />
                        )}
                        Category-Specific Specifications ({formatCategory(formCategory)})
                      </h3>
                      <Badge variant="outline" className="text-xs font-medium text-slate-600">
                        Dynamic Section
                      </Badge>
                    </div>

                    {/* 2A: RESIDENTIAL / BUY-SELL FLAT / DUPLEX */}
                    {(formCategory === 'RENTAL_RESIDENTIAL' || formCategory === 'BUY_SELL_FLAT') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 bg-blue-50/30 p-4 rounded-xl border border-blue-100">
                        {/* BHK */}
                        <div className="space-y-1.5">
                          <Label htmlFor="bhk" className="text-xs font-semibold text-slate-700">
                            BHK Configuration
                          </Label>
                          <Select
                            id="bhk"
                            value={formBhk}
                            onChange={(e) => setFormBhk(e.target.value)}
                            className="h-10 text-sm bg-white"
                          >
                            <option value="1 RK">1 RK</option>
                            <option value="1 BHK">1 BHK</option>
                            <option value="2 BHK">2 BHK</option>
                            <option value="3 BHK">3 BHK</option>
                            <option value="4 BHK">4 BHK</option>
                            <option value="5+ BHK">5+ BHK</option>
                            <option value="Duplex / Villa">Duplex / Villa</option>
                          </Select>
                        </div>

                        {/* Furnishing */}
                        <div className="space-y-1.5">
                          <Label htmlFor="furnishing" className="text-xs font-semibold text-slate-700">
                            Furnishing Status
                          </Label>
                          <Select
                            id="furnishing"
                            value={formFurnishing}
                            onChange={(e) => setFormFurnishing(e.target.value)}
                            className="h-10 text-sm bg-white"
                          >
                            <option value="Unfurnished">Unfurnished</option>
                            <option value="Semi-Furnished">Semi-Furnished</option>
                            <option value="Fully-Furnished">Fully-Furnished</option>
                          </Select>
                        </div>

                        {/* Built-up Area */}
                        <div className="space-y-1.5">
                          <Label htmlFor="built_up_area" className="text-xs font-semibold text-slate-700">
                            Built-up Area (sq. ft.)
                          </Label>
                          <Input
                            id="built_up_area"
                            type="number"
                            value={formResArea}
                            onChange={(e) => setFormResArea(e.target.value)}
                            placeholder="e.g. 1250"
                            className="h-10 text-sm bg-white"
                          />
                        </div>

                        {/* Floor */}
                        <div className="space-y-1.5">
                          <Label htmlFor="floor" className="text-xs font-semibold text-slate-700">
                            Floor
                          </Label>
                          <Input
                            id="floor"
                            value={formFloor}
                            onChange={(e) => setFormFloor(e.target.value)}
                            placeholder="e.g. 3rd of 8 Floors, Ground, etc."
                            className="h-10 text-sm bg-white"
                          />
                        </div>

                        {/* Parking */}
                        <div className="space-y-1.5">
                          <Label htmlFor="parking" className="text-xs font-semibold text-slate-700">
                            Parking
                          </Label>
                          <Select
                            id="parking"
                            value={formParking}
                            onChange={(e) => setFormParking(e.target.value)}
                            className="h-10 text-sm bg-white"
                          >
                            <option value="None">None</option>
                            <option value="1 Covered">1 Covered Car</option>
                            <option value="2 Covered">2 Covered Cars</option>
                            <option value="Open Parking">Open Parking</option>
                            <option value="Two-wheeler only">Two-wheeler only</option>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* 2B: COMMERCIAL (RENTAL & BUY-SELL) */}
                    {(formCategory === 'RENTAL_COMMERCIAL' || formCategory === 'BUY_SELL_COMMERCIAL') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 bg-purple-50/30 p-4 rounded-xl border border-purple-100">
                        {/* Seater Capacity */}
                        <div className="space-y-1.5">
                          <Label htmlFor="seater" className="text-xs font-semibold text-slate-700">
                            Seater Capacity
                          </Label>
                          <Input
                            id="seater"
                            type="number"
                            value={formSeater}
                            onChange={(e) => setFormSeater(e.target.value)}
                            placeholder="Number of workstations"
                            className="h-10 text-sm bg-white"
                          />
                        </div>

                        {/* Cabins */}
                        <div className="space-y-1.5">
                          <Label htmlFor="cabins" className="text-xs font-semibold text-slate-700">
                            Executive Cabins
                          </Label>
                          <Input
                            id="cabins"
                            type="number"
                            value={formCabins}
                            onChange={(e) => setFormCabins(e.target.value)}
                            placeholder="Number of cabins"
                            className="h-10 text-sm bg-white"
                          />
                        </div>

                        {/* Built-up Area */}
                        <div className="space-y-1.5">
                          <Label htmlFor="comm_area" className="text-xs font-semibold text-slate-700">
                            Built-up Area (sq. ft.)
                          </Label>
                          <Input
                            id="comm_area"
                            type="number"
                            value={formCommArea}
                            onChange={(e) => setFormCommArea(e.target.value)}
                            placeholder="e.g. 2400"
                            className="h-10 text-sm bg-white"
                          />
                        </div>

                        {/* Conference Room (yes/no) */}
                        <div className="space-y-1.5">
                          <Label htmlFor="conference" className="text-xs font-semibold text-slate-700">
                            Conference Room
                          </Label>
                          <Select
                            id="conference"
                            value={formConference}
                            onChange={(e) => setFormConference(e.target.value)}
                            className="h-10 text-sm bg-white"
                          >
                            <option value="yes">Yes (Available)</option>
                            <option value="no">No</option>
                          </Select>
                        </div>

                        {/* Washroom (yes/no) */}
                        <div className="space-y-1.5">
                          <Label htmlFor="washroom" className="text-xs font-semibold text-slate-700">
                            Private Washroom
                          </Label>
                          <Select
                            id="washroom"
                            value={formWashroom}
                            onChange={(e) => setFormWashroom(e.target.value)}
                            className="h-10 text-sm bg-white"
                          >
                            <option value="yes">Yes (Private Inside)</option>
                            <option value="no">No (Shared Floor)</option>
                          </Select>
                        </div>

                        {/* Pantry (yes/no) */}
                        <div className="space-y-1.5">
                          <Label htmlFor="pantry" className="text-xs font-semibold text-slate-700">
                            Pantry / Cafeteria
                          </Label>
                          <Select
                            id="pantry"
                            value={formPantry}
                            onChange={(e) => setFormPantry(e.target.value)}
                            className="h-10 text-sm bg-white"
                          >
                            <option value="yes">Yes (Wet Pantry)</option>
                            <option value="no">No</option>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* 2C: PLOT / JAMEEN */}
                    {formCategory === 'PLOT' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
                        {/* Facing */}
                        <div className="space-y-1.5">
                          <Label htmlFor="facing" className="text-xs font-semibold text-slate-700">
                            Facing
                          </Label>
                          <Select
                            id="facing"
                            value={formFacing}
                            onChange={(e) => setFormFacing(e.target.value)}
                            className="h-10 text-sm bg-white"
                          >
                            <option value="East">East</option>
                            <option value="North">North</option>
                            <option value="North-East">North-East</option>
                            <option value="West">West</option>
                            <option value="South">South</option>
                            <option value="North-West">North-West</option>
                            <option value="South-East">South-East</option>
                            <option value="South-West">South-West</option>
                          </Select>
                        </div>

                        {/* Plot Number */}
                        <div className="space-y-1.5">
                          <Label htmlFor="plot_number" className="text-xs font-semibold text-slate-700">
                            Plot Number
                          </Label>
                          <Input
                            id="plot_number"
                            value={formPlotNumber}
                            onChange={(e) => setFormPlotNumber(e.target.value)}
                            placeholder="e.g. Plot No. 84, Sector B"
                            className="h-10 text-sm bg-white"
                          />
                        </div>

                        {/* Size with Unit Dropdown */}
                        <div className="space-y-1.5">
                          <Label htmlFor="plot_size" className="text-xs font-semibold text-slate-700">
                            Plot Area / Size &amp; Unit
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="plot_size"
                              type="number"
                              value={formPlotSize}
                              onChange={(e) => setFormPlotSize(e.target.value)}
                              placeholder="e.g. 1500"
                              className="h-10 text-sm bg-white flex-1"
                            />
                            <Select
                              value={formPlotUnit}
                              onChange={(e) => setFormPlotUnit(e.target.value)}
                              className="h-10 text-sm bg-white w-28"
                            >
                              <option value="sqft">sq. ft.</option>
                              <option value="acre">acre</option>
                              <option value="bigha">bigha</option>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form Footer Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm()
                        setView('list')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                    >
                      Save Property
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW DETAILS MODAL                                                */}
        {/* ================================================================= */}
        {selectedProperty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Property Details — {selectedProperty.id}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {formatCategory(selectedProperty.category)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-400 uppercase font-semibold">ShortLoc (Match Key)</span>
                    <div className="mt-1">
                      <ShortLocBadge code={selectedProperty.short_loc} />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Price / Rent</span>
                    <p className="text-base font-bold text-slate-900 mt-1">
                      {formatPrice(selectedProperty.price, selectedProperty.category)}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Status</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${propertyStatusClasses(selectedProperty.status)}`}>
                        {selectedProperty.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Owner / Linked Party</span>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {selectedProperty.owner_name}
                    </p>
                  </div>
                </div>

                {selectedProperty.address && (
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Full Address</span>
                    <p className="text-sm text-slate-800 mt-0.5">{selectedProperty.address}</p>
                  </div>
                )}

                {selectedProperty.details_json && Object.keys(selectedProperty.details_json).length > 0 && (
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Specifications</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      {Object.entries(selectedProperty.details_json).map(([key, val]) => (
                        <div key={key} className="bg-slate-50/70 p-2.5 rounded border text-xs">
                          <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}: </span>
                          <span className="font-semibold text-slate-800">
                            {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 border-t pt-3">
                  <span>Created: {formatDate(selectedProperty.created_at)}</span>
                  <span>Last Verified: {formatDate(selectedProperty.last_verified_at)}</span>
                </div>
              </div>

              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedProperty(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

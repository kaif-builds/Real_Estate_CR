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

import { useCallback, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import {
  Plus, ArrowLeft, Building2, MapPin,
  AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Home,
  LandPlot, Building, Eye, Edit3, X, Upload, Download,
  FileSpreadsheet, AlertCircle, CheckCircle, Loader2
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
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

  // ── Bulk Upload State ───────────────────────────────────────────────────────

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadFileName, setUploadFileName] = useState<string>('')
  const [uploadParsing, setUploadParsing] = useState(false)

  type UploadRowError = { row: number; field: string; message: string }
  type ParsedUploadRow = {
    rowIndex: number
    data: Record<string, string>
    property: PropertyRow | null   // null when row has errors
    errors: UploadRowError[]
  }

  const [parsedRows, setParsedRows] = useState<ParsedUploadRow[]>([])

  const VALID_CATEGORIES: Record<string, string> = {
    'RENTAL_RESIDENTIAL': 'RENTAL_RESIDENTIAL',
    'RENTAL RESIDENTIAL': 'RENTAL_RESIDENTIAL',
    'RENTAL_COMMERCIAL': 'RENTAL_COMMERCIAL',
    'RENTAL COMMERCIAL': 'RENTAL_COMMERCIAL',
    'BUY_SELL_FLAT': 'BUY_SELL_FLAT',
    'BUY SELL FLAT': 'BUY_SELL_FLAT',
    'BUY-SELL FLAT': 'BUY_SELL_FLAT',
    'BUY_SELL_COMMERCIAL': 'BUY_SELL_COMMERCIAL',
    'BUY SELL COMMERCIAL': 'BUY_SELL_COMMERCIAL',
    'BUY-SELL COMMERCIAL': 'BUY_SELL_COMMERCIAL',
    'PLOT': 'PLOT',
    'PLOT/JAMEEN': 'PLOT',
  }

  const VALID_STATUSES = new Set([
    'NEW', 'AVAILABLE', 'UNDER_NEGOTIATION', 'ON_HOLD',
    'SOLD', 'RENTED', 'LEASED', 'WITHDRAWN',
  ])

  // ── Download Template ─────────────────────────────────────────────────────

  const handleDownloadTemplate = useCallback(() => {
    const headers = [
      'Category', 'ShortLoc', 'Address', 'Price/Rent', 'Source',
      'Availability Date', 'Status',
      // Residential / Flat
      'BHK', 'Furnishing', 'Built-up Area', 'Floor', 'Parking',
      // Commercial
      'Seater Capacity', 'Cabins', 'Conference Room', 'Washroom', 'Pantry',
      // Plot
      'Facing', 'Plot Number', 'Size', 'Size Unit',
    ]

    const exampleRow = [
      'RENTAL_RESIDENTIAL', '01-Schm140_Mayank', 'Flat 101, Heights, Scheme 140, Indore',
      '18000', 'Owner', '2026-10-01', 'AVAILABLE',
      '2 BHK', 'Semi-Furnished', '1100', '3rd', '1 Covered',
      '', '', '', '', '', // commercial fields blank
      '', '', '', '', // plot fields blank
    ]

    const instructions = [
      '──── INSTRUCTIONS ────', '', '', '', '', '', '',
      '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    ]

    const wsData = [
      headers,
      exampleRow,   // row 2: example
      instructions, // row 3: instructions (hidden visually)
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Set column widths for readability
    ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 4, 16) }))

    // Add a comment-like note to the example row's first cell
    // (SheetJS doesn't support cell comments easily, so we use a note row)

    XLSX.utils.book_append_sheet(wb, ws, 'Properties')

    // Add an Instructions sheet
    const instrWs = XLSX.utils.aoa_to_sheet([
      ['PropDesk CRM — Bulk Import Template'],
      [''],
      ['IMPORTANT: Delete the example row (row 2) before uploading!'],
      [''],
      ['Valid Category values:'],
      ['  RENTAL_RESIDENTIAL, RENTAL_COMMERCIAL, BUY_SELL_FLAT, BUY_SELL_COMMERCIAL, PLOT'],
      [''],
      ['Valid Status values:'],
      ['  NEW, AVAILABLE, UNDER_NEGOTIATION, ON_HOLD, SOLD, RENTED, LEASED, WITHDRAWN'],
      [''],
      ['Valid Source values:'],
      ['  Owner, Broker, Builder-Marketing'],
      [''],
      ['ShortLoc format: "01-Schm140_Mayank" (zone-locality code)'],
      [''],
      ['Category-specific columns:'],
      ['  Residential/Flat: BHK, Furnishing, Built-up Area, Floor, Parking'],
      ['  Commercial: Seater Capacity, Cabins, Conference Room (yes/no), Washroom (yes/no), Pantry (yes/no)'],
      ['  Plot: Facing, Plot Number, Size, Size Unit (sqft/acre/bigha)'],
      [''],
      ['Leave category-specific fields blank for non-applicable categories.'],
    ])
    instrWs['!cols'] = [{ wch: 80 }]
    XLSX.utils.book_append_sheet(wb, instrWs, 'Instructions')

    XLSX.writeFile(wb, 'PropDesk_Property_Import_Template.xlsx')
  }, [])

  // ── Parse Uploaded File ───────────────────────────────────────────────────

  const validateAndParseRow = useCallback((rowData: Record<string, string>, rowIndex: number): ParsedUploadRow => {
    const errors: UploadRowError[] = []
    const raw = (key: string): string => (rowData[key] || '').toString().trim()

    // Required: Category
    const rawCategory = raw('Category').toUpperCase()
    const resolvedCategory = VALID_CATEGORIES[rawCategory]
    if (!rawCategory) {
      errors.push({ row: rowIndex, field: 'Category', message: 'Category is required' })
    } else if (!resolvedCategory) {
      errors.push({ row: rowIndex, field: 'Category', message: `Invalid category: "${raw('Category')}"` })
    }

    // Required: ShortLoc
    const shortLoc = raw('ShortLoc')
    if (!shortLoc) {
      errors.push({ row: rowIndex, field: 'ShortLoc', message: 'ShortLoc is required' })
    }

    // Required: Status
    const rawStatus = raw('Status').toUpperCase().replace(/\s+/g, '_')
    if (!rawStatus) {
      errors.push({ row: rowIndex, field: 'Status', message: 'Status is required' })
    } else if (!VALID_STATUSES.has(rawStatus)) {
      errors.push({ row: rowIndex, field: 'Status', message: `Invalid status: "${raw('Status')}"` })
    }

    // Price (optional but should be numeric if provided)
    const priceStr = raw('Price/Rent')
    const price = priceStr ? parseFloat(priceStr.replace(/[₹,\s]/g, '')) : 0
    if (priceStr && isNaN(price)) {
      errors.push({ row: rowIndex, field: 'Price/Rent', message: 'Price must be a number' })
    }

    // Build property if no errors
    let property: PropertyRow | null = null
    if (errors.length === 0) {
      const category = resolvedCategory!
      let detailsJson: Record<string, unknown> = {}

      if (category === 'RENTAL_RESIDENTIAL' || category === 'BUY_SELL_FLAT') {
        detailsJson = {
          bhk: raw('BHK') || undefined,
          furnishing: raw('Furnishing') || undefined,
          built_up_area: raw('Built-up Area') ? Number(raw('Built-up Area')) : undefined,
          floor: raw('Floor') || undefined,
          parking: raw('Parking') || undefined,
        }
      } else if (category === 'RENTAL_COMMERCIAL' || category === 'BUY_SELL_COMMERCIAL') {
        detailsJson = {
          seater_capacity: raw('Seater Capacity') ? Number(raw('Seater Capacity')) : undefined,
          cabins: raw('Cabins') ? Number(raw('Cabins')) : undefined,
          conference_room: raw('Conference Room') ? raw('Conference Room').toLowerCase() === 'yes' : undefined,
          washroom: raw('Washroom') ? raw('Washroom').toLowerCase() === 'yes' : undefined,
          pantry: raw('Pantry') ? raw('Pantry').toLowerCase() === 'yes' : undefined,
          built_up_area: raw('Built-up Area') ? Number(raw('Built-up Area')) : undefined,
        }
      } else if (category === 'PLOT') {
        detailsJson = {
          facing: raw('Facing') || undefined,
          plot_number: raw('Plot Number') || undefined,
          size: raw('Size') ? Number(raw('Size')) : undefined,
          unit: raw('Size Unit') || 'sqft',
        }
      }

      // Remove undefined values
      detailsJson = Object.fromEntries(Object.entries(detailsJson).filter(([, v]) => v !== undefined))

      property = {
        id: `P-${Date.now().toString().slice(-4)}-${rowIndex}`,
        category,
        short_loc: shortLoc,
        address: raw('Address') || null,
        price: price || 0,
        status: rawStatus,
        owner_id: 'p1',
        owner_name: 'Imported',
        source: raw('Source') || 'Owner',
        availability_date: raw('Availability Date') || 'Immediate',
        details_json: Object.keys(detailsJson).length > 0 ? detailsJson : null,
        last_verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }
    }

    return { rowIndex, data: rowData, property, errors }
  }, [])

  const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadFileName(file.name)
    setUploadParsing(true)
    setShowUploadDialog(true)
    setParsedRows([])

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { defval: '' })

        // Filter out obvious instruction/example rows
        const dataRows = jsonRows.filter((row) => {
          const firstVal = Object.values(row)[0]?.toString() || ''
          return !firstVal.startsWith('──') && !firstVal.startsWith('EXAMPLE')
        })

        const parsed = dataRows.map((row, i) => validateAndParseRow(row, i + 2)) // +2 for 1-indexed + header row
        setParsedRows(parsed)
      } catch {
        setParsedRows([])
      } finally {
        setUploadParsing(false)
      }
    }
    reader.readAsArrayBuffer(file)

    // Reset file input so same file can be re-selected
    e.target.value = ''
  }, [validateAndParseRow])

  const validRows = parsedRows.filter((r) => r.errors.length === 0)
  const errorRows = parsedRows.filter((r) => r.errors.length > 0)

  const handleConfirmImport = useCallback(() => {
    const newProperties = validRows.map((r) => r.property!).reverse()
    setProperties((prev) => [...newProperties, ...prev])
    setShowUploadDialog(false)
    setParsedRows([])
    setUploadFileName('')
  }, [validRows])


  // ── Filter Logic (category/status only — search is handled by DataTable) ──

  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      if (categoryFilter && prop.category !== categoryFilter) return false
      if (statusFilter) {
        if (statusFilter === 'SOLD_RENTED_LEASED') {
          if (!['SOLD', 'RENTED', 'LEASED'].includes(prop.status)) return false
        } else if (prop.status !== statusFilter) {
          return false
        }
      }
      return true
    })
  }, [properties, categoryFilter, statusFilter])

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

  // ── Column Definitions for DataTable ────────────────────────────────────────

  const inventoryColumns: ColumnDef<PropertyRow>[] = [
    {
      key: 'id',
      header: 'Property ID',
      sortValue: (r) => r.id,
      render: (r) => <span className="font-mono text-xs font-semibold text-slate-800">{r.id}</span>,
    },
    {
      key: 'short_loc',
      header: 'ShortLoc',
      sortValue: (r) => r.short_loc,
      render: (r) => (
        <div>
          <ShortLocBadge code={r.short_loc} />
          {r.address && (
            <p className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5" title={r.address}>
              {r.address}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortValue: (r) => formatCategory(r.category),
      render: (r) => {
        const cls = r.category.includes('RENTAL')
          ? 'bg-blue-50 text-blue-700 border-blue-200/60'
          : r.category.includes('PLOT')
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
          : 'bg-purple-50 text-purple-700 border-purple-200/60'
        return (
          <Badge variant="secondary" className={`${cls} font-medium text-[11px]`}>
            {formatCategory(r.category)}
          </Badge>
        )
      },
    },
    {
      key: 'price',
      header: 'Price / Rent',
      align: 'right',
      sortValue: (r) => r.price,
      render: (r) => (
        <span className="font-semibold text-slate-900 whitespace-nowrap">
          {formatPrice(r.price, r.category)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.status,
      render: (r) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${propertyStatusClasses(r.status)}`}>
          {r.status.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'last_verified',
      header: 'Last Verified',
      sortValue: (r) => r.last_verified_at ? new Date(r.last_verified_at).getTime() : 0,
      render: (r) => {
        const v = getVerificationStatus(r.last_verified_at)
        if (v.isStale) {
          return (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200 shadow-xs" title={`Last verified: ${formatDate(r.last_verified_at)}`}>
              <AlertTriangle size={13} className="text-red-600 shrink-0" />
              <span>{v.days !== null ? `${v.days}d ago (Stale)` : 'Never Verified'}</span>
            </div>
          )
        }
        return (
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            <span>{v.label}</span>
            <span className="text-[11px] text-slate-400">({formatDate(r.last_verified_at)})</span>
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      sortable: false,
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="outline" size="sm" onClick={() => setSelectedProperty(r)} className="h-8 px-2.5 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-100">
            <Eye size={12} className="mr-1 text-slate-400" />View
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedProperty(r)} className="h-8 px-2.5 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-100">
            <Edit3 size={12} className="mr-1 text-slate-400" />Edit
          </Button>
        </div>
      ),
    },
  ]

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
              <div className="flex items-center gap-2">
                {/* Hidden file input for Excel upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelected}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="text-slate-700 border-slate-300 hover:bg-slate-50 font-medium shadow-xs"
                  title="Download .xlsx template with correct column headers"
                >
                  <Download size={16} className="mr-1.5 text-slate-500" />
                  Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-medium shadow-xs"
                  title="Upload properties from an Excel file"
                >
                  <Upload size={16} className="mr-1.5" />
                  Upload Excel
                </Button>
                <Button
                  onClick={() => setView('add')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
                >
                  <Plus size={16} className="mr-1.5" />
                  Add Property
                </Button>
              </div>
            </div>

            {/* DataTable with sorting, search, and page-specific filters */}
            <DataTable<PropertyRow>
              columns={inventoryColumns}
              data={filteredProperties}
              totalCount={properties.length}
              rowKey={(row) => row.id}
              searchFields={[
                (r) => r.id,
                (r) => r.short_loc,
                (r) => r.address,
                (r) => r.owner_name,
                (r) => formatCategory(r.category),
              ]}
              searchPlaceholder="Search by ID, ShortLoc, address, or owner…"
              hasActiveFilters={!!categoryFilter || !!statusFilter}
              onClearFilters={() => { setCategoryFilter(''); setStatusFilter('') }}
              emptyIcon={<Building2 className="h-12 w-12" />}
              emptyTitle="No properties found"
              emptyDescription="No property listings match your current search and filter criteria."
              filterSlot={
                <>
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-8 text-sm min-w-[160px]"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-8 text-sm min-w-[160px]"
                  >
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </>
              }
            />
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

      {/* ================================================================= */}
      {/* BULK UPLOAD PREVIEW DIALOG                                         */}
      {/* ================================================================= */}
      {/* TODO: Once real backend is wired, parsed data will POST to a       */}
      {/*       bulk-import API endpoint instead of adding to local state.   */}
      {showUploadDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowUploadDialog(false)
              setParsedRows([])
              setUploadFileName('')
            }}
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Import Properties</h2>
                  <p className="text-sm text-slate-500">
                    Preview and validate data from <span className="font-medium text-slate-700">{uploadFileName}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUploadDialog(false)
                  setParsedRows([])
                  setUploadFileName('')
                }}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {/* Parsing state */}
              {uploadParsing && (
                <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                  <span className="text-sm font-medium">Parsing spreadsheet…</span>
                </div>
              )}

              {/* No data */}
              {!uploadParsing && parsedRows.length === 0 && (
                <div className="text-center py-12">
                  <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-base font-semibold text-slate-800">No data rows found</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    The spreadsheet appears to be empty or could not be parsed. Please check the file and try again.
                  </p>
                </div>
              )}

              {/* Results summary + table */}
              {!uploadParsing && parsedRows.length > 0 && (
                <>
                  {/* Validation Summary */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                      <FileSpreadsheet size={16} className="text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">
                        {parsedRows.length} row{parsedRows.length !== 1 ? 's' : ''} parsed
                      </span>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                      <CheckCircle size={16} className="text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">
                        {validRows.length} valid
                      </span>
                    </div>

                    {errorRows.length > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                        <AlertCircle size={16} className="text-red-600" />
                        <span className="text-sm font-medium text-red-700">
                          {errorRows.length} row{errorRows.length !== 1 ? 's' : ''} with errors
                        </span>
                      </div>
                    )}

                    <span className="text-xs text-slate-400 ml-auto">
                      {validRows.length} of {parsedRows.length} rows valid
                      {errorRows.length > 0 && ' — rows with errors will be skipped'}
                    </span>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-[50vh]">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <th className="py-2.5 px-3 w-12">Row</th>
                            <th className="py-2.5 px-3 w-12">Status</th>
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3">ShortLoc</th>
                            <th className="py-2.5 px-3">Address</th>
                            <th className="py-2.5 px-3 text-right">Price/Rent</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Source</th>
                            <th className="py-2.5 px-3">Issues</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedRows.map((row) => {
                            const hasErrors = row.errors.length > 0
                            return (
                              <tr
                                key={row.rowIndex}
                                className={
                                  hasErrors
                                    ? 'bg-red-50/60 hover:bg-red-50'
                                    : 'hover:bg-slate-50/80'
                                }
                              >
                                <td className="py-2.5 px-3 font-mono text-xs text-slate-500">
                                  {row.rowIndex}
                                </td>
                                <td className="py-2.5 px-3">
                                  {hasErrors ? (
                                    <AlertCircle size={16} className="text-red-500" />
                                  ) : (
                                    <CheckCircle size={16} className="text-emerald-500" />
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-xs font-medium">
                                  <span className={hasErrors && row.errors.some(e => e.field === 'Category') ? 'text-red-700 underline decoration-wavy decoration-red-400' : 'text-slate-700'}>
                                    {row.data['Category'] || '—'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-xs font-mono">
                                  <span className={hasErrors && row.errors.some(e => e.field === 'ShortLoc') ? 'text-red-700 underline decoration-wavy decoration-red-400' : 'text-slate-700'}>
                                    {row.data['ShortLoc'] || '—'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-xs text-slate-600 truncate max-w-[180px]">
                                  {row.data['Address'] || '—'}
                                </td>
                                <td className="py-2.5 px-3 text-xs text-right font-medium text-slate-700">
                                  {row.data['Price/Rent'] || '—'}
                                </td>
                                <td className="py-2.5 px-3 text-xs">
                                  <span className={hasErrors && row.errors.some(e => e.field === 'Status') ? 'text-red-700 underline decoration-wavy decoration-red-400' : 'text-slate-600'}>
                                    {row.data['Status'] || '—'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-xs text-slate-600">
                                  {row.data['Source'] || '—'}
                                </td>
                                <td className="py-2.5 px-3">
                                  {hasErrors ? (
                                    <div className="space-y-0.5">
                                      {row.errors.map((err, i) => (
                                        <div key={i} className="text-[11px] text-red-600 font-medium">
                                          {err.field}: {err.message}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-emerald-600">✓ OK</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                {validRows.length > 0
                  ? `${validRows.length} valid propert${validRows.length === 1 ? 'y' : 'ies'} will be imported`
                  : 'No valid rows to import'}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowUploadDialog(false)
                    setParsedRows([])
                    setUploadFileName('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmImport}
                  disabled={validRows.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50"
                >
                  <CheckCircle size={14} className="mr-1.5" />
                  Import {validRows.length} Propert{validRows.length === 1 ? 'y' : 'ies'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

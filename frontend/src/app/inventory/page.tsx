'use client'

/**
 * Property Inventory page — Spec §1.4.1 & Category Specifications Extension
 *
 * Full real estate property inventory management:
 * - Table view: Property ID, ShortLoc, Category, Price/Rent, Status, Last Verified, Actions
 * - Filter bar: Category dropdown, Status dropdown (all 12 real statuses + Active/Sold synthetic filters), Search
 * - Add/Edit Property Form with dynamic category-specific specification fields:
 *   - Rental Residential / Buy-Sell Flat/Duplex: BHK, Furnishing, Built-up Area, Floor, Parking
 *   - Rental Commercial / Buy-Sell Commercial: Seater Capacity, Cabins, Conference Room, Washroom, Pantry, Built-up Area
 *   - Plot/Jameen: Facing, Plot Number, Size with unit dropdown (sqft/acre/bigha)
 * - Bulk Upload via Excel (.xlsx) with client-side parsing and sequential real API creation.
 * - View Details Modal with active marketing campaign promotions.
 *
 * DATA SOURCE: Real FastAPI backend via apiClient.ts (/api/properties, /api/parties)
 */

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import * as XLSX from 'xlsx'
import {
  Plus, ArrowLeft, Building2, MapPin,
  AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Home,
  LandPlot, Building, Eye, Edit3, X, Upload, Download,
  FileSpreadsheet, AlertCircle, CheckCircle, Loader2, Megaphone,
  Trash2, RefreshCw
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import {
  formatPrice, formatDate, formatCategory, propertyStatusClasses,
} from '@/lib/formatters'
import { apiClient } from '@/lib/apiClient'
import {
  getPropertyActivePromotions,
  type PropertyRow,
  type PartyRow,
} from '@/lib/mockData'

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

const PROPERTY_STATUSES = [
  'NEW',
  'UNDER_VERIFICATION',
  'AVAILABLE',
  'ACTIVE',
  'ON_HOLD',
  'RESERVED',
  'UNDER_NEGOTIATION',
  'SOLD',
  'RENTED',
  'LEASED',
  'WITHDRAWN',
  'INACTIVE',
] as const

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

const VALID_STATUSES = new Set(PROPERTY_STATUSES)

const TERMINAL_PROPERTY_STATUSES = new Set([
  'SOLD',
  'RENTED',
  'LEASED',
  'WITHDRAWN',
  'INACTIVE',
])

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active Inventory' },
  { value: 'SOLD_RENTED_LEASED', label: 'Sold / Rented / Leased' },
  { value: 'NEW', label: 'New' },
  { value: 'UNDER_VERIFICATION', label: 'Under Verification' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'UNDER_NEGOTIATION', label: 'Under Negotiation' },
  { value: 'SOLD', label: 'Sold' },
  { value: 'RENTED', label: 'Rented' },
  { value: 'LEASED', label: 'Leased' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
  { value: 'INACTIVE', label: 'Inactive' },
] as const

const STATUS_ALL_OPTIONS = PROPERTY_STATUSES

const SOURCE_OPTIONS = ['Owner', 'Broker', 'Builder-Marketing'] as const

const VALID_SOURCES: Record<string, string> = {
  'owner': 'Owner',
  'broker': 'Broker',
  'builder-marketing': 'Builder-Marketing',
  'builder marketing': 'Builder-Marketing',
  'buildermarketing': 'Builder-Marketing',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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
          detail = parsed.detail.replace(/^Value error,\s*/i, '')
        } else if (Array.isArray(parsed.detail)) {
          detail = parsed.detail
            .map((d: any) => {
              const field = d.loc?.slice(-1)[0] || 'field'
              const msg = (d.msg || '').replace(/^Value error,\s*/i, '')
              return `${field}: ${msg}`
            })
            .join(', ')
        }
      }
    }
  } catch {
    // Ignore JSON parsing issues
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

function formatAvailabilityDate(avail: string | null | undefined): string {
  if (!avail) return 'Immediate'
  const trimmed = avail.trim()
  if (!trimmed) return 'Immediate'
  const parsed = Date.parse(trimmed)
  if (isNaN(parsed) || !/^\d{4}/.test(trimmed)) {
    return trimmed
  }
  return formatDate(trimmed)
}

function normalizeMobile(val: string | null | undefined): string {
  if (!val) return ''
  let s = String(val).trim().replace(/[\s\-\(\)\.]/g, '')
  if (s.startsWith('+91')) s = s.slice(3)
  else if (s.startsWith('91') && s.length > 10) s = s.slice(2)
  else if (s.startsWith('0') && s.length > 10) s = s.slice(1)
  return s
}

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

function InventoryContent() {
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get('status') || ''
  const initialSearch = searchParams.get('search') || ''

  // Real backend state
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // Parties for Owner Picker
  const [parties, setParties] = useState<PartyRow[]>([])
  const [partiesLoading, setPartiesLoading] = useState(false)

  // Navigation / View State
  const [view, setView] = useState<'list' | 'add'>('list')
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null)

  // List View Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus)

  useEffect(() => {
    if (initialStatus) {
      setStatusFilter(initialStatus)
    }
  }, [initialStatus])

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
  const [formOwnerId, setFormOwnerId] = useState<string>('')

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
    property: PropertyRow | null
    resolvedOwnerName?: string
    errors: UploadRowError[]
  }

  const [parsedRows, setParsedRows] = useState<ParsedUploadRow[]>([])


  // ── Fetch Properties from Real Backend ──────────────────────────────────────

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const data = await apiClient.get<{ items: PropertyRow[]; total: number }>('/api/properties?limit=200')
      setProperties(data.items || [])
      setTotalCount(data.total || 0)
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Failed to load property inventory')
      if (parsed.status === 403) {
        setPermissionDenied(true)
      } else {
        setError(parsed.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Fetch Parties for Owner Picker ──────────────────────────────────────────

  // ── Fetch Parties for Owner Picker ──────────────────────────────────────────

  const fetchParties = useCallback(async () => {
    setPartiesLoading(true)
    try {
      let all: PartyRow[] = []
      let offset = 0
      const limit = 200
      let total = 0
      do {
        const data = await apiClient.get<{ items: PartyRow[]; total: number }>(`/api/parties?limit=${limit}&offset=${offset}`)
        all = all.concat(data.items || [])
        total = data.total || 0
        offset += limit
      } while (all.length < total && offset < 5000)
      setParties(all)
    } catch {
      // Non-critical fallback
    } finally {
      setPartiesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProperties()
    fetchParties()
  }, [fetchProperties, fetchParties])

  // ── Download Template ─────────────────────────────────────────────────────

  const handleDownloadTemplate = useCallback(() => {
    const headers = [
      'Category', 'ShortLoc', 'Address', 'Price/Rent', 'Source', 'Owner Mobile',
      'Availability Date', 'Status',
      // Residential / Flat
      'BHK', 'Furnishing', 'Built-up Area', 'Floor', 'Parking',
      // Commercial
      'Seater Capacity', 'Cabins', 'Conference Room', 'Washroom', 'Pantry',
      // Plot
      'Facing', 'Plot Number', 'Size', 'Size Unit',
    ]

    const sampleRow = [
      'RENTAL_RESIDENTIAL', '01-Schm140_Mayank', 'Flat 101, Heights, Scheme 140, Indore',
      '25000', 'Owner', '+91 9876543213', 'Immediate', 'AVAILABLE',
      // residential fields
      '2 BHK', 'Semi-Furnished', '1100', '2nd', '1 Covered',
      '', '', '', '', '', // commercial fields blank
      '', '', '', '', // plot fields blank
    ]

    const wsData = [headers, sampleRow]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    ws['!cols'] = [
      { wch: 22 }, { wch: 20 }, { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 16 },
      { wch: 16 }, { wch: 14 },
      { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 8 }, { wch: 12 },
      { wch: 14 }, { wch: 8 }, { wch: 16 }, { wch: 10 }, { wch: 8 },
      { wch: 10 }, { wch: 14 }, { wch: 8 }, { wch: 10 },
    ]

    const instructionsData = [
      ['Property Inventory — Bulk Import Template Instructions'],
      [''],
      ['How to use this template:'],
      ['1. The "Properties" sheet contains headers and a sample row.'],
      ['2. Add your property rows below the sample row, or replace the sample.'],
      ['3. Required fields: Category, ShortLoc, Price/Rent, Owner Mobile, Status.'],
      ['4. ShortLoc must be a valid hyperlocal key (e.g. 01-Schm140_Mayank).'],
      ['5. Price/Rent must be a positive number.'],
      ['6. Owner Mobile: the mobile number of the owner exactly as saved in Parties. The owner must already exist in Parties.'],
      ['7. Save as .xlsx and upload using the "Upload Excel" button.'],
      [''],
      ['Valid Category values:'],
      ['  RENTAL_RESIDENTIAL, RENTAL_COMMERCIAL, BUY_SELL_FLAT, BUY_SELL_COMMERCIAL, PLOT'],
      [''],
      ['Valid Status values:'],
      ['  NEW, UNDER_VERIFICATION, AVAILABLE, ACTIVE, ON_HOLD, RESERVED, UNDER_NEGOTIATION, SOLD, RENTED, LEASED, WITHDRAWN, INACTIVE'],
      [''],
      ['Valid Source values:'],
      ['  Owner, Broker, Builder-Marketing'],
      [''],
      ['Category-specific columns:'],
      ['  Residential/Flat: BHK, Furnishing, Built-up Area, Floor, Parking'],
      ['  Commercial: Seater Capacity, Cabins, Conference Room (yes/no), Washroom (yes/no), Pantry (yes/no), Built-up Area'],
      ['  Plot: Facing, Plot Number, Size, Size Unit (sqft/acre/bigha)'],
      [''],
      ['Leave category-specific fields blank for non-applicable categories.'],
    ]
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData)
    wsInstructions['!cols'] = [{ wch: 85 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions')
    XLSX.utils.book_append_sheet(wb, ws, 'Properties')

    XLSX.writeFile(wb, 'Property_Inventory_Template.xlsx')
  }, [])

  // ── Handle File Selection & Parse ──────────────────────────────────────────

  const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadFileName(file.name)
    setUploadParsing(true)
    setParsedRows([])
    setShowUploadDialog(true)

    if (e.target) e.target.value = ''

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result
        const wb = XLSX.read(buffer, { type: 'binary' })

        let sheetName = wb.SheetNames.find((n) => n.toLowerCase() === 'properties')
        if (!sheetName) sheetName = wb.SheetNames[0]

        const ws = wb.Sheets[sheetName]
        const rawJson: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, {
          defval: '',
          raw: false,
        })

        const rows: ParsedUploadRow[] = []

        rawJson.forEach((data, index) => {
          const rowIndex = index + 2
          const errors: UploadRowError[] = []

          const raw = (field: string) => (data[field] || '').trim()

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
          } else if (!VALID_STATUSES.has(rawStatus as any)) {
            errors.push({ row: rowIndex, field: 'Status', message: `Invalid status: "${raw('Status')}"` })
          }

          // Required: Price/Rent
          const rawPriceVal = raw('Price/Rent')
          const cleanPriceStr = rawPriceVal.replace(/,/g, '').trim()
          const priceNum = Number(cleanPriceStr)
          if (!rawPriceVal) {
            errors.push({ row: rowIndex, field: 'Price/Rent', message: 'Price/Rent is required' })
          } else if (isNaN(priceNum) || !/^-?\d+(\.\d+)?$/.test(cleanPriceStr)) {
            errors.push({ row: rowIndex, field: 'Price/Rent', message: `Price must be a valid number: "${rawPriceVal}"` })
          } else if (priceNum <= 0) {
            errors.push({ row: rowIndex, field: 'Price/Rent', message: `Price must be greater than 0: "${rawPriceVal}"` })
          }

          // Optional: Source (defaults to Owner if blank; if provided must be one of Owner, Broker, Builder-Marketing)
          const rawSource = raw('Source')
          let resolvedSource = 'Owner'
          if (rawSource) {
            const normalizedSource = VALID_SOURCES[rawSource.toLowerCase()]
            if (!normalizedSource) {
              errors.push({
                row: rowIndex,
                field: 'Source',
                message: `Invalid source: "${rawSource}". Must be one of: Owner, Broker, Builder-Marketing`,
              })
            } else {
              resolvedSource = normalizedSource
            }
          }

          // Required: Owner Mobile (must match a unique party in Parties directory)
          const rawMobile = raw('Owner Mobile')
          let resolvedOwner: PartyRow | null = null
          if (!rawMobile) {
            errors.push({ row: rowIndex, field: 'Owner Mobile', message: 'Owner Mobile is required' })
          } else {
            const norm = normalizeMobile(rawMobile)
            const matches = parties.filter((p) => normalizeMobile(p.mobile) === norm)
            if (matches.length === 0) {
              errors.push({
                row: rowIndex,
                field: 'Owner Mobile',
                message: `Owner not found for mobile ${rawMobile}. Add them in Parties first`,
              })
            } else if (matches.length > 1) {
              errors.push({
                row: rowIndex,
                field: 'Owner Mobile',
                message: `More than one party has this mobile (${rawMobile}), do not guess`,
              })
            } else {
              resolvedOwner = matches[0]
            }
          }

          let property: PropertyRow | null = null

          if (errors.length === 0 && resolvedCategory && resolvedOwner) {
            const category = resolvedCategory
            const detailsJson: Record<string, unknown> = {}

            if (category === 'RENTAL_RESIDENTIAL' || category === 'BUY_SELL_FLAT') {
              if (raw('BHK')) detailsJson.bhk = raw('BHK')
              if (raw('Furnishing')) detailsJson.furnishing = raw('Furnishing')
              if (raw('Built-up Area')) detailsJson.built_up_area = Number(raw('Built-up Area')) || 0
              if (raw('Floor')) detailsJson.floor = raw('Floor')
              if (raw('Parking')) detailsJson.parking = raw('Parking')
            } else if (category === 'RENTAL_COMMERCIAL' || category === 'BUY_SELL_COMMERCIAL') {
              if (raw('Seater Capacity')) detailsJson.seater_capacity = Number(raw('Seater Capacity')) || 0
              if (raw('Cabins')) detailsJson.cabins = Number(raw('Cabins')) || 0
              if (raw('Conference Room')) detailsJson.conference_room = raw('Conference Room').toLowerCase().startsWith('y')
              if (raw('Washroom')) detailsJson.washroom = raw('Washroom').toLowerCase().startsWith('y')
              if (raw('Pantry')) detailsJson.pantry = raw('Pantry').toLowerCase().startsWith('y')
              if (raw('Built-up Area')) detailsJson.built_up_area = Number(raw('Built-up Area')) || 0
            } else if (category === 'PLOT') {
              if (raw('Facing')) detailsJson.facing = raw('Facing')
              if (raw('Plot Number')) detailsJson.plot_number = raw('Plot Number')
              if (raw('Size')) detailsJson.size = Number(raw('Size')) || 0
              if (raw('Size Unit')) detailsJson.unit = raw('Size Unit')
            }

            property = {
              id: `P-${Date.now().toString().slice(-4)}-${rowIndex}`,
              category,
              short_loc: shortLoc,
              address: raw('Address') || null,
              price: priceNum,
              status: rawStatus,
              owner_id: resolvedOwner.id,
              owner_name: resolvedOwner.name,
              source: resolvedSource,
              availability_date: raw('Availability Date') || 'Immediate',
              details_json: Object.keys(detailsJson).length > 0 ? detailsJson : null,
              last_verified_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            }
          }

          rows.push({
            rowIndex,
            data: data as Record<string, string>,
            property,
            resolvedOwnerName: resolvedOwner?.name,
            errors,
          })
        })

        setParsedRows(rows)
      } catch (err) {
        console.error('Error parsing Excel file:', err)
        setError('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.')
      } finally {
        setUploadParsing(false)
      }
    }

    reader.readAsBinaryString(file)
  }, [parties])

  const validRows = parsedRows.filter((r) => r.errors.length === 0 && r.property !== null)
  const errorRows = parsedRows.filter((r) => r.errors.length > 0)

  // ── Confirm Import via Real Sequential API POSTs ────────────────────────────

  const handleConfirmImport = useCallback(async () => {
    setIsImporting(true)
    let successCount = 0
    let failureCount = 0
    const failureMessages: string[] = []

    for (const row of validRows) {
      if (!row.property || !row.property.owner_id) continue
      const prop = row.property
      const payload = {
        category: prop.category,
        short_loc: prop.short_loc,
        address: prop.address || null,
        price: prop.price,
        status: prop.status || 'NEW',
        owner_id: prop.owner_id,
        source: prop.source || 'Owner',
        availability_date: prop.availability_date || 'Immediate',
        details_json: prop.details_json,
      }

      try {
        await apiClient.post('/api/properties', payload)
        successCount++
      } catch (err: unknown) {
        failureCount++
        const parsed = parseApiError(err, 'Failed to import row')
        failureMessages.push(`Row ${row.rowIndex} (${prop.short_loc}): ${parsed.message}`)
      }
    }

    setIsImporting(false)
    setShowUploadDialog(false)
    await fetchProperties()

    if (failureCount > 0) {
      setError(`Import finished: ${successCount} imported successfully, ${failureCount} failed. ${failureMessages.slice(0, 3).join('; ')}`)
    } else {
      setError(null)
    }
  }, [validRows, fetchProperties])

  // ── Filter Logic (category/status only — search is handled by DataTable) ──

  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      if (categoryFilter && prop.category !== categoryFilter) return false
      if (statusFilter) {
        const propStatusUpper = (prop.status || '').toUpperCase()
        if (statusFilter === 'SOLD_RENTED_LEASED') {
          if (!['SOLD', 'RENTED', 'LEASED'].includes(propStatusUpper)) return false
        } else if (statusFilter === 'ACTIVE') {
          if (TERMINAL_PROPERTY_STATUSES.has(propStatusUpper)) return false
        } else if (propStatusUpper !== statusFilter.toUpperCase()) {
          return false
        }
      }
      return true
    })
  }, [properties, categoryFilter, statusFilter])

  // ── Last Verified Helper (FIX 2: terminal properties never show red/stale) ─

  const getVerificationStatus = (
    lastVerifiedAt: string | null,
    status?: string,
    isStaleBackend?: boolean
  ) => {
    const isTerminal = status && TERMINAL_PROPERTY_STATUSES.has(status.toUpperCase())
    if (isTerminal) {
      return {
        isStale: false,
        days: null,
        label: lastVerifiedAt ? formatDate(lastVerifiedAt) : 'Verified',
      }
    }

    if (isStaleBackend !== undefined) {
      const days = lastVerifiedAt
        ? Math.floor((Date.now() - new Date(lastVerifiedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null
      return {
        isStale: isStaleBackend,
        days,
        label: lastVerifiedAt ? (days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days}d ago`) : 'Never Verified',
      }
    }

    if (!lastVerifiedAt) {
      return {
        isStale: true,
        days: null,
        label: 'Never Verified',
      }
    }

    const verifiedDate = new Date(lastVerifiedAt)
    const diffMs = Date.now() - verifiedDate.getTime()
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
    setFormOwnerId('')
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

  const handleStartEdit = (prop: PropertyRow) => {
    setEditingPropertyId(prop.id)
    setFormCategory(prop.category as PropertyCategory)
    setFormShortLoc(prop.short_loc || '')
    setFormAddress(prop.address || '')
    setFormPrice(prop.price ? String(prop.price) : '')
    setFormSource(prop.source || 'Owner')
    setFormAvailabilityDate(prop.availability_date || 'Immediate')
    setFormStatus(prop.status || 'NEW')
    setFormOwnerId(prop.owner_id || '')

    const dj = (prop.details_json || {}) as Record<string, any>
    if (prop.category === 'RENTAL_RESIDENTIAL' || prop.category === 'BUY_SELL_FLAT') {
      setFormBhk(dj.bhk || '2 BHK')
      setFormFurnishing(dj.furnishing || 'Semi-Furnished')
      setFormResArea(dj.built_up_area ? String(dj.built_up_area) : '1100')
      setFormFloor(dj.floor || '2nd')
      setFormParking(dj.parking || '1 Covered')
    } else if (prop.category === 'RENTAL_COMMERCIAL' || prop.category === 'BUY_SELL_COMMERCIAL') {
      setFormSeater(dj.seater_capacity ? String(dj.seater_capacity) : '20')
      setFormCabins(dj.cabins ? String(dj.cabins) : '2')
      setFormConference(dj.conference_room ? 'yes' : 'no')
      setFormWashroom(dj.washroom ? 'yes' : 'no')
      setFormPantry(dj.pantry ? 'yes' : 'no')
      setFormCommArea(dj.built_up_area ? String(dj.built_up_area) : '1500')
    } else if (prop.category === 'PLOT') {
      setFormFacing(dj.facing || 'East')
      setFormPlotNumber(dj.plot_number || '')
      setFormPlotSize(dj.size ? String(dj.size) : '1500')
      setFormPlotUnit(dj.unit || 'sqft')
    }

    setError(null)
    setView('add')
  }

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    const cleanPrice = formPrice.replace(/,/g, '').trim()
    const numericPrice = Number(cleanPrice)
    if (!formPrice.trim() || isNaN(numericPrice) || numericPrice <= 0) {
      setError('Price must be greater than 0')
      setIsSaving(false)
      return
    }

    if (!formOwnerId.trim()) {
      setError('Please select an owner for this property')
      setIsSaving(false)
      return
    }

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

    const payload = {
      category: formCategory,
      short_loc: formShortLoc.trim() || '01-Schm140_Mayank',
      address: formAddress.trim() || null,
      price: numericPrice,
      status: formStatus,
      owner_id: formOwnerId,
      source: formSource,
      availability_date: formAvailabilityDate.trim() || null,
      details_json: detailsJson,
    }

    try {
      if (editingPropertyId) {
        await apiClient.patch(`/api/properties/${editingPropertyId}`, payload)
      } else {
        await apiClient.post('/api/properties', payload)
      }
      resetForm()
      setEditingPropertyId(null)
      setView('list')
      await fetchProperties()
    } catch (err: unknown) {
      const parsed = parseApiError(err, editingPropertyId ? 'Failed to update property' : 'Failed to create property')
      setError(parsed.message)
    } finally {
      setIsSaving(false)
    }
  }

  // ── Inline Status Change (PATCH /api/properties/{id}) ───────────────────────

  const patchStatus = useCallback(async (id: string, newStatus: string) => {
    let oldStatus: string | undefined
    setProperties((prev) => {
      const found = prev.find((p) => p.id === id)
      oldStatus = found?.status
      return prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    })

    setError(null)

    try {
      await apiClient.patch(`/api/properties/${id}`, { status: newStatus })
      await fetchProperties()
    } catch (err: unknown) {
      if (oldStatus) {
        setProperties((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: oldStatus! } : p))
        )
      }
      const parsed = parseApiError(err, `Failed to update status for property ${id}`)
      setError(parsed.message)
    }
  }, [fetchProperties])

  // ── Delete Property (DELETE /api/properties/{id}) ───────────────────────────

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm(`Are you sure you want to delete property ${id}?`)) return
    setDeletingId(id)
    setError(null)

    try {
      await apiClient.delete(`/api/properties/${id}`)
      await fetchProperties()
    } catch (err: unknown) {
      const parsed = parseApiError(err, `Failed to delete property ${id}`)
      setError(parsed.message)
    } finally {
      setDeletingId(null)
    }
  }, [fetchProperties])

  // ── Column Definitions for DataTable ────────────────────────────────────────

  const inventoryColumns: ColumnDef<PropertyRow>[] = [
    {
      key: 'id',
      header: 'Property ID',
      sortValue: (r) => r.id,
      render: (r) => {
        const promos = getPropertyActivePromotions(r.id)
        return (
          <div>
            <span className="font-mono text-xs font-semibold text-slate-800">{r.id}</span>
            {promos.length > 0 && (
              <div className="mt-1">
                <span
                  title={promos.map(p => `${p.campaign.name} (${p.promotion.marketing_headline})`).join('\n')}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200"
                >
                  <Megaphone size={10} className="text-purple-600 shrink-0" />
                  <span>Promoted in {promos.length} campaign{promos.length > 1 ? 's' : ''}</span>
                </span>
              </div>
            )}
          </div>
        )
      },
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
        <div>
          <span className="font-semibold text-slate-900 whitespace-nowrap">
            {formatPrice(r.price, r.category)}
          </span>
          <span className="block text-[11px] text-slate-400 font-normal whitespace-nowrap">
            Avail: {formatAvailabilityDate(r.availability_date)}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.status,
      render: (r) => (
        <Select
          value={r.status}
          onChange={(e) => patchStatus(r.id, e.target.value)}
          className={`h-7 text-xs font-semibold px-2 w-auto min-w-[125px] rounded-full border shadow-none cursor-pointer ${propertyStatusClasses(r.status)}`}
        >
          {PROPERTY_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
      ),
    },
    {
      key: 'last_verified',
      header: 'Last Verified',
      sortValue: (r) => r.last_verified_at ? new Date(r.last_verified_at).getTime() : 0,
      render: (r) => {
        const v = getVerificationStatus(r.last_verified_at, r.status, r.is_stale)
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
            {r.last_verified_at && (
              <span className="text-[11px] text-slate-400">({formatDate(r.last_verified_at)})</span>
            )}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedProperty(r)}
            className="h-8 px-2.5 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-100"
          >
            <Eye size={12} className="mr-1 text-slate-400" />View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStartEdit(r)}
            className="h-8 px-2.5 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-100"
          >
            <Edit3 size={12} className="mr-1 text-slate-400" />Edit
          </Button>
          <button
            type="button"
            onClick={() => handleDelete(r.id)}
            disabled={deletingId === r.id}
            title={`Delete property ${r.id}`}
            className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
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
                {/* Refresh list button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchProperties}
                  className="h-9 px-2.5 text-slate-700 border-slate-300 hover:bg-slate-50"
                  title="Refresh properties from backend"
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                </Button>

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
                  onClick={() => {
                    resetForm()
                    setEditingPropertyId(null)
                    setView('add')
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
                >
                  <Plus size={16} className="mr-1.5" />
                  Add Property
                </Button>
              </div>
            </div>

            {/* Permission Denied (403/401) Banner */}
            {permissionDenied && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 px-6 py-8 rounded-xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <ShieldAlert size={24} />
                </div>
                <h2 className="text-lg font-bold">Access Restricted</h2>
                <p className="text-sm text-amber-800 max-w-md mx-auto">
                  You don&apos;t have permission to view Inventory. Inventory management requires the Super Admin or Office Executive role.
                </p>
              </div>
            )}

            {/* Global Error Banner */}
            {error && !permissionDenied && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 font-bold">✕</button>
              </div>
            )}

            {/* Main Content: Filter Bar + DataTable */}
            {!permissionDenied && (
              <>
                {/* Filter Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <div className="w-full sm:w-48">
                    <Select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="h-9 text-xs"
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="w-full sm:w-56">
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-9 text-xs"
                    >
                      {STATUS_FILTER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Clear Filters */}
                  {(categoryFilter || statusFilter) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCategoryFilter('')
                        setStatusFilter('')
                      }}
                      className="h-9 px-2 text-xs text-slate-500 hover:text-slate-800"
                    >
                      <X size={14} className="mr-1" />
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Table or Loading */}
                {loading && properties.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-sm bg-white rounded-lg border border-slate-200">
                    <Loader2 size={24} className="animate-spin mb-2 text-indigo-600" />
                    <span>Loading property inventory from backend…</span>
                  </div>
                ) : (
                  <DataTable<PropertyRow>
                    columns={inventoryColumns}
                    data={filteredProperties}
                    totalCount={properties.length}
                    initialSearch={initialSearch}
                    rowKey={(r) => r.id}
                    searchFields={[
                      (r) => r.short_loc,
                      (r) => r.address || '',
                      (r) => r.id,
                      (r) => r.owner_name,
                      (r) => formatCategory(r.category),
                    ]}
                  />
                )}
              </>
            )}
          </>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: ADD / EDIT PROPERTY FORM                                  */}
        {/* ================================================================= */}
        {view === 'add' && !permissionDenied && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => {
                  resetForm()
                  setEditingPropertyId(null)
                  setView('list')
                }}
                className="text-slate-600 hover:text-slate-900 -ml-2"
              >
                <ArrowLeft size={16} className="mr-1.5" />
                Back to Inventory
              </Button>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 font-bold">✕</button>
              </div>
            )}

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg font-bold text-slate-900">
                  {editingPropertyId ? `Edit Property — ${editingPropertyId}` : 'Create New Property Listing'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {editingPropertyId
                    ? 'Update listing parameters and specifications'
                    : 'Enter common listing parameters and category-specific property attributes'}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                <form id="add-property-form" noValidate onSubmit={handleSaveProperty} className="space-y-8">
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
                          min="0.01"
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

                      {/* Status (All 12 Real Postgres Statuses) */}
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

                    {/* Full Address & Owner (Real Parties Picker) */}
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
                          Linked Party / Owner <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          id="owner"
                          value={formOwnerId}
                          onChange={(e) => setFormOwnerId(e.target.value)}
                          className="h-10 text-sm"
                          required
                        >
                          <option value="">— Select an Owner (Required) —</option>
                          {partiesLoading && <option value="" disabled>Loading parties…</option>}
                          {!partiesLoading && parties.length === 0 && <option value="" disabled>No parties found</option>}
                          {parties.map((party) => (
                            <option key={party.id} value={party.id}>
                              {party.name} {party.mobile ? `(${party.mobile})` : ''}
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
                            <option value="Duplex">Duplex</option>
                            <option value="Penthouse">Penthouse</option>
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
                            <option value="Fully Furnished">Fully Furnished</option>
                          </Select>
                        </div>

                        {/* Built-up Area */}
                        <div className="space-y-1.5">
                          <Label htmlFor="res_area" className="text-xs font-semibold text-slate-700">
                            Built-up Area (sq ft)
                          </Label>
                          <Input
                            id="res_area"
                            type="number"
                            value={formResArea}
                            onChange={(e) => setFormResArea(e.target.value)}
                            placeholder="e.g. 1100"
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
                            placeholder="e.g. 2nd, Top, Ground"
                            className="h-10 text-sm bg-white"
                          />
                        </div>

                        {/* Parking */}
                        <div className="space-y-1.5">
                          <Label htmlFor="parking" className="text-xs font-semibold text-slate-700">
                            Parking
                          </Label>
                          <Input
                            id="parking"
                            value={formParking}
                            onChange={(e) => setFormParking(e.target.value)}
                            placeholder="e.g. 1 Covered, 2 Open, None"
                            className="h-10 text-sm bg-white"
                          />
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
                            placeholder="e.g. 25"
                            className="h-10 text-sm bg-white"
                          />
                        </div>

                        {/* Cabins */}
                        <div className="space-y-1.5">
                          <Label htmlFor="cabins" className="text-xs font-semibold text-slate-700">
                            Cabins
                          </Label>
                          <Input
                            id="cabins"
                            type="number"
                            value={formCabins}
                            onChange={(e) => setFormCabins(e.target.value)}
                            placeholder="e.g. 3"
                            className="h-10 text-sm bg-white"
                          />
                        </div>

                        {/* Conference Room */}
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
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </Select>
                        </div>

                        {/* Washroom */}
                        <div className="space-y-1.5">
                          <Label htmlFor="washroom" className="text-xs font-semibold text-slate-700">
                            Attached Washroom
                          </Label>
                          <Select
                            id="washroom"
                            value={formWashroom}
                            onChange={(e) => setFormWashroom(e.target.value)}
                            className="h-10 text-sm bg-white"
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </Select>
                        </div>

                        {/* Pantry */}
                        <div className="space-y-1.5">
                          <Label htmlFor="pantry" className="text-xs font-semibold text-slate-700">
                            Pantry Available
                          </Label>
                          <Select
                            id="pantry"
                            value={formPantry}
                            onChange={(e) => setFormPantry(e.target.value)}
                            className="h-10 text-sm bg-white"
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </Select>
                        </div>

                        {/* Built-up Area */}
                        <div className="space-y-1.5">
                          <Label htmlFor="comm_area" className="text-xs font-semibold text-slate-700">
                            Built-up Area (sq ft)
                          </Label>
                          <Input
                            id="comm_area"
                            type="number"
                            value={formCommArea}
                            onChange={(e) => setFormCommArea(e.target.value)}
                            placeholder="e.g. 1500"
                            className="h-10 text-sm bg-white"
                          />
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

                        {/* Size & Unit */}
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
                              placeholder="1500"
                              className="h-10 text-sm bg-white flex-1"
                            />
                            <Select
                              value={formPlotUnit}
                              onChange={(e) => setFormPlotUnit(e.target.value)}
                              className="h-10 text-sm bg-white w-24"
                            >
                              <option value="sqft">sq ft</option>
                              <option value="acre">Acre</option>
                              <option value="bigha">Bigha</option>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        resetForm()
                        setEditingPropertyId(null)
                        setView('list')
                      }}
                      className="text-slate-700 border-slate-300 hover:bg-slate-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs min-w-[130px]"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-1.5" />
                          Saving…
                        </>
                      ) : editingPropertyId ? (
                        'Save Changes'
                      ) : (
                        <>
                          <Plus size={16} className="mr-1.5" />
                          Save Property
                        </>
                      )}
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

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Availability</span>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {formatAvailabilityDate(selectedProperty.availability_date)}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Source</span>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {selectedProperty.source || 'Owner'}
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

                {/* Active Marketing Campaigns Section (Read-Only) */}
                {(() => {
                  const activePromos = getPropertyActivePromotions(selectedProperty.id)
                  if (activePromos.length === 0) return null
                  return (
                    <div className="bg-purple-50/60 border border-purple-200/80 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                        <Megaphone size={14} className="text-purple-600" />
                        <span>Active Marketing Campaigns ({activePromos.length})</span>
                      </div>
                      <div className="space-y-2">
                        {activePromos.map(({ campaign, promotion }) => (
                          <div key={promotion.id} className="bg-white p-2.5 rounded-lg border border-purple-100 text-xs shadow-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-slate-900">{campaign.name}</span>
                              <span className="px-2 py-0.2 rounded text-[10px] bg-purple-100 text-purple-800 font-medium">
                                {campaign.type}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">
                              <strong>Headline:</strong> &ldquo;{promotion.marketing_headline}&rdquo;
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                              <span>CTA: <strong className="text-slate-600">{promotion.cta_text}</strong></span>
                              <span>•</span>
                              <span>Attributed Enquiries: <strong className="text-indigo-600">{promotion.enquiries_count}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                <div className="flex items-center justify-between text-xs text-slate-400 border-t pt-3">
                  <span>Created: {formatDate(selectedProperty.created_at)}</span>
                  <span>Last Verified: {formatDate(selectedProperty.last_verified_at)}</span>
                </div>
              </div>

              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const toEdit = selectedProperty
                    setSelectedProperty(null)
                    if (toEdit) handleStartEdit(toEdit)
                  }}
                >
                  <Edit3 size={13} className="mr-1 text-slate-500" />
                  Edit
                </Button>
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
      {showUploadDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (!isImporting) setShowUploadDialog(false)
            }}
          />

          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Import Properties from Excel</h3>
                  <p className="text-xs text-slate-500">
                    {uploadFileName} — Preview and validate data before importing
                  </p>
                </div>
              </div>
              <button
                disabled={isImporting}
                onClick={() => setShowUploadDialog(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {uploadParsing ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Loader2 size={32} className="animate-spin text-emerald-600 mb-2" />
                  <p className="text-sm font-medium">Parsing spreadsheet data…</p>
                </div>
              ) : parsedRows.length === 0 ? (
                <div className="text-center py-12">
                  <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-base font-semibold text-slate-800">No data rows found</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    The spreadsheet appears to be empty or could not be parsed. Please check the file and try again.
                  </p>
                </div>
              ) : (
                <>
                  {/* Validation Summary */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                      <FileSpreadsheet size={16} className="text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">
                        {parsedRows.length} row{parsedRows.length !== 1 ? 's' : ''} parsed
                      </span>
                    </div>

                    {validRows.length > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
                        <CheckCircle size={16} />
                        <span>{validRows.length} valid</span>
                      </div>
                    )}

                    {errorRows.length > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                        <AlertCircle size={16} />
                        <span>{errorRows.length} with errors</span>
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
                            <th className="py-2.5 px-3">Owner</th>
                            <th className="py-2.5 px-3 text-right">Price/Rent</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Source</th>
                            <th className="py-2.5 px-3">Errors / Notes</th>
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
                                    <AlertCircle size={15} className="text-red-500" />
                                  ) : (
                                    <CheckCircle size={15} className="text-emerald-500" />
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
                                <td className="py-2.5 px-3 text-xs">
                                  {row.resolvedOwnerName ? (
                                    <span className="font-medium text-slate-800">
                                      {row.resolvedOwnerName}
                                    </span>
                                  ) : (
                                    <span className="text-red-700 underline decoration-wavy decoration-red-400">
                                      {row.data['Owner Mobile'] ? `Unresolved (${row.data['Owner Mobile']})` : 'Missing Owner'}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-xs text-right font-medium text-slate-700">
                                  <span className={hasErrors && row.errors.some(e => e.field === 'Price/Rent') ? 'text-red-700 underline decoration-wavy decoration-red-400' : 'text-slate-700'}>
                                    {row.data['Price/Rent'] || '—'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-xs">
                                  <span className={hasErrors && row.errors.some(e => e.field === 'Status') ? 'text-red-700 underline decoration-wavy decoration-red-400' : 'text-slate-600'}>
                                    {row.data['Status'] || '—'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-xs">
                                  <span className={hasErrors && row.errors.some(e => e.field === 'Source') ? 'text-red-700 underline decoration-wavy decoration-red-400' : 'text-slate-600'}>
                                    {row.data['Source'] || '—'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-xs">
                                  {hasErrors ? (
                                    <div className="space-y-0.5">
                                      {row.errors.map((err, i) => (
                                        <p key={i} className="text-red-600 text-[11px] font-medium">
                                          {err.field}: {err.message}
                                        </p>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-emerald-600 text-xs font-medium">Ready</span>
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
                  onClick={() => setShowUploadDialog(false)}
                  disabled={isImporting}
                  className="text-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmImport}
                  disabled={validRows.length === 0 || isImporting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50 min-w-[120px]"
                >
                  {isImporting ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-1.5" />
                      Importing…
                    </>
                  ) : (
                    `Import ${validRows.length} Propert${validRows.length === 1 ? 'y' : 'ies'}`
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
          Loading Inventory…
        </div>
      }
    >
      <InventoryContent />
    </Suspense>
  )
}

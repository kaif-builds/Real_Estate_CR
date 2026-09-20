'use client'

/**
 * Visits Management Page — Module 9
 *
 * List + assignment view for Office Executives & Super Admins.
 *
 * Filter bar:
 * - Status dropdown (Assigned, Accepted, Scheduled, En Route, Arrived, Visit Started,
 *   Visit Completed, Submitted, Approved, Rejected, Cancelled)
 * - Agent dropdown (mock Agent-role staff only — no Office Executive users)
 * - Text search
 * - "+ Assign Visit" button
 *
 * Table columns:
 * - Visit ID
 * - Property (ShortLoc badge)
 * - Client/Party
 * - Assigned Agent
 * - Purpose (Property Viewing/Owner Meeting/Verification badge)
 * - Status (colored badge, distinct color per pipeline stage)
 * - Scheduled Date
 * - Actions ("Review" button for Submitted visits, "View Details")
 *
 * "+ Assign Visit" form:
 * - Agent (dropdown, Agent role only)
 * - Property (dropdown of existing mock properties)
 * - Client/Party (dropdown)
 * - Purpose (Property Viewing/Owner Meeting/Verification dropdown)
 * - Planned Date/Time
 * - Instructions (textarea)
 * - Checklist Template (Standard Residential / Standard Commercial / Owner Meeting dropdown)
 * - Save & Cancel buttons
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Plus, ArrowLeft, MapPin, Calendar, Clock,
  UserCheck, Building2, ClipboardCheck, CheckCircle2, AlertCircle,
  Eye, FileText, ChevronRight, Sparkles, X, Play
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { VisitExecutionModal } from '@/components/visits/VisitExecutionModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  formatDateTime, formatDate,
} from '@/lib/formatters'
import {
  MOCK_VISITS, MOCK_USERS, MOCK_PROPERTIES, MOCK_PARTIES,
  type VisitRow,
} from '@/lib/mockData'

const VISIT_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Assigned', label: 'Assigned' },
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'En Route', label: 'En Route' },
  { value: 'Arrived', label: 'Arrived' },
  { value: 'Visit Started', label: 'Visit Started' },
  { value: 'Visit Completed', label: 'Visit Completed' },
  { value: 'Submitted', label: 'Submitted (Needs Review)' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Cancelled', label: 'Cancelled' },
] as const

const PURPOSE_OPTIONS = [
  { value: 'Property Viewing', label: 'Property Viewing' },
  { value: 'Owner Meeting', label: 'Owner Meeting' },
  { value: 'Verification', label: 'Verification' },
] as const

const TEMPLATE_OPTIONS = [
  { value: 'Standard Residential', label: 'Standard Residential' },
  { value: 'Standard Commercial', label: 'Standard Commercial' },
  { value: 'Owner Meeting', label: 'Owner Meeting' },
] as const

// ── Distinct ShortLoc Badge ───────────────────────────────────────────────────

function ShortLocBadge({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200">
      <MapPin size={11} className="text-indigo-600 shrink-0" />
      <span>{code}</span>
    </span>
  )
}

// ── Status Color Helper ───────────────────────────────────────────────────────

function getVisitStatusBadge(status: VisitRow['status']) {
  switch (status) {
    case 'Assigned':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'Accepted':
      return 'bg-sky-100 text-sky-700 border-sky-200'
    case 'Scheduled':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'En Route':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200'
    case 'Arrived':
      return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'Visit Started':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Visit Completed':
      return 'bg-teal-100 text-teal-800 border-teal-200'
    case 'Submitted':
      return 'bg-orange-100 text-orange-800 border-orange-300 font-bold'
    case 'Approved':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Rejected':
      return 'bg-rose-100 text-rose-800 border-rose-200'
    case 'Cancelled':
      return 'bg-slate-100 text-slate-500 border-slate-200'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function getPurposeBadge(purpose: VisitRow['purpose']) {
  switch (purpose) {
    case 'Property Viewing':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Owner Meeting':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'Verification':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

export default function VisitsPage() {
  const [visits, setVisits] = useState<VisitRow[]>([...MOCK_VISITS])
  const [view, setView] = useState<'list' | 'assign'>('list')
  const [selectedVisit, setSelectedVisit] = useState<VisitRow | null>(null)
  const [executingVisit, setExecutingVisit] = useState<VisitRow | null>(null)

  // Filters (search handled by DataTable)
  const [fStatus, setFStatus] = useState<string>('')
  const [fAgent, setFAgent] = useState<string>('')

  // Form State
  const [formAgentId, setFormAgentId] = useState<string>('u3')
  const [formPropertyId, setFormPropertyId] = useState<string>('P-1001')
  const [formClientId, setFormClientId] = useState<string>('p4')
  const [formPurpose, setFormPurpose] = useState<VisitRow['purpose']>('Property Viewing')
  const [formDate, setFormDate] = useState<string>('2026-09-20T11:00')
  const [formInstructions, setFormInstructions] = useState<string>('')
  const [formTemplate, setFormTemplate] = useState<string>('Standard Residential')

  // ── Agents Only (FILTER OUT OFFICE EXECUTIVE & ADMIN) ────────────────────────
  // Prompt instruction: "Agent dropdown (mock Agent-role staff only — do NOT include Office Executive users in this list)"

  const agentUsers = useMemo(() => {
    return MOCK_USERS.filter((u) => u.role === 'AGENT')
  }, [])

  // ── Filtered Visits (page-specific filters only — search in DataTable) ───────

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      if (fStatus && v.status !== fStatus) return false
      if (fAgent && v.agent_name !== fAgent) return false
      return true
    })
  }, [visits, fStatus, fAgent])

  // ── Assign Form Handlers ────────────────────────────────────────────────────

  const resetForm = () => {
    setFormAgentId('u3')
    setFormPropertyId('P-1001')
    setFormClientId('p4')
    setFormPurpose('Property Viewing')
    setFormDate('2026-09-20T11:00')
    setFormInstructions('')
    setFormTemplate('Standard Residential')
  }

  const handleSaveVisit = (e: React.FormEvent) => {
    e.preventDefault()

    const agent = agentUsers.find((u) => u.id === formAgentId)
    const property = MOCK_PROPERTIES.find((p) => p.id === formPropertyId)
    const client = MOCK_PARTIES.find((p) => p.id === formClientId)

    const newVisit: VisitRow = {
      id: `V-${Date.now().toString().slice(-3)}`,
      property_id: formPropertyId,
      property_short_loc: property?.short_loc || '01-Schm140_Mayank',
      client_id: formClientId,
      client_name: client?.name || 'Client',
      agent_id: formAgentId,
      agent_name: agent?.name || 'Ravi Mehta',
      purpose: formPurpose,
      status: 'Assigned',
      scheduled_date: formDate ? new Date(formDate).toISOString() : new Date().toISOString(),
      instructions: formInstructions.trim() || undefined,
      checklist_template: formTemplate,
      created_at: new Date().toISOString(),
    }

    setVisits([newVisit, ...visits])
    resetForm()
    setView('list')
  }

  // ── Column Definitions for DataTable ────────────────────────────────────────

  const visitColumns: ColumnDef<VisitRow>[] = useMemo(
    () => [
      {
        key: 'id',
        header: 'Visit ID',
        sortValue: (v) => v.id,
        render: (v) => (
          <span className="font-mono text-xs font-semibold text-slate-800 whitespace-nowrap">
            {v.id}
          </span>
        ),
      },
      {
        key: 'property',
        header: 'Property',
        sortValue: (v) => v.property_short_loc,
        render: (v) => (
          <div className="space-y-0.5 whitespace-nowrap">
            <ShortLocBadge code={v.property_short_loc} />
            <div className="text-[10px] font-mono text-slate-400">
              ID: {v.property_id}
            </div>
          </div>
        ),
      },
      {
        key: 'client',
        header: 'Client / Party',
        sortValue: (v) => v.client_name,
        render: (v) => (
          <span className="font-semibold text-slate-900 whitespace-nowrap">
            {v.client_name}
          </span>
        ),
      },
      {
        key: 'agent',
        header: 'Assigned Agent',
        sortValue: (v) => v.agent_name,
        render: (v) => (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 whitespace-nowrap">
            <UserCheck size={13} className="text-slate-400" />
            {v.agent_name}
          </span>
        ),
      },
      {
        key: 'purpose',
        header: 'Purpose',
        sortValue: (v) => v.purpose,
        render: (v) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border whitespace-nowrap ${getPurposeBadge(
              v.purpose
            )}`}
          >
            {v.purpose}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortValue: (v) => v.status,
        render: (v) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${getVisitStatusBadge(
              v.status
            )}`}
          >
            {v.status}
          </span>
        ),
      },
      {
        key: 'scheduled_date',
        header: 'Scheduled Date',
        sortValue: (v) => (v.scheduled_date ? new Date(v.scheduled_date).getTime() : 0),
        render: (v) => (
          <span className="text-xs text-slate-600 whitespace-nowrap">
            {formatDateTime(v.scheduled_date)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        sortable: false,
        render: (v) => {
          const isSubmitted = v.status === 'Submitted'
          return (
            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
              {isSubmitted ? (
                <Link href={`/visits/review?id=${v.id}`}>
                  <Button
                    size="sm"
                    className="h-7 px-2.5 text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-xs font-bold"
                  >
                    <ClipboardCheck size={12} className="mr-1" />
                    Review
                  </Button>
                </Link>
              ) : (
                <div className="flex items-center gap-1.5 justify-end">
                  {v.status !== 'Approved' &&
                    v.status !== 'Rejected' &&
                    v.status !== 'Cancelled' && (
                      <Button
                        size="sm"
                        onClick={() => setExecutingVisit(v)}
                        className="h-7 px-2 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                      >
                        <Play size={11} className="mr-1 fill-current" />
                        Arrival
                      </Button>
                    )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedVisit(v)}
                    className="h-7 px-2.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
                  >
                    View
                  </Button>
                </div>
              )}
            </div>
          )
        },
      },
    ],
    []
  )

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* ================================================================= */}
        {/* VIEW 1: VISITS LIST VIEW                                          */}
        {/* ================================================================= */}
        {view === 'list' && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
                  <MapPin size={22} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Field Visits
                  </h1>
                  <p className="text-sm text-slate-500">
                    Dispatch field agents, track real-time inspection stages, and review visit submissions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Link href="/visits/review">
                  <Button variant="outline" className="text-slate-700 border-slate-200">
                    <ClipboardCheck size={16} className="mr-1.5 text-indigo-600" />
                    Review Queue
                    {visits.filter((v) => v.status === 'Submitted').length > 0 && (
                      <Badge className="ml-2 bg-orange-500 text-white font-bold text-[10px] px-1.5 py-0">
                        {visits.filter((v) => v.status === 'Submitted').length}
                      </Badge>
                    )}
                  </Button>
                </Link>

                <Button
                  onClick={() => setView('assign')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
                >
                  <Plus size={16} className="mr-1.5" />
                  Assign Visit
                </Button>
              </div>
            </div>

            {/* DataTable with sorting, search, and page-specific filters */}
            <DataTable<VisitRow>
              columns={visitColumns}
              data={filteredVisits}
              totalCount={visits.length}
              rowKey={(v) => v.id}
              rowClassName={(v) => (v.status === 'Submitted' ? 'bg-orange-50/20' : '')}
              searchFields={[
                (v) => v.id,
                (v) => v.property_short_loc,
                (v) => v.client_name,
                (v) => v.agent_name,
              ]}
              searchPlaceholder="Search by ID, property, client, or agent…"
              hasActiveFilters={!!fStatus || !!fAgent}
              onClearFilters={() => {
                setFStatus('')
                setFAgent('')
              }}
              emptyIcon={<MapPin className="h-12 w-12" />}
              emptyTitle="No visits found"
              emptyDescription="No visits match the current filter parameters."
              filterSlot={
                <>
                  <Select
                    value={fStatus}
                    onChange={(e) => setFStatus(e.target.value)}
                    className="h-8 text-sm min-w-[170px]"
                  >
                    {VISIT_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={fAgent}
                    onChange={(e) => setFAgent(e.target.value)}
                    className="h-8 text-sm min-w-[170px]"
                  >
                    <option value="">All Field Agents</option>
                    {agentUsers.map((agent) => (
                      <option key={agent.id} value={agent.name}>
                        {agent.name}
                      </option>
                    ))}
                  </Select>
                </>
              }
            />
          </>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: ASSIGN VISIT FORM                                         */}
        {/* ================================================================= */}
        {view === 'assign' && (
          <div className="space-y-6">
            {/* Top Navigation Bar */}
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
                Back to Visits List
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
                  form="assign-visit-form"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  Confirm &amp; Assign Visit
                </Button>
              </div>
            </div>

            {/* Form Card */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      Assign Field Inspection / Viewing
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500">
                      Dispatch a field agent to a target inventory property for client inspection or verification
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <form id="assign-visit-form" onSubmit={handleSaveVisit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Agent (Dropdown, Agent role only!) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="agent" className="text-xs font-semibold text-slate-700">
                        Field Agent <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        id="agent"
                        value={formAgentId}
                        onChange={(e) => setFormAgentId(e.target.value)}
                        required
                        className="h-10 text-sm"
                      >
                        {agentUsers.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name} (Field Agent)
                          </option>
                        ))}
                      </Select>
                      <p className="text-[11px] text-slate-400">
                        Shows field agents available for dispatch
                      </p>
                    </div>

                    {/* Property (Dropdown of existing mock properties) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="property" className="text-xs font-semibold text-slate-700">
                        Property (Inventory) <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        id="property"
                        value={formPropertyId}
                        onChange={(e) => setFormPropertyId(e.target.value)}
                        required
                        className="h-10 text-sm font-mono"
                      >
                        {MOCK_PROPERTIES.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.id}] {p.short_loc} — {p.category}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Client / Party (Dropdown) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="client" className="text-xs font-semibold text-slate-700">
                        Client / Party <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        id="client"
                        value={formClientId}
                        onChange={(e) => setFormClientId(e.target.value)}
                        required
                        className="h-10 text-sm"
                      >
                        {MOCK_PARTIES.map((party) => (
                          <option key={party.id} value={party.id}>
                            {party.name} ({party.mobile})
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Purpose (Dropdown) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="purpose" className="text-xs font-semibold text-slate-700">
                        Visit Purpose <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        id="purpose"
                        value={formPurpose}
                        onChange={(e) => setFormPurpose(e.target.value as VisitRow['purpose'])}
                        required
                        className="h-10 text-sm"
                      >
                        {PURPOSE_OPTIONS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Planned Date / Time */}
                    <div className="space-y-1.5">
                      <Label htmlFor="planned_date" className="text-xs font-semibold text-slate-700">
                        Planned Date &amp; Time <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="planned_date"
                        type="datetime-local"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        required
                        className="h-10 text-sm"
                      />
                    </div>

                    {/* Checklist Template (Dropdown) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="template" className="text-xs font-semibold text-slate-700">
                        Checklist Template <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        id="template"
                        value={formTemplate}
                        onChange={(e) => setFormTemplate(e.target.value)}
                        required
                        className="h-10 text-sm"
                      >
                        {TEMPLATE_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-1.5">
                    <Label htmlFor="instructions" className="text-xs font-semibold text-slate-700">
                      Field Instructions &amp; Notes
                    </Label>
                    <Textarea
                      id="instructions"
                      value={formInstructions}
                      onChange={(e) => setFormInstructions(e.target.value)}
                      placeholder="e.g. Meet client at gate, collect key from guard, take clear photos of meter readings..."
                      rows={3}
                      className="text-sm"
                    />
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
                      Assign Visit
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* View Details Modal */}
        {selectedVisit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Visit Summary — {selectedVisit.id}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(selectedVisit.scheduled_date)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVisit(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Property</span>
                    <div className="mt-1 font-semibold text-slate-900">{selectedVisit.property_short_loc}</div>
                    <div className="text-slate-400 font-mono text-[10px]">ID: {selectedVisit.property_id}</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Status</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getVisitStatusBadge(selectedVisit.status)}`}>
                        {selectedVisit.status}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Client Party</span>
                    <p className="font-semibold text-slate-900 mt-1">{selectedVisit.client_name}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Agent</span>
                    <p className="font-semibold text-slate-900 mt-1">{selectedVisit.agent_name}</p>
                  </div>
                </div>

                {selectedVisit.instructions && (
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Instructions</span>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700">
                      {selectedVisit.instructions}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedVisit(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Live GPS Visit Execution Modal */}
        {executingVisit && (
          <VisitExecutionModal
            visit={executingVisit}
            onClose={() => setExecutingVisit(null)}
            onStatusChange={(id, status) => {
              setVisits((prev) =>
                prev.map((v) => (v.id === id ? { ...v, status } : v))
              )
            }}
          />
        )}
      </div>
    </AppLayout>
  )
}

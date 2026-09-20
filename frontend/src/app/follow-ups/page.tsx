'use client'

/**
 * Follow-ups Page — Module 5
 *
 * Filter bar:
 * - Status dropdown (Pending, Completed, Rescheduled, Cancelled, Overdue, No Response)
 * - Priority dropdown (Low, Medium, High)
 * - Responsible dropdown (list of mock staff names)
 * - Text search
 * - "+ New Follow-up" button
 *
 * Table columns:
 * - Client/Party Name
 * - Type (Requirement/Lead/Opportunity — small badge)
 * - Purpose
 * - Priority (colored badge)
 * - Due Date (with overdue indicator if past due)
 * - Status (colored badge)
 * - Responsible (staff name)
 * - Actions ("Mark Done" button and "Reschedule" button)
 *
 * "+ New Follow-up" form:
 * - Linked Record (dropdown of Requirements, Leads, Opportunities from mockData)
 * - Date
 * - Purpose
 * - Priority (Low/Medium/High)
 * - Responsible (dropdown of staff)
 * - Expected Outcome (textarea)
 * - Save & Cancel buttons
 */

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Plus, ArrowLeft, Bell, Calendar, CheckCircle2,
  Clock, AlertCircle, UserCheck,
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
  formatDateTime, formatDate, statusClasses, priorityClasses,
} from '@/lib/formatters'
import {
  MOCK_FOLLOW_UPS, MOCK_USERS, MOCK_LEADS, MOCK_REQUIREMENTS,
  MOCK_OPPORTUNITIES_LIST, type FollowUpRow,
} from '@/lib/mockData'

// ── Dropdown Constants ────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'RESCHEDULED', label: 'Rescheduled' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'NO_RESPONSE', label: 'No Response' },
] as const

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priority' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
] as const

function FollowUpsContent() {
  const searchParams = useSearchParams()
  const initialStatus = (searchParams.get('status') || '').toUpperCase()
  const initialSearch = searchParams.get('search') || ''

  const [followUps, setFollowUps] = useState<FollowUpRow[]>([...MOCK_FOLLOW_UPS])
  const [view, setView] = useState<'list' | 'add'>('list')

  // Filters (search handled by DataTable)
  const [fStatus, setFStatus] = useState<string>(initialStatus)
  const [fPriority, setFPriority] = useState<string>('')
  const [fResponsible, setFResponsible] = useState<string>('')

  useEffect(() => {
    if (initialStatus) {
      setFStatus(initialStatus)
    }
  }, [initialStatus])

  // Add Form State
  const [formLinkedRecord, setFormLinkedRecord] = useState<string>('L-1001')
  const [formDueDate, setFormDueDate] = useState<string>('2026-09-20T10:00')
  const [formPurpose, setFormPurpose] = useState<string>('')
  const [formPriority, setFormPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [formResponsibleId, setFormResponsibleId] = useState<string>('u2')
  const [formExpectedOutcome, setFormExpectedOutcome] = useState<string>('')

  // ── Unified Linked Record Options ───────────────────────────────────────────

  const linkedRecords = useMemo(() => {
    const records: { id: string; type: 'Lead' | 'Requirement' | 'Opportunity'; label: string; clientName: string }[] = []

    // Leads
    for (const lead of MOCK_LEADS) {
      records.push({
        id: lead.id,
        type: 'Lead',
        label: `[Lead] ${lead.id} — ${lead.party_name} (${lead.lead_type})`,
        clientName: lead.party_name,
      })
    }

    // Requirements
    for (const req of MOCK_REQUIREMENTS) {
      records.push({
        id: req.id,
        type: 'Requirement',
        label: `[Requirement] ${req.id} — ${req.client_name} (${req.intent})`,
        clientName: req.client_name,
      })
    }

    // Opportunities
    for (const opp of MOCK_OPPORTUNITIES_LIST) {
      records.push({
        id: opp.id,
        type: 'Opportunity',
        label: `[Opportunity] ${opp.id} — ${opp.client_name} (${opp.stage})`,
        clientName: opp.client_name,
      })
    }

    return records
  }, [])

  // ── Filtered List (page-specific filters only — search in DataTable) ───────

  const filteredFollowUps = useMemo(() => {
    return followUps.filter((item) => {
      if (fStatus && item.status.toUpperCase() !== fStatus.toUpperCase()) return false
      if (fPriority && item.priority !== fPriority) return false
      if (fResponsible && item.responsible_name !== fResponsible) return false
      return true
    })
  }, [followUps, fStatus, fPriority, fResponsible])

  // ── Distinct Staff List for filter ──────────────────────────────────────────

  const staffOptions = useMemo(() => {
    return MOCK_USERS.filter((u) => u.role !== 'CLIENT').map((u) => u.name)
  }, [])

  // ── Action Handlers ─────────────────────────────────────────────────────────

  const handleMarkDone = (id: string) => {
    setFollowUps((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'COMPLETED' } : item))
    )
  }

  const handleReschedule = (id: string) => {
    setFollowUps((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'RESCHEDULED' } : item))
    )
  }

  const resetForm = () => {
    setFormLinkedRecord('L-1001')
    setFormDueDate('2026-09-20T10:00')
    setFormPurpose('')
    setFormPriority('MEDIUM')
    setFormResponsibleId('u2')
    setFormExpectedOutcome('')
  }

  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault()

    const selectedRec = linkedRecords.find((r) => r.id === formLinkedRecord)
    const responsibleUser = MOCK_USERS.find((u) => u.id === formResponsibleId)

    const newFollowUp: FollowUpRow = {
      id: `FU-${Date.now().toString().slice(-4)}`,
      client_name: selectedRec?.clientName || 'Client Contact',
      entity_type: selectedRec?.type || 'Lead',
      entity_id: formLinkedRecord,
      purpose: formPurpose.trim() || 'Client follow-up call',
      priority: formPriority,
      due_date: formDueDate ? new Date(formDueDate).toISOString() : new Date().toISOString(),
      status: 'PENDING',
      responsible_name: responsibleUser?.name || 'Neha Kapoor',
      responsible_id: formResponsibleId,
      expected_outcome: formExpectedOutcome.trim() || null,
      created_at: new Date().toISOString(),
    }

    setFollowUps([newFollowUp, ...followUps])
    resetForm()
    setView('list')
  }

  // ── Helper: Entity Badge Styling ────────────────────────────────────────────

  const renderTypeBadge = (type: 'Requirement' | 'Lead' | 'Opportunity' | string) => {
    switch (type) {
      case 'Lead':
        return (
          <Badge variant="secondary" className="bg-sky-50 text-sky-700 border-sky-200 font-semibold text-[11px] px-2 py-0.5">
            Lead
          </Badge>
        )
      case 'Requirement':
        return (
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold text-[11px] px-2 py-0.5">
            Requirement
          </Badge>
        )
      case 'Opportunity':
        return (
          <Badge variant="secondary" className="bg-amber-50 text-amber-800 border-amber-200 font-semibold text-[11px] px-2 py-0.5">
            Opportunity
          </Badge>
        )
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  // ── Column Definitions for DataTable ────────────────────────────────────────

  const followUpColumns: ColumnDef<FollowUpRow>[] = [
    {
      key: 'client',
      header: 'Client / Party',
      sortValue: (r) => r.client_name,
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-900">{r.client_name}</div>
          <span className="text-[11px] font-mono text-slate-400 font-normal">Ref: {r.entity_id}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortValue: (r) => r.entity_type,
      render: (r) => renderTypeBadge(r.entity_type),
    },
    {
      key: 'purpose',
      header: 'Purpose',
      className: 'min-w-[200px]',
      sortValue: (r) => r.purpose,
      render: (r) => (
        <div>
          <p className="text-slate-800 font-medium text-xs line-clamp-2">{r.purpose}</p>
          {r.expected_outcome && (
            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs" title={r.expected_outcome}>
              Outcome: {r.expected_outcome}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortValue: (r) => ['LOW', 'MEDIUM', 'HIGH'].indexOf(r.priority),
      render: (r) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${priorityClasses(r.priority)}`}>
          {r.priority}
        </span>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      sortValue: (r) => r.due_date ? new Date(r.due_date).getTime() : 0,
      render: (r) => {
        const isOverdue = r.status === 'OVERDUE'
        return (
          <div className="flex items-center gap-1.5 text-xs">
            {isOverdue ? (
              <span className="text-red-700 font-bold flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                <AlertCircle size={12} className="text-red-600" />
                {formatDateTime(r.due_date)}
              </span>
            ) : (
              <span className="text-slate-600 flex items-center gap-1">
                <Calendar size={12} className="text-slate-400" />
                {formatDateTime(r.due_date)}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.status,
      render: (r) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClasses(r.status)}`}>
          {r.status.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'responsible',
      header: 'Responsible',
      sortValue: (r) => r.responsible_name,
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
          <UserCheck size={13} className="text-slate-400" />
          {r.responsible_name}
        </span>
      ),
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
            disabled={r.status === 'COMPLETED'}
            onClick={() => handleMarkDone(r.id)}
            className={`h-7 px-2.5 text-xs font-medium ${
              r.status === 'COMPLETED'
                ? 'text-slate-400 border-slate-200 bg-slate-50'
                : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 size={12} className="mr-1" />
            Mark Done
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={r.status === 'COMPLETED'}
            onClick={() => handleReschedule(r.id)}
            className="h-7 px-2.5 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-50"
          >
            <Clock size={12} className="mr-1 text-slate-400" />
            Reschedule
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
        {/* VIEW 1: FOLLOW-UPS LIST                                           */}
        {/* ================================================================= */}
        {view === 'list' && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
                    <Bell size={22} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Follow-up Queue
                    </h1>
                    <p className="text-sm text-slate-500">
                      Manage client reminders, action items, and overdue schedules
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setView('add')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
              >
                <Plus size={16} className="mr-1.5" />
                New Follow-up
              </Button>
            </div>

            {/* DataTable with sorting, search, and page-specific filters */}
            <DataTable<FollowUpRow>
              columns={followUpColumns}
              data={filteredFollowUps}
              totalCount={followUps.length}
              initialSearch={initialSearch}
              rowKey={(r) => r.id}
              rowClassName={(r) => r.status === 'OVERDUE' ? 'bg-red-50/20' : ''}
              searchFields={[
                (r) => r.client_name,
                (r) => r.purpose,
                (r) => r.entity_id,
                (r) => r.responsible_name,
              ]}
              searchPlaceholder="Search by client, purpose, ID…"
              hasActiveFilters={!!fStatus || !!fPriority || !!fResponsible}
              onClearFilters={() => { setFStatus(''); setFPriority(''); setFResponsible('') }}
              emptyIcon={<Bell className="h-12 w-12" />}
              emptyTitle="No follow-ups found"
              emptyDescription="No follow-up records match the active filter criteria."
              filterSlot={
                <>
                  <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="h-8 text-sm min-w-[140px]">
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                  <Select value={fPriority} onChange={(e) => setFPriority(e.target.value)} className="h-8 text-sm min-w-[130px]">
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                  <Select value={fResponsible} onChange={(e) => setFResponsible(e.target.value)} className="h-8 text-sm min-w-[150px]">
                    <option value="">All Staff</option>
                    {staffOptions.map((staff) => (
                      <option key={staff} value={staff}>{staff}</option>
                    ))}
                  </Select>
                </>
              }
            />
          </>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: ADD FOLLOW-UP FORM                                        */}
        {/* ================================================================= */}
        {view === 'add' && (
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
                Back to Follow-up Queue
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
                  form="add-followup-form"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  Save Follow-up
                </Button>
              </div>
            </div>

            {/* Form Card */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
                    <Bell size={22} />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      Schedule Client Follow-up
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500">
                      Create an actionable reminder linked to a specific lead, requirement, or opportunity
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <form id="add-followup-form" onSubmit={handleSaveFollowUp} className="space-y-6">
                  {/* Linked Record Dropdown */}
                  <div className="space-y-1.5">
                    <Label htmlFor="linked_record" className="text-xs font-semibold text-slate-700">
                      Linked Record <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      id="linked_record"
                      value={formLinkedRecord}
                      onChange={(e) => setFormLinkedRecord(e.target.value)}
                      required
                      className="h-10 text-sm"
                    >
                      <optgroup label="Leads">
                        {linkedRecords
                          .filter((r) => r.type === 'Lead')
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.label}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Requirements">
                        {linkedRecords
                          .filter((r) => r.type === 'Requirement')
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.label}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Opportunities">
                        {linkedRecords
                          .filter((r) => r.type === 'Opportunity')
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.label}
                            </option>
                          ))}
                      </optgroup>
                    </Select>
                    <p className="text-[11px] text-slate-400">
                      Associates this reminder directly with the client&apos;s history
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Due Date */}
                    <div className="space-y-1.5">
                      <Label htmlFor="due_date" className="text-xs font-semibold text-slate-700">
                        Due Date &amp; Time <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="due_date"
                        type="datetime-local"
                        value={formDueDate}
                        onChange={(e) => setFormDueDate(e.target.value)}
                        required
                        className="h-10 text-sm"
                      />
                    </div>

                    {/* Priority */}
                    <div className="space-y-1.5">
                      <Label htmlFor="priority" className="text-xs font-semibold text-slate-700">
                        Priority Level <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        id="priority"
                        value={formPriority}
                        onChange={(e) => setFormPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                        required
                        className="h-10 text-sm"
                      >
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </Select>
                    </div>

                    {/* Responsible Staff */}
                    <div className="space-y-1.5">
                      <Label htmlFor="responsible" className="text-xs font-semibold text-slate-700">
                        Responsible Staff <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        id="responsible"
                        value={formResponsibleId}
                        onChange={(e) => setFormResponsibleId(e.target.value)}
                        required
                        className="h-10 text-sm"
                      >
                        {MOCK_USERS.filter((u) => u.role !== 'CLIENT').map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role.replace(/_/g, ' ')})
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* Purpose */}
                  <div className="space-y-1.5">
                    <Label htmlFor="purpose" className="text-xs font-semibold text-slate-700">
                      Purpose / Action Item <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="purpose"
                      type="text"
                      value={formPurpose}
                      onChange={(e) => setFormPurpose(e.target.value)}
                      placeholder="e.g. Discuss revised pricing, coordinate property inspection, follow-up on agreement draft..."
                      required
                      className="h-10 text-sm"
                    />
                  </div>

                  {/* Expected Outcome */}
                  <div className="space-y-1.5">
                    <Label htmlFor="expected_outcome" className="text-xs font-semibold text-slate-700">
                      Expected Outcome (Optional)
                    </Label>
                    <Textarea
                      id="expected_outcome"
                      value={formExpectedOutcome}
                      onChange={(e) => setFormExpectedOutcome(e.target.value)}
                      placeholder="e.g. Obtain confirmed budget approval, arrange weekend site visit, or confirm counter-offer..."
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
                      Save Follow-up
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default function FollowUpsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
          Loading Follow-ups…
        </div>
      }
    >
      <FollowUpsContent />
    </Suspense>
  )
}


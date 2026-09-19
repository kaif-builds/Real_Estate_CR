'use client'

/**
 * Tasks Page — Module 7
 *
 * General internal work items — distinct from Follow-ups (client-contact-specific).
 *
 * Features:
 * - View switcher: "List" vs "Board" toggle next to "+ New Task"
 * - List view:
 *   Table columns: Task Title, Type (Internal/Verification/Documentation/Admin/Other badge),
 *   Assigned To, Due Date, Priority (badge), Status (To Do/In Progress/Done/Overdue),
 *   Linked Record (optional small link-styled tag, e.g. "Property P-1005"), Actions.
 * - Board view:
 *   3-column Kanban (To Do / In Progress / Done) with the same tasks as cards.
 * - "+ New Task" form:
 *   Title, Type (dropdown), Assigned To (dropdown of mock staff), Due Date,
 *   Priority (dropdown), Linked Record (dropdown of existing records), Description (textarea).
 *   Save/Cancel buttons.
 */

import { useMemo, useState } from 'react'
import {
  Plus, Search, RefreshCw, ArrowLeft, CheckSquare, LayoutGrid,
  List as ListIcon, Calendar, Clock, AlertTriangle, UserCheck,
  Building2, ClipboardList, Tag, Sparkles, X, CheckCircle2
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
  formatDate, formatDateTime, priorityClasses,
} from '@/lib/formatters'
import {
  MOCK_TASKS, MOCK_USERS, MOCK_PROPERTIES, MOCK_REQUIREMENTS,
  MOCK_LEADS, MOCK_OPPORTUNITIES_LIST, type TaskRow,
} from '@/lib/mockData'

const TASK_TYPE_OPTIONS = [
  { value: 'Internal', label: 'Internal' },
  { value: 'Verification', label: 'Verification' },
  { value: 'Documentation', label: 'Documentation' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Other', label: 'Other' },
] as const

const PRIORITY_OPTIONS = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
] as const

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([...MOCK_TASKS])
  const [activeTab, setActiveTab] = useState<'list' | 'board'>('list')
  const [viewMode, setViewMode] = useState<'view' | 'create'>('view')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [fType, setFType] = useState('')
  const [fPriority, setFPriority] = useState('')
  const [fAssignee, setFAssignee] = useState('')

  // Create Form State
  const [formTitle, setFormTitle] = useState('')
  const [formType, setFormType] = useState<TaskRow['task_type']>('Internal')
  const [formAssigneeId, setFormAssigneeId] = useState('u2')
  const [formDueDate, setFormDueDate] = useState('2026-09-22T12:00')
  const [formPriority, setFormPriority] = useState<TaskRow['priority']>('MEDIUM')
  const [formLinkedRecord, setFormLinkedRecord] = useState('')
  const [formDescription, setFormDescription] = useState('')

  // ── Unified Linked Record Dropdown Options ───────────────────────────────────

  const linkedRecordOptions = useMemo(() => {
    const records: { id: string; label: string; type: string }[] = [
      { id: '', label: 'None / Standalone Task', type: '' },
    ]

    // Properties
    for (const p of MOCK_PROPERTIES) {
      records.push({
        id: `Property:${p.id}`,
        label: `Property ${p.id} — ${p.short_loc}`,
        type: 'Property',
      })
    }

    // Requirements
    for (const r of MOCK_REQUIREMENTS) {
      records.push({
        id: `Requirement:${r.id}`,
        label: `Requirement ${r.id} — ${r.client_name}`,
        type: 'Requirement',
      })
    }

    // Opportunities
    for (const opp of MOCK_OPPORTUNITIES_LIST) {
      records.push({
        id: `Opportunity:${opp.id}`,
        label: `Opportunity ${opp.id} — ${opp.client_name}`,
        type: 'Opportunity',
      })
    }

    // Leads
    for (const l of MOCK_LEADS) {
      records.push({
        id: `Lead:${l.id}`,
        label: `Lead ${l.id} — ${l.party_name}`,
        type: 'Lead',
      })
    }

    return records
  }, [])

  // ── Filtered Tasks ──────────────────────────────────────────────────────────

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (fType && task.task_type !== fType) return false
      if (fPriority && task.priority !== fPriority) return false
      if (fAssignee && task.assigned_to_name !== fAssignee) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = task.title.toLowerCase().includes(q)
        const matchDesc = (task.description || '').toLowerCase().includes(q)
        const matchAssignee = task.assigned_to_name.toLowerCase().includes(q)
        const matchLinked = (task.linked_record_label || '').toLowerCase().includes(q)
        if (!matchTitle && !matchDesc && !matchAssignee && !matchLinked) return false
      }

      return true
    })
  }, [tasks, fType, fPriority, fAssignee, searchQuery])

  // ── Staff Assignee Options ──────────────────────────────────────────────────

  const staffOptions = useMemo(() => {
    return MOCK_USERS.filter((u) => u.role !== 'CLIENT').map((u) => u.name)
  }, [])

  // ── Task Type Badge Helper ──────────────────────────────────────────────────

  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'Verification':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Verification
          </span>
        )
      case 'Documentation':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Documentation
          </span>
        )
      case 'Internal':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Internal
          </span>
        )
      case 'Admin':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Admin
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {type}
          </span>
        )
    }
  }

  // ── Task Status Badge Helper ────────────────────────────────────────────────

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'TODO':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            To Do
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
            In Progress
          </span>
        )
      case 'DONE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
            Done
          </span>
        )
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
            Overdue
          </span>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // ── Task Actions ────────────────────────────────────────────────────────────

  const updateTaskStatus = (taskId: string, newStatus: TaskRow['status']) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )
  }

  // ── Create Task Handler ─────────────────────────────────────────────────────

  const resetForm = () => {
    setFormTitle('')
    setFormType('Internal')
    setFormAssigneeId('u2')
    setFormDueDate('2026-09-22T12:00')
    setFormPriority('MEDIUM')
    setFormLinkedRecord('')
    setFormDescription('')
  }

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault()

    const assignedUser = MOCK_USERS.find((u) => u.id === formAssigneeId)

    let linkedType: TaskRow['linked_record_type'] = null
    let linkedId: string | null = null
    let linkedLabel: string | null = null

    if (formLinkedRecord) {
      const [type, id] = formLinkedRecord.split(':')
      linkedType = type as TaskRow['linked_record_type']
      linkedId = id
      linkedLabel = `${type} ${id}`
    }

    const newTask: TaskRow = {
      id: `T-${Date.now().toString().slice(-3)}`,
      title: formTitle.trim() || 'Untitled Task',
      task_type: formType,
      assigned_to_name: assignedUser?.name || 'Staff Member',
      assigned_to_id: formAssigneeId,
      due_date: formDueDate ? new Date(formDueDate).toISOString() : new Date().toISOString(),
      priority: formPriority,
      status: 'TODO',
      linked_record_type: linkedType,
      linked_record_id: linkedId,
      linked_record_label: linkedLabel,
      description: formDescription.trim() || undefined,
      created_at: new Date().toISOString(),
    }

    setTasks([newTask, ...tasks])
    resetForm()
    setViewMode('view')
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* ================================================================= */}
        {/* VIEW: MAIN TASKS DASHBOARD (LIST / BOARD)                         */}
        {/* ================================================================= */}
        {viewMode === 'view' && (
          <>
            {/* Header & View Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
                  <CheckSquare size={22} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tasks Management</h1>
                  <p className="text-sm text-slate-500">
                    Track internal verification, documentation, and operational workloads
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* List / Board Toggle */}
                <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      activeTab === 'list'
                        ? 'bg-white text-indigo-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ListIcon size={14} />
                    <span>List</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('board')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      activeTab === 'board'
                        ? 'bg-white text-indigo-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid size={14} />
                    <span>Board</span>
                  </button>
                </div>

                {/* + New Task Button */}
                <Button
                  onClick={() => setViewMode('create')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
                >
                  <Plus size={16} className="mr-1.5" />
                  New Task
                </Button>
              </div>
            </div>

            {/* Filter Bar */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardContent className="p-4 flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks, descriptions, linked records..."
                    className="pl-9 text-sm h-9"
                  />
                </div>

                {/* Type Filter */}
                <div className="w-full sm:w-auto min-w-[150px]">
                  <Select
                    value={fType}
                    onChange={(e) => setFType(e.target.value)}
                    className="h-9 text-sm"
                  >
                    <option value="">All Types</option>
                    {TASK_TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Priority Filter */}
                <div className="w-full sm:w-auto min-w-[130px]">
                  <Select
                    value={fPriority}
                    onChange={(e) => setFPriority(e.target.value)}
                    className="h-9 text-sm"
                  >
                    <option value="">All Priority</option>
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Assignee Filter */}
                <div className="w-full sm:w-auto min-w-[150px]">
                  <Select
                    value={fAssignee}
                    onChange={(e) => setFAssignee(e.target.value)}
                    className="h-9 text-sm"
                  >
                    <option value="">All Assignees</option>
                    {staffOptions.map((staff) => (
                      <option key={staff} value={staff}>
                        {staff}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Reset Filters */}
                {(fType || fPriority || fAssignee || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFType('')
                      setFPriority('')
                      setFAssignee('')
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
                  Showing {filteredTasks.length} of {tasks.length} tasks
                </div>
              </CardContent>
            </Card>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* VIEW MODE 1: LIST VIEW                                        */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeTab === 'list' && (
              <Card className="border-slate-200/80 shadow-xs overflow-hidden">
                <CardContent className="p-0">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <CheckSquare className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                      <h3 className="text-base font-semibold text-slate-800">No tasks found</h3>
                      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                        No tasks match the active filters. Clear your filters or create a new internal task.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <th className="py-3 px-4">Task Title</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Assigned To</th>
                            <th className="py-3 px-4">Due Date</th>
                            <th className="py-3 px-4">Priority</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Linked Record</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredTasks.map((task) => (
                            <tr
                              key={task.id}
                              className="hover:bg-slate-50/80 transition-colors group"
                            >
                              {/* Task Title */}
                              <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs">
                                <div>{task.title}</div>
                                {task.description && (
                                  <p className="text-xs text-slate-400 font-normal line-clamp-1 mt-0.5" title={task.description}>
                                    {task.description}
                                  </p>
                                )}
                              </td>

                              {/* Type Badge */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {renderTypeBadge(task.task_type)}
                              </td>

                              {/* Assigned To */}
                              <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5 font-medium">
                                  <UserCheck size={13} className="text-slate-400" />
                                  {task.assigned_to_name}
                                </span>
                              </td>

                              {/* Due Date */}
                              <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 ${task.status === 'OVERDUE' ? 'text-red-700 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded' : 'text-slate-600'}`}>
                                  {task.status === 'OVERDUE' && <AlertTriangle size={12} className="text-red-600" />}
                                  {formatDate(task.due_date)}
                                </span>
                              </td>

                              {/* Priority Badge */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${priorityClasses(
                                    task.priority
                                  )}`}
                                >
                                  {task.priority}
                                </span>
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {renderStatusBadge(task.status)}
                              </td>

                              {/* Linked Record (Optional small link-styled tag) */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {task.linked_record_label ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-indigo-50 text-indigo-800 border border-indigo-200/80 hover:bg-indigo-100 transition-colors">
                                    <Tag size={10} className="text-indigo-600 shrink-0" />
                                    <span>{task.linked_record_label}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-xs">—</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {task.status !== 'DONE' ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateTaskStatus(task.id, 'DONE')}
                                      className="h-7 px-2.5 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                    >
                                      <CheckCircle2 size={12} className="mr-1" />
                                      Mark Done
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                                      className="h-7 px-2.5 text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
                                    >
                                      Reopen
                                    </Button>
                                  )}
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
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* VIEW MODE 2: 3-COLUMN KANBAN BOARD                            */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeTab === 'board' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1: TO DO */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100/90 border border-slate-200 font-semibold text-slate-800 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span>To Do</span>
                    </div>
                    <Badge variant="secondary" className="bg-white text-slate-700 text-xs font-bold">
                      {filteredTasks.filter((t) => t.status === 'TODO' || t.status === 'OVERDUE').length}
                    </Badge>
                  </div>

                  <div className="space-y-3 min-h-[300px]">
                    {filteredTasks
                      .filter((t) => t.status === 'TODO' || t.status === 'OVERDUE')
                      .map((task) => (
                        <Card key={task.id} className="border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              {renderTypeBadge(task.task_type)}
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border ${priorityClasses(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-semibold text-slate-900 text-sm">{task.title}</h4>
                              {task.description && (
                                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{task.description}</p>
                              )}
                            </div>

                            {task.linked_record_label && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-50 text-indigo-800 border border-indigo-200">
                                <Tag size={10} />
                                {task.linked_record_label}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                              <span className="flex items-center gap-1 font-medium text-slate-700">
                                <UserCheck size={12} className="text-slate-400" />
                                {task.assigned_to_name}
                              </span>
                              <span className={task.status === 'OVERDUE' ? 'text-red-600 font-bold flex items-center gap-1' : ''}>
                                {task.status === 'OVERDUE' && <AlertTriangle size={11} />}
                                {formatDate(task.due_date)}
                              </span>
                            </div>

                            <div className="flex justify-end pt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                                className="h-6 text-[11px] px-2 text-blue-700 border-blue-200 hover:bg-blue-50"
                              >
                                Move to In Progress →
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>

                {/* Column 2: IN PROGRESS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200 font-semibold text-blue-900 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span>In Progress</span>
                    </div>
                    <Badge variant="secondary" className="bg-white text-blue-800 text-xs font-bold">
                      {filteredTasks.filter((t) => t.status === 'IN_PROGRESS').length}
                    </Badge>
                  </div>

                  <div className="space-y-3 min-h-[300px]">
                    {filteredTasks
                      .filter((t) => t.status === 'IN_PROGRESS')
                      .map((task) => (
                        <Card key={task.id} className="border-slate-200/80 shadow-xs hover:shadow-sm transition-all border-l-4 border-l-blue-500">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              {renderTypeBadge(task.task_type)}
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border ${priorityClasses(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-semibold text-slate-900 text-sm">{task.title}</h4>
                              {task.description && (
                                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{task.description}</p>
                              )}
                            </div>

                            {task.linked_record_label && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-50 text-indigo-800 border border-indigo-200">
                                <Tag size={10} />
                                {task.linked_record_label}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                              <span className="flex items-center gap-1 font-medium text-slate-700">
                                <UserCheck size={12} className="text-slate-400" />
                                {task.assigned_to_name}
                              </span>
                              <span>{formatDate(task.due_date)}</span>
                            </div>

                            <div className="flex justify-between items-center pt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateTaskStatus(task.id, 'TODO')}
                                className="h-6 text-[11px] px-2 text-slate-500"
                              >
                                ← Back
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateTaskStatus(task.id, 'DONE')}
                                className="h-6 text-[11px] px-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                              >
                                Complete ✓
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>

                {/* Column 3: DONE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200 font-semibold text-emerald-900 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Done</span>
                    </div>
                    <Badge variant="secondary" className="bg-white text-emerald-800 text-xs font-bold">
                      {filteredTasks.filter((t) => t.status === 'DONE').length}
                    </Badge>
                  </div>

                  <div className="space-y-3 min-h-[300px]">
                    {filteredTasks
                      .filter((t) => t.status === 'DONE')
                      .map((task) => (
                        <Card key={task.id} className="border-slate-200/80 shadow-xs opacity-90 hover:opacity-100 transition-all border-l-4 border-l-emerald-500 bg-slate-50/50">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              {renderTypeBadge(task.task_type)}
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                                <CheckCircle2 size={13} /> Done
                              </span>
                            </div>

                            <div>
                              <h4 className="font-semibold text-slate-700 text-sm line-through">{task.title}</h4>
                            </div>

                            {task.linked_record_label && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                                <Tag size={10} />
                                {task.linked_record_label}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs text-slate-400">
                              <span>Completed by {task.assigned_to_name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                                className="h-6 text-[10px] px-1 text-slate-500 hover:text-slate-800"
                              >
                                Reopen
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ================================================================= */}
        {/* VIEW: CREATE TASK FORM                                            */}
        {/* ================================================================= */}
        {viewMode === 'create' && (
          <div className="space-y-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetForm()
                  setViewMode('view')
                }}
                className="text-slate-600 hover:text-slate-900 -ml-2"
              >
                <ArrowLeft size={16} className="mr-1.5" />
                Back to Tasks
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetForm()
                    setViewMode('view')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="new-task-form"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  Save Task
                </Button>
              </div>
            </div>

            {/* Form Card */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
                    <CheckSquare size={22} />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      Create Internal Work Task
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500">
                      Assign verification, legal documentation, or operational action items
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <form id="new-task-form" onSubmit={handleSaveTask} className="space-y-6">
                  {/* Task Title */}
                  <div className="space-y-1.5">
                    <Label htmlFor="task_title" className="text-xs font-semibold text-slate-700">
                      Task Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="task_title"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Photograph front elevation, verify RERA compliance, draft deed..."
                      required
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Task Type */}
                    <div className="space-y-1.5">
                      <Label htmlFor="task_type" className="text-xs font-semibold text-slate-700">
                        Task Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        id="task_type"
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as TaskRow['task_type'])}
                        required
                        className="h-10 text-sm"
                      >
                        {TASK_TYPE_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Assigned To */}
                    <div className="space-y-1.5">
                      <Label htmlFor="assigned_to" className="text-xs font-semibold text-slate-700">
                        Assigned To <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        id="assigned_to"
                        value={formAssigneeId}
                        onChange={(e) => setFormAssigneeId(e.target.value)}
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

                    {/* Due Date */}
                    <div className="space-y-1.5">
                      <Label htmlFor="due_date" className="text-xs font-semibold text-slate-700">
                        Due Date <span className="text-red-500">*</span>
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
                        Priority <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        id="priority"
                        value={formPriority}
                        onChange={(e) => setFormPriority(e.target.value as TaskRow['priority'])}
                        required
                        className="h-10 text-sm"
                      >
                        {PRIORITY_OPTIONS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* Linked Record Dropdown */}
                  <div className="space-y-1.5">
                    <Label htmlFor="linked_record" className="text-xs font-semibold text-slate-700">
                      Linked Record (Optional)
                    </Label>
                    <Select
                      id="linked_record"
                      value={formLinkedRecord}
                      onChange={(e) => setFormLinkedRecord(e.target.value)}
                      className="h-10 text-sm max-w-xl"
                    >
                      {linkedRecordOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                    <p className="text-[11px] text-slate-400">
                      Connects this work item with an inventory property, buyer requirement, or active deal
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
                      Description &amp; Instructions
                    </Label>
                    <Textarea
                      id="description"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Enter detailed checklist items, key handover directions, or documentation requirements..."
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
                        setViewMode('view')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                    >
                      Save Task
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

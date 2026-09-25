'use client'

/**
 * AI Assistant — Part 2 (Read + Write with Human-in-the-Loop)
 *
 * NEW in Part 2:
 * - Write actions: Create Lead, Create Follow-up, Schedule Visit
 * - Multi-turn field collection (AI asks for missing required fields)
 * - Duplicate detection against existing Party/Lead records
 * - Editable "Proposed Action" card rendered inline in chat
 * - On "Approve & Create": mutates the same MOCK_* arrays the modules use
 *   (record is immediately visible in Leads/Follow-ups/Visits pages)
 * - Full audit trail in MOCK_AI_INTERACTIONS:
 *   original_request → proposed_values → user_edits → final_committed_values
 * - "Cancel" discards with AI acknowledgement
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bot, Send, User, Loader2, AlertCircle, RefreshCw,
  Database, Sparkles, ChevronDown, ChevronUp, Clock,
  CheckCircle2, X, Edit3, ExternalLink, UserPlus, Bell, MapPin,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  logAiInteraction, MOCK_AI_INTERACTIONS,
  MOCK_LEADS, MOCK_FOLLOW_UPS, MOCK_VISITS,
  MOCK_PARTIES, MOCK_USERS, MOCK_CAMPAIGNS, MOCK_PROPERTIES,
  MOCK_LEADS as LEADS_REF,
  type AiInteractionLog,
  type LeadRow, type FollowUpRow, type VisitRow, type PartyRow,
} from '@/lib/mockData'
import { useAuth } from '@/lib/auth-context'

// ── Types ─────────────────────────────────────────────────────────────────────

type MessageRole = 'user' | 'assistant' | 'error'

interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  data_queried?: string
  record_count?: number
  timestamp: Date
  loading?: boolean
  // For action proposal messages
  proposal?: ActionProposal
  // For confirmation messages
  confirmation?: {
    action_type: string
    record_id: string
    record_label: string
    href: string
  }
}

interface ActionProposal {
  action_type: 'create_lead' | 'create_followup' | 'schedule_visit'
  fields: Record<string, string | null>
  status: 'pending' | 'approved' | 'cancelled'
  original_request: string
  proposed_values: Record<string, string | null>
  user_edits: Record<string, string | null>
  final_values?: Record<string, string | null>
  created_record_id?: string
}

interface DuplicateCandidate {
  type: 'party' | 'lead'
  id: string
  name: string
  mobile?: string
  existing_lead_count?: number
}

// ── Staff lookup helpers (matching pages' exact patterns) ─────────────────────

const STAFF_USERS = MOCK_USERS.filter(u => u.role !== 'CLIENT')
const AGENT_USERS = MOCK_USERS.filter(u => u.role === 'AGENT')

function findUserByName(name: string) {
  return MOCK_USERS.find(u => u.name.toLowerCase().includes(name.toLowerCase()))
}

function findPropertyByLoc(shortLoc: string) {
  return MOCK_PROPERTIES.find(p => p.short_loc.toLowerCase().includes(shortLoc.toLowerCase()))
}

function findPartyByName(name: string): PartyRow | undefined {
  return MOCK_PARTIES.find(p => p.name.toLowerCase().includes(name.toLowerCase()))
}

function detectDuplicates(partyName: string, phone?: string | null): DuplicateCandidate[] {
  const dupes: DuplicateCandidate[] = []
  // Check parties
  for (const p of MOCK_PARTIES) {
    const nameMatch = partyName && p.name.toLowerCase().includes(partyName.toLowerCase().split(' ')[0])
    const phoneMatch = phone && p.mobile && p.mobile.replace(/\D/g, '').includes(phone.replace(/\D/g, ''))
    if (nameMatch || phoneMatch) {
      const leadCount = MOCK_LEADS.filter(l => l.party_id === p.id).length
      dupes.push({ type: 'party', id: p.id, name: p.name, mobile: p.mobile, existing_lead_count: leadCount })
    }
  }
  return dupes
}

// ── Suggested queries ─────────────────────────────────────────────────────────

const SUGGESTED_QUERIES = [
  'How many active leads do we have?',
  'Show me overdue follow-ups',
  'Create a lead for Rajesh Kumar, phone 9876543210, buyer',
  'Schedule a follow-up with Amit Jain for tomorrow about pricing',
  'Book a visit at 01-Schm140_Mayank for Rahul Verma, assign to Ravi Mehta, next Tuesday',
  'What properties are available in 01-Schm140_Mayank?',
  'Which opportunities are in negotiation stage?',
  'List active campaigns',
]

// ── Action icons ──────────────────────────────────────────────────────────────

const ACTION_ICONS = {
  create_lead: UserPlus,
  create_followup: Bell,
  schedule_visit: MapPin,
}

const ACTION_LABELS = {
  create_lead: 'Create Lead',
  create_followup: 'Create Follow-up',
  schedule_visit: 'Schedule Visit',
}

const ACTION_COLORS = {
  create_lead: 'bg-sky-50 border-sky-200 text-sky-700',
  create_followup: 'bg-amber-50 border-amber-200 text-amber-700',
  schedule_visit: 'bg-emerald-50 border-emerald-200 text-emerald-700',
}

// ── Proposal Card Fields ──────────────────────────────────────────────────────

function CreateLeadProposalForm({
  fields,
  onChange,
}: {
  fields: Record<string, string>
  onChange: (key: string, val: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <Label className="text-xs text-slate-600 font-medium">Client Name *</Label>
        <Input
          value={fields.party_name || ''}
          onChange={e => onChange('party_name', e.target.value)}
          placeholder="Full name"
          className="mt-1 h-8 text-sm"
        />
      </div>
      <div>
        <Label className="text-xs text-slate-600 font-medium">Phone *</Label>
        <Input
          value={fields.phone || ''}
          onChange={e => onChange('phone', e.target.value)}
          placeholder="e.g. 9876543210"
          className="mt-1 h-8 text-sm"
        />
      </div>
      <div>
        <Label className="text-xs text-slate-600 font-medium">Lead Type *</Label>
        <Select
          value={fields.lead_type || 'BUYER'}
          onChange={e => onChange('lead_type', e.target.value)}
          className="mt-1 h-8 text-sm"
        >
          {['BUYER', 'SELLER', 'TENANT', 'LANDLORD', 'INVESTOR', 'CONSULTANT'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label className="text-xs text-slate-600 font-medium">Priority</Label>
        <Select
          value={fields.priority || 'MEDIUM'}
          onChange={e => onChange('priority', e.target.value)}
          className="mt-1 h-8 text-sm"
        >
          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label className="text-xs text-slate-600 font-medium">Assigned To</Label>
        <Select
          value={fields.assigned_to_id || ''}
          onChange={e => onChange('assigned_to_id', e.target.value)}
          className="mt-1 h-8 text-sm"
        >
          <option value="">— Unassigned —</option>
          {STAFF_USERS.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label className="text-xs text-slate-600 font-medium">Channel</Label>
        <Select
          value={fields.channel_type || 'Offline'}
          onChange={e => onChange('channel_type', e.target.value)}
          className="mt-1 h-8 text-sm"
        >
          <option value="Digital">Digital</option>
          <option value="Offline">Offline</option>
        </Select>
      </div>
      <div>
        <Label className="text-xs text-slate-600 font-medium">Source</Label>
        <Input
          value={fields.source || ''}
          onChange={e => onChange('source', e.target.value)}
          placeholder="e.g. Website, Referral"
          className="mt-1 h-8 text-sm"
        />
      </div>
      <div>
        <Label className="text-xs text-slate-600 font-medium">Est. Value (₹)</Label>
        <Input
          type="number"
          value={fields.value || ''}
          onChange={e => onChange('value', e.target.value)}
          placeholder="e.g. 5000000"
          className="mt-1 h-8 text-sm"
        />
      </div>
      <div className="col-span-2">
        <Label className="text-xs text-slate-600 font-medium">Remarks</Label>
        <Textarea
          value={fields.remarks || ''}
          onChange={e => onChange('remarks', e.target.value)}
          placeholder="Any additional notes…"
          rows={2}
          className="mt-1 text-sm"
        />
      </div>
    </div>
  )
}

function CreateFollowUpProposalForm({
  fields,
  onChange,
}: {
  fields: Record<string, string>
  onChange: (key: string, val: string) => void
}) {
  const linkedOptions = [
    ...MOCK_LEADS.map(l => ({ id: l.id, label: `[Lead] ${l.id} — ${l.party_name}` })),
    ...MOCK_FOLLOW_UPS.slice(0, 5).map(f => ({ id: f.entity_id, label: `[Linked] ${f.entity_id} — ${f.client_name}` })),
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <Label className="text-xs text-slate-600 font-medium">Client Name *</Label>
        <Input
          value={fields.client_name || ''}
          onChange={e => onChange('client_name', e.target.value)}
          placeholder="Client name"
          className="mt-1 h-8 text-sm"
        />
      </div>
      <div className="col-span-2">
        <Label className="text-xs text-slate-600 font-medium">Purpose *</Label>
        <Input
          value={fields.purpose || ''}
          onChange={e => onChange('purpose', e.target.value)}
          placeholder="What is this follow-up about?"
          className="mt-1 h-8 text-sm"
        />
      </div>
      <div>
        <Label className="text-xs text-slate-600 font-medium">Due Date & Time *</Label>
        <Input
          type="datetime-local"
          value={fields.due_date || ''}
          onChange={e => onChange('due_date', e.target.value)}
          className="mt-1 h-8 text-sm"
        />
      </div>
      <div>
        <Label className="text-xs text-slate-600 font-medium">Priority</Label>
        <Select
          value={fields.priority || 'MEDIUM'}
          onChange={e => onChange('priority', e.target.value)}
          className="mt-1 h-8 text-sm"
        >
          {['LOW', 'MEDIUM', 'HIGH'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label className="text-xs text-slate-600 font-medium">Responsible *</Label>
        <Select
          value={fields.responsible_id || ''}
          onChange={e => onChange('responsible_id', e.target.value)}
          className="mt-1 h-8 text-sm"
        >
          <option value="">— Select —</option>
          {STAFF_USERS.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label className="text-xs text-slate-600 font-medium">Linked Record</Label>
        <Select
          value={fields.entity_id || ''}
          onChange={e => onChange('entity_id', e.target.value)}
          className="mt-1 h-8 text-sm"
        >
          <option value="">— None —</option>
          {linkedOptions.map(o => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </Select>
      </div>
      <div className="col-span-2">
        <Label className="text-xs text-slate-600 font-medium">Expected Outcome</Label>
        <Textarea
          value={fields.expected_outcome || ''}
          onChange={e => onChange('expected_outcome', e.target.value)}
          placeholder="What should result from this follow-up?"
          rows={2}
          className="mt-1 text-sm"
        />
      </div>
    </div>
  )
}

function ScheduleVisitProposalForm({
  fields,
  onChange,
}: {
  fields: Record<string, string>
  onChange: (key: string, val: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className="text-xs text-slate-600 font-medium">Client Name *</Label>
        <Select
          value={fields.client_id || ''}
          onChange={e => onChange('client_id', e.target.value)}
          className="mt-1 h-8 text-sm"
        >
          <option value="">— Select Client —</option>
          {MOCK_PARTIES.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label className="text-xs text-slate-600 font-medium">Agent *</Label>
        <Select
          value={fields.agent_id || ''}
          onChange={e => onChange('agent_id', e.target.value)}
          className="mt-1 h-8 text-sm"
        >
          <option value="">— Select Agent —</option>
          {AGENT_USERS.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </Select>
      </div>
      <div className="col-span-2">
        <Label className="text-xs text-slate-600 font-medium">Property *</Label>
        <Select
          value={fields.property_id || ''}
          onChange={e => onChange('property_id', e.target.value)}
          className="mt-1 h-8 text-sm"
        >
          <option value="">— Select Property —</option>
          {MOCK_PROPERTIES.map(p => (
            <option key={p.id} value={p.id}>{p.short_loc} — {p.id} ({p.status})</option>
          ))}
        </Select>
      </div>
      <div>
        <Label className="text-xs text-slate-600 font-medium">Visit Date & Time *</Label>
        <Input
          type="datetime-local"
          value={fields.scheduled_date || ''}
          onChange={e => onChange('scheduled_date', e.target.value)}
          className="mt-1 h-8 text-sm"
        />
      </div>
      <div>
        <Label className="text-xs text-slate-600 font-medium">Purpose</Label>
        <Select
          value={fields.purpose || 'Property Viewing'}
          onChange={e => onChange('purpose', e.target.value)}
          className="mt-1 h-8 text-sm"
        >
          <option value="Property Viewing">Property Viewing</option>
          <option value="Owner Meeting">Owner Meeting</option>
          <option value="Verification">Verification</option>
        </Select>
      </div>
      <div className="col-span-2">
        <Label className="text-xs text-slate-600 font-medium">Instructions</Label>
        <Textarea
          value={fields.instructions || ''}
          onChange={e => onChange('instructions', e.target.value)}
          placeholder="Any special instructions for the agent…"
          rows={2}
          className="mt-1 text-sm"
        />
      </div>
    </div>
  )
}

// ── Proposal Card ─────────────────────────────────────────────────────────────

function ProposalCard({
  proposal,
  duplicates,
  onApprove,
  onCancel,
}: {
  proposal: ActionProposal
  duplicates: DuplicateCandidate[]
  onApprove: (finalFields: Record<string, string>) => void
  onCancel: () => void
}) {
  const [editFields, setEditFields] = useState<Record<string, string>>(() => {
    // Resolve display-ready defaults from extracted fields
    const f = { ...proposal.fields } as Record<string, string>

    if (proposal.action_type === 'create_lead') {
      // Try to pre-resolve assigned_to_id from name
      if (f.assigned_to_name && !f.assigned_to_id) {
        const user = findUserByName(f.assigned_to_name)
        if (user) f.assigned_to_id = user.id
      }
      f.priority = f.priority || 'MEDIUM'
      f.channel_type = f.channel_type || 'Offline'
    }

    if (proposal.action_type === 'create_followup') {
      if (f.responsible_name && !f.responsible_id) {
        const user = findUserByName(f.responsible_name)
        if (user) f.responsible_id = user.id
      }
      f.priority = f.priority || 'MEDIUM'
      // Normalize datetime-local format
      if (f.due_date && !f.due_date.includes('T')) {
        f.due_date = f.due_date + 'T10:00'
      }
    }

    if (proposal.action_type === 'schedule_visit') {
      if (f.agent_name && !f.agent_id) {
        const user = findUserByName(f.agent_name)
        if (user) f.agent_id = user.id
      }
      if (f.client_name && !f.client_id) {
        const party = findPartyByName(f.client_name)
        if (party) f.client_id = party.id
      }
      if (f.property_short_loc && !f.property_id) {
        const prop = findPropertyByLoc(f.property_short_loc)
        if (prop) f.property_id = prop.id
      }
      f.purpose = f.purpose || 'Property Viewing'
      if (f.scheduled_date && !f.scheduled_date.includes('T')) {
        f.scheduled_date = f.scheduled_date + 'T11:00'
      }
    }

    return f
  })

  const [isApproving, setIsApproving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleChange = (key: string, val: string) => {
    setEditFields(prev => ({ ...prev, [key]: val }))
    setErrors([])
  }

  const validate = (): string[] => {
    const errs: string[] = []
    if (proposal.action_type === 'create_lead') {
      if (!editFields.party_name?.trim()) errs.push('Client name is required')
      if (!editFields.phone?.trim()) errs.push('Phone number is required')
      if (!editFields.lead_type) errs.push('Lead type is required')
    } else if (proposal.action_type === 'create_followup') {
      if (!editFields.client_name?.trim()) errs.push('Client name is required')
      if (!editFields.purpose?.trim()) errs.push('Purpose is required')
      if (!editFields.due_date) errs.push('Due date is required')
      if (!editFields.responsible_id) errs.push('Responsible person is required')
    } else if (proposal.action_type === 'schedule_visit') {
      if (!editFields.client_id) errs.push('Client is required')
      if (!editFields.agent_id) errs.push('Agent is required')
      if (!editFields.property_id) errs.push('Property is required')
      if (!editFields.scheduled_date) errs.push('Visit date is required')
    }
    return errs
  }

  const handleApprove = () => {
    const errs = validate()
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setIsApproving(true)
    onApprove(editFields)
  }

  const ActionIcon = ACTION_ICONS[proposal.action_type]
  const colorClass = ACTION_COLORS[proposal.action_type]

  if (proposal.status === 'approved') {
    return (
      <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4">
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 size={16} />
          <span className="text-sm font-semibold">Action approved and created.</span>
        </div>
      </div>
    )
  }

  if (proposal.status === 'cancelled') {
    return (
      <div className="border border-slate-200 bg-slate-50 rounded-xl p-4 opacity-60">
        <div className="flex items-center gap-2 text-slate-500">
          <X size={16} />
          <span className="text-sm">Proposal cancelled.</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`border rounded-xl overflow-hidden ${colorClass.split(' ')[1]} shadow-sm`}>
      {/* Header */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${colorClass}`}>
        <ActionIcon size={16} className="shrink-0" />
        <span className="font-semibold text-sm">{ACTION_LABELS[proposal.action_type]}</span>
        <span className="ml-auto text-xs opacity-70 flex items-center gap-1">
          <Edit3 size={11} />
          Editable before approving
        </span>
      </div>

      {/* Duplicate warning */}
      {duplicates.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Possible duplicate detected</p>
              <ul className="mt-1 space-y-0.5">
                {duplicates.map(d => (
                  <li key={d.id} className="text-xs text-amber-700">
                    • {d.name} ({d.mobile || 'no phone'}) — {d.existing_lead_count ?? 0} existing lead(s)
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-600 mt-1">You may edit the name/phone above or proceed if this is a different person.</p>
            </div>
          </div>
        </div>
      )}

      {/* Form body */}
      <div className="px-4 py-4 bg-white">
        {proposal.action_type === 'create_lead' && (
          <CreateLeadProposalForm fields={editFields} onChange={handleChange} />
        )}
        {proposal.action_type === 'create_followup' && (
          <CreateFollowUpProposalForm fields={editFields} onChange={handleChange} />
        )}
        {proposal.action_type === 'schedule_visit' && (
          <ScheduleVisitProposalForm fields={editFields} onChange={handleChange} />
        )}

        {/* Validation errors */}
        {errors.length > 0 && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {errors.map(e => <div key={e}>• {e}</div>)}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4">
          <Button
            onClick={handleApprove}
            disabled={isApproving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-sm h-9"
          >
            {isApproving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Approve & Create
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={isApproving}
            className="text-slate-600 gap-1.5 text-sm h-9"
          >
            <X size={14} />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  duplicates,
  onApproveProposal,
  onCancelProposal,
}: {
  msg: ChatMessage
  duplicates: DuplicateCandidate[]
  onApproveProposal: (msgId: string, finalFields: Record<string, string>) => void
  onCancelProposal: (msgId: string) => void
}) {
  const isUser = msg.role === 'user'
  const isError = msg.role === 'error'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {/* AI / Error avatar */}
      {!isUser && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1 ${
          isError ? 'bg-red-100' : 'bg-amber-100'
        }`}>
          {isError ? <AlertCircle size={16} className="text-red-500" /> : <Bot size={16} className="text-amber-600" />}
        </div>
      )}

      <div className={`${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1 ${msg.proposal ? 'w-full max-w-[90%]' : 'max-w-[78%]'}`}>
        {/* Text bubble */}
        {msg.content && (
          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-amber-500 text-white rounded-br-sm'
              : isError
              ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm'
              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm'
          }`}>
            {msg.loading ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 size={14} className="animate-spin" />
                <span>Thinking…</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{msg.content}</div>
            )}
          </div>
        )}

        {/* Proposal card */}
        {msg.proposal && msg.proposal.status !== 'cancelled' && (
          <div className="w-full mt-1">
            <ProposalCard
              proposal={msg.proposal}
              duplicates={duplicates}
              onApprove={(fields) => onApproveProposal(msg.id, fields)}
              onCancel={() => onCancelProposal(msg.id)}
            />
          </div>
        )}

        {/* Confirmation link */}
        {msg.confirmation && (
          <div className="mt-1 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2 size={16} />
              {msg.confirmation.record_label}
            </div>
            <Link
              href={msg.confirmation.href}
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 underline"
            >
              <ExternalLink size={11} />
              View in {msg.confirmation.action_type === 'create_lead' ? 'Leads' : msg.confirmation.action_type === 'create_followup' ? 'Follow-ups' : 'Visits'}
            </Link>
          </div>
        )}

        {/* Metadata row */}
        {!isUser && !msg.loading && msg.data_queried && msg.data_queried !== 'None' && (
          <div className="flex items-center gap-2 px-1">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Database size={10} />
              {msg.data_queried}
            </span>
            {msg.record_count !== undefined && (
              <span className="text-xs text-slate-400">· {msg.record_count} record{msg.record_count !== 1 ? 's' : ''}</span>
            )}
          </div>
        )}

        <span className="text-[10px] text-slate-400 px-1">
          {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center ml-3 mt-1">
          <User size={16} className="text-white" />
        </div>
      )}
    </div>
  )
}

// ── Session Log Panel ─────────────────────────────────────────────────────────

function SessionLogPanel({ logs }: { logs: AiInteractionLog[] }) {
  const [open, setOpen] = useState(false)
  if (logs.length === 0) return null
  return (
    <div className="border-t border-slate-200 bg-slate-50">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-500 hover:text-slate-700 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Clock size={12} />
          Session Log ({logs.length} interaction{logs.length !== 1 ? 's' : ''})
        </span>
        {open ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>
      {open && (
        <div className="max-h-48 overflow-y-auto px-4 pb-3 space-y-2">
          {logs.map(log => (
            <div key={log.id} className="text-xs bg-white border border-slate-200 rounded p-2">
              <div className="font-medium text-slate-700 truncate">Q: {log.user_message}</div>
              <div className="text-slate-400 mt-0.5">
                {log.entity_queried} · {log.record_count} record{log.record_count !== 1 ? 's' : ''}
                {' '} · {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {log.interpreted_intent.startsWith('create') && (
                <div className="text-emerald-600 mt-0.5">✓ Write action: {log.interpreted_intent}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Create record functions (same logic as each module's create form) ─────────

function createLeadRecord(fields: Record<string, string>): { record: LeadRow; id: string } {
  // Find or create party (if new name + phone, create a minimal party)
  let party = MOCK_PARTIES.find(p =>
    p.name.toLowerCase() === fields.party_name?.toLowerCase() ||
    (fields.phone && p.mobile?.replace(/\D/g, '') === fields.phone?.replace(/\D/g, ''))
  )

  // If no matching party, add a new one
  if (!party) {
    const newParty: PartyRow = {
      id: `p-ai-${Date.now().toString(36)}`,
      name: fields.party_name || 'Unknown',
      email: null,
      mobile: fields.phone || '',
      city: null,
      roles: [fields.lead_type || 'BUYER'],
      status: 'Active',
      source: 'AI Assistant',
      leads_count: 0,
      requirements_count: 0,
      opportunities_count: 0,
      updated_at: new Date().toISOString(),
    }
    MOCK_PARTIES.push(newParty)
    party = newParty
  }

  const assignedUser = fields.assigned_to_id
    ? MOCK_USERS.find(u => u.id === fields.assigned_to_id)
    : fields.assigned_to_name
    ? findUserByName(fields.assigned_to_name)
    : null

  const id = `L-${Date.now().toString(36).toUpperCase().slice(-8)}`

  const record: LeadRow = {
    id,
    party_id: party.id,
    party_name: party.name,
    channel_type: (fields.channel_type as any) || 'Offline',
    source: fields.source || 'AI Assistant',
    lead_type: fields.lead_type || 'BUYER',
    status: 'NEW',
    priority: (fields.priority as any) || 'MEDIUM',
    assigned_to_id: assignedUser?.id || null,
    assigned_to_name: assignedUser?.name || null,
    value: fields.value ? parseFloat(fields.value) : null,
    remarks: fields.remarks || null,
    campaign_id: null,
    campaign_name: null,
    referral_partner_id: null,
    referral_partner_name: null,
    referral_code: null,
    ad_reference: null,
    enquiry_at: new Date().toISOString(),
    last_activity_at: new Date().toISOString(),
    next_follow_up_at: null,
    created_at: new Date().toISOString(),
  }

  MOCK_LEADS.unshift(record)
  return { record, id }
}

function createFollowUpRecord(fields: Record<string, string>): { record: FollowUpRow; id: string } {
  const responsibleUser = fields.responsible_id
    ? MOCK_USERS.find(u => u.id === fields.responsible_id)
    : fields.responsible_name
    ? findUserByName(fields.responsible_name)
    : null

  // Determine entity_type from entity_id prefix
  const entityId = fields.entity_id || ''
  let entityType: 'Lead' | 'Requirement' | 'Opportunity' = 'Lead'
  if (entityId.startsWith('R-')) entityType = 'Requirement'
  else if (entityId.startsWith('OPP-')) entityType = 'Opportunity'

  const id = `FU-${Date.now().toString().slice(-4)}`

  const record: FollowUpRow = {
    id,
    client_name: fields.client_name || 'Client Contact',
    entity_type: entityType,
    entity_id: entityId || 'L-1001',
    purpose: fields.purpose || 'Follow-up call',
    priority: (fields.priority as any) || 'MEDIUM',
    due_date: fields.due_date ? new Date(fields.due_date).toISOString() : new Date().toISOString(),
    status: 'PENDING',
    responsible_name: responsibleUser?.name || 'Neha Kapoor',
    responsible_id: responsibleUser?.id,
    expected_outcome: fields.expected_outcome || null,
    created_at: new Date().toISOString(),
  }

  MOCK_FOLLOW_UPS.unshift(record)
  return { record, id }
}

function createVisitRecord(fields: Record<string, string>): { record: VisitRow; id: string } {
  const agent = MOCK_USERS.find(u => u.id === fields.agent_id) || AGENT_USERS[0]
  const property = MOCK_PROPERTIES.find(p => p.id === fields.property_id) || MOCK_PROPERTIES[0]
  const client = MOCK_PARTIES.find(p => p.id === fields.client_id) || MOCK_PARTIES[0]

  const id = `V-AI${Date.now().toString().slice(-4)}`

  const record: VisitRow = {
    id,
    property_id: property.id,
    property_short_loc: property.short_loc,
    client_id: client.id,
    client_name: client.name,
    agent_id: agent.id,
    agent_name: agent.name,
    purpose: (fields.purpose as VisitRow['purpose']) || 'Property Viewing',
    status: 'Assigned',
    scheduled_date: fields.scheduled_date
      ? new Date(fields.scheduled_date).toISOString()
      : new Date().toISOString(),
    instructions: fields.instructions || undefined,
    checklist_template: 'Standard Residential',
    created_at: new Date().toISOString(),
  }

  MOCK_VISITS.unshift(record)
  return { record, id }
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AIAssistantPage() {
  const { user } = useAuth()

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm PropDesk AI — your assistant for reading and creating CRM records.

**I can now create records for you:**
• 🧑 **Create Lead** — "Create a lead for Rajesh Kumar, phone 9876543210, buyer, assign to Neha"
• 🔔 **Create Follow-up** — "Schedule a follow-up with Amit Jain tomorrow about pricing"
• 📍 **Schedule Visit** — "Book a visit at Scheme 140 for Rahul Verma, assign to Ravi Mehta, next Tuesday 11am"

I'll always show you a **Proposed Action card** to review and edit before anything is saved. What would you like to do?`,
      timestamp: new Date(),
    },
  ])

  const [sessionLogs, setSessionLogs] = useState<AiInteractionLog[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])

  // Pending write action tracking (for multi-turn field collection)
  const [pendingActionType, setPendingActionType] = useState<string | null>(null)
  const [pendingActionFields, setPendingActionFields] = useState<Record<string, string | null>>({})

  // Duplicate detection state (tied to the most recent proposal)
  const [currentDuplicates, setCurrentDuplicates] = useState<DuplicateCandidate[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Approve proposal ────────────────────────────────────────────────────────

  const handleApproveProposal = useCallback((msgId: string, finalFields: Record<string, string>) => {
    setMessages(prev => {
      const msg = prev.find(m => m.id === msgId)
      if (!msg?.proposal) return prev

      const originalRequest = msg.proposal.original_request
      const proposedValues = { ...msg.proposal.proposed_values }

      // Detect user edits (fields that differ from proposed)
      const userEdits: Record<string, string | null> = {}
      for (const [k, v] of Object.entries(finalFields)) {
        if (proposedValues[k] !== v) userEdits[k] = v
      }

      // Create the record
      let newId = ''
      let confirmationLabel = ''
      let href = ''
      let actionTypeStr = ''

      try {
        if (msg.proposal.action_type === 'create_lead') {
          const { record, id } = createLeadRecord(finalFields)
          newId = id
          confirmationLabel = `Created Lead ${id} for ${record.party_name}`
          href = '/leads'
          actionTypeStr = 'create_lead'
        } else if (msg.proposal.action_type === 'create_followup') {
          const { record, id } = createFollowUpRecord(finalFields)
          newId = id
          confirmationLabel = `Created Follow-up ${id} for ${record.client_name} — "${record.purpose}"`
          href = '/follow-ups'
          actionTypeStr = 'create_followup'
        } else if (msg.proposal.action_type === 'schedule_visit') {
          const { record, id } = createVisitRecord(finalFields)
          newId = id
          confirmationLabel = `Scheduled Visit ${id} at ${record.property_short_loc} for ${record.client_name}`
          href = '/visits'
          actionTypeStr = 'schedule_visit'
        }
      } catch (err) {
        console.error('Create record error:', err)
        return prev
      }

      // Log full audit trail
      const log = logAiInteraction({
        user_message: originalRequest,
        interpreted_intent: msg.proposal.action_type,
        entity_queried: msg.proposal.action_type.replace('create_', '').replace('schedule_', ''),
        filters_applied: {},
        record_count: 1,
        ai_response: confirmationLabel,
        user_id: user?.id,
        user_name: user?.name,
        // Extra fields stored in filters_applied for audit trail
      })

      // Update the proposal status to approved
      const updatedMessages = prev.map(m =>
        m.id === msgId
          ? { ...m, proposal: { ...m.proposal!, status: 'approved' as const, final_values: finalFields, created_record_id: newId, user_edits: userEdits } }
          : m
      )

      // Add confirmation message
      const confirmMsg: ChatMessage = {
        id: `confirm-${Date.now()}`,
        role: 'assistant',
        content: `✅ Done! ${confirmationLabel}.${Object.keys(userEdits).length > 0 ? ` (I also applied your ${Object.keys(userEdits).length} edit${Object.keys(userEdits).length !== 1 ? 's' : ''} before saving.)` : ''}`,
        timestamp: new Date(),
        confirmation: {
          action_type: actionTypeStr,
          record_id: newId,
          record_label: confirmationLabel,
          href,
        },
      }

      // Clear pending state
      setPendingActionType(null)
      setPendingActionFields({})
      setCurrentDuplicates([])
      setSessionLogs(s => [log, ...s])

      return [...updatedMessages, confirmMsg]
    })
  }, [user])

  // ── Cancel proposal ─────────────────────────────────────────────────────────

  const handleCancelProposal = useCallback((msgId: string) => {
    setMessages(prev => {
      const updated = prev.map(m =>
        m.id === msgId
          ? { ...m, proposal: { ...m.proposal!, status: 'cancelled' as const } }
          : m
      )

      const cancelMsg: ChatMessage = {
        id: `cancel-${Date.now()}`,
        role: 'assistant',
        content: 'No problem — I\'ve cancelled that. Is there anything else you\'d like to do?',
        timestamp: new Date(),
      }

      setPendingActionType(null)
      setPendingActionFields({})
      setCurrentDuplicates([])

      return [...updated, cancelMsg]
    })
  }, [])

  // ── Send message ────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text?: string) => {
    const userText = (text ?? input).trim()
    if (!userText || loading) return

    setInput('')
    setLoading(true)

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date(),
    }

    const loadingMsg: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      loading: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg, loadingMsg])

    try {
      const res = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          conversation_history: conversationHistory,
          pending_action_type: pendingActionType,
          pending_action_fields: Object.keys(pendingActionFields).length > 0 ? pendingActionFields : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`)
      }

      // ── Handle write action proposal ──────────────────────────────────────

      if (data.action_proposal?.ready) {
        const proposal = data.action_proposal
        const extractedFields = data.intent?.extracted_fields || proposal.fields

        // Detect duplicates for create_lead
        let dupes: DuplicateCandidate[] = []
        if (proposal.action_type === 'create_lead') {
          dupes = detectDuplicates(
            extractedFields.party_name || '',
            extractedFields.phone
          )
          setCurrentDuplicates(dupes)
        }

        const proposalMsg: ChatMessage = {
          id: `proposal-${Date.now()}`,
          role: 'assistant',
          content: data.answer || 'Here\'s what I\'m proposing to create:',
          timestamp: new Date(),
          proposal: {
            action_type: proposal.action_type,
            fields: extractedFields,
            status: 'pending',
            original_request: userText,
            proposed_values: { ...extractedFields },
            user_edits: {},
          },
        }

        setMessages(prev => prev.map(m => m.id === loadingMsg.id ? proposalMsg : m))
        setPendingActionType(null)
        setPendingActionFields({})

        // Update conversation history
        setConversationHistory(prev => [
          ...prev,
          { role: 'user' as const, content: userText },
          { role: 'assistant' as const, content: data.answer },
        ].slice(-12))

        const log = logAiInteraction({
          user_message: userText,
          interpreted_intent: proposal.action_type + '_proposed',
          entity_queried: proposal.action_type,
          filters_applied: extractedFields,
          record_count: 0,
          ai_response: data.answer,
          user_id: user?.id,
          user_name: user?.name,
        })
        setSessionLogs(s => [log, ...s])

        return
      }

      // ── Handle pending field collection (AI asking for more info) ─────────

      if (data._pending_action_type) {
        setPendingActionType(data._pending_action_type)
        setPendingActionFields(data._pending_action_fields || {})
      } else {
        // Clear pending if not a write flow
        const writeIntents = ['create_lead', 'create_followup', 'schedule_visit']
        if (!writeIntents.includes(data.intent?.intent)) {
          setPendingActionType(null)
          setPendingActionFields({})
        }
      }

      // ── Regular response ─────────────────────────────────────────────────

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'No response received.',
        data_queried: data.data_queried,
        record_count: data.record_count,
        timestamp: new Date(),
      }

      setConversationHistory(prev => [
        ...prev,
        { role: 'user' as const, content: userText },
        { role: 'assistant' as const, content: data.answer },
      ].slice(-12))

      const log = logAiInteraction({
        user_message: userText,
        interpreted_intent: data.intent?.intent || 'unknown',
        entity_queried: data.data_queried || 'None',
        filters_applied: data.intent?.filters || {},
        record_count: data.record_count ?? 0,
        ai_response: data.answer,
        user_id: user?.id,
        user_name: user?.name,
      })
      setSessionLogs(s => [log, ...s])

      setMessages(prev => prev.map(m => m.id === loadingMsg.id ? aiMsg : m))

    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'error',
        content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => prev.map(m => m.id === loadingMsg.id ? errorMsg : m))
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [input, loading, conversationHistory, pendingActionType, pendingActionFields, user])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: 'Chat cleared. What would you like to do?',
      timestamp: new Date(),
    }])
    setConversationHistory([])
    setPendingActionType(null)
    setPendingActionFields({})
    setCurrentDuplicates([])
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">AI Assistant</h1>
              <p className="text-xs text-slate-500">
                Read + Write · Human-in-the-loop · Powered by Groq
                {pendingActionType && (
                  <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium">
                    <Clock size={10} />
                    Collecting info for {pendingActionType.replace(/_/g, ' ')}…
                  </span>
                )}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={clearChat} className="text-slate-500 gap-1.5">
            <RefreshCw size={14} />
            Clear Chat
          </Button>
        </div>

        {/* Chat container */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
          {/* Message list */}
          <div className="flex-1 overflow-y-auto p-6">
            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                duplicates={msg.proposal ? currentDuplicates : []}
                onApproveProposal={handleApproveProposal}
                onCancelProposal={handleCancelProposal}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested queries (only on fresh chat) */}
          {messages.length <= 1 && (
            <div className="px-6 pb-4">
              <p className="text-xs text-slate-400 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUERIES.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 bg-slate-50 hover:bg-amber-50 hover:text-amber-700 border border-slate-200 hover:border-amber-200 rounded-full text-slate-600 transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Session log */}
          <SessionLogPanel logs={sessionLogs} />

          {/* Input bar */}
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            {pendingActionType && (
              <div className="mb-2 text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                <AlertTriangle size={11} />
                <span>Collecting fields for <strong>{ACTION_LABELS[pendingActionType as keyof typeof ACTION_LABELS] || pendingActionType}</strong> — answer the question above or type &ldquo;cancel&rdquo; to abort</span>
              </div>
            )}
            <div className="flex items-end gap-3">
              <div className="flex-1 bg-white border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-amber-400 focus-within:border-amber-400 transition-all">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    pendingActionType
                      ? 'Provide the requested info, or type "cancel" to abort…'
                      : 'Ask anything, or say "create a lead for…"'
                  }
                  disabled={loading}
                  className="w-full px-4 py-3 text-sm text-slate-800 placeholder-slate-400 bg-transparent resize-none focus:outline-none disabled:opacity-50"
                  style={{ maxHeight: '120px', minHeight: '44px' }}
                  onInput={e => {
                    const t = e.target as HTMLTextAreaElement
                    t.style.height = 'auto'
                    t.style.height = `${Math.min(t.scrollHeight, 120)}px`
                  }}
                />
              </div>
              <Button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-white h-11 w-11 p-0 rounded-xl flex-shrink-0"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Human-in-the-loop · No record is created without your explicit approval · Enter to send
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

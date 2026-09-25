'use client'

/**
 * AI Assistant — Part 4 (Multi-Step Workflows)
 *
 * Extends Parts 2-3 with WORKFLOW support:
 * - A single user request can trigger 2+ linked actions
 * - Proposed Workflow card shows all steps with dependency connectors
 * - Each step is individually editable / excludable
 * - Sequential execution passes real IDs between dependent steps
 * - Partial failure reporting: shows which steps completed, which failed, which skipped
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bot, Send, User, Loader2, AlertCircle, RefreshCw,
  Database, Sparkles, ChevronDown, ChevronUp, Clock,
  CheckCircle2, X, Edit3, ExternalLink, UserPlus, Bell, MapPin,
  AlertTriangle, ClipboardList, TrendingUp, ArrowRightLeft,
  Megaphone, CheckSquare, Link2, SkipForward, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  logAiInteraction, logAiAudit, logAiWorkflowAudit,
  MOCK_LEADS, MOCK_FOLLOW_UPS, MOCK_VISITS, MOCK_REQUIREMENTS,
  MOCK_PIPELINE_OPPORTUNITIES, MOCK_TASKS, MOCK_CAMPAIGNS, MOCK_MATCHES,
  MOCK_PARTIES, MOCK_USERS, MOCK_PROPERTIES,
  type AiInteractionLog,
  type LeadRow, type FollowUpRow, type VisitRow, type PartyRow,
  type FullRequirementRow, type PipelineOpportunityRow, type TaskRow,
  type CampaignRow, type MatchRow,
} from '@/lib/mockData'
import type { WriteIntent, WorkflowStep } from '@/app/api/ai-agent/route'
import { useAuth } from '@/lib/auth-context'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'error'
  content: string
  data_queried?: string
  record_count?: number
  timestamp: Date
  loading?: boolean
  proposal?: ActionProposal
  workflow?: WorkflowProposal
  confirmation?: { action_type: string; record_id: string; record_label: string; href: string }
  workflowResult?: WorkflowResult
}

interface ActionProposal {
  action_type: WriteIntent
  fields: Record<string, string | null>
  status: 'pending' | 'approved' | 'cancelled'
  original_request: string
  proposed_values: Record<string, string | null>
  user_edits: Record<string, string | null>
  final_values?: Record<string, string | null>
  created_record_id?: string
}

interface WorkflowProposal {
  status: 'pending' | 'approved' | 'cancelled'
  original_request: string
  steps: WorkflowStepState[]
}

interface WorkflowStepState {
  action_type: WriteIntent
  fields: Record<string, string>
  proposed_values: Record<string, string>
  depends_on: number | null
  dependency_description: string | null
  excluded: boolean
}

interface WorkflowStepResult {
  step_index: number
  action_type: WriteIntent
  status: 'success' | 'failed' | 'skipped' | 'dep_excluded'
  record_id?: string
  label?: string
  extra?: string
  error?: string
}

interface WorkflowResult {
  steps: WorkflowStepResult[]
  all_succeeded: boolean
}

interface DuplicateCandidate {
  type: 'party' | 'lead'
  id: string
  name: string
  mobile?: string
  existing_lead_count?: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STAFF = MOCK_USERS.filter(u => u.role !== 'CLIENT')
const AGENTS = MOCK_USERS.filter(u => u.role === 'AGENT')
const SHORT_LOCS = ['01-Schm140_Mayank', '07-Geeta_Bhawan', '05-MG_Road', '04-Vijay_Nagar', '08-SAPNA_SANGEETA', '09-Super_Corridor']

function findUser(name: string) { return MOCK_USERS.find(u => u.name.toLowerCase().includes(name.toLowerCase())) }
function findProp(loc: string) { return MOCK_PROPERTIES.find(p => p.short_loc.toLowerCase().includes(loc.toLowerCase())) }
function findParty(name: string) { return MOCK_PARTIES.find(p => p.name.toLowerCase().includes(name.toLowerCase())) }

function detectDuplicates(name: string, phone?: string | null): DuplicateCandidate[] {
  const dupes: DuplicateCandidate[] = []
  for (const p of MOCK_PARTIES) {
    const nameMatch = name && p.name.toLowerCase().includes(name.toLowerCase().split(' ')[0])
    const phoneMatch = phone && p.mobile?.replace(/\D/g, '').includes(phone.replace(/\D/g, ''))
    if (nameMatch || phoneMatch) {
      dupes.push({ type: 'party', id: p.id, name: p.name, mobile: p.mobile, existing_lead_count: MOCK_LEADS.filter(l => l.party_id === p.id).length })
    }
  }
  return dupes
}

const VALID_STAGES: PipelineOpportunityRow['stage'][] = ['QUALIFIED', 'PROPERTY_SHARED', 'SITE_VISIT', 'NEGOTIATION', 'DOCUMENTATION', 'WON', 'LOST']

// ── Action metadata ───────────────────────────────────────────────────────────

const ACTION_META: Record<WriteIntent, { icon: React.ElementType; label: string; color: string; borderColor: string; href: string; module: string }> = {
  create_lead:        { icon: UserPlus,       label: 'Create Lead',        color: 'bg-sky-50 text-sky-700',       borderColor: 'border-sky-200',   href: '/leads',         module: 'Leads' },
  create_followup:    { icon: Bell,           label: 'Create Follow-up',   color: 'bg-amber-50 text-amber-700',   borderColor: 'border-amber-200', href: '/follow-ups',    module: 'Follow-ups' },
  schedule_visit:     { icon: MapPin,         label: 'Schedule Visit',     color: 'bg-emerald-50 text-emerald-700', borderColor: 'border-emerald-200', href: '/visits', module: 'Visits' },
  create_requirement: { icon: ClipboardList,  label: 'Create Requirement', color: 'bg-violet-50 text-violet-700', borderColor: 'border-violet-200', href: '/requirements', module: 'Requirements' },
  create_opportunity: { icon: TrendingUp,     label: 'Create Opportunity', color: 'bg-indigo-50 text-indigo-700', borderColor: 'border-indigo-200', href: '/opportunities', module: 'Opportunities' },
  update_deal_stage:  { icon: ArrowRightLeft, label: 'Update Deal Stage',  color: 'bg-rose-50 text-rose-700',     borderColor: 'border-rose-200',  href: '/opportunities', module: 'Opportunities' },
  create_campaign:    { icon: Megaphone,      label: 'Create Campaign',    color: 'bg-pink-50 text-pink-700',     borderColor: 'border-pink-200',  href: '/campaigns',     module: 'Campaigns' },
  create_task:        { icon: CheckSquare,    label: 'Create Task',        color: 'bg-teal-50 text-teal-700',     borderColor: 'border-teal-200',  href: '/tasks',         module: 'Tasks' },
}

// ── Suggested queries ─────────────────────────────────────────────────────────

const SUGGESTED_QUERIES = [
  'How many active leads do we have?',
  'Create a lead for Rajesh Kumar, phone 9876543210, buyer, assign to Priya, and schedule a follow-up for Friday about pricing',
  'Create a requirement for Vikram Singh, 2BHK flat in Scheme 140, budget 50-70 lakhs',
  'Create an opportunity for Rahul Verma at MG Road, ₹45L, and schedule a site visit with Ravi next Tuesday',
  'Move OPP-5001 to Documentation stage',
  'Create a campaign "Diwali Homes" for Buyer Acquisition starting Oct 15',
]

// ════════════════════════════════════════════════════════════════════════════════
// ── PROPOSAL FORM COMPONENTS ──────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════

type FormProps = { fields: Record<string, string>; onChange: (k: string, v: string) => void; compact?: boolean }

function LeadForm({ fields: f, onChange, compact }: FormProps) {
  return (<div className={`grid grid-cols-2 gap-${compact ? '2' : '3'}`}>
    <div className="col-span-2"><Label className="text-xs text-slate-600 font-medium">Client Name *</Label>
      <Input value={f.party_name||''} onChange={e=>onChange('party_name',e.target.value)} className="mt-1 h-8 text-sm" /></div>
    <div><Label className="text-xs text-slate-600 font-medium">Phone *</Label>
      <Input value={f.phone||''} onChange={e=>onChange('phone',e.target.value)} className="mt-1 h-8 text-sm" /></div>
    <div><Label className="text-xs text-slate-600 font-medium">Lead Type *</Label>
      <Select value={f.lead_type||'BUYER'} onChange={e=>onChange('lead_type',e.target.value)} className="mt-1 h-8 text-sm">
        {['BUYER','SELLER','TENANT','LANDLORD','INVESTOR','CONSULTANT'].map(t=><option key={t}>{t}</option>)}</Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Priority</Label>
      <Select value={f.priority||'MEDIUM'} onChange={e=>onChange('priority',e.target.value)} className="mt-1 h-8 text-sm">
        {['LOW','MEDIUM','HIGH','CRITICAL'].map(p=><option key={p}>{p}</option>)}</Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Assigned To</Label>
      <Select value={f.assigned_to_id||''} onChange={e=>onChange('assigned_to_id',e.target.value)} className="mt-1 h-8 text-sm">
        <option value="">— Unassigned —</option>{STAFF.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</Select></div>
    {!compact && <><div><Label className="text-xs text-slate-600 font-medium">Channel</Label>
      <Select value={f.channel_type||'Offline'} onChange={e=>onChange('channel_type',e.target.value)} className="mt-1 h-8 text-sm">
        <option>Digital</option><option>Offline</option></Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Source</Label>
      <Input value={f.source||''} onChange={e=>onChange('source',e.target.value)} placeholder="e.g. Website" className="mt-1 h-8 text-sm" /></div>
    <div><Label className="text-xs text-slate-600 font-medium">Est. Value</Label>
      <Input type="number" value={f.value||''} onChange={e=>onChange('value',e.target.value)} className="mt-1 h-8 text-sm" /></div>
    <div className="col-span-2"><Label className="text-xs text-slate-600 font-medium">Remarks</Label>
      <Textarea value={f.remarks||''} onChange={e=>onChange('remarks',e.target.value)} rows={2} className="mt-1 text-sm" /></div></>}
  </div>)
}

function FollowUpForm({ fields: f, onChange }: FormProps) {
  return (<div className="grid grid-cols-2 gap-3">
    <div className="col-span-2"><Label className="text-xs text-slate-600 font-medium">Client Name *</Label>
      <Input value={f.client_name||''} onChange={e=>onChange('client_name',e.target.value)} className="mt-1 h-8 text-sm" /></div>
    <div className="col-span-2"><Label className="text-xs text-slate-600 font-medium">Purpose *</Label>
      <Input value={f.purpose||''} onChange={e=>onChange('purpose',e.target.value)} className="mt-1 h-8 text-sm" /></div>
    <div><Label className="text-xs text-slate-600 font-medium">Due Date *</Label>
      <Input type="datetime-local" value={f.due_date||''} onChange={e=>onChange('due_date',e.target.value)} className="mt-1 h-8 text-sm" /></div>
    <div><Label className="text-xs text-slate-600 font-medium">Priority</Label>
      <Select value={f.priority||'MEDIUM'} onChange={e=>onChange('priority',e.target.value)} className="mt-1 h-8 text-sm">
        {['LOW','MEDIUM','HIGH'].map(p=><option key={p}>{p}</option>)}</Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Responsible *</Label>
      <Select value={f.responsible_id||''} onChange={e=>onChange('responsible_id',e.target.value)} className="mt-1 h-8 text-sm">
        <option value="">— Select —</option>{STAFF.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Linked Record</Label>
      <Input value={f.entity_id||''} onChange={e=>onChange('entity_id',e.target.value)} placeholder="Auto-linked from prior step" className="mt-1 h-8 text-sm bg-slate-50" /></div>
    <div className="col-span-2"><Label className="text-xs text-slate-600 font-medium">Expected Outcome</Label>
      <Textarea value={f.expected_outcome||''} onChange={e=>onChange('expected_outcome',e.target.value)} rows={2} className="mt-1 text-sm" /></div>
  </div>)
}

function VisitForm({ fields: f, onChange }: FormProps) {
  return (<div className="grid grid-cols-2 gap-3">
    <div><Label className="text-xs text-slate-600 font-medium">Client *</Label>
      <Select value={f.client_id||''} onChange={e=>onChange('client_id',e.target.value)} className="mt-1 h-8 text-sm">
        <option value="">— Select —</option>{MOCK_PARTIES.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Agent *</Label>
      <Select value={f.agent_id||''} onChange={e=>onChange('agent_id',e.target.value)} className="mt-1 h-8 text-sm">
        <option value="">— Select —</option>{AGENTS.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</Select></div>
    <div className="col-span-2"><Label className="text-xs text-slate-600 font-medium">Property *</Label>
      <Select value={f.property_id||''} onChange={e=>onChange('property_id',e.target.value)} className="mt-1 h-8 text-sm">
        <option value="">— Select —</option>{MOCK_PROPERTIES.map(p=><option key={p.id} value={p.id}>{p.short_loc} — {p.id}</option>)}</Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Date *</Label>
      <Input type="datetime-local" value={f.scheduled_date||''} onChange={e=>onChange('scheduled_date',e.target.value)} className="mt-1 h-8 text-sm" /></div>
    <div><Label className="text-xs text-slate-600 font-medium">Purpose</Label>
      <Select value={f.purpose||'Property Viewing'} onChange={e=>onChange('purpose',e.target.value)} className="mt-1 h-8 text-sm">
        <option>Property Viewing</option><option>Owner Meeting</option><option>Verification</option></Select></div>
    <div className="col-span-2"><Label className="text-xs text-slate-600 font-medium">Instructions</Label>
      <Textarea value={f.instructions||''} onChange={e=>onChange('instructions',e.target.value)} rows={2} className="mt-1 text-sm" /></div>
  </div>)
}

function RequirementForm({ fields: f, onChange }: FormProps) {
  return (<div className="grid grid-cols-2 gap-3">
    <div><Label className="text-xs text-slate-600 font-medium">Client *</Label>
      <Select value={f.client_id||''} onChange={e=>onChange('client_id',e.target.value)} className="mt-1 h-8 text-sm">
        <option value="">— Select —</option>{MOCK_PARTIES.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Category *</Label>
      <Select value={f.category||''} onChange={e=>onChange('category',e.target.value)} className="mt-1 h-8 text-sm">
        <option value="">— Select —</option>
        {['RENTAL_RESIDENTIAL','RENTAL_COMMERCIAL','BUY_SELL_FLAT','BUY_SELL_COMMERCIAL','PLOT'].map(c=><option key={c}>{c}</option>)}</Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Intent *</Label>
      <Select value={f.intent||''} onChange={e=>onChange('intent',e.target.value)} className="mt-1 h-8 text-sm">
        <option value="">— Select —</option><option>BUY</option><option>RENT</option><option>LEASE</option></Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Preferred Locations</Label>
      <Select value="" onChange={e => { if (e.target.value) { const cur = (f.preferred_short_locs || '').split(',').filter(Boolean); if (!cur.includes(e.target.value)) onChange('preferred_short_locs', [...cur, e.target.value].join(',')); }}} className="mt-1 h-8 text-sm">
        <option value="">+ Add location</option>{SHORT_LOCS.map(l=><option key={l}>{l}</option>)}</Select>
      {f.preferred_short_locs && <div className="flex flex-wrap gap-1 mt-1">{f.preferred_short_locs.split(',').filter(Boolean).map(l=>(
        <span key={l} className="inline-flex items-center gap-0.5 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded">
          {l}<button type="button" onClick={()=>onChange('preferred_short_locs',f.preferred_short_locs!.split(',').filter(x=>x!==l).join(','))} className="ml-0.5 text-indigo-400 hover:text-indigo-700"><X size={8}/></button>
        </span>))}</div>}</div>
    <div><Label className="text-xs text-slate-600 font-medium">Min Budget (₹)</Label>
      <Input type="number" value={f.min_budget||''} onChange={e=>onChange('min_budget',e.target.value)} className="mt-1 h-8 text-sm" /></div>
    <div><Label className="text-xs text-slate-600 font-medium">Max Budget (₹)</Label>
      <Input type="number" value={f.max_budget||''} onChange={e=>onChange('max_budget',e.target.value)} className="mt-1 h-8 text-sm" /></div>
    <div><Label className="text-xs text-slate-600 font-medium">Timeline</Label>
      <Input value={f.timeline||''} onChange={e=>onChange('timeline',e.target.value)} placeholder="e.g. Within 3 months" className="mt-1 h-8 text-sm" /></div>
    <div><Label className="text-xs text-slate-600 font-medium">Assigned To</Label>
      <Select value={f.assigned_to_id||''} onChange={e=>onChange('assigned_to_id',e.target.value)} className="mt-1 h-8 text-sm">
        <option value="">— Unassigned —</option>{STAFF.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</Select></div>
    <div className="col-span-2"><Label className="text-xs text-slate-600 font-medium">Remarks</Label>
      <Textarea value={f.remarks||''} onChange={e=>onChange('remarks',e.target.value)} rows={2} className="mt-1 text-sm" /></div>
  </div>)
}

function OpportunityForm({ fields: f, onChange }: FormProps) {
  return (<div className="grid grid-cols-2 gap-3">
    <div><Label className="text-xs text-slate-600 font-medium">Property *</Label>
      <Select value={f.property_id||''} onChange={e=>onChange('property_id',e.target.value)} className="mt-1 h-8 text-sm">
        <option value="">— Select —</option>{MOCK_PROPERTIES.map(p=><option key={p.id} value={p.id}>{p.short_loc} — {p.id}</option>)}</Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Client *</Label>
      <Select value={f.client_id||''} onChange={e=>onChange('client_id',e.target.value)} className="mt-1 h-8 text-sm">
        <option value="">— Select —</option>{MOCK_PARTIES.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Expected Value (₹) *</Label>
      <Input type="number" value={f.expected_value||''} onChange={e=>onChange('expected_value',e.target.value)} className="mt-1 h-8 text-sm" /></div>
    <div><Label className="text-xs text-slate-600 font-medium">Probability (%)</Label>
      <Input type="number" value={f.probability||'20'} onChange={e=>onChange('probability',e.target.value)} min="0" max="100" className="mt-1 h-8 text-sm" /></div>
    <div><Label className="text-xs text-slate-600 font-medium">Agent</Label>
      <Select value={f.agent_id||''} onChange={e=>onChange('agent_id',e.target.value)} className="mt-1 h-8 text-sm">
        <option value="">— Select —</option>{AGENTS.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Stage</Label>
      <Select value={f.stage||'QUALIFIED'} onChange={e=>onChange('stage',e.target.value)} className="mt-1 h-8 text-sm">
        {VALID_STAGES.map(s=><option key={s}>{s}</option>)}</Select></div>
  </div>)
}

function UpdateStageForm({ fields: f, onChange }: FormProps) {
  return (<div className="grid grid-cols-2 gap-3">
    <div className="col-span-2"><Label className="text-xs text-slate-600 font-medium">Opportunity *</Label>
      <Select value={f.opportunity_id||''} onChange={e=>onChange('opportunity_id',e.target.value)} className="mt-1 h-8 text-sm">
        <option value="">— Select —</option>
        {MOCK_PIPELINE_OPPORTUNITIES.map(o=><option key={o.id} value={o.id}>{o.id} — {o.client_name} @ {o.property_short_loc} ({o.stage})</option>)}</Select></div>
    <div className="col-span-2"><Label className="text-xs text-slate-600 font-medium">New Stage *</Label>
      <Select value={f.new_stage||''} onChange={e=>onChange('new_stage',e.target.value)} className="mt-1 h-8 text-sm">
        <option value="">— Select —</option>{VALID_STAGES.map(s=><option key={s}>{s}</option>)}</Select></div>
  </div>)
}

function CampaignForm({ fields: f, onChange }: FormProps) {
  return (<div className="grid grid-cols-2 gap-3">
    <div className="col-span-2"><Label className="text-xs text-slate-600 font-medium">Campaign Name *</Label>
      <Input value={f.campaign_name||''} onChange={e=>onChange('campaign_name',e.target.value)} className="mt-1 h-8 text-sm" /></div>
    <div><Label className="text-xs text-slate-600 font-medium">Type *</Label>
      <Select value={f.type||''} onChange={e=>onChange('type',e.target.value)} className="mt-1 h-8 text-sm">
        <option value="">— Select —</option>
        {['Property Promotion','Buyer Acquisition','Seller Acquisition','Tenant Acquisition','Landlord Acquisition','Investor Acquisition','Brand Awareness','Lead Generation'].map(t=><option key={t}>{t}</option>)}</Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Status</Label>
      <Select value={f.status||'Planned'} onChange={e=>onChange('status',e.target.value)} className="mt-1 h-8 text-sm">
        {['Draft','Planned','Active','Paused','Completed','Cancelled'].map(s=><option key={s}>{s}</option>)}</Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Start Date *</Label>
      <Input type="date" value={f.start_date||''} onChange={e=>onChange('start_date',e.target.value)} className="mt-1 h-8 text-sm" /></div>
    <div><Label className="text-xs text-slate-600 font-medium">End Date</Label>
      <Input type="date" value={f.end_date||''} onChange={e=>onChange('end_date',e.target.value)} className="mt-1 h-8 text-sm" /></div>
    <div><Label className="text-xs text-slate-600 font-medium">Owner</Label>
      <Select value={f.owner_id||''} onChange={e=>onChange('owner_id',e.target.value)} className="mt-1 h-8 text-sm">
        <option value="">— Select —</option>{STAFF.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Budget (₹)</Label>
      <Input type="number" value={f.planned_budget||''} onChange={e=>onChange('planned_budget',e.target.value)} className="mt-1 h-8 text-sm" /></div>
    <div className="col-span-2"><Label className="text-xs text-slate-600 font-medium">Objective</Label>
      <Textarea value={f.objective||''} onChange={e=>onChange('objective',e.target.value)} rows={2} className="mt-1 text-sm" /></div>
  </div>)
}

function TaskForm({ fields: f, onChange }: FormProps) {
  return (<div className="grid grid-cols-2 gap-3">
    <div className="col-span-2"><Label className="text-xs text-slate-600 font-medium">Title *</Label>
      <Input value={f.title||''} onChange={e=>onChange('title',e.target.value)} className="mt-1 h-8 text-sm" /></div>
    <div><Label className="text-xs text-slate-600 font-medium">Type</Label>
      <Select value={f.task_type||'Internal'} onChange={e=>onChange('task_type',e.target.value)} className="mt-1 h-8 text-sm">
        {['Internal','Verification','Documentation','Admin','Other'].map(t=><option key={t}>{t}</option>)}</Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Priority</Label>
      <Select value={f.priority||'MEDIUM'} onChange={e=>onChange('priority',e.target.value)} className="mt-1 h-8 text-sm">
        {['LOW','MEDIUM','HIGH','CRITICAL'].map(p=><option key={p}>{p}</option>)}</Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Assigned To *</Label>
      <Select value={f.assigned_to_id||''} onChange={e=>onChange('assigned_to_id',e.target.value)} className="mt-1 h-8 text-sm">
        <option value="">— Select —</option>{STAFF.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Due Date *</Label>
      <Input type="datetime-local" value={f.due_date||''} onChange={e=>onChange('due_date',e.target.value)} className="mt-1 h-8 text-sm" /></div>
    <div><Label className="text-xs text-slate-600 font-medium">Linked Record</Label>
      <Input value={f.linked_record||''} onChange={e=>onChange('linked_record',e.target.value)} placeholder="e.g. Lead:L-1001" className="mt-1 h-8 text-sm" /></div>
    <div className="col-span-2"><Label className="text-xs text-slate-600 font-medium">Description</Label>
      <Textarea value={f.description||''} onChange={e=>onChange('description',e.target.value)} rows={2} className="mt-1 text-sm" /></div>
  </div>)
}

const FORM_COMPONENTS: Record<WriteIntent, React.ComponentType<FormProps>> = {
  create_lead: LeadForm, create_followup: FollowUpForm, schedule_visit: VisitForm,
  create_requirement: RequirementForm, create_opportunity: OpportunityForm,
  update_deal_stage: UpdateStageForm, create_campaign: CampaignForm, create_task: TaskForm,
}

// ════════════════════════════════════════════════════════════════════════════════
// ── RECORD CREATION FUNCTIONS ─────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════

function runMatchingEngine(req: FullRequirementRow): { matches: MatchRow[]; summary: string } {
  const matches: MatchRow[] = []
  for (const prop of MOCK_PROPERTIES) {
    if (prop.category !== req.category) continue
    if (!['AVAILABLE', 'NEW', 'UNDER_NEGOTIATION'].includes(prop.status)) continue
    const breakdown: Record<string, string> = {}; let score = 0
    const locMatch = req.preferred_short_locs.includes(prop.short_loc); const altMatch = req.alternate_locs?.includes(prop.short_loc)
    if (locMatch) { score += 40; breakdown.location = 'PASS' } else if (altMatch) { score += 25; breakdown.location = 'WARNING (alternate location)' } else { score += 10; breakdown.location = `WARNING (different area: ${prop.short_loc})` }
    if (req.min_budget != null && req.max_budget != null) { if (prop.price >= req.min_budget && prop.price <= req.max_budget) { score += 30; breakdown.budget = 'PASS' } else if (prop.price <= req.max_budget * 1.1) { score += 20; breakdown.budget = `WARNING (${Math.round(((prop.price - req.max_budget) / req.max_budget) * 100)}% over max)` } else { score += 5; breakdown.budget = 'FAIL (out of budget range)' } } else { score += 15; breakdown.budget = 'WARNING (no budget specified)' }
    score += 20; breakdown.type = 'PASS'
    if (prop.status === 'AVAILABLE' || prop.status === 'NEW') { score += 10; breakdown.availability = 'PASS' } else { score += 5; breakdown.availability = `WARNING (${prop.status.toLowerCase()})` }
    if (score < 50) continue
    matches.push({ id: `M-AI${Date.now().toString().slice(-4)}-${prop.id}`, requirement_id: req.id, client_name: req.client_name, property_id: prop.id, short_loc: prop.short_loc, property_category: prop.category, property_price: prop.price, score, tier: score >= 90 ? 'HIGH' : score >= 75 ? 'GOOD' : 'POSSIBLE', status: 'SUGGESTED', score_breakdown: breakdown })
  }
  matches.sort((a, b) => b.score - a.score)
  const high = matches.filter(m => m.tier === 'HIGH').length; const good = matches.filter(m => m.tier === 'GOOD').length; const possible = matches.filter(m => m.tier === 'POSSIBLE').length
  const parts: string[] = []; if (high > 0) parts.push(`${high} High`); if (good > 0) parts.push(`${good} Good`); if (possible > 0) parts.push(`${possible} Possible`)
  return { matches, summary: matches.length > 0 ? `Found ${matches.length} matching ${matches.length === 1 ? 'property' : 'properties'} \u2014 ${parts.join(', ')}.` : 'No matching properties found.' }
}

function createLeadRecord(f: Record<string, string>): { id: string; label: string } {
  let party = MOCK_PARTIES.find(p => p.name.toLowerCase() === f.party_name?.toLowerCase() || (f.phone && p.mobile?.replace(/\D/g, '') === f.phone?.replace(/\D/g, '')))
  if (!party) { const np: PartyRow = { id: `p-ai-${Date.now().toString(36)}`, name: f.party_name||'Unknown', email: null, mobile: f.phone||'', city: null, roles: [f.lead_type||'BUYER'], status: 'Active', source: 'AI Assistant', leads_count: 0, requirements_count: 0, opportunities_count: 0, updated_at: new Date().toISOString() }; MOCK_PARTIES.push(np); party = np }
  const assignedUser = f.assigned_to_id ? MOCK_USERS.find(u => u.id === f.assigned_to_id) : f.assigned_to_name ? findUser(f.assigned_to_name) : null
  const id = `L-${Date.now().toString(36).toUpperCase().slice(-8)}`
  const record: LeadRow = { id, party_id: party.id, party_name: party.name, channel_type: (f.channel_type as any)||'Offline', source: f.source||'AI Assistant', lead_type: f.lead_type||'BUYER', status: 'NEW', priority: (f.priority as any)||'MEDIUM', assigned_to_id: assignedUser?.id||null, assigned_to_name: assignedUser?.name||null, value: f.value ? parseFloat(f.value) : null, remarks: f.remarks||null, campaign_id: null, campaign_name: null, referral_partner_id: null, referral_partner_name: null, referral_code: null, ad_reference: null, enquiry_at: new Date().toISOString(), last_activity_at: new Date().toISOString(), next_follow_up_at: null, created_at: new Date().toISOString() }
  MOCK_LEADS.unshift(record)
  return { id, label: `Created Lead ${id} for ${record.party_name}` }
}

function createFollowUpRecord(f: Record<string, string>): { id: string; label: string } {
  const responsible = f.responsible_id ? MOCK_USERS.find(u => u.id === f.responsible_id) : findUser(f.responsible_name || '')
  const entityId = f.entity_id || 'L-1001'
  let entityType: FollowUpRow['entity_type'] = 'Lead'
  if (entityId.startsWith('R-')) entityType = 'Requirement'; else if (entityId.startsWith('OPP-')) entityType = 'Opportunity'
  const id = `FU-${Date.now().toString().slice(-4)}`
  const record: FollowUpRow = { id, client_name: f.client_name||'Client', entity_type: entityType, entity_id: entityId, purpose: f.purpose||'Follow-up', priority: (f.priority as any)||'MEDIUM', due_date: f.due_date ? new Date(f.due_date).toISOString() : new Date().toISOString(), status: 'PENDING', responsible_name: responsible?.name||'Neha Kapoor', responsible_id: responsible?.id, expected_outcome: f.expected_outcome||null, created_at: new Date().toISOString() }
  MOCK_FOLLOW_UPS.unshift(record)
  return { id, label: `Created Follow-up ${id} for ${record.client_name}` }
}

function createVisitRecord(f: Record<string, string>): { id: string; label: string } {
  const agent = MOCK_USERS.find(u => u.id === f.agent_id) || AGENTS[0]; const prop = MOCK_PROPERTIES.find(p => p.id === f.property_id) || MOCK_PROPERTIES[0]; const client = MOCK_PARTIES.find(p => p.id === f.client_id) || MOCK_PARTIES[0]
  const id = `V-AI${Date.now().toString().slice(-4)}`
  const record: VisitRow = { id, property_id: prop.id, property_short_loc: prop.short_loc, client_id: client.id, client_name: client.name, agent_id: agent.id, agent_name: agent.name, purpose: (f.purpose as VisitRow['purpose'])||'Property Viewing', status: 'Assigned', scheduled_date: f.scheduled_date ? new Date(f.scheduled_date).toISOString() : new Date().toISOString(), instructions: f.instructions||undefined, checklist_template: 'Standard Residential', created_at: new Date().toISOString() }
  MOCK_VISITS.unshift(record)
  return { id, label: `Scheduled Visit ${id} at ${record.property_short_loc}` }
}

function createRequirementRecord(f: Record<string, string>): { id: string; label: string; extra?: string } {
  const client = MOCK_PARTIES.find(p => p.id === f.client_id) || MOCK_PARTIES[0]; const assignedUser = f.assigned_to_id ? MOCK_USERS.find(u => u.id === f.assigned_to_id) : null
  const locs = (f.preferred_short_locs || '').split(',').filter(Boolean); const id = `R-${Date.now().toString().slice(-4)}`
  const record: FullRequirementRow = { id, client_id: client.id, client_name: client.name, assigned_to_id: assignedUser?.id||null, assigned_to_name: assignedUser?.name||null, category: f.category, intent: f.intent, preferred_short_locs: locs.length > 0 ? locs : ['01-Schm140_Mayank'], alternate_locs: [], min_budget: f.min_budget ? parseFloat(f.min_budget) : null, max_budget: f.max_budget ? parseFloat(f.max_budget) : null, min_area: null, max_area: null, timeline: f.timeline||null, facilities: [], status: 'NEW', remarks: f.remarks||null, created_at: new Date().toISOString() }
  MOCK_REQUIREMENTS.unshift(record)
  const { matches, summary } = runMatchingEngine(record); for (const m of matches) MOCK_MATCHES.push(m)
  return { id, label: `Created Requirement ${id} for ${record.client_name}`, extra: summary }
}

function createOpportunityRecord(f: Record<string, string>): { id: string; label: string } {
  const prop = MOCK_PROPERTIES.find(p => p.id === f.property_id) || MOCK_PROPERTIES[0]; const client = MOCK_PARTIES.find(p => p.id === f.client_id) || MOCK_PARTIES[0]; const agent = f.agent_id ? MOCK_USERS.find(u => u.id === f.agent_id) : AGENTS[0]
  const id = `OPP-${Date.now().toString().slice(-4)}`
  const record: PipelineOpportunityRow = { id, property_id: prop.id, property_short_loc: prop.short_loc, client_id: client.id, client_name: client.name, stage: (f.stage as PipelineOpportunityRow['stage'])||'QUALIFIED', expected_value: parseFloat(f.expected_value)||0, probability: parseInt(f.probability)||20, agent_id: agent?.id||'u3', agent_name: agent?.name||'Ravi Mehta', negotiation_history: [], created_at: new Date().toISOString() }
  MOCK_PIPELINE_OPPORTUNITIES.unshift(record)
  return { id, label: `Created Opportunity ${id} \u2014 ${record.client_name} @ ${record.property_short_loc}` }
}

function updateDealStageRecord(f: Record<string, string>): { id: string; label: string } {
  const opp = MOCK_PIPELINE_OPPORTUNITIES.find(o => o.id === f.opportunity_id); if (!opp) throw new Error(`Opportunity ${f.opportunity_id} not found`)
  const old = opp.stage; opp.stage = f.new_stage as PipelineOpportunityRow['stage']; if (opp.stage === 'WON' || opp.stage === 'LOST') opp.closed_at = new Date().toISOString()
  return { id: opp.id, label: `Updated ${opp.id} from ${old} \u2192 ${opp.stage}` }
}

function createCampaignRecord(f: Record<string, string>): { id: string; label: string } {
  const owner = f.owner_id ? MOCK_USERS.find(u => u.id === f.owner_id) : STAFF[0]
  const id = `CMP-${new Date().getFullYear()}-${String(MOCK_CAMPAIGNS.length + 1).padStart(3, '0')}`
  const record: CampaignRow = { id, name: f.campaign_name||'Campaign', type: f.type as any, status: (f.status as any)||'Planned', start_date: f.start_date, end_date: f.end_date||f.start_date, owner_id: owner?.id||'u1', owner_name: owner?.name||'Aman Desai', objective: f.objective||'', target_audience: ['Buyers'], geography: 'Indore Metro Region', categories: ['Residential'], transaction_types: ['Sale'], planned_budget: parseFloat(f.planned_budget)||0, target_leads: 0, target_qualified_leads: 0, target_opportunities: 0, promoted_properties: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  MOCK_CAMPAIGNS.unshift(record)
  return { id, label: `Created Campaign ${id} "${record.name}"` }
}

function createTaskRecord(f: Record<string, string>): { id: string; label: string } {
  const assigned = f.assigned_to_id ? MOCK_USERS.find(u => u.id === f.assigned_to_id) : findUser(f.assigned_to_name || '')
  let linkedType: TaskRow['linked_record_type'] = null; let linkedId: string | null = null; let linkedLabel: string | null = null
  if (f.linked_record) { const parts = f.linked_record.split(':'); linkedType = parts[0] as TaskRow['linked_record_type']; linkedId = parts[1] || null; linkedLabel = f.linked_record }
  const id = `T-${Date.now().toString().slice(-3)}`
  const record: TaskRow = { id, title: f.title||'Task', task_type: (f.task_type as TaskRow['task_type'])||'Internal', assigned_to_name: assigned?.name||'Staff', assigned_to_id: assigned?.id, due_date: f.due_date ? new Date(f.due_date).toISOString() : new Date().toISOString(), priority: (f.priority as any)||'MEDIUM', status: 'TODO', linked_record_type: linkedType, linked_record_id: linkedId, linked_record_label: linkedLabel, description: f.description||undefined, created_at: new Date().toISOString() }
  MOCK_TASKS.unshift(record)
  return { id, label: `Created Task ${id} "${record.title}"` }
}

function executeAction(at: WriteIntent, f: Record<string, string>): { id: string; label: string; extra?: string } {
  switch (at) {
    case 'create_lead': return createLeadRecord(f)
    case 'create_followup': return createFollowUpRecord(f)
    case 'schedule_visit': return createVisitRecord(f)
    case 'create_requirement': return createRequirementRecord(f)
    case 'create_opportunity': return createOpportunityRecord(f)
    case 'update_deal_stage': return updateDealStageRecord(f)
    case 'create_campaign': return createCampaignRecord(f)
    case 'create_task': return createTaskRecord(f)
  }
}

// ── Dependency injection: pass results from prior steps into dependent fields ─

function injectDependency(depStep: WorkflowStepState, priorResult: { id: string; label: string }, priorFields: Record<string, string>): void {
  const depType = depStep.action_type
  const priorId = priorResult.id

  // Carry client_name / party_name from prior step
  if (priorFields.party_name) {
    if (depType === 'create_followup' && !depStep.fields.client_name) depStep.fields.client_name = priorFields.party_name
    if (depType === 'schedule_visit' || depType === 'create_requirement' || depType === 'create_opportunity') {
      if (!depStep.fields.client_id) { const p = findParty(priorFields.party_name); if (p) depStep.fields.client_id = p.id }
    }
  }
  if (priorFields.client_name) {
    if (depType === 'create_followup' && !depStep.fields.client_name) depStep.fields.client_name = priorFields.client_name
    if ((depType === 'schedule_visit' || depType === 'create_requirement' || depType === 'create_opportunity') && !depStep.fields.client_id) { const p = findParty(priorFields.client_name); if (p) depStep.fields.client_id = p.id }
  }

  // Link entity_id for follow-ups
  if (depType === 'create_followup') depStep.fields.entity_id = priorId

  // Pass property_id from opportunity to visit
  if (priorFields.property_id) {
    if (depType === 'schedule_visit' && !depStep.fields.property_id) depStep.fields.property_id = priorFields.property_id
  }

  // Pass assigned_to / agent from prior step
  if (priorFields.assigned_to_id) {
    if (depType === 'create_followup' && !depStep.fields.responsible_id) depStep.fields.responsible_id = priorFields.assigned_to_id
    if (depType === 'schedule_visit' && !depStep.fields.agent_id) depStep.fields.agent_id = priorFields.assigned_to_id
  }

  // linked_record for tasks
  if (depType === 'create_task') {
    const typeMap: Record<string, string> = { create_lead: 'Lead', create_requirement: 'Requirement', create_opportunity: 'Opportunity' }
    if (typeMap[priorFields._action_type || '']) depStep.fields.linked_record = `${typeMap[priorFields._action_type || '']}:${priorId}`
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// ── SINGLE-ACTION PROPOSAL CARD ───────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════

function ProposalCard({ proposal, duplicates, onApprove, onCancel }: {
  proposal: ActionProposal; duplicates: DuplicateCandidate[]
  onApprove: (f: Record<string, string>) => void; onCancel: () => void
}) {
  const [editFields, setEditFields] = useState<Record<string, string>>(() => resolveIds({ ...proposal.fields } as Record<string, string>, proposal.action_type))
  const [isApproving, setIsApproving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleChange = (k: string, v: string) => { setEditFields(prev => ({ ...prev, [k]: v })); setErrors([]) }

  if (proposal.status === 'approved') return <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4"><div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 size={16}/><span className="text-sm font-semibold">Approved and created.</span></div></div>
  if (proposal.status === 'cancelled') return <div className="border border-slate-200 bg-slate-50 rounded-xl p-4 opacity-60"><div className="flex items-center gap-2 text-slate-500"><X size={16}/><span className="text-sm">Cancelled.</span></div></div>

  const meta = ACTION_META[proposal.action_type]; const FormComponent = FORM_COMPONENTS[proposal.action_type]
  return (
    <div className={`border rounded-xl overflow-hidden ${meta.borderColor} shadow-sm`}>
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${meta.color} ${meta.borderColor}`}><meta.icon size={16} className="shrink-0"/><span className="font-semibold text-sm">{meta.label}</span><span className="ml-auto text-xs opacity-70 flex items-center gap-1"><Edit3 size={11}/>Editable</span></div>
      {duplicates.length > 0 && <div className="bg-amber-50 border-b border-amber-200 px-4 py-3"><div className="flex items-start gap-2"><AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5"/><div><p className="text-xs font-semibold text-amber-800">Possible duplicate</p><ul className="mt-1 space-y-0.5">{duplicates.map(d=><li key={d.id} className="text-xs text-amber-700">{'\u2022'} {d.name} ({d.mobile||'no phone'}) \u2014 {d.existing_lead_count??0} lead(s)</li>)}</ul></div></div></div>}
      <div className="px-4 py-4 bg-white">
        <FormComponent fields={editFields} onChange={handleChange}/>
        {errors.length > 0 && <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">{errors.map(e=><div key={e}>{'\u2022'} {e}</div>)}</div>}
        <div className="flex items-center gap-2 mt-4">
          <Button onClick={() => { setIsApproving(true); onApprove(editFields) }} disabled={isApproving} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-sm h-9">{isApproving ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>}Approve & {proposal.action_type === 'update_deal_stage' ? 'Update' : 'Create'}</Button>
          <Button onClick={onCancel} variant="outline" disabled={isApproving} className="text-slate-600 gap-1.5 text-sm h-9"><X size={14}/>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// ── WORKFLOW CARD (multi-step) ────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════

function resolveIds(f: Record<string, string>, actionType: WriteIntent): Record<string, string> {
  if (f.assigned_to_name && !f.assigned_to_id) { const u = findUser(f.assigned_to_name); if (u) f.assigned_to_id = u.id }
  if (f.responsible_name && !f.responsible_id) { const u = findUser(f.responsible_name); if (u) f.responsible_id = u.id }
  if (f.agent_name && !f.agent_id) { const u = findUser(f.agent_name); if (u) f.agent_id = u.id }
  if (f.client_name && !f.client_id) { const p = findParty(f.client_name); if (p) f.client_id = p.id }
  if (f.property_short_loc && !f.property_id) { const p = findProp(f.property_short_loc); if (p) f.property_id = p.id }
  if (f.owner_name && !f.owner_id) { const u = findUser(f.owner_name); if (u) f.owner_id = u.id }
  if (f.due_date && !f.due_date.includes('T')) f.due_date += 'T10:00'
  if (f.scheduled_date && !f.scheduled_date.includes('T')) f.scheduled_date += 'T11:00'
  f.priority = f.priority || 'MEDIUM'; f.channel_type = f.channel_type || 'Offline'
  f.purpose = f.purpose || (actionType === 'schedule_visit' ? 'Property Viewing' : f.purpose || '')
  f.stage = f.stage || 'QUALIFIED'; f.status = f.status || (actionType === 'create_campaign' ? 'Planned' : ''); f.task_type = f.task_type || 'Internal'
  return f
}

function WorkflowCard({ workflow, onApprove, onCancel }: {
  workflow: WorkflowProposal
  onApprove: (steps: WorkflowStepState[]) => void
  onCancel: () => void
}) {
  const [steps, setSteps] = useState<WorkflowStepState[]>(() =>
    workflow.steps.map(s => ({ ...s, fields: resolveIds({ ...s.fields } as Record<string, string>, s.action_type) as Record<string, string> }))
  )
  const [isApproving, setIsApproving] = useState(false)

  const toggleExclude = (idx: number) => {
    setSteps(prev => {
      const next = prev.map((s, i) => i === idx ? { ...s, excluded: !s.excluded } : s)
      // If excluding a step, also exclude dependent steps
      if (next[idx].excluded) {
        for (let i = idx + 1; i < next.length; i++) {
          if (next[i].depends_on === idx) next[i] = { ...next[i], excluded: true }
        }
      }
      return next
    })
  }

  const updateField = (idx: number, k: string, v: string) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, fields: { ...s.fields, [k]: v } } : s))
  }

  if (workflow.status === 'approved') return <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4"><div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 size={16}/><span className="text-sm font-semibold">Workflow approved and executed.</span></div></div>
  if (workflow.status === 'cancelled') return <div className="border border-slate-200 bg-slate-50 rounded-xl p-4 opacity-60"><div className="flex items-center gap-2 text-slate-500"><X size={16}/><span className="text-sm">Workflow cancelled.</span></div></div>

  const activeSteps = steps.filter(s => !s.excluded)

  return (
    <div className="border border-indigo-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border-b border-indigo-200 text-indigo-700">
        <Link2 size={16} className="shrink-0"/>
        <span className="font-semibold text-sm">Proposed Workflow \u2014 {activeSteps.length} step{activeSteps.length !== 1 ? 's' : ''}</span>
        <span className="ml-auto text-xs opacity-70 flex items-center gap-1"><Edit3 size={11}/>Editable</span>
      </div>

      <div className="bg-white">
        {steps.map((step, idx) => {
          const meta = ACTION_META[step.action_type]
          const FormComponent = FORM_COMPONENTS[step.action_type]
          const hasDep = step.depends_on != null
          const depExcluded = hasDep && steps[step.depends_on!]?.excluded

          return (
            <div key={idx}>
              {/* Dependency connector */}
              {hasDep && !step.excluded && (
                <div className="flex items-center gap-2 px-6 py-1.5 bg-slate-50 border-y border-slate-100">
                  <ChevronRight size={12} className="text-indigo-400"/>
                  <span className="text-[11px] text-indigo-500 font-medium flex items-center gap-1">
                    <Link2 size={10}/>{step.dependency_description || `Linked to Step ${(step.depends_on ?? 0) + 1}`}
                  </span>
                  {depExcluded && <span className="text-[10px] text-red-500 font-semibold ml-1">\u26a0 dependency excluded!</span>}
                </div>
              )}

              {/* Step card */}
              <div className={`border-b last:border-b-0 ${step.excluded ? 'opacity-40 bg-slate-50' : ''}`}>
                <div className={`flex items-center gap-2 px-4 py-2.5 ${meta.color} ${meta.borderColor} border-b`}>
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-current flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</div>
                  <meta.icon size={14} className="shrink-0"/>
                  <span className="font-semibold text-sm">{meta.label}</span>
                  {step.excluded && <span className="text-xs flex items-center gap-1 ml-1"><SkipForward size={11}/>Excluded</span>}
                  <button onClick={() => toggleExclude(idx)} className={`ml-auto text-xs px-2 py-0.5 rounded border transition-colors ${step.excluded ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100' : 'bg-white border-slate-300 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300'}`}>
                    {step.excluded ? 'Include' : 'Exclude'}
                  </button>
                </div>
                {!step.excluded && (
                  <div className="px-4 py-3">
                    <FormComponent fields={step.fields} onChange={(k, v) => updateField(idx, k, v)} compact={true}/>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer: Approve All / Cancel */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-t border-indigo-200">
        <Button onClick={() => { setIsApproving(true); onApprove(steps) }} disabled={isApproving || activeSteps.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-sm h-9">
          {isApproving ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>}
          Approve {activeSteps.length} Step{activeSteps.length !== 1 ? 's' : ''}
        </Button>
        <Button onClick={onCancel} variant="outline" disabled={isApproving} className="text-slate-600 gap-1.5 text-sm h-9"><X size={14}/>Cancel All</Button>
        {activeSteps.length === 0 && <span className="text-xs text-red-500 ml-2">All steps excluded \u2014 include at least one to approve</span>}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// ── WORKFLOW RESULT DISPLAY ───────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════

function WorkflowResultCard({ result }: { result: WorkflowResult }) {
  return (
    <div className={`border rounded-xl overflow-hidden ${result.all_succeeded ? 'border-emerald-200' : 'border-amber-200'}`}>
      <div className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold ${result.all_succeeded ? 'bg-emerald-50 text-emerald-700 border-b border-emerald-200' : 'bg-amber-50 text-amber-700 border-b border-amber-200'}`}>
        {result.all_succeeded ? <><CheckCircle2 size={16}/>Workflow completed successfully</> : <><AlertTriangle size={16}/>Workflow partially completed</>}
      </div>
      <div className="bg-white divide-y divide-slate-100">
        {result.steps.map((s, i) => {
          const meta = ACTION_META[s.action_type]
          const statusIcon = s.status === 'success' ? <CheckCircle2 size={14} className="text-emerald-500"/> : s.status === 'failed' ? <AlertCircle size={14} className="text-red-500"/> : <SkipForward size={14} className="text-slate-400"/>
          const statusColor = s.status === 'success' ? 'text-emerald-700' : s.status === 'failed' ? 'text-red-700' : 'text-slate-400'
          return (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${s.status === 'success' ? 'bg-emerald-100 text-emerald-700' : s.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-400'}`}>{s.step_index + 1}</div>
              {statusIcon}
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${statusColor}`}>{meta.label}</span>
                {s.label && <span className="text-xs text-slate-500 ml-2">{s.label}</span>}
                {s.extra && <div className="text-xs text-indigo-600 mt-0.5">\ud83d\udd0d {s.extra}</div>}
                {s.error && <div className="text-xs text-red-600 mt-0.5">\u274c {s.error}</div>}
                {s.status === 'skipped' && <span className="text-xs text-slate-400 ml-2">(skipped \u2014 prior step failed)</span>}
                {s.status === 'dep_excluded' && <span className="text-xs text-slate-400 ml-2">(excluded by user)</span>}
              </div>
              {s.status === 'success' && s.record_id && <Link href={meta.href} className="text-xs text-emerald-600 hover:underline flex items-center gap-1"><ExternalLink size={10}/>{s.record_id}</Link>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// ── MESSAGE BUBBLE ────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════

function MessageBubble({ msg, duplicates, onApprove, onCancel, onWorkflowApprove, onWorkflowCancel }: {
  msg: ChatMessage; duplicates: DuplicateCandidate[]
  onApprove: (id: string, f: Record<string, string>) => void; onCancel: (id: string) => void
  onWorkflowApprove: (id: string, steps: WorkflowStepState[]) => void; onWorkflowCancel: (id: string) => void
}) {
  const isUser = msg.role === 'user'; const isError = msg.role === 'error'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1 ${isError ? 'bg-red-100' : 'bg-amber-100'}`}>{isError ? <AlertCircle size={16} className="text-red-500"/> : <Bot size={16} className="text-amber-600"/>}</div>}
      <div className={`${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1 ${(msg.proposal || msg.workflow) ? 'w-full max-w-[92%]' : 'max-w-[78%]'}`}>
        {msg.content && <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'bg-amber-500 text-white rounded-br-sm' : isError ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm'}`}>
          {msg.loading ? <div className="flex items-center gap-2 text-slate-500"><Loader2 size={14} className="animate-spin"/><span>Thinking\u2026</span></div> : <div className="whitespace-pre-wrap">{msg.content}</div>}
        </div>}
        {msg.proposal && msg.proposal.status !== 'cancelled' && <div className="w-full mt-1"><ProposalCard proposal={msg.proposal} duplicates={duplicates} onApprove={f => onApprove(msg.id, f)} onCancel={() => onCancel(msg.id)}/></div>}
        {msg.workflow && <div className="w-full mt-1"><WorkflowCard workflow={msg.workflow} onApprove={steps => onWorkflowApprove(msg.id, steps)} onCancel={() => onWorkflowCancel(msg.id)}/></div>}
        {msg.workflowResult && <div className="w-full mt-1"><WorkflowResultCard result={msg.workflowResult}/></div>}
        {msg.confirmation && <div className="mt-1 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold"><CheckCircle2 size={16}/>{msg.confirmation.record_label}</div>
          <Link href={msg.confirmation.href} className="mt-1.5 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 underline"><ExternalLink size={11}/>View in {ACTION_META[msg.confirmation.action_type as WriteIntent]?.module || 'module'}</Link>
        </div>}
        {!isUser && !msg.loading && msg.data_queried && msg.data_queried !== 'None' && <div className="flex items-center gap-2 px-1"><span className="flex items-center gap-1 text-xs text-slate-400"><Database size={10}/>{msg.data_queried}</span>{msg.record_count !== undefined && <span className="text-xs text-slate-400">{'\u00b7'} {msg.record_count} record{msg.record_count!==1?'s':''}</span>}</div>}
        <span className="text-[10px] text-slate-400 px-1">{msg.timestamp.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
      </div>
      {isUser && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center ml-3 mt-1"><User size={16} className="text-white"/></div>}
    </div>
  )
}

// ── Session Log ───────────────────────────────────────────────────────────────

function SessionLog({ logs }: { logs: AiInteractionLog[] }) {
  const [open, setOpen] = useState(false)
  if (!logs.length) return null
  return (
    <div className="border-t border-slate-200 bg-slate-50">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-500 hover:text-slate-700">
        <span className="flex items-center gap-1.5"><Clock size={12}/>Session Log ({logs.length})</span>{open ? <ChevronDown size={12}/> : <ChevronUp size={12}/>}
      </button>
      {open && <div className="max-h-48 overflow-y-auto px-4 pb-3 space-y-2">{logs.map(l => (
        <div key={l.id} className="text-xs bg-white border border-slate-200 rounded p-2">
          <div className="font-medium text-slate-700 truncate">Q: {l.user_message}</div>
          <div className="text-slate-400 mt-0.5">{l.entity_queried} {'\u00b7'} {l.record_count} rec {'\u00b7'} {new Date(l.timestamp).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
        </div>))}</div>}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════

export default function AIAssistantPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome', role: 'assistant', timestamp: new Date(),
    content: `Hello! I\u2019m PropDesk AI. I can read all CRM data and perform **8 write actions** with your approval.

\u2728 **New: Multi-step workflows!** Try requests like:
\u2022 \u201cCreate a lead for X, assign to Priya, and schedule a follow-up for Friday\u201d
\u2022 \u201cCreate an opportunity for this client at MG Road and schedule a site visit\u201d

Every action shows a **Proposed card** you can edit, exclude, or approve. What can I help with?`,
  }])
  const [sessionLogs, setSessionLogs] = useState<AiInteractionLog[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [convoHistory, setConvoHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [pendingType, setPendingType] = useState<string | null>(null)
  const [pendingFields, setPendingFields] = useState<Record<string, string | null>>({})
  const [currentDupes, setCurrentDupes] = useState<DuplicateCandidate[]>([])

  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // ── Approve single action ───────────────────────────────────────────────────

  const handleApprove = useCallback((msgId: string, finalFields: Record<string, string>) => {
    setMessages(prev => {
      const msg = prev.find(m => m.id === msgId); if (!msg?.proposal) return prev
      const userEdits: Record<string, string | null> = {}
      for (const [k, v] of Object.entries(finalFields)) { if (msg.proposal.proposed_values[k] !== v) userEdits[k] = v }
      let result: { id: string; label: string; extra?: string }
      try { result = executeAction(msg.proposal.action_type, finalFields) } catch (err) { console.error(err); return prev }
      const editCount = Object.keys(userEdits).length
      let confirmText = `\u2705 Done! ${result.label}.`
      if (editCount > 0) confirmText += ` (Applied your ${editCount} edit${editCount!==1?'s':''}.)`
      if (result.extra) confirmText += `\n\n\ud83d\udd0d **Matching results:** ${result.extra}`
      const log = logAiInteraction({ user_message: msg.proposal.original_request, interpreted_intent: msg.proposal.action_type, entity_queried: msg.proposal.action_type, filters_applied: finalFields, record_count: 1, ai_response: result.label, user_id: user?.id, user_name: user?.name })
      setSessionLogs(s => [log, ...s])
      // Write to unified audit trail
      logAiAudit({ action_type: msg.proposal.action_type, entity_id: result.id, summary: result.label, user_id: user?.id, user_name: user?.name, user_role: user?.role, ai_trail: { original_request: msg.proposal.original_request, interpreted_intent: msg.proposal.action_type, proposed_values: { ...msg.proposal.proposed_values }, user_edits: userEdits, final_values: finalFields } })
      const meta = ACTION_META[msg.proposal!.action_type]
      const updated = prev.map(m => m.id === msgId ? { ...m, proposal: { ...m.proposal!, status: 'approved' as const, final_values: finalFields, user_edits: userEdits, created_record_id: result.id } } : m)
      setPendingType(null); setPendingFields({}); setCurrentDupes([])
      return [...updated, { id: `confirm-${Date.now()}`, role: 'assistant' as const, content: confirmText, timestamp: new Date(), confirmation: { action_type: msg.proposal!.action_type, record_id: result.id, record_label: result.label, href: meta.href } }]
    })
  }, [user])

  const handleCancel = useCallback((msgId: string) => {
    setMessages(prev => {
      setPendingType(null); setPendingFields({}); setCurrentDupes([])
      return [...prev.map(m => m.id === msgId ? { ...m, proposal: { ...m.proposal!, status: 'cancelled' as const } } : m), { id: `cancel-${Date.now()}`, role: 'assistant' as const, content: 'No problem \u2014 cancelled. Anything else?', timestamp: new Date() }]
    })
  }, [])

  // ── Approve workflow ────────────────────────────────────────────────────────

  const handleWorkflowApprove = useCallback((msgId: string, finalSteps: WorkflowStepState[]) => {
    setMessages(prev => {
      const msg = prev.find(m => m.id === msgId); if (!msg?.workflow) return prev

      const stepResults: WorkflowStepResult[] = []
      const completedResults: Map<number, { id: string; label: string; fields: Record<string, string> }> = new Map()
      let hasFailed = false

      for (let i = 0; i < finalSteps.length; i++) {
        const step = finalSteps[i]
        if (step.excluded) {
          stepResults.push({ step_index: i, action_type: step.action_type, status: 'dep_excluded' })
          continue
        }
        if (hasFailed) {
          stepResults.push({ step_index: i, action_type: step.action_type, status: 'skipped' })
          continue
        }
        // If this step depends on an excluded step, skip it
        if (step.depends_on != null && finalSteps[step.depends_on].excluded) {
          stepResults.push({ step_index: i, action_type: step.action_type, status: 'dep_excluded', error: `Dependency (Step ${step.depends_on + 1}) was excluded` })
          continue
        }
        // Inject dependency results from prior completed step
        if (step.depends_on != null) {
          const prior = completedResults.get(step.depends_on)
          if (prior) injectDependency(step, prior, { ...prior.fields, _action_type: finalSteps[step.depends_on].action_type })
        }

        try {
          const result = executeAction(step.action_type, step.fields)
          stepResults.push({ step_index: i, action_type: step.action_type, status: 'success', record_id: result.id, label: result.label, extra: result.extra })
          completedResults.set(i, { id: result.id, label: result.label, fields: step.fields })
        } catch (err) {
          stepResults.push({ step_index: i, action_type: step.action_type, status: 'failed', error: err instanceof Error ? err.message : 'Unknown error' })
          hasFailed = true
        }
      }

      const allSucceeded = stepResults.every(s => s.status === 'success' || s.status === 'dep_excluded')
      const successCount = stepResults.filter(s => s.status === 'success').length

      // Log entire workflow as one interaction
      const log = logAiInteraction({
        user_message: msg.workflow!.original_request,
        interpreted_intent: 'workflow',
        entity_queried: `workflow (${finalSteps.map(s => s.action_type).join(' → ')})`,
        filters_applied: { workflow_steps: stepResults.map(s => ({ ...s })) },
        record_count: successCount,
        ai_response: allSucceeded ? `Workflow completed: ${successCount} step(s) succeeded` : `Workflow partial: ${successCount} succeeded, ${stepResults.filter(s=>s.status==='failed').length} failed`,
        user_id: user?.id, user_name: user?.name,
      })
      setSessionLogs(s => [log, ...s])
      // Write each successful step to unified audit trail
      logAiWorkflowAudit({
        workflow_request: msg.workflow!.original_request,
        steps: stepResults.map((s, i) => ({ action_type: s.action_type, status: s.status, record_id: s.record_id, label: s.label, proposed_values: { ...finalSteps[i].proposed_values }, final_values: { ...finalSteps[i].fields } })),
        user_id: user?.id, user_name: user?.name, user_role: user?.role,
      })

      let confirmText = allSucceeded
        ? `\u2705 Workflow completed! All ${successCount} step${successCount!==1?'s':''} executed successfully.`
        : `\u26a0\ufe0f Workflow partially completed. ${successCount} step${successCount!==1?'s':''} succeeded.`

      const updated = prev.map(m => m.id === msgId ? { ...m, workflow: { ...m.workflow!, status: 'approved' as const } } : m)
      setPendingType(null); setPendingFields({})
      return [...updated, { id: `wf-result-${Date.now()}`, role: 'assistant' as const, content: confirmText, timestamp: new Date(), workflowResult: { steps: stepResults, all_succeeded: allSucceeded } }]
    })
  }, [user])

  const handleWorkflowCancel = useCallback((msgId: string) => {
    setMessages(prev => {
      setPendingType(null); setPendingFields({})
      return [...prev.map(m => m.id === msgId ? { ...m, workflow: { ...m.workflow!, status: 'cancelled' as const } } : m), { id: `wf-cancel-${Date.now()}`, role: 'assistant' as const, content: 'Workflow cancelled \u2014 nothing was created. Anything else?', timestamp: new Date() }]
    })
  }, [])

  // ── Send ────────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text?: string) => {
    const userText = (text ?? input).trim(); if (!userText || loading) return
    setInput(''); setLoading(true)
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: userText, timestamp: new Date() }
    const loadingId = `loading-${Date.now()}`
    setMessages(prev => [...prev, userMsg, { id: loadingId, role: 'assistant', content: '', loading: true, timestamp: new Date() }])

    try {
      const res = await fetch('/api/ai-agent', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, conversation_history: convoHistory, pending_action_type: pendingType, pending_action_fields: Object.keys(pendingFields).length > 0 ? pendingFields : null }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)

      // ── Workflow proposal ───────────────────────────────────────────────────

      if (data.workflow_proposal?.ready) {
        const wfSteps: WorkflowStepState[] = data.workflow_proposal.steps.map((s: WorkflowStep) => ({
          action_type: s.action_type,
          fields: { ...(s.extracted_fields || {}) } as Record<string, string>,
          proposed_values: { ...(s.extracted_fields || {}) } as Record<string, string>,
          depends_on: s.depends_on,
          dependency_description: s.dependency_description,
          excluded: false,
        }))
        const wfMsg: ChatMessage = { id: `wf-${Date.now()}`, role: 'assistant', content: data.answer, timestamp: new Date(), workflow: { status: 'pending', original_request: userText, steps: wfSteps } }
        setMessages(prev => prev.map(m => m.id === loadingId ? wfMsg : m))
        setPendingType(null); setPendingFields({})
        setConvoHistory(prev => [...prev, { role: 'user' as const, content: userText }, { role: 'assistant' as const, content: data.answer }].slice(-12))
        const log = logAiInteraction({ user_message: userText, interpreted_intent: 'workflow_proposed', entity_queried: 'workflow', filters_applied: {}, record_count: wfSteps.length, ai_response: data.answer, user_id: user?.id, user_name: user?.name })
        setSessionLogs(s => [log, ...s])
        return
      }

      // ── Single action proposal ──────────────────────────────────────────────

      if (data.action_proposal?.ready) {
        const ef = data.intent?.extracted_fields || data.action_proposal.fields
        let dupes: DuplicateCandidate[] = []
        if (data.action_proposal.action_type === 'create_lead') { dupes = detectDuplicates(ef.party_name||'', ef.phone); setCurrentDupes(dupes) }
        const proposalMsg: ChatMessage = { id: `proposal-${Date.now()}`, role: 'assistant', content: data.answer, timestamp: new Date(), proposal: { action_type: data.action_proposal.action_type, fields: ef, status: 'pending', original_request: userText, proposed_values: { ...ef }, user_edits: {} } }
        setMessages(prev => prev.map(m => m.id === loadingId ? proposalMsg : m))
        setPendingType(null); setPendingFields({})
        setConvoHistory(prev => [...prev, { role: 'user' as const, content: userText }, { role: 'assistant' as const, content: data.answer }].slice(-12))
        const log = logAiInteraction({ user_message: userText, interpreted_intent: data.action_proposal.action_type + '_proposed', entity_queried: data.action_proposal.action_type, filters_applied: ef, record_count: 0, ai_response: data.answer, user_id: user?.id, user_name: user?.name })
        setSessionLogs(s => [log, ...s])
        return
      }

      // ── Pending field collection ────────────────────────────────────────────

      if (data._pending_action_type) { setPendingType(data._pending_action_type); setPendingFields(data._pending_action_fields || {}) }
      else { setPendingType(null); setPendingFields({}) }

      // ── Regular response ────────────────────────────────────────────────────

      const aiMsg: ChatMessage = { id: `ai-${Date.now()}`, role: 'assistant', content: data.answer || 'No response.', data_queried: data.data_queried, record_count: data.record_count, timestamp: new Date() }
      setConvoHistory(prev => [...prev, { role: 'user' as const, content: userText }, { role: 'assistant' as const, content: data.answer }].slice(-12))
      const log = logAiInteraction({ user_message: userText, interpreted_intent: data.intent?.intent||'unknown', entity_queried: data.data_queried||'None', filters_applied: data.intent?.filters||{}, record_count: data.record_count??0, ai_response: data.answer, user_id: user?.id, user_name: user?.name })
      setSessionLogs(s => [log, ...s])
      setMessages(prev => prev.map(m => m.id === loadingId ? aiMsg : m))
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === loadingId ? { id: `err-${Date.now()}`, role: 'error' as const, content: err instanceof Error ? err.message : 'Something went wrong.', timestamp: new Date() } : m))
    } finally { setLoading(false); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [input, loading, convoHistory, pendingType, pendingFields, user])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }
  const clearChat = () => { setMessages([{ id: 'welcome-new', role: 'assistant', content: 'Chat cleared. What can I help with?', timestamp: new Date() }]); setConvoHistory([]); setPendingType(null); setPendingFields({}); setCurrentDupes([]) }

  return (
    <AppLayout>
      <div className="h-full flex flex-col max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow"><Sparkles size={20} className="text-white"/></div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">AI Assistant</h1>
              <p className="text-xs text-slate-500">
                8 actions {'\u00b7'} Multi-step workflows {'\u00b7'} Human-in-the-loop
                {pendingType && <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium"><Clock size={10}/> Collecting: {ACTION_META[pendingType as WriteIntent]?.label || pendingType}</span>}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={clearChat} className="text-slate-500 gap-1.5"><RefreshCw size={14}/>Clear</Button>
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-6">
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} duplicates={msg.proposal ? currentDupes : []} onApprove={handleApprove} onCancel={handleCancel} onWorkflowApprove={handleWorkflowApprove} onWorkflowCancel={handleWorkflowCancel}/>)}
            <div ref={endRef}/>
          </div>

          {messages.length <= 1 && (
            <div className="px-6 pb-4">
              <p className="text-xs text-slate-400 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">{SUGGESTED_QUERIES.map(q => (
                <button key={q} onClick={() => sendMessage(q)} disabled={loading} className="text-xs px-3 py-1.5 bg-slate-50 hover:bg-amber-50 hover:text-amber-700 border border-slate-200 hover:border-amber-200 rounded-full text-slate-600 transition-colors disabled:opacity-50">{q}</button>
              ))}</div>
            </div>
          )}

          <SessionLog logs={sessionLogs}/>

          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            {pendingType && <div className="mb-2 text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
              <AlertTriangle size={11}/><span>Collecting fields for <strong>{ACTION_META[pendingType as WriteIntent]?.label || pendingType}</strong></span></div>}
            <div className="flex items-end gap-3">
              <div className="flex-1 bg-white border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-amber-400 focus-within:border-amber-400 transition-all">
                <textarea ref={inputRef} rows={1} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder={pendingType ? 'Provide the requested info\u2026' : 'Ask anything, or describe a multi-step workflow\u2026'}
                  disabled={loading} className="w-full px-4 py-3 text-sm text-slate-800 placeholder-slate-400 bg-transparent resize-none focus:outline-none disabled:opacity-50"
                  style={{ maxHeight: '120px', minHeight: '44px' }}
                  onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 120)}px` }}/>
              </div>
              <Button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="bg-amber-500 hover:bg-amber-600 text-white h-11 w-11 p-0 rounded-xl flex-shrink-0">
                {loading ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">Human-in-the-loop {'\u00b7'} No record created without your approval {'\u00b7'} Enter to send</p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

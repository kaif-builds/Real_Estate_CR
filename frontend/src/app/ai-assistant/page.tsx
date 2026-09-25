'use client'

/**
 * AI Assistant — Part 3 (8 Write Actions + Matching Engine)
 *
 * Supported WRITE actions (all with human-in-the-loop approval):
 * 1. create_lead          5. create_opportunity
 * 2. create_followup      6. update_deal_stage
 * 3. schedule_visit       7. create_campaign
 * 4. create_requirement   8. create_task
 *
 * After create_requirement: auto-runs matching engine against inventory,
 * shows summary of top matches by tier.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bot, Send, User, Loader2, AlertCircle, RefreshCw,
  Database, Sparkles, ChevronDown, ChevronUp, Clock,
  CheckCircle2, X, Edit3, ExternalLink, UserPlus, Bell, MapPin,
  AlertTriangle, ClipboardList, TrendingUp, ArrowRightLeft,
  Megaphone, CheckSquare,
} from 'lucide-react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  logAiInteraction,
  MOCK_LEADS, MOCK_FOLLOW_UPS, MOCK_VISITS, MOCK_REQUIREMENTS,
  MOCK_PIPELINE_OPPORTUNITIES, MOCK_TASKS, MOCK_CAMPAIGNS, MOCK_MATCHES,
  MOCK_PARTIES, MOCK_USERS, MOCK_PROPERTIES,
  type AiInteractionLog,
  type LeadRow, type FollowUpRow, type VisitRow, type PartyRow,
  type FullRequirementRow, type PipelineOpportunityRow, type TaskRow,
  type CampaignRow, type MatchRow,
} from '@/lib/mockData'
import type { WriteIntent } from '@/app/api/ai-agent/route'
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
  confirmation?: { action_type: string; record_id: string; record_label: string; href: string }
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

const ACTION_META: Record<WriteIntent, { icon: React.ElementType; label: string; color: string; href: string; module: string }> = {
  create_lead:        { icon: UserPlus,        label: 'Create Lead',        color: 'bg-sky-50 border-sky-200 text-sky-700',       href: '/leads',         module: 'Leads' },
  create_followup:    { icon: Bell,            label: 'Create Follow-up',   color: 'bg-amber-50 border-amber-200 text-amber-700', href: '/follow-ups',    module: 'Follow-ups' },
  schedule_visit:     { icon: MapPin,          label: 'Schedule Visit',     color: 'bg-emerald-50 border-emerald-200 text-emerald-700', href: '/visits', module: 'Visits' },
  create_requirement: { icon: ClipboardList,   label: 'Create Requirement', color: 'bg-violet-50 border-violet-200 text-violet-700', href: '/requirements', module: 'Requirements' },
  create_opportunity: { icon: TrendingUp,      label: 'Create Opportunity', color: 'bg-indigo-50 border-indigo-200 text-indigo-700', href: '/opportunities', module: 'Opportunities' },
  update_deal_stage:  { icon: ArrowRightLeft,  label: 'Update Deal Stage',  color: 'bg-rose-50 border-rose-200 text-rose-700',     href: '/opportunities', module: 'Opportunities' },
  create_campaign:    { icon: Megaphone,       label: 'Create Campaign',    color: 'bg-pink-50 border-pink-200 text-pink-700',     href: '/campaigns',     module: 'Campaigns' },
  create_task:        { icon: CheckSquare,     label: 'Create Task',        color: 'bg-teal-50 border-teal-200 text-teal-700',     href: '/tasks',         module: 'Tasks' },
}

// ── Suggested queries ─────────────────────────────────────────────────────────

const SUGGESTED_QUERIES = [
  'How many active leads do we have?',
  'Create a lead for Rajesh Kumar, phone 9876543210, buyer',
  'Schedule a follow-up with Amit Jain tomorrow about pricing',
  'Create a requirement for Vikram Singh, 2BHK flat in Scheme 140, budget 50-70 lakhs',
  'Create an opportunity for Rahul Verma at MG Road, ₹45 lakhs',
  'Move OPP-5001 to Documentation stage',
  'Create a campaign "Diwali Homes" for Buyer Acquisition starting Oct 15',
  'Create a task to verify documents for Ravi Mehta, due Friday',
]

// ════════════════════════════════════════════════════════════════════════════════
// ── PROPOSAL FORM COMPONENTS (one per action type) ────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════

type FormProps = { fields: Record<string, string>; onChange: (k: string, v: string) => void }

function LeadForm({ fields: f, onChange }: FormProps) {
  return (<div className="grid grid-cols-2 gap-3">
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
    <div><Label className="text-xs text-slate-600 font-medium">Channel</Label>
      <Select value={f.channel_type||'Offline'} onChange={e=>onChange('channel_type',e.target.value)} className="mt-1 h-8 text-sm">
        <option>Digital</option><option>Offline</option></Select></div>
    <div><Label className="text-xs text-slate-600 font-medium">Source</Label>
      <Input value={f.source||''} onChange={e=>onChange('source',e.target.value)} placeholder="e.g. Website" className="mt-1 h-8 text-sm" /></div>
    <div><Label className="text-xs text-slate-600 font-medium">Est. Value</Label>
      <Input type="number" value={f.value||''} onChange={e=>onChange('value',e.target.value)} className="mt-1 h-8 text-sm" /></div>
    <div className="col-span-2"><Label className="text-xs text-slate-600 font-medium">Remarks</Label>
      <Textarea value={f.remarks||''} onChange={e=>onChange('remarks',e.target.value)} rows={2} className="mt-1 text-sm" /></div>
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
      <Select value={f.entity_id||''} onChange={e=>onChange('entity_id',e.target.value)} className="mt-1 h-8 text-sm">
        <option value="">— None —</option>
        {MOCK_LEADS.map(l=><option key={l.id} value={l.id}>[Lead] {l.id} — {l.party_name}</option>)}</Select></div>
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
// ── PROPOSAL CARD ─────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════

function ProposalCard({ proposal, duplicates, onApprove, onCancel }: {
  proposal: ActionProposal; duplicates: DuplicateCandidate[]
  onApprove: (f: Record<string, string>) => void; onCancel: () => void
}) {
  const [editFields, setEditFields] = useState<Record<string, string>>(() => {
    const f = { ...proposal.fields } as Record<string, string>
    // Resolve IDs from names
    if (f.assigned_to_name && !f.assigned_to_id) { const u = findUser(f.assigned_to_name); if (u) f.assigned_to_id = u.id }
    if (f.responsible_name && !f.responsible_id) { const u = findUser(f.responsible_name); if (u) f.responsible_id = u.id }
    if (f.agent_name && !f.agent_id) { const u = findUser(f.agent_name); if (u) f.agent_id = u.id }
    if (f.client_name && !f.client_id) { const p = findParty(f.client_name); if (p) f.client_id = p.id }
    if (f.property_short_loc && !f.property_id) { const p = findProp(f.property_short_loc); if (p) f.property_id = p.id }
    if (f.owner_name && !f.owner_id) { const u = findUser(f.owner_name); if (u) f.owner_id = u.id }
    // Normalize datetime-local
    if (f.due_date && !f.due_date.includes('T')) f.due_date += 'T10:00'
    if (f.scheduled_date && !f.scheduled_date.includes('T')) f.scheduled_date += 'T11:00'
    // Defaults
    f.priority = f.priority || 'MEDIUM'
    f.channel_type = f.channel_type || 'Offline'
    f.purpose = f.purpose || (proposal.action_type === 'schedule_visit' ? 'Property Viewing' : f.purpose || '')
    f.stage = f.stage || 'QUALIFIED'
    f.status = f.status || (proposal.action_type === 'create_campaign' ? 'Planned' : '')
    f.task_type = f.task_type || 'Internal'
    return f
  })
  const [isApproving, setIsApproving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleChange = (k: string, v: string) => { setEditFields(prev => ({ ...prev, [k]: v })); setErrors([]) }

  const validate = (): string[] => {
    const errs: string[] = []
    const at = proposal.action_type
    if (at === 'create_lead') { if (!editFields.party_name?.trim()) errs.push('Client name required'); if (!editFields.phone?.trim()) errs.push('Phone required'); if (!editFields.lead_type) errs.push('Lead type required') }
    if (at === 'create_followup') { if (!editFields.client_name?.trim()) errs.push('Client name required'); if (!editFields.purpose?.trim()) errs.push('Purpose required'); if (!editFields.due_date) errs.push('Due date required'); if (!editFields.responsible_id) errs.push('Responsible required') }
    if (at === 'schedule_visit') { if (!editFields.client_id) errs.push('Client required'); if (!editFields.agent_id) errs.push('Agent required'); if (!editFields.property_id) errs.push('Property required'); if (!editFields.scheduled_date) errs.push('Date required') }
    if (at === 'create_requirement') { if (!editFields.client_id) errs.push('Client required'); if (!editFields.category) errs.push('Category required'); if (!editFields.intent) errs.push('Intent required') }
    if (at === 'create_opportunity') { if (!editFields.property_id) errs.push('Property required'); if (!editFields.client_id) errs.push('Client required'); if (!editFields.expected_value) errs.push('Expected value required') }
    if (at === 'update_deal_stage') { if (!editFields.opportunity_id) errs.push('Opportunity required'); if (!editFields.new_stage) errs.push('New stage required') }
    if (at === 'create_campaign') { if (!editFields.campaign_name?.trim()) errs.push('Campaign name required'); if (!editFields.type) errs.push('Type required'); if (!editFields.start_date) errs.push('Start date required') }
    if (at === 'create_task') { if (!editFields.title?.trim()) errs.push('Title required'); if (!editFields.assigned_to_id) errs.push('Assignee required'); if (!editFields.due_date) errs.push('Due date required') }
    return errs
  }

  if (proposal.status === 'approved') return <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4"><div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 size={16}/><span className="text-sm font-semibold">Action approved and created.</span></div></div>
  if (proposal.status === 'cancelled') return <div className="border border-slate-200 bg-slate-50 rounded-xl p-4 opacity-60"><div className="flex items-center gap-2 text-slate-500"><X size={16}/><span className="text-sm">Cancelled.</span></div></div>

  const meta = ACTION_META[proposal.action_type]
  const FormComponent = FORM_COMPONENTS[proposal.action_type]

  return (
    <div className={`border rounded-xl overflow-hidden ${meta.color.split(' ')[1]} shadow-sm`}>
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${meta.color}`}>
        <meta.icon size={16} className="shrink-0"/>
        <span className="font-semibold text-sm">{meta.label}</span>
        <span className="ml-auto text-xs opacity-70 flex items-center gap-1"><Edit3 size={11}/>Editable</span>
      </div>
      {duplicates.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="flex items-start gap-2"><AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5"/>
            <div><p className="text-xs font-semibold text-amber-800">Possible duplicate</p>
              <ul className="mt-1 space-y-0.5">{duplicates.map(d=><li key={d.id} className="text-xs text-amber-700">• {d.name} ({d.mobile||'no phone'}) — {d.existing_lead_count??0} lead(s)</li>)}</ul>
            </div></div></div>)}
      <div className="px-4 py-4 bg-white">
        <FormComponent fields={editFields} onChange={handleChange}/>
        {errors.length > 0 && <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">{errors.map(e=><div key={e}>• {e}</div>)}</div>}
        <div className="flex items-center gap-2 mt-4">
          <Button onClick={() => { const errs = validate(); if (errs.length > 0) { setErrors(errs); return } setIsApproving(true); onApprove(editFields) }} disabled={isApproving} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-sm h-9">
            {isApproving ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>}Approve & {proposal.action_type === 'update_deal_stage' ? 'Update' : 'Create'}</Button>
          <Button onClick={onCancel} variant="outline" disabled={isApproving} className="text-slate-600 gap-1.5 text-sm h-9"><X size={14}/>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// ── MESSAGE BUBBLE ────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════

function MessageBubble({ msg, duplicates, onApprove, onCancel }: {
  msg: ChatMessage; duplicates: DuplicateCandidate[]
  onApprove: (id: string, f: Record<string, string>) => void; onCancel: (id: string) => void
}) {
  const isUser = msg.role === 'user'; const isError = msg.role === 'error'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1 ${isError ? 'bg-red-100' : 'bg-amber-100'}`}>{isError ? <AlertCircle size={16} className="text-red-500"/> : <Bot size={16} className="text-amber-600"/>}</div>}
      <div className={`${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1 ${msg.proposal ? 'w-full max-w-[90%]' : 'max-w-[78%]'}`}>
        {msg.content && <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'bg-amber-500 text-white rounded-br-sm' : isError ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm'}`}>
          {msg.loading ? <div className="flex items-center gap-2 text-slate-500"><Loader2 size={14} className="animate-spin"/><span>Thinking…</span></div> : <div className="whitespace-pre-wrap">{msg.content}</div>}
        </div>}
        {msg.proposal && msg.proposal.status !== 'cancelled' && <div className="w-full mt-1"><ProposalCard proposal={msg.proposal} duplicates={duplicates} onApprove={f => onApprove(msg.id, f)} onCancel={() => onCancel(msg.id)}/></div>}
        {msg.confirmation && <div className="mt-1 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold"><CheckCircle2 size={16}/>{msg.confirmation.record_label}</div>
          <Link href={msg.confirmation.href} className="mt-1.5 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 underline"><ExternalLink size={11}/>View in {ACTION_META[msg.confirmation.action_type as WriteIntent]?.module || 'module'}</Link>
        </div>}
        {!isUser && !msg.loading && msg.data_queried && msg.data_queried !== 'None' && <div className="flex items-center gap-2 px-1"><span className="flex items-center gap-1 text-xs text-slate-400"><Database size={10}/>{msg.data_queried}</span>{msg.record_count !== undefined && <span className="text-xs text-slate-400">· {msg.record_count} record{msg.record_count!==1?'s':''}</span>}</div>}
        <span className="text-[10px] text-slate-400 px-1">{msg.timestamp.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
      </div>
      {isUser && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center ml-3 mt-1"><User size={16} className="text-white"/></div>}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// ── MATCHING ENGINE (reuses scoring logic from matching page) ──────────────────
// ════════════════════════════════════════════════════════════════════════════════

function runMatchingEngine(req: FullRequirementRow): { matches: MatchRow[]; summary: string } {
  const matches: MatchRow[] = []

  for (const prop of MOCK_PROPERTIES) {
    // Category compatibility check
    const catMatch = prop.category === req.category
    if (!catMatch) continue

    // Status check — only available/new properties
    if (!['AVAILABLE', 'NEW', 'UNDER_NEGOTIATION'].includes(prop.status)) continue

    // Score breakdown
    const breakdown: Record<string, string> = {}
    let score = 0

    // Location (40 points)
    const locMatch = req.preferred_short_locs.includes(prop.short_loc)
    const altMatch = req.alternate_locs?.includes(prop.short_loc)
    if (locMatch) { score += 40; breakdown.location = 'PASS' }
    else if (altMatch) { score += 25; breakdown.location = 'WARNING (alternate location)' }
    else { score += 10; breakdown.location = `WARNING (different area: ${prop.short_loc})` }

    // Budget (30 points)
    if (req.min_budget != null && req.max_budget != null) {
      if (prop.price >= req.min_budget && prop.price <= req.max_budget) { score += 30; breakdown.budget = 'PASS' }
      else if (prop.price <= req.max_budget * 1.1) { score += 20; breakdown.budget = `WARNING (${Math.round(((prop.price - req.max_budget) / req.max_budget) * 100)}% over max)` }
      else { score += 5; breakdown.budget = 'FAIL (out of budget range)' }
    } else { score += 15; breakdown.budget = 'WARNING (no budget specified)' }

    // Type (20 points) — already filtered by category match
    score += 20; breakdown.type = 'PASS'

    // Availability (10 points)
    if (prop.status === 'AVAILABLE' || prop.status === 'NEW') { score += 10; breakdown.availability = 'PASS' }
    else { score += 5; breakdown.availability = `WARNING (${prop.status.toLowerCase()})` }

    if (score < 50) continue

    const tier = score >= 90 ? 'HIGH' : score >= 75 ? 'GOOD' : 'POSSIBLE'

    matches.push({
      id: `M-AI${Date.now().toString().slice(-4)}-${prop.id}`,
      requirement_id: req.id,
      client_name: req.client_name,
      property_id: prop.id,
      short_loc: prop.short_loc,
      property_category: prop.category,
      property_price: prop.price,
      score,
      tier,
      status: 'SUGGESTED',
      score_breakdown: breakdown,
    })
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score)

  // Build summary
  const high = matches.filter(m => m.tier === 'HIGH').length
  const good = matches.filter(m => m.tier === 'GOOD').length
  const possible = matches.filter(m => m.tier === 'POSSIBLE').length
  const parts: string[] = []
  if (high > 0) parts.push(`${high} High tier`)
  if (good > 0) parts.push(`${good} Good tier`)
  if (possible > 0) parts.push(`${possible} Possible tier`)

  const summary = matches.length > 0
    ? `Found ${matches.length} matching ${matches.length === 1 ? 'property' : 'properties'} — ${parts.join(', ')}.`
    : 'No matching properties found in current inventory.'

  return { matches, summary }
}

// ════════════════════════════════════════════════════════════════════════════════
// ── RECORD CREATION FUNCTIONS (same logic as each module) ─────────────────────
// ════════════════════════════════════════════════════════════════════════════════

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
  const agent = MOCK_USERS.find(u => u.id === f.agent_id) || AGENTS[0]
  const prop = MOCK_PROPERTIES.find(p => p.id === f.property_id) || MOCK_PROPERTIES[0]
  const client = MOCK_PARTIES.find(p => p.id === f.client_id) || MOCK_PARTIES[0]
  const id = `V-AI${Date.now().toString().slice(-4)}`
  const record: VisitRow = { id, property_id: prop.id, property_short_loc: prop.short_loc, client_id: client.id, client_name: client.name, agent_id: agent.id, agent_name: agent.name, purpose: (f.purpose as VisitRow['purpose'])||'Property Viewing', status: 'Assigned', scheduled_date: f.scheduled_date ? new Date(f.scheduled_date).toISOString() : new Date().toISOString(), instructions: f.instructions||undefined, checklist_template: 'Standard Residential', created_at: new Date().toISOString() }
  MOCK_VISITS.unshift(record)
  return { id, label: `Scheduled Visit ${id} at ${record.property_short_loc} for ${record.client_name}` }
}

function createRequirementRecord(f: Record<string, string>): { id: string; label: string; matchSummary: string } {
  const client = MOCK_PARTIES.find(p => p.id === f.client_id) || MOCK_PARTIES[0]
  const assignedUser = f.assigned_to_id ? MOCK_USERS.find(u => u.id === f.assigned_to_id) : null
  const locs = (f.preferred_short_locs || '').split(',').filter(Boolean)
  const id = `R-${Date.now().toString().slice(-4)}`
  const record: FullRequirementRow = { id, client_id: client.id, client_name: client.name, assigned_to_id: assignedUser?.id||null, assigned_to_name: assignedUser?.name||null, category: f.category, intent: f.intent, preferred_short_locs: locs.length > 0 ? locs : ['01-Schm140_Mayank'], alternate_locs: [], min_budget: f.min_budget ? parseFloat(f.min_budget) : null, max_budget: f.max_budget ? parseFloat(f.max_budget) : null, min_area: null, max_area: null, timeline: f.timeline||null, facilities: [], status: 'NEW', remarks: f.remarks||null, created_at: new Date().toISOString() }
  MOCK_REQUIREMENTS.unshift(record)

  // Run matching engine
  const { matches, summary } = runMatchingEngine(record)
  // Push computed matches to MOCK_MATCHES for visibility in the Matching workspace
  for (const m of matches) MOCK_MATCHES.push(m)

  return { id, label: `Created Requirement ${id} for ${record.client_name} (${record.category} / ${record.intent})`, matchSummary: summary }
}

function createOpportunityRecord(f: Record<string, string>): { id: string; label: string } {
  const prop = MOCK_PROPERTIES.find(p => p.id === f.property_id) || MOCK_PROPERTIES[0]
  const client = MOCK_PARTIES.find(p => p.id === f.client_id) || MOCK_PARTIES[0]
  const agent = f.agent_id ? MOCK_USERS.find(u => u.id === f.agent_id) : AGENTS[0]
  const id = `OPP-${Date.now().toString().slice(-4)}`
  const record: PipelineOpportunityRow = { id, property_id: prop.id, property_short_loc: prop.short_loc, client_id: client.id, client_name: client.name, stage: (f.stage as PipelineOpportunityRow['stage'])||'QUALIFIED', expected_value: parseFloat(f.expected_value)||0, probability: parseInt(f.probability)||20, agent_id: agent?.id||'u3', agent_name: agent?.name||'Ravi Mehta', negotiation_history: [], created_at: new Date().toISOString() }
  MOCK_PIPELINE_OPPORTUNITIES.unshift(record)
  return { id, label: `Created Opportunity ${id} — ${record.client_name} @ ${record.property_short_loc}` }
}

function updateDealStageRecord(f: Record<string, string>): { id: string; label: string } {
  const opp = MOCK_PIPELINE_OPPORTUNITIES.find(o => o.id === f.opportunity_id)
  if (!opp) throw new Error(`Opportunity ${f.opportunity_id} not found`)
  const oldStage = opp.stage
  opp.stage = f.new_stage as PipelineOpportunityRow['stage']
  if (opp.stage === 'WON' || opp.stage === 'LOST') opp.closed_at = new Date().toISOString()
  return { id: opp.id, label: `Updated ${opp.id} from ${oldStage} → ${opp.stage} (${opp.client_name})` }
}

function createCampaignRecord(f: Record<string, string>): { id: string; label: string } {
  const owner = f.owner_id ? MOCK_USERS.find(u => u.id === f.owner_id) : STAFF[0]
  const id = `CMP-${new Date().getFullYear()}-${String(MOCK_CAMPAIGNS.length + 1).padStart(3, '0')}`
  const record: CampaignRow = { id, name: f.campaign_name||'Campaign', type: f.type as any, status: (f.status as any)||'Planned', start_date: f.start_date, end_date: f.end_date||f.start_date, owner_id: owner?.id||'u1', owner_name: owner?.name||'Aman Desai', objective: f.objective||'', target_audience: ['Buyers'], geography: 'Indore Metro Region', categories: ['Residential'], transaction_types: ['Sale'], planned_budget: parseFloat(f.planned_budget)||0, target_leads: 0, target_qualified_leads: 0, target_opportunities: 0, promoted_properties: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  MOCK_CAMPAIGNS.unshift(record)
  return { id, label: `Created Campaign ${id} "${record.name}" (${record.type})` }
}

function createTaskRecord(f: Record<string, string>): { id: string; label: string } {
  const assigned = f.assigned_to_id ? MOCK_USERS.find(u => u.id === f.assigned_to_id) : findUser(f.assigned_to_name || '')
  let linkedType: TaskRow['linked_record_type'] = null; let linkedId: string | null = null; let linkedLabel: string | null = null
  if (f.linked_record) { const parts = f.linked_record.split(':'); linkedType = parts[0] as TaskRow['linked_record_type']; linkedId = parts[1] || null; linkedLabel = f.linked_record }
  const id = `T-${Date.now().toString().slice(-3)}`
  const record: TaskRow = { id, title: f.title||'Untitled Task', task_type: (f.task_type as TaskRow['task_type'])||'Internal', assigned_to_name: assigned?.name||'Staff Member', assigned_to_id: assigned?.id, due_date: f.due_date ? new Date(f.due_date).toISOString() : new Date().toISOString(), priority: (f.priority as any)||'MEDIUM', status: 'TODO', linked_record_type: linkedType, linked_record_id: linkedId, linked_record_label: linkedLabel, description: f.description||undefined, created_at: new Date().toISOString() }
  MOCK_TASKS.unshift(record)
  return { id, label: `Created Task ${id} "${record.title}" assigned to ${record.assigned_to_name}` }
}

// Unified dispatch
function executeAction(actionType: WriteIntent, fields: Record<string, string>): { id: string; label: string; extra?: string } {
  switch (actionType) {
    case 'create_lead': return createLeadRecord(fields)
    case 'create_followup': return createFollowUpRecord(fields)
    case 'schedule_visit': return createVisitRecord(fields)
    case 'create_requirement': { const r = createRequirementRecord(fields); return { id: r.id, label: r.label, extra: r.matchSummary } }
    case 'create_opportunity': return createOpportunityRecord(fields)
    case 'update_deal_stage': return updateDealStageRecord(fields)
    case 'create_campaign': return createCampaignRecord(fields)
    case 'create_task': return createTaskRecord(fields)
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// ── SESSION LOG PANEL ─────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════

function SessionLog({ logs }: { logs: AiInteractionLog[] }) {
  const [open, setOpen] = useState(false)
  if (!logs.length) return null
  return (
    <div className="border-t border-slate-200 bg-slate-50">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-500 hover:text-slate-700">
        <span className="flex items-center gap-1.5"><Clock size={12}/>Session Log ({logs.length})</span>
        {open ? <ChevronDown size={12}/> : <ChevronUp size={12}/>}
      </button>
      {open && <div className="max-h-48 overflow-y-auto px-4 pb-3 space-y-2">{logs.map(l => (
        <div key={l.id} className="text-xs bg-white border border-slate-200 rounded p-2">
          <div className="font-medium text-slate-700 truncate">Q: {l.user_message}</div>
          <div className="text-slate-400 mt-0.5">{l.entity_queried} · {l.record_count} rec · {new Date(l.timestamp).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
          {l.interpreted_intent.startsWith('create') && <div className="text-emerald-600 mt-0.5">✓ {l.interpreted_intent}</div>}
          {l.interpreted_intent === 'update_deal_stage' && <div className="text-rose-600 mt-0.5">✓ stage updated</div>}
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
    content: `Hello! I\u2019m PropDesk AI \u2014 I can read all CRM data and create records with your approval.

**8 actions available:**
\u2022 \ud83e\uddd1 Create Lead \u2022 \ud83d\udd14 Create Follow-up \u2022 \ud83d\udccd Schedule Visit
\u2022 \ud83d\udccb Create Requirement (with auto-matching!) \u2022 \ud83d\udcc8 Create Opportunity
\u2022 \u21c4 Update Deal Stage \u2022 \ud83d\udce3 Create Campaign \u2022 \u2705 Create Task

Every write action shows a **Proposed Action** card you can edit before approving. What would you like to do?`,
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

  // ── Approve ─────────────────────────────────────────────────────────────────

  const handleApprove = useCallback((msgId: string, finalFields: Record<string, string>) => {
    setMessages(prev => {
      const msg = prev.find(m => m.id === msgId)
      if (!msg?.proposal) return prev

      const userEdits: Record<string, string | null> = {}
      for (const [k, v] of Object.entries(finalFields)) { if (msg.proposal.proposed_values[k] !== v) userEdits[k] = v }

      let result: { id: string; label: string; extra?: string }
      try { result = executeAction(msg.proposal.action_type, finalFields) }
      catch (err) { console.error(err); return prev }

      const editCount = Object.keys(userEdits).length
      let confirmText = `\u2705 Done! ${result.label}.`
      if (editCount > 0) confirmText += ` (Applied your ${editCount} edit${editCount!==1?'s':''}.)`
      if (result.extra) confirmText += `\n\n\ud83d\udd0d **Matching results:** ${result.extra}`

      const log = logAiInteraction({ user_message: msg.proposal.original_request, interpreted_intent: msg.proposal.action_type, entity_queried: msg.proposal.action_type, filters_applied: finalFields, record_count: 1, ai_response: result.label, user_id: user?.id, user_name: user?.name })
      setSessionLogs(s => [log, ...s])

      const meta = ACTION_META[msg.proposal!.action_type]
      const updated = prev.map(m => m.id === msgId ? { ...m, proposal: { ...m.proposal!, status: 'approved' as const, final_values: finalFields, user_edits: userEdits, created_record_id: result.id } } : m)
      const confirmMsg: ChatMessage = { id: `confirm-${Date.now()}`, role: 'assistant', content: confirmText, timestamp: new Date(), confirmation: { action_type: msg.proposal!.action_type, record_id: result.id, record_label: result.label, href: meta.href } }

      setPendingType(null); setPendingFields({}); setCurrentDupes([])
      return [...updated, confirmMsg]
    })
  }, [user])

  // ── Cancel ──────────────────────────────────────────────────────────────────

  const handleCancel = useCallback((msgId: string) => {
    setMessages(prev => {
      const updated = prev.map(m => m.id === msgId ? { ...m, proposal: { ...m.proposal!, status: 'cancelled' as const } } : m)
      setPendingType(null); setPendingFields({}); setCurrentDupes([])
      return [...updated, { id: `cancel-${Date.now()}`, role: 'assistant' as const, content: 'No problem \u2014 cancelled. Anything else?', timestamp: new Date() }]
    })
  }, [])

  // ── Send ────────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text?: string) => {
    const userText = (text ?? input).trim()
    if (!userText || loading) return
    setInput(''); setLoading(true)
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: userText, timestamp: new Date() }
    const loadingId = `loading-${Date.now()}`
    const loadingMsg: ChatMessage = { id: loadingId, role: 'assistant', content: '', loading: true, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg, loadingMsg])

    try {
      const res = await fetch('/api/ai-agent', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, conversation_history: convoHistory, pending_action_type: pendingType, pending_action_fields: Object.keys(pendingFields).length > 0 ? pendingFields : null }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)

      // Proposal ready
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

      // Pending field collection
      if (data._pending_action_type) { setPendingType(data._pending_action_type); setPendingFields(data._pending_action_fields || {}) }
      else if (!['create_lead','create_followup','schedule_visit','create_requirement','create_opportunity','update_deal_stage','create_campaign','create_task'].includes(data.intent?.intent)) { setPendingType(null); setPendingFields({}) }

      // Regular response
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

  const clearChat = () => { setMessages([{ id: 'welcome-new', role: 'assistant', content: 'Chat cleared. What would you like to do?', timestamp: new Date() }]); setConvoHistory([]); setPendingType(null); setPendingFields({}); setCurrentDupes([]) }

  return (
    <AppLayout>
      <div className="h-full flex flex-col max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow"><Sparkles size={20} className="text-white"/></div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">AI Assistant</h1>
              <p className="text-xs text-slate-500">
                8 actions · Human-in-the-loop · Powered by Groq
                {pendingType && <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium"><Clock size={10}/> Collecting: {ACTION_META[pendingType as WriteIntent]?.label || pendingType}</span>}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={clearChat} className="text-slate-500 gap-1.5"><RefreshCw size={14}/>Clear</Button>
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-6">
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} duplicates={msg.proposal ? currentDupes : []} onApprove={handleApprove} onCancel={handleCancel}/>)}
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
                  placeholder={pendingType ? 'Provide the requested info\u2026' : 'Ask anything, or say \u201ccreate a lead for\u2026\u201d'}
                  disabled={loading} className="w-full px-4 py-3 text-sm text-slate-800 placeholder-slate-400 bg-transparent resize-none focus:outline-none disabled:opacity-50"
                  style={{ maxHeight: '120px', minHeight: '44px' }}
                  onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 120)}px` }}/>
              </div>
              <Button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="bg-amber-500 hover:bg-amber-600 text-white h-11 w-11 p-0 rounded-xl flex-shrink-0">
                {loading ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">Human-in-the-loop · No record created without your approval · Enter to send</p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

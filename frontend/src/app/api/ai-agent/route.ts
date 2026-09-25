import { NextRequest, NextResponse } from 'next/server'

// ── Types ─────────────────────────────────────────────────────────────────────

export type WriteIntent =
  | 'create_lead'
  | 'create_followup'
  | 'schedule_visit'
  | 'create_requirement'
  | 'create_opportunity'
  | 'update_deal_stage'
  | 'create_campaign'
  | 'create_task'

export interface WorkflowStep {
  action_type: WriteIntent
  extracted_fields: Record<string, string | null>
  depends_on: number | null          // index of the step this depends on (0-based)
  dependency_description: string | null  // e.g. "Uses the Lead ID from Step 1"
}

export interface AIAgentIntent {
  intent: 'query_data' | WriteIntent | 'workflow' | 'clarify' | 'unsupported'
  entity: string
  filters: Record<string, string | string[] | boolean | null>
  extracted_fields?: Record<string, string | null>
  missing_required_fields?: string[]
  // Workflow support
  workflow_steps?: WorkflowStep[]
  summary_requested?: boolean
  clarification_needed?: string | null
  reasoning?: string
}

export interface AIAgentRequest {
  message: string
  conversation_history?: { role: 'user' | 'assistant'; content: string }[]
  pending_action_type?: string | null
  pending_action_fields?: Record<string, string | null>
}

export interface AIAgentResponse {
  answer: string
  data_queried: string
  record_count: number
  intent: AIAgentIntent
  raw_results?: unknown[]
  action_proposal?: {
    action_type: WriteIntent
    fields: Record<string, string | null>
    ready: true
  } | null
  workflow_proposal?: {
    steps: WorkflowStep[]
    ready: true
  } | null
}

// ── All valid write intents ───────────────────────────────────────────────────

const WRITE_INTENTS: WriteIntent[] = [
  'create_lead', 'create_followup', 'schedule_visit',
  'create_requirement', 'create_opportunity', 'update_deal_stage',
  'create_campaign', 'create_task',
]

// ── Required fields per write action ──────────────────────────────────────────

const REQUIRED_FIELDS: Record<WriteIntent, string[]> = {
  create_lead: ['party_name', 'phone', 'lead_type'],
  create_followup: ['client_name', 'purpose', 'due_date', 'responsible_name'],
  schedule_visit: ['client_name', 'property_short_loc', 'agent_name', 'scheduled_date'],
  create_requirement: ['client_name', 'category', 'intent'],
  create_opportunity: ['property_short_loc', 'client_name', 'expected_value'],
  update_deal_stage: ['opportunity_id', 'new_stage'],
  create_campaign: ['campaign_name', 'type', 'start_date'],
  create_task: ['title', 'assigned_to_name', 'due_date'],
}

// ── Human-readable field labels for missing-field prompts ─────────────────────

const FIELD_LABELS: Record<string, string> = {
  party_name: 'the client\'s full name',
  phone: 'their phone number',
  lead_type: 'the lead type (Buyer/Seller/Tenant/Landlord/Investor/Consultant)',
  client_name: 'the client\'s name',
  purpose: 'the purpose of the follow-up',
  due_date: 'when it should happen (date and time)',
  responsible_name: 'which team member should be responsible',
  property_short_loc: 'the property location (e.g. 01-Schm140_Mayank, 05-MG_Road)',
  agent_name: 'which agent should conduct the visit (Ravi Mehta, Priya Sharma, Amit Patel, or Sanjay Verma)',
  scheduled_date: 'the visit date and time',
  category: 'the property category (RENTAL_RESIDENTIAL, RENTAL_COMMERCIAL, BUY_SELL_FLAT, BUY_SELL_COMMERCIAL, PLOT)',
  intent: 'whether the client wants to Buy, Rent, or Lease',
  expected_value: 'the expected deal value in ₹',
  opportunity_id: 'the opportunity ID (e.g. OPP-5001) or the client name + property to identify it',
  new_stage: 'the new pipeline stage (QUALIFIED, PROPERTY_SHARED, SITE_VISIT, NEGOTIATION, DOCUMENTATION, WON, LOST)',
  campaign_name: 'the campaign name',
  type: 'the campaign type (Property Promotion, Buyer Acquisition, Lead Generation, etc.)',
  start_date: 'the campaign start date',
  title: 'the task title/description',
  assigned_to_name: 'who should be assigned this task',
}

const ACTION_VERB: Record<WriteIntent, string> = {
  create_lead: 'create this lead',
  create_followup: 'schedule this follow-up',
  schedule_visit: 'book this visit',
  create_requirement: 'create this requirement',
  create_opportunity: 'create this opportunity',
  update_deal_stage: 'update the deal stage',
  create_campaign: 'create this campaign',
  create_task: 'create this task',
}

// ── Data Schema ───────────────────────────────────────────────────────────────

const DATA_SCHEMA = `
You are the AI assistant embedded in "PropDesk CRM" — a real estate CRM for an agency in Indore, India.
You have READ access to all CRM data, and WRITE access to exactly 8 actions:
  1. create_lead  2. create_followup  3. schedule_visit
  4. create_requirement  5. create_opportunity  6. update_deal_stage
  7. create_campaign  8. create_task

IMPORTANT RULES:
- You MUST NOT make up numbers, names, phone numbers, or any data.
- If the user's intent is ambiguous, set intent="clarify".
- For write intents: extract ONLY fields the user explicitly stated.
- DISAMBIGUATION: "create a follow-up for this opportunity" = create_followup (not create_opportunity).

## MULTI-STEP WORKFLOWS
When a user requests MULTIPLE actions in one message (e.g. "Create a lead for X and schedule a follow-up for Friday"):
- Set intent="workflow"
- Return workflow_steps: an array of step objects in execution order
- Each step has: action_type, extracted_fields, depends_on (0-based index of prior step, or null), dependency_description
- Common patterns:
  * "Create lead + follow-up" → Step 0: create_lead, Step 1: create_followup (depends_on: 0, the follow-up uses the new lead's client_name and ID)
  * "Create lead + schedule visit" → Step 0: create_lead, Step 1: schedule_visit (depends_on: 0)
  * "Create opportunity + schedule visit" → Step 0: create_opportunity, Step 1: schedule_visit (depends_on: 0, uses the opportunity's property and client)
  * "Create requirement + task" → Step 0: create_requirement, Step 1: create_task (depends_on: 0)
- For dependent steps: set known fields from context (e.g. client_name from the first step's party_name), leave fields that need the runtime ID as null (they'll be filled from the prior step's result at execution time)
- If a single action is requested, use the normal single-action intent format (not workflow)

## CRM Entities and Fields (for read queries)

### leads
Fields: id, party_name, lead_type (BUYER|SELLER|TENANT|LANDLORD|INVESTOR|CONSULTANT), status (NEW|CONTACTED|QUALIFIED|LOST|ACTIVE|CONVERTED), priority, channel_type, source, assigned_to_name, value, created_at

### properties
Fields: id, category (RENTAL_RESIDENTIAL|RENTAL_COMMERCIAL|BUY_SELL_FLAT|BUY_SELL_COMMERCIAL|PLOT), short_loc (01-Schm140_Mayank, 07-Geeta_Bhawan, 05-MG_Road, 04-Vijay_Nagar, 08-SAPNA_SANGEETA, 09-Super_Corridor), price, status, owner_name

### follow_ups
Fields: id, client_name, entity_type, entity_id, purpose, priority, due_date, status, responsible_name

### opportunities
Fields: id, client_name, property_short_loc, stage, expected_value, probability, agent_name

### requirements
Fields: id, client_name, category, intent (BUY|RENT|LEASE), preferred_short_locs, min_budget, max_budget, status, assigned_to_name

### tasks
Fields: id, title, assigned_to_name, priority, status, due_date, task_type

### campaigns
Fields: id, name, type, status, owner_name, start_date, end_date, planned_budget

### parties
Fields: id, name, email, mobile, city, roles, status

### telemarketing
Fields: id, name, target_audience, purpose, status, geography

## Write Action Required & Optional Fields

### create_lead — Required: party_name, phone, lead_type | Optional: priority, assigned_to_name, source, channel_type, remarks, value

### create_followup — Required: client_name, purpose, due_date, responsible_name | Optional: priority, entity_id, expected_outcome

### schedule_visit — Required: client_name, property_short_loc, agent_name, scheduled_date | Optional: purpose, instructions

### create_requirement — Required: client_name, category, intent | Optional: preferred_short_locs, min_budget, max_budget, timeline, assigned_to_name, remarks

### create_opportunity — Required: property_short_loc, client_name, expected_value | Optional: agent_name, stage, probability

### update_deal_stage — Required: opportunity_id, new_stage

### create_campaign — Required: campaign_name, type, start_date | Optional: end_date, owner_name, planned_budget, objective

### create_task — Required: title, assigned_to_name, due_date | Optional: task_type, priority, description, linked_record

Staff: Aman Desai (Super Admin), Neha Kapoor (Office Executive), Ravi Mehta (Agent), Priya Sharma (Agent), Amit Patel (Agent), Sanjay Verma (Agent)
Today's date: 2026-09-26

## Response Format
Return EXACTLY this JSON (no markdown fences):

For single action:
{
  "intent": "<one of the 8 write intents or query_data/clarify/unsupported>",
  "entity": "...",
  "filters": {},
  "extracted_fields": {},
  "missing_required_fields": [],
  "clarification_needed": null,
  "reasoning": "..."
}

For multi-step workflow:
{
  "intent": "workflow",
  "entity": "general",
  "filters": {},
  "workflow_steps": [
    { "action_type": "create_lead", "extracted_fields": {"party_name": "X", "phone": "123", "lead_type": "BUYER", "assigned_to_name": "Priya Sharma"}, "depends_on": null, "dependency_description": null },
    { "action_type": "create_followup", "extracted_fields": {"client_name": "X", "purpose": "Initial follow-up", "due_date": "2026-09-28T10:00", "responsible_name": "Priya Sharma"}, "depends_on": 0, "dependency_description": "Links to the Lead created in Step 1" }
  ],
  "reasoning": "User wants to create a lead AND schedule a follow-up linked to it"
}
`

// ── Data Query Engine ─────────────────────────────────────────────────────────

async function queryMockData(intent: AIAgentIntent): Promise<{ results: unknown[]; entity_label: string }> {
  const {
    MOCK_LEADS, MOCK_PROPERTIES, MOCK_FOLLOW_UPS, MOCK_PIPELINE_OPPORTUNITIES,
    MOCK_REQUIREMENTS, MOCK_TASKS, MOCK_CAMPAIGNS, MOCK_PARTIES, MOCK_TELEMARKETING_CAMPAIGNS,
  } = await import('@/lib/mockData')

  const filters = intent.filters || {}
  const matchString = (val: string | undefined | null, filter: unknown): boolean => {
    if (!filter) return true
    if (!val) return false
    if (Array.isArray(filter)) return filter.some(f => val.toLowerCase() === f.toLowerCase())
    return val.toLowerCase().includes((filter as string).toLowerCase())
  }

  switch (intent.entity) {
    case 'leads': {
      const results = MOCK_LEADS.filter(l => {
        if (filters.status && !matchString(l.status, filters.status)) return false
        if (filters.lead_type && !matchString(l.lead_type, filters.lead_type)) return false
        if (filters.priority && !matchString(l.priority, filters.priority)) return false
        if (filters.channel_type && !matchString(l.channel_type || '', filters.channel_type)) return false
        if (filters.assigned_to_name && !matchString(l.assigned_to_name || '', filters.assigned_to_name)) return false
        if (filters.source && !matchString(l.source || '', filters.source)) return false
        return true
      })
      return { results: results.map(l => ({ id: l.id, client: l.party_name, type: l.lead_type, status: l.status, priority: l.priority, source: l.source, assigned_to: l.assigned_to_name, value: l.value, created: l.created_at?.slice(0, 10) })), entity_label: 'Leads' }
    }
    case 'properties': {
      const results = MOCK_PROPERTIES.filter(p => {
        if (filters.status && !matchString(p.status, filters.status)) return false
        if (filters.category && !matchString(p.category, filters.category)) return false
        if (filters.short_loc && !matchString(p.short_loc, filters.short_loc)) return false
        return true
      })
      return { results: results.map(p => ({ id: p.id, category: p.category, location: p.short_loc, price: p.price, status: p.status, owner: p.owner_name })), entity_label: 'Properties' }
    }
    case 'follow_ups': {
      const results = MOCK_FOLLOW_UPS.filter(f => {
        if (filters.status && !matchString(f.status, filters.status)) return false
        if (filters.priority && !matchString(f.priority, filters.priority)) return false
        if (filters.responsible_name && !matchString(f.responsible_name, filters.responsible_name)) return false
        return true
      })
      return { results: results.map(f => ({ id: f.id, client: f.client_name, purpose: f.purpose, priority: f.priority, due_date: f.due_date?.slice(0, 10), status: f.status, responsible: f.responsible_name })), entity_label: 'Follow-ups' }
    }
    case 'opportunities': {
      const results = MOCK_PIPELINE_OPPORTUNITIES.filter(o => {
        if (filters.stage && !matchString(o.stage, filters.stage)) return false
        if (filters.client_name && !matchString(o.client_name, filters.client_name)) return false
        return true
      })
      return { results: results.map(o => ({ id: o.id, client: o.client_name, stage: o.stage, property: o.property_short_loc, expected_value: o.expected_value, probability: `${o.probability}%`, agent: o.agent_name })), entity_label: 'Opportunities' }
    }
    case 'requirements': {
      const results = MOCK_REQUIREMENTS.filter(r => {
        if (filters.status && !matchString(r.status, filters.status)) return false
        if (filters.category && !matchString(r.category, filters.category)) return false
        return true
      })
      return { results: results.map(r => ({ id: r.id, client: r.client_name, category: r.category, intent: r.intent, locations: r.preferred_short_locs.join(', '), budget: r.min_budget != null ? `₹${r.min_budget?.toLocaleString('en-IN')} – ₹${r.max_budget?.toLocaleString('en-IN')}` : '—', status: r.status })), entity_label: 'Requirements' }
    }
    case 'tasks': {
      const results = MOCK_TASKS.filter(t => {
        if (filters.status && !matchString(t.status, filters.status)) return false
        if (filters.priority && !matchString(t.priority, filters.priority)) return false
        if (filters.assigned_to_name && !matchString(t.assigned_to_name || '', filters.assigned_to_name)) return false
        return true
      })
      return { results: results.map(t => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, assigned_to: t.assigned_to_name, due: t.due_date?.slice(0, 10), task_type: t.task_type })), entity_label: 'Tasks' }
    }
    case 'campaigns': {
      const results = MOCK_CAMPAIGNS.filter(c => {
        if (filters.status && !matchString(c.status, filters.status)) return false
        if (filters.type && !matchString(c.type, filters.type)) return false
        return true
      })
      return { results: results.map(c => ({ id: c.id, name: c.name, type: c.type, status: c.status, owner: c.owner_name, period: `${c.start_date} to ${c.end_date}`, budget: c.planned_budget })), entity_label: 'Campaigns' }
    }
    case 'parties': {
      const results = MOCK_PARTIES.filter(p => { if (filters.status && !matchString(p.status, filters.status)) return false; return true })
      return { results: results.map(p => ({ id: p.id, name: p.name, email: p.email, mobile: p.mobile, city: p.city, roles: p.roles.join(', '), status: p.status })), entity_label: 'Parties / Contacts' }
    }
    case 'telemarketing': {
      const results = MOCK_TELEMARKETING_CAMPAIGNS.filter(t => { if (filters.status && !matchString(t.status, filters.status)) return false; return true })
      return { results: results.map(t => ({ id: t.id, name: t.name, purpose: t.purpose, status: t.status, target_audience: t.target_audience, geography: t.geography })), entity_label: 'Telemarketing Campaigns' }
    }
    default: return { results: [], entity_label: 'Data' }
  }
}

// ── POST /api/ai-agent ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GROQ_API_KEY is not configured.' }, { status: 500 })

    const body: AIAgentRequest = await req.json()
    const { message, conversation_history = [], pending_action_type, pending_action_fields } = body
    if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

    // ── Step 1: Parse intent ───────────────────────────────────────────────────

    let systemPrompt = DATA_SCHEMA
    if (pending_action_type && pending_action_fields) {
      const filledFields = Object.entries(pending_action_fields)
        .filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n')
      systemPrompt += `\n\n## CURRENT CONTEXT: Collecting fields for ${pending_action_type}\nAlready collected:\n${filledFields || '  (none yet)'}\nThe user is providing additional information. Extract new field values and merge.`
    }

    const intentRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'system', content: systemPrompt }, ...conversation_history.slice(-8), { role: 'user', content: message }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 1024,
      }),
    })

    if (!intentRes.ok) {
      if (intentRes.status === 429) return NextResponse.json({ error: 'AI rate limit exceeded. Please wait.' }, { status: 429 })
      return NextResponse.json({ error: `AI service error (${intentRes.status}).` }, { status: 502 })
    }

    const intentRaw = (await intentRes.json()).choices?.[0]?.message?.content || '{}'
    let intent: AIAgentIntent
    try { intent = JSON.parse(intentRaw.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()) }
    catch { intent = { intent: 'clarify', entity: 'general', filters: {}, clarification_needed: 'I had trouble understanding. Could you rephrase?' } }

    // ── Handle WORKFLOW intent ─────────────────────────────────────────────────

    if (intent.intent === 'workflow' && intent.workflow_steps && intent.workflow_steps.length > 1) {
      // Check if ALL steps have their required fields
      const allMissing: { stepIdx: number; fields: string[] }[] = []
      for (let i = 0; i < intent.workflow_steps.length; i++) {
        const step = intent.workflow_steps[i]
        const req = REQUIRED_FIELDS[step.action_type] || []
        // For dependent steps, some required fields will be filled at runtime from the prior step
        // So only flag truly missing fields that aren't going to come from the dependency
        const dependencyProvidedFields = new Set<string>()
        if (step.depends_on != null) {
          // Dependent steps get client_name, entity_id, property_short_loc from the prior step
          dependencyProvidedFields.add('client_name')
          dependencyProvidedFields.add('entity_id')
          dependencyProvidedFields.add('property_short_loc')
          dependencyProvidedFields.add('party_name')
        }
        const missing = req.filter(f => !dependencyProvidedFields.has(f) && (!step.extracted_fields[f] || step.extracted_fields[f] === ''))
        if (missing.length > 0) allMissing.push({ stepIdx: i, fields: missing })
      }

      if (allMissing.length > 0) {
        const desc = allMissing.map(m => {
          const stepLabel = `Step ${m.stepIdx + 1} (${intent.workflow_steps![m.stepIdx].action_type})`
          const fieldDesc = m.fields.map(f => FIELD_LABELS[f] || f).join(', ')
          return `**${stepLabel}**: ${fieldDesc}`
        }).join('\n')
        return NextResponse.json({
          answer: `To complete this workflow, I still need:\n${desc}\n\nCould you provide the missing information?`,
          data_queried: 'None', record_count: 0, intent, raw_results: [],
          action_proposal: null, workflow_proposal: null,
          _pending_action_type: 'workflow',
          _pending_action_fields: intent.workflow_steps[allMissing[0].stepIdx].extracted_fields,
        })
      }

      // All steps have their required fields — propose workflow
      return NextResponse.json({
        answer: `I\u2019ve identified a **${intent.workflow_steps.length}-step workflow**. Please review each step below and approve:`,
        data_queried: 'None', record_count: 0, intent, raw_results: [],
        action_proposal: null,
        workflow_proposal: { steps: intent.workflow_steps, ready: true as const },
      })
    }

    // ── Handle single write intents ────────────────────────────────────────────

    if (WRITE_INTENTS.includes(intent.intent as WriteIntent)) {
      const actionType = intent.intent as WriteIntent
      const mergedFields: Record<string, string | null> = { ...(pending_action_fields || {}), ...(intent.extracted_fields || {}) }
      const requiredFields = REQUIRED_FIELDS[actionType] || []
      const stillMissing = requiredFields.filter(f => !mergedFields[f] || mergedFields[f] === '')

      if (stillMissing.length > 0) {
        const missingDesc = stillMissing.map(f => FIELD_LABELS[f] || f).join(', and ')
        return NextResponse.json({
          answer: `To ${ACTION_VERB[actionType]}, I still need: **${missingDesc}**. Could you provide that?`,
          data_queried: 'None', record_count: 0,
          intent: { ...intent, extracted_fields: mergedFields, missing_required_fields: stillMissing },
          raw_results: [], action_proposal: null,
          _pending_action_type: actionType, _pending_action_fields: mergedFields,
        })
      }

      return NextResponse.json({
        answer: 'I have everything I need. Please review and edit any field before approving:',
        data_queried: 'None', record_count: 0,
        intent: { ...intent, extracted_fields: mergedFields, missing_required_fields: [] },
        raw_results: [],
        action_proposal: { action_type: actionType, fields: mergedFields, ready: true as const },
      })
    }

    // ── Handle clarify / unsupported ───────────────────────────────────────────

    if (intent.intent === 'clarify' || intent.intent === 'unsupported') {
      return NextResponse.json({
        answer: intent.clarification_needed || 'Could you be more specific?',
        data_queried: 'None', record_count: 0, intent, raw_results: [],
      } satisfies AIAgentResponse)
    }

    // ── Read queries ──────────────────────────────────────────────────────────

    const { results, entity_label } = await queryMockData(intent)
    const answerRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: 'You are PropDesk CRM AI. Answer concisely using ONLY the provided data. Format ₹ in Indian numbering.' },
          { role: 'user', content: `User asked: "${message}"\nEntity: ${entity_label}\nTotal: ${results.length}\n${results.slice(0, 25).length > 0 ? `Results:\n${JSON.stringify(results.slice(0, 25), null, 2)}` : 'No matching records.'}` },
        ],
        temperature: 0.3, max_tokens: 512,
      }),
    })
    let finalAnswer = `Found ${results.length} ${entity_label.toLowerCase()}.`
    if (answerRes.ok) { const d = await answerRes.json(); const r = d.choices?.[0]?.message?.content || ''; if (r.trim()) finalAnswer = r.trim() }

    return NextResponse.json({ answer: finalAnswer, data_queried: entity_label, record_count: results.length, intent, raw_results: results } satisfies AIAgentResponse)
  } catch (error) {
    console.error('AI Agent error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, { status: 500 })
  }
}

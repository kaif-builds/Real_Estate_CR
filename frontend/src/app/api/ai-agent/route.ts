import { NextRequest, NextResponse } from 'next/server'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AIAgentIntent {
  intent:
    | 'query_data'
    | 'create_lead'
    | 'create_followup'
    | 'schedule_visit'
    | 'clarify'
    | 'unsupported'
  entity: string
  filters: Record<string, string | string[] | boolean | null>
  // For write intents — extracted structured fields from the user's message
  extracted_fields?: Record<string, string | null>
  // Missing required fields the AI needs to ask for
  missing_required_fields?: string[]
  summary_requested?: boolean
  clarification_needed?: string | null
  reasoning?: string
}

export interface AIAgentRequest {
  message: string
  conversation_history?: { role: 'user' | 'assistant'; content: string }[]
  // Context for multi-turn write flows
  pending_action_type?: string | null
  pending_action_fields?: Record<string, string | null>
}

export interface AIAgentResponse {
  answer: string
  data_queried: string
  record_count: number
  intent: AIAgentIntent
  raw_results?: unknown[]
  // Write action proposal — when all required fields are collected
  action_proposal?: {
    action_type: 'create_lead' | 'create_followup' | 'schedule_visit'
    fields: Record<string, string | null>
    ready: true
  } | null
}

// ── Data Schema (fields only — no actual data rows sent to LLM) ───────────────

const DATA_SCHEMA = `
You are the AI assistant embedded in "PropDesk CRM" — a real estate CRM for an agency in Indore, India.
You have READ access to all CRM data, and WRITE access to exactly 3 actions:
  1. create_lead — Create a new Lead record
  2. create_followup — Create a new Follow-up record
  3. schedule_visit — Schedule a new Property Visit

IMPORTANT RULES:
- You MUST NOT make up numbers, names, phone numbers, or any data. All facts come from the actual database.
- If the user's intent is ambiguous, set intent="clarify" and explain what clarification is needed.
- For write intents: extract ONLY fields the user explicitly stated. Mark missing required fields clearly.
- You respond ONLY with a valid JSON object matching the schema below.

## CRM Entities and Fields (for read queries)

### leads
Fields: id, party_name, lead_type (BUYER|SELLER|TENANT|LANDLORD|INVESTOR|CONSULTANT), status (NEW|CONTACTED|QUALIFIED|LOST|ACTIVE|CONVERTED), priority (LOW|MEDIUM|HIGH|CRITICAL), channel_type (Digital|Offline), source (string), assigned_to_name (string), value (number|null), created_at

### properties
Fields: id, category (RENTAL_RESIDENTIAL|RENTAL_COMMERCIAL|BUY_SELL_FLAT|BUY_SELL_COMMERCIAL|PLOT), short_loc (e.g. "01-Schm140_Mayank", "07-Geeta_Bhawan", "05-MG_Road", "04-Vijay_Nagar", "08-SAPNA_SANGEETA", "09-Super_Corridor"), price, status (AVAILABLE|NEW|UNDER_NEGOTIATION|ON_HOLD|RENTED|SOLD), owner_name

### follow_ups
Fields: id, client_name, entity_type, entity_id, purpose, priority (LOW|MEDIUM|HIGH), due_date, status (PENDING|COMPLETED|OVERDUE|RESCHEDULED|CANCELLED|NO_RESPONSE), responsible_name

### opportunities
Fields: id, client_name, property_short_loc, stage (QUALIFIED|PROPERTY_SHARED|SITE_VISIT|NEGOTIATION|DOCUMENTATION|WON|LOST), expected_value, probability, agent_name

### requirements
Fields: id, client_name, category, intent, preferred_short_locs, min_budget, max_budget, status, assigned_to_name

### tasks
Fields: id, title, assigned_to_name, priority, status, due_date, task_type

### campaigns
Fields: id, name, type, status, owner_name, start_date, end_date, planned_budget

### parties
Fields: id, name, email, mobile, city, roles, status

### telemarketing
Fields: id, name, target_audience, purpose, status, geography

## Write Action Required Fields

### create_lead — Required: party_name, phone, lead_type | Optional: priority, assigned_to_name, source, channel_type, remarks, value
- party_name: Full name of the lead/client
- phone: Mobile phone number (MUST be provided by user — never invent)
- lead_type: BUYER | SELLER | TENANT | LANDLORD | INVESTOR | CONSULTANT
- priority: LOW | MEDIUM | HIGH | CRITICAL (default: MEDIUM if not specified)
- assigned_to_name: Staff member to assign to (match from: Aman Desai, Neha Kapoor, Ravi Mehta, Priya Sharma, Amit Patel, Sanjay Verma)
- source: Where the lead came from
- channel_type: Digital | Offline
- remarks: Any notes
- value: Expected deal value in rupees (number only)

### create_followup — Required: client_name, purpose, due_date, responsible_name | Optional: priority, entity_id, expected_outcome
- client_name: Name of the client/party (must match an existing party if possible)
- purpose: What the follow-up is about
- due_date: When the follow-up is due (YYYY-MM-DDTHH:mm format — infer from natural language like "tomorrow", "next Tuesday", etc. using today's date 2026-09-26)
- responsible_name: Which staff member is responsible (match from: Aman Desai, Neha Kapoor, Ravi Mehta, Priya Sharma, Amit Patel, Sanjay Verma)
- priority: LOW | MEDIUM | HIGH (default: MEDIUM)
- entity_id: ID of the linked Lead/Requirement/Opportunity (optional — ask if unsure)
- expected_outcome: What should happen as a result

### schedule_visit — Required: client_name, property_short_loc, agent_name, scheduled_date | Optional: purpose, instructions
- client_name: Name of the client (must match an existing party if possible)
- property_short_loc: Property location code — match from: 01-Schm140_Mayank, 07-Geeta_Bhawan, 05-MG_Road, 04-Vijay_Nagar, 08-SAPNA_SANGEETA, 09-Super_Corridor
- agent_name: Which agent will conduct the visit (Agent-role only: Ravi Mehta, Priya Sharma, Amit Patel, Sanjay Verma)
- scheduled_date: Date and time (YYYY-MM-DDTHH:mm — infer from natural language using today's date 2026-09-26)
- purpose: Property Viewing | Owner Meeting | Verification (default: Property Viewing)
- instructions: Any special instructions

## Your Response Format
Return EXACTLY this JSON (no markdown, no code fences):
{
  "intent": "query_data" | "create_lead" | "create_followup" | "schedule_visit" | "clarify" | "unsupported",
  "entity": "leads" | "properties" | "follow_ups" | "opportunities" | "requirements" | "tasks" | "campaigns" | "parties" | "telemarketing" | "general",
  "filters": {},
  "extracted_fields": {
    // For write intents: only fields the user explicitly mentioned. Use null for fields not mentioned.
    // Example for create_lead: { "party_name": "Rajesh Kumar", "phone": null, "lead_type": "BUYER", "priority": null, "assigned_to_name": "Neha Kapoor", "source": null, "channel_type": null, "remarks": "interested in 2BHK", "value": null }
  },
  "missing_required_fields": ["phone"],  // list of required field names not yet provided
  "summary_requested": false,
  "clarification_needed": null,  // set to a helpful question if intent="clarify" or missing required fields
  "reasoning": "brief explanation"
}
`

// ── Data Query Engine ─────────────────────────────────────────────────────────

async function queryMockData(intent: AIAgentIntent): Promise<{ results: unknown[]; entity_label: string }> {
  const {
    MOCK_LEADS,
    MOCK_PROPERTIES,
    MOCK_FOLLOW_UPS,
    MOCK_PIPELINE_OPPORTUNITIES,
    MOCK_REQUIREMENTS,
    MOCK_TASKS,
    MOCK_CAMPAIGNS,
    MOCK_PARTIES,
    MOCK_TELEMARKETING_CAMPAIGNS,
  } = await import('@/lib/mockData')

  const filters = intent.filters || {}

  const matchString = (val: string | undefined | null, filter: unknown): boolean => {
    if (!filter) return true
    if (!val) return false
    if (Array.isArray(filter)) {
      return filter.some(f => val.toLowerCase() === f.toLowerCase())
    }
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
        if (filters.campaign_name && !matchString(l.campaign_name || '', filters.campaign_name)) return false
        return true
      })
      return {
        results: results.map(l => ({
          id: l.id, client: l.party_name, type: l.lead_type, status: l.status,
          priority: l.priority, source: l.source, channel: l.channel_type,
          assigned_to: l.assigned_to_name, value: l.value,
          created: l.created_at?.slice(0, 10),
          next_follow_up: l.next_follow_up_at?.slice(0, 10) || 'Not scheduled',
          campaign: l.campaign_name || '—', remarks: l.remarks,
        })),
        entity_label: 'Leads',
      }
    }

    case 'properties': {
      const results = MOCK_PROPERTIES.filter(p => {
        if (filters.status && !matchString(p.status, filters.status)) return false
        if (filters.category && !matchString(p.category, filters.category)) return false
        if (filters.short_loc && !matchString(p.short_loc, filters.short_loc)) return false
        if (filters.owner_name && !matchString(p.owner_name, filters.owner_name)) return false
        return true
      })
      return {
        results: results.map(p => ({
          id: p.id, category: p.category, location: p.short_loc,
          address: p.address, price: p.price, status: p.status, owner: p.owner_name,
        })),
        entity_label: 'Properties',
      }
    }

    case 'follow_ups': {
      const results = MOCK_FOLLOW_UPS.filter(f => {
        if (filters.status && !matchString(f.status, filters.status)) return false
        if (filters.priority && !matchString(f.priority, filters.priority)) return false
        if (filters.entity_type && !matchString(f.entity_type, filters.entity_type)) return false
        if (filters.responsible_name && !matchString(f.responsible_name, filters.responsible_name)) return false
        if (filters.client_name && !matchString(f.client_name, filters.client_name)) return false
        return true
      })
      return {
        results: results.map(f => ({
          id: f.id, client: f.client_name, purpose: f.purpose,
          priority: f.priority, due_date: f.due_date?.slice(0, 10),
          status: f.status, responsible: f.responsible_name,
          entity_type: f.entity_type, entity_id: f.entity_id,
        })),
        entity_label: 'Follow-ups',
      }
    }

    case 'opportunities': {
      const results = MOCK_PIPELINE_OPPORTUNITIES.filter(o => {
        if (filters.stage && !matchString(o.stage, filters.stage)) return false
        if (filters.client_name && !matchString(o.client_name, filters.client_name)) return false
        if (filters.agent_name && !matchString(o.agent_name, filters.agent_name)) return false
        return true
      })
      return {
        results: results.map(o => ({
          id: o.id, client: o.client_name, stage: o.stage,
          property_location: o.property_short_loc, expected_value: o.expected_value,
          probability: `${o.probability}%`, agent: o.agent_name,
          campaign: o.attributed_campaign_name || '—',
        })),
        entity_label: 'Opportunities',
      }
    }

    case 'requirements': {
      const results = MOCK_REQUIREMENTS.filter(r => {
        if (filters.status && !matchString(r.status, filters.status)) return false
        if (filters.category && !matchString(r.category, filters.category)) return false
        if (filters.client_name && !matchString(r.client_name, filters.client_name)) return false
        return true
      })
      return {
        results: results.map(r => ({
          id: r.id, client: r.client_name, category: r.category, intent: r.intent,
          locations: r.preferred_short_locs.join(', '),
          budget: r.min_budget !== null ? `₹${r.min_budget?.toLocaleString('en-IN')} – ₹${r.max_budget?.toLocaleString('en-IN')}` : '—',
          status: r.status, assigned_to: r.assigned_to_name || 'Unassigned',
        })),
        entity_label: 'Requirements',
      }
    }

    case 'tasks': {
      const results = MOCK_TASKS.filter(t => {
        if (filters.status && !matchString(t.status, filters.status)) return false
        if (filters.priority && !matchString(t.priority, filters.priority)) return false
        if (filters.assigned_to_name && !matchString(t.assigned_to_name || '', filters.assigned_to_name)) return false
        if (filters.task_type && !matchString(t.task_type, filters.task_type)) return false
        return true
      })
      return {
        results: results.map(t => ({
          id: t.id, title: t.title, status: t.status, priority: t.priority,
          assigned_to: t.assigned_to_name, due: t.due_date?.slice(0, 10), task_type: t.task_type,
        })),
        entity_label: 'Tasks',
      }
    }

    case 'campaigns': {
      const results = MOCK_CAMPAIGNS.filter(c => {
        if (filters.status && !matchString(c.status, filters.status)) return false
        if (filters.type && !matchString(c.type, filters.type)) return false
        return true
      })
      return {
        results: results.map(c => ({
          id: c.id, name: c.name, type: c.type, status: c.status,
          owner: c.owner_name, period: `${c.start_date} to ${c.end_date}`,
          budget: c.planned_budget, spend: c.actual_spend ?? '—',
        })),
        entity_label: 'Campaigns',
      }
    }

    case 'parties': {
      const results = MOCK_PARTIES.filter(p => {
        if (filters.status && !matchString(p.status, filters.status)) return false
        return true
      })
      return {
        results: results.map(p => ({
          id: p.id, name: p.name, email: p.email, mobile: p.mobile,
          city: p.city, roles: p.roles.join(', '), status: p.status,
        })),
        entity_label: 'Parties / Contacts',
      }
    }

    case 'telemarketing': {
      const results = MOCK_TELEMARKETING_CAMPAIGNS.filter(t => {
        if (filters.status && !matchString(t.status, filters.status)) return false
        return true
      })
      return {
        results: results.map(t => ({
          id: t.id, name: t.name, purpose: t.purpose, status: t.status,
          target_audience: t.target_audience, geography: t.geography,
        })),
        entity_label: 'Telemarketing Campaigns',
      }
    }

    default:
      return { results: [], entity_label: 'Data' }
  }
}

// ── POST /api/ai-agent ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured. Add it to .env.local' }, { status: 500 })
    }

    const body: AIAgentRequest = await req.json()
    const { message, conversation_history = [], pending_action_type, pending_action_fields } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // ── Step 1: Parse user intent with Groq ────────────────────────────────────

    // If we have a pending write action in progress, provide context to the LLM
    let systemPrompt = DATA_SCHEMA
    if (pending_action_type && pending_action_fields) {
      const filledFields = Object.entries(pending_action_fields)
        .filter(([, v]) => v !== null && v !== '')
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n')
      systemPrompt += `\n\n## CURRENT CONTEXT: Collecting fields for ${pending_action_type}
Already collected fields:
${filledFields || '  (none yet)'}
The user is providing additional information to complete this action. Extract the new field values from their message and merge with already-collected fields.`
    }

    const intentMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversation_history.slice(-8),
      { role: 'user' as const, content: message },
    ]

    const intentRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: intentMessages,
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 768,
      }),
    })

    if (!intentRes.ok) {
      const errBody = await intentRes.text()
      if (intentRes.status === 429) {
        return NextResponse.json({ error: 'AI rate limit exceeded. Please wait a moment and try again.' }, { status: 429 })
      }
      return NextResponse.json({ error: `AI service error (${intentRes.status}). Please try again.` }, { status: 502 })
    }

    const intentData = await intentRes.json()
    const intentRaw = intentData.choices?.[0]?.message?.content || '{}'

    let intent: AIAgentIntent
    try {
      const cleaned = intentRaw.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
      intent = JSON.parse(cleaned)
    } catch {
      intent = { intent: 'clarify', entity: 'general', filters: {}, clarification_needed: 'I had trouble understanding your request. Could you please rephrase it?' }
    }

    // ── Handle write intents ───────────────────────────────────────────────────

    const WRITE_INTENTS = ['create_lead', 'create_followup', 'schedule_visit']

    if (WRITE_INTENTS.includes(intent.intent)) {
      // Merge with any previously collected fields from the pending action context
      const mergedFields: Record<string, string | null> = {
        ...(pending_action_fields || {}),
        ...(intent.extracted_fields || {}),
      }

      // Determine missing required fields based on action type
      let requiredFields: string[] = []
      if (intent.intent === 'create_lead') {
        requiredFields = ['party_name', 'phone', 'lead_type']
      } else if (intent.intent === 'create_followup') {
        requiredFields = ['client_name', 'purpose', 'due_date', 'responsible_name']
      } else if (intent.intent === 'schedule_visit') {
        requiredFields = ['client_name', 'property_short_loc', 'agent_name', 'scheduled_date']
      }

      const stillMissing = requiredFields.filter(f => !mergedFields[f] || mergedFields[f] === '')

      if (stillMissing.length > 0) {
        // Not all required fields collected — ask for them
        const fieldLabels: Record<string, string> = {
          party_name: 'the client\'s full name',
          phone: 'their phone number',
          lead_type: 'the lead type (Buyer/Seller/Tenant/Landlord/Investor/Consultant)',
          client_name: 'the client\'s name',
          purpose: 'the purpose of the follow-up',
          due_date: 'when the follow-up should happen (date and time)',
          responsible_name: 'which team member should be responsible',
          property_short_loc: 'the property location (e.g. 01-Schm140_Mayank, 05-MG_Road)',
          agent_name: 'which agent should conduct the visit (Ravi Mehta, Priya Sharma, Amit Patel, or Sanjay Verma)',
          scheduled_date: 'the visit date and time',
        }

        const missingDesc = stillMissing.map(f => fieldLabels[f] || f).join(', and ')
        const clarificationMsg = `To ${intent.intent === 'create_lead' ? 'create this lead' : intent.intent === 'create_followup' ? 'schedule this follow-up' : 'book this visit'}, I still need: **${missingDesc}**. Could you provide that?`

        return NextResponse.json({
          answer: clarificationMsg,
          data_queried: 'None',
          record_count: 0,
          intent: { ...intent, extracted_fields: mergedFields, missing_required_fields: stillMissing },
          raw_results: [],
          action_proposal: null,
          // Echo back so the frontend can track pending state
          _pending_action_type: intent.intent,
          _pending_action_fields: mergedFields,
        })
      }

      // All required fields collected — ready to propose
      return NextResponse.json({
        answer: `I have everything I need. Here's what I'm proposing to create — please review and edit any field before approving:`,
        data_queried: 'None',
        record_count: 0,
        intent: { ...intent, extracted_fields: mergedFields, missing_required_fields: [] },
        raw_results: [],
        action_proposal: {
          action_type: intent.intent as 'create_lead' | 'create_followup' | 'schedule_visit',
          fields: mergedFields,
          ready: true,
        },
      })
    }

    // ── Handle clarification / unsupported ─────────────────────────────────────

    if (intent.intent === 'clarify' || intent.intent === 'unsupported') {
      const clarifyMsg = intent.clarification_needed ||
        'I\'m not sure what you\'re looking for. Could you be more specific? For example: "Show me active leads", "Create a lead for Rajesh Kumar, phone 9876543210, buyer", or "Schedule a follow-up with Amit Jain for tomorrow".'

      return NextResponse.json({
        answer: clarifyMsg,
        data_queried: 'None',
        record_count: 0,
        intent,
        raw_results: [],
      } satisfies AIAgentResponse)
    }

    // ── Step 2: Query actual mock data (read intents) ─────────────────────────

    const { results, entity_label } = await queryMockData(intent)

    // ── Step 3: Natural-language answer ───────────────────────────────────────

    const resultsForPrompt = results.slice(0, 25)

    const answerSystemPrompt = `You are the PropDesk CRM AI assistant. Provide clear, concise answers about real estate CRM data.
Rules:
- ONLY use the data provided. Do NOT invent or hallucinate any numbers or names.
- If results list is empty, say so clearly.
- Format monetary values in Indian Rupee format (₹ with Indian numbering like ₹54 L or ₹1.2 Cr).
- Keep the answer conversational — 2-4 sentences max unless listing items.
- If listing, use a clean numbered or bulleted format.
- Do NOT say "Based on the data provided" — just answer directly.`

    const answerUserPrompt = `User asked: "${message}"
Entity queried: ${entity_label}
Total matching records: ${results.length}
${resultsForPrompt.length > 0 ? `Results (${resultsForPrompt.length} shown):\n${JSON.stringify(resultsForPrompt, null, 2)}` : 'No matching records found.'}

Please provide a helpful, natural-language answer.`

    const answerRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: answerSystemPrompt },
          { role: 'user', content: answerUserPrompt },
        ],
        temperature: 0.3,
        max_tokens: 512,
      }),
    })

    let finalAnswer = `Found ${results.length} ${entity_label.toLowerCase()}.`
    if (answerRes.ok) {
      const answerData = await answerRes.json()
      const rawAnswer = answerData.choices?.[0]?.message?.content || ''
      if (rawAnswer.trim()) finalAnswer = rawAnswer.trim()
    }

    return NextResponse.json({
      answer: finalAnswer,
      data_queried: entity_label,
      record_count: results.length,
      intent,
      raw_results: results,
    } satisfies AIAgentResponse)

  } catch (error) {
    console.error('AI Agent route error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}

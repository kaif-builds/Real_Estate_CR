import { NextRequest, NextResponse } from 'next/server'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AIAgentIntent {
  intent: 'query_data' | 'clarify' | 'unsupported'
  entity: string // 'leads' | 'properties' | 'follow_ups' | 'opportunities' | 'requirements' | 'tasks' | 'campaigns' | 'parties' | 'telemarketing' | 'general'
  filters: Record<string, string | string[] | boolean | null>
  summary_requested?: boolean
  clarification_needed?: string | null
  reasoning?: string
}

export interface AIAgentRequest {
  message: string
  conversation_history?: { role: 'user' | 'assistant'; content: string }[]
}

export interface AIAgentResponse {
  answer: string
  data_queried: string
  record_count: number
  intent: AIAgentIntent
  raw_results?: unknown[]
}

// ── Data Schema (fields only, no actual data rows) ────────────────────────────
// Sent to the LLM so it knows what to filter on.

const DATA_SCHEMA = `
You are the AI assistant embedded in "PropDesk CRM" — a real estate CRM for an agency in Indore, India.
You have READ-ONLY access to the following CRM entities and fields.

IMPORTANT RULES:
- You MUST NOT make up numbers or data. All facts come from the actual database.
- If the user's intent is ambiguous, set intent="clarify" and explain what clarification is needed.
- You respond ONLY with a valid JSON object matching the schema below.

## CRM Entities and Fields

### leads
Fields: id, party_name, lead_type (BUYER|SELLER|TENANT|LANDLORD|INVESTOR|CONSULTANT), status (NEW|CONTACTED|QUALIFIED|LOST|ACTIVE|CONVERTED), priority (LOW|MEDIUM|HIGH|CRITICAL), channel_type (Digital|Offline), source (string), assigned_to_name (string), value (number|null), remarks (string|null), created_at (ISO date), next_follow_up_at (ISO date|null), campaign_name (string|null)

### properties
Fields: id, category (RENTAL_RESIDENTIAL|RENTAL_COMMERCIAL|BUY_SELL_FLAT|BUY_SELL_COMMERCIAL|PLOT), short_loc (e.g. "01-Schm140_Mayank", "07-Geeta_Bhawan", "05-MG_Road", "04-Vijay_Nagar", "08-SAPNA_SANGEETA", "09-Super_Corridor"), address, price (number, monthly rent or sale price), status (AVAILABLE|NEW|UNDER_NEGOTIATION|ON_HOLD|RENTED|SOLD), owner_name, source (Owner|Broker|Builder-Marketing)

### follow_ups
Fields: id, client_name, entity_type (Lead|Requirement|Opportunity), entity_id, purpose (string), priority (LOW|MEDIUM|HIGH), due_date (ISO date), status (PENDING|COMPLETED|OVERDUE|RESCHEDULED|CANCELLED|NO_RESPONSE), responsible_name

### opportunities (pipeline)
Fields: id, client_name, property_short_loc, stage (QUALIFIED|PROPERTY_SHARED|SITE_VISIT|NEGOTIATION|DOCUMENTATION|WON|LOST), expected_value (number), probability (number 0-100), agent_name, attributed_campaign_name

### requirements
Fields: id, client_name, category (RENTAL_RESIDENTIAL|RENTAL_COMMERCIAL|BUY_SELL_FLAT|BUY_SELL_COMMERCIAL|PLOT), intent (BUY|RENT), preferred_short_locs (array), min_budget (number|null), max_budget (number|null), status (ACTIVE|QUALIFIED|NEW|LOW_CLARITY|FULFILLED|DROPPED), assigned_to_name

### tasks
Fields: id, title, assigned_to_name, priority (LOW|NORMAL|HIGH|URGENT), status (TODO|IN_PROGRESS|DONE|CANCELLED|BLOCKED), due_date (ISO date), category (string), linked_entity_type

### campaigns
Fields: id, name, type (Property Promotion|Buyer Acquisition|Seller Acquisition|Tenant Acquisition|...|Brand Awareness|Lead Generation), status (Draft|Planned|Active|Paused|Completed|Cancelled), owner_name, start_date, end_date, planned_budget, actual_spend, target_leads

### parties
Fields: id, name, email, mobile, city, roles (array: BUYER|SELLER|OWNER|TENANT|LANDLORD|BROKER|BUILDER|CLIENT), status (Active|Inactive), source

### telemarketing
Fields: id, name, target_audience, purpose (Cold Calling|Market Survey|Owner Acquisition|Buyer Acquisition|Lead Reactivation|Other), status (Draft|Active|Paused|Completed), geography, assigned_telecallers

## Your Response Format
Return EXACTLY this JSON object (no markdown, no code fences):
{
  "intent": "query_data" | "clarify" | "unsupported",
  "entity": "leads" | "properties" | "follow_ups" | "opportunities" | "requirements" | "tasks" | "campaigns" | "parties" | "telemarketing" | "general",
  "filters": {
    // key-value pairs matching the field names above. Use exact enum values.
    // Examples:
    //   "status": "OVERDUE"
    //   "stage": "NEGOTIATION"
    //   "short_loc": "01-Schm140_Mayank"
    //   "priority": "HIGH"
    //   "category": "RENTAL_RESIDENTIAL"
    //   "lead_type": "BUYER"
    // For "active" leads, status should be ["NEW", "CONTACTED", "QUALIFIED", "ACTIVE"]
    // Leave as {} if no specific filter
  },
  "summary_requested": true | false,  // true if user wants a count/summary, false if they want a list
  "clarification_needed": null | "string explaining what needs clarification",
  "reasoning": "brief explanation of what you understood"
}
`

// ── Data Query Engine ─────────────────────────────────────────────────────────
// Runs on the SERVER side — imports mock data directly.
// This avoids sending raw data to the LLM in step 1.

async function queryMockData(intent: AIAgentIntent): Promise<{ results: unknown[]; entity_label: string }> {
  // Dynamic import of mockData — only runs server-side
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
      let results = MOCK_LEADS.filter(l => {
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
          id: l.id,
          client: l.party_name,
          type: l.lead_type,
          status: l.status,
          priority: l.priority,
          source: l.source,
          channel: l.channel_type,
          assigned_to: l.assigned_to_name,
          value: l.value,
          created: l.created_at?.slice(0, 10),
          next_follow_up: l.next_follow_up_at?.slice(0, 10) || 'Not scheduled',
          campaign: l.campaign_name || '—',
          remarks: l.remarks,
        })),
        entity_label: 'Leads',
      }
    }

    case 'properties': {
      let results = MOCK_PROPERTIES.filter(p => {
        if (filters.status && !matchString(p.status, filters.status)) return false
        if (filters.category && !matchString(p.category, filters.category)) return false
        if (filters.short_loc && !matchString(p.short_loc, filters.short_loc)) return false
        if (filters.owner_name && !matchString(p.owner_name, filters.owner_name)) return false
        if (filters.source && !matchString(p.source || '', filters.source)) return false
        return true
      })
      return {
        results: results.map(p => ({
          id: p.id,
          category: p.category,
          location: p.short_loc,
          address: p.address,
          price: p.price,
          status: p.status,
          owner: p.owner_name,
          source: p.source,
        })),
        entity_label: 'Properties',
      }
    }

    case 'follow_ups': {
      let results = MOCK_FOLLOW_UPS.filter(f => {
        if (filters.status && !matchString(f.status, filters.status)) return false
        if (filters.priority && !matchString(f.priority, filters.priority)) return false
        if (filters.entity_type && !matchString(f.entity_type, filters.entity_type)) return false
        if (filters.responsible_name && !matchString(f.responsible_name, filters.responsible_name)) return false
        if (filters.client_name && !matchString(f.client_name, filters.client_name)) return false
        return true
      })
      return {
        results: results.map(f => ({
          id: f.id,
          client: f.client_name,
          purpose: f.purpose,
          priority: f.priority,
          due_date: f.due_date?.slice(0, 10),
          status: f.status,
          responsible: f.responsible_name,
          entity_type: f.entity_type,
          entity_id: f.entity_id,
        })),
        entity_label: 'Follow-ups',
      }
    }

    case 'opportunities': {
      let results = MOCK_PIPELINE_OPPORTUNITIES.filter(o => {
        if (filters.stage && !matchString(o.stage, filters.stage)) return false
        if (filters.client_name && !matchString(o.client_name, filters.client_name)) return false
        if (filters.agent_name && !matchString(o.agent_name, filters.agent_name)) return false
        if (filters.property_short_loc && !matchString(o.property_short_loc, filters.property_short_loc)) return false
        return true
      })
      return {
        results: results.map(o => ({
          id: o.id,
          client: o.client_name,
          stage: o.stage,
          property_location: o.property_short_loc,
          expected_value: o.expected_value,
          probability: `${o.probability}%`,
          agent: o.agent_name,
          campaign: o.attributed_campaign_name || '—',
        })),
        entity_label: 'Opportunities',
      }
    }

    case 'requirements': {
      let results = MOCK_REQUIREMENTS.filter(r => {
        if (filters.status && !matchString(r.status, filters.status)) return false
        if (filters.category && !matchString(r.category, filters.category)) return false
        if (filters.intent && !matchString(r.intent, filters.intent)) return false
        if (filters.client_name && !matchString(r.client_name, filters.client_name)) return false
        if (filters.assigned_to_name && !matchString(r.assigned_to_name || '', filters.assigned_to_name)) return false
        return true
      })
      return {
        results: results.map(r => ({
          id: r.id,
          client: r.client_name,
          category: r.category,
          intent: r.intent,
          locations: r.preferred_short_locs.join(', '),
          budget: r.min_budget !== null ? `₹${r.min_budget?.toLocaleString('en-IN')} – ₹${r.max_budget?.toLocaleString('en-IN')}` : '—',
          status: r.status,
          assigned_to: r.assigned_to_name || 'Unassigned',
        })),
        entity_label: 'Requirements',
      }
    }

    case 'tasks': {
      let results = MOCK_TASKS.filter(t => {
        if (filters.status && !matchString(t.status, filters.status)) return false
        if (filters.priority && !matchString(t.priority, filters.priority)) return false
        if (filters.assigned_to_name && !matchString(t.assigned_to_name || '', filters.assigned_to_name)) return false
        if (filters.task_type && !matchString(t.task_type, filters.task_type)) return false
        return true
      })
      return {
        results: results.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          assigned_to: t.assigned_to_name,
          due: t.due_date?.slice(0, 10),
          task_type: t.task_type,
        })),
        entity_label: 'Tasks',
      }
    }

    case 'campaigns': {
      let results = MOCK_CAMPAIGNS.filter(c => {
        if (filters.status && !matchString(c.status, filters.status)) return false
        if (filters.type && !matchString(c.type, filters.type)) return false
        if (filters.owner_name && !matchString(c.owner_name, filters.owner_name)) return false
        return true
      })
      return {
        results: results.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          status: c.status,
          owner: c.owner_name,
          period: `${c.start_date} to ${c.end_date}`,
          budget: c.planned_budget,
          spend: c.actual_spend ?? '—',
        })),
        entity_label: 'Campaigns',
      }
    }

    case 'parties': {
      let results = MOCK_PARTIES.filter(p => {
        if (filters.status && !matchString(p.status, filters.status)) return false
        if (filters.city && !matchString(p.city, filters.city)) return false
        return true
      })
      return {
        results: results.map(p => ({
          id: p.id,
          name: p.name,
          email: p.email,
          mobile: p.mobile,
          city: p.city,
          roles: p.roles.join(', '),
          status: p.status,
        })),
        entity_label: 'Parties / Contacts',
      }
    }

    case 'telemarketing': {
      let results = MOCK_TELEMARKETING_CAMPAIGNS.filter(t => {
        if (filters.status && !matchString(t.status, filters.status)) return false
        if (filters.purpose && !matchString(t.purpose, filters.purpose)) return false
        return true
      })
      return {
        results: results.map(t => ({
          id: t.id,
          name: t.name,
          purpose: t.purpose,
          status: t.status,
          target_audience: t.target_audience,
          geography: t.geography,
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
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured. Add it to .env.local' },
        { status: 500 }
      )
    }

    const body: AIAgentRequest = await req.json()
    const { message, conversation_history = [] } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // ── Step 1: Parse user intent with Groq ────────────────────────────────────

    const intentMessages = [
      { role: 'system' as const, content: DATA_SCHEMA },
      ...conversation_history.slice(-6), // include last 3 turns for context
      { role: 'user' as const, content: message },
    ]

    const intentRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: intentMessages,
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 512,
      }),
    })

    if (!intentRes.ok) {
      const errBody = await intentRes.text()
      console.error('Groq intent parse error:', intentRes.status, errBody)
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

    // ── Handle clarification / unsupported ─────────────────────────────────────

    if (intent.intent === 'clarify' || intent.intent === 'unsupported') {
      const clarifyMsg = intent.clarification_needed ||
        "I'm not sure what you're looking for. Could you be more specific? For example: \"Show me active leads\", \"List overdue follow-ups\", or \"What properties are available in Scheme 140?\""

      return NextResponse.json({
        answer: clarifyMsg,
        data_queried: 'None',
        record_count: 0,
        intent,
        raw_results: [],
      } satisfies AIAgentResponse)
    }

    // ── Step 2: Query actual mock data ─────────────────────────────────────────

    const { results, entity_label } = await queryMockData(intent)

    // ── Step 3: Have Groq phrase a natural-language answer from real results ───
    // We send ONLY summarized results (not full raw data) to minimize tokens

    const resultsForPrompt = results.slice(0, 25) // cap at 25 records to stay within token limits

    const answerSystemPrompt = `You are the PropDesk CRM AI assistant. Your job is to provide clear, concise answers about real estate CRM data.
Rules:
- ONLY use the data provided. Do NOT invent or hallucinate any numbers or names.
- If the results list is empty, say so clearly.
- Format monetary values in Indian Rupee format (₹ with Indian numbering like ₹54 L or ₹1.2 Cr).
- Keep the answer conversational and helpful — 2-4 sentences max unless listing items.
- If listing items, use a clean numbered or bulleted format.
- Do NOT say "Based on the data provided" — just answer directly.`

    const answerUserPrompt = `User asked: "${message}"

Entity queried: ${entity_label}
Total matching records: ${results.length}
${resultsForPrompt.length > 0 ? `Results (${resultsForPrompt.length} shown):\n${JSON.stringify(resultsForPrompt, null, 2)}` : 'No matching records found.'}

Please provide a helpful, natural-language answer summarising these results for the user.`

    const answerRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
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
      if (rawAnswer.trim()) {
        finalAnswer = rawAnswer.trim()
      }
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

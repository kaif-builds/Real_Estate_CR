import { NextRequest, NextResponse } from 'next/server'

// ── Types ────────────────────────────────────────────────────────────────────

interface RateMention {
  mention: string
  amount: string
  context: string
}

interface CallAnalysis {
  transcript: string
  summary: string
  rates: RateMention[]
  sentiment: 'Interested' | 'Neutral' | 'Not Interested'
  nextAction: string
}

// ── POST /api/summarize-call ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured. Add it to .env.local' },
        { status: 500 }
      )
    }

    // Parse the multipart form data
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided. Please upload an audio file.' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a',
      'audio/x-m4a', 'audio/wav', 'audio/wave', 'audio/x-wav',
      'audio/webm', 'video/webm',
    ]
    if (!allowedTypes.includes(audioFile.type) && !audioFile.name.match(/\.(mp3|m4a|wav|webm)$/i)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${audioFile.type || 'unknown'}. Accepted: .mp3, .m4a, .wav, .webm` },
        { status: 400 }
      )
    }

    // Validate file size (Groq Whisper caps at ~25MB)
    const MAX_SIZE = 25 * 1024 * 1024 // 25 MB
    if (audioFile.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(audioFile.size / 1024 / 1024).toFixed(1)}MB). Maximum is 25MB.` },
        { status: 400 }
      )
    }

    // ── Step 1: Transcribe with Groq Whisper ──────────────────────────────────

    const whisperForm = new FormData()
    whisperForm.append('file', audioFile, audioFile.name)
    whisperForm.append('model', 'whisper-large-v3')
    whisperForm.append('response_format', 'text')

    const transcribeRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: whisperForm,
    })

    if (!transcribeRes.ok) {
      const errBody = await transcribeRes.text()
      console.error('Groq Whisper error:', transcribeRes.status, errBody)

      if (transcribeRes.status === 401) {
        return NextResponse.json(
          { error: 'Invalid GROQ_API_KEY. Check your API key in .env.local' },
          { status: 401 }
        )
      }
      if (transcribeRes.status === 429) {
        return NextResponse.json(
          { error: 'Groq rate limit exceeded. Please wait a moment and try again.' },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: `Transcription failed (HTTP ${transcribeRes.status}): ${errBody.slice(0, 200)}` },
        { status: 502 }
      )
    }

    const transcript = await transcribeRes.text()

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transcription returned empty. The audio file may be silent, corrupted, or in an unsupported format.' },
        { status: 422 }
      )
    }

    // ── Step 2: Analyze with Groq LLM ────────────────────────────────────────

    const analysisPrompt = `You are an AI assistant for a real estate CRM. Analyze the following call transcript between a real estate agent and a client.

Return your analysis as a JSON object with EXACTLY this structure (no markdown, no code fences, just raw JSON):
{
  "summary": "A 2-3 sentence summary of the call",
  "rates": [
    { "mention": "what was discussed", "amount": "the price/rate", "context": "brief context" }
  ],
  "sentiment": "Interested" or "Neutral" or "Not Interested",
  "nextAction": "Suggested next action based on the call"
}

Rules:
- "rates" should be an empty array [] if no specific prices, rates, or amounts were mentioned.
- "sentiment" MUST be exactly one of: "Interested", "Neutral", "Not Interested"
- "nextAction" should be a specific, actionable follow-up step.
- Return ONLY the JSON object, nothing else.

Transcript:
"""${transcript}"""`

    const llmRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          { role: 'user', content: analysisPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    })

    if (!llmRes.ok) {
      const errBody = await llmRes.text()
      console.error('Groq LLM error:', llmRes.status, errBody)

      if (llmRes.status === 429) {
        return NextResponse.json(
          { error: 'Groq rate limit exceeded during analysis. Please wait and try again.' },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: `Analysis failed (HTTP ${llmRes.status}): ${errBody.slice(0, 200)}` },
        { status: 502 }
      )
    }

    const llmData = await llmRes.json()
    const rawContent = llmData.choices?.[0]?.message?.content || ''

    // Parse the JSON from the LLM response
    let analysis: Omit<CallAnalysis, 'transcript'>
    try {
      // Strip any markdown code fences the LLM might have added
      const cleaned = rawContent.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
      analysis = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse LLM JSON:', rawContent)
      // Fallback: return the raw content as the summary
      analysis = {
        summary: rawContent.slice(0, 500) || 'Unable to generate structured analysis.',
        rates: [],
        sentiment: 'Neutral',
        nextAction: 'Review the transcript manually and determine next steps.',
      }
    }

    // Validate sentiment value
    const validSentiments = ['Interested', 'Neutral', 'Not Interested'] as const
    if (!validSentiments.includes(analysis.sentiment as any)) {
      analysis.sentiment = 'Neutral'
    }

    const result: CallAnalysis = {
      transcript,
      summary: analysis.summary || 'No summary available.',
      rates: Array.isArray(analysis.rates) ? analysis.rates : [],
      sentiment: analysis.sentiment as CallAnalysis['sentiment'],
      nextAction: analysis.nextAction || 'Follow up with the client.',
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Summarize-call route error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred processing the recording.' },
      { status: 500 }
    )
  }
}

// Route segment config: increase max body size for audio uploads
export const maxDuration = 60 // seconds — Whisper can take time on long recordings

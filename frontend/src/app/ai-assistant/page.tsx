'use client'

/**
 * AI Assistant — Part 1 (Read-Only)
 * Conversational interface backed by /api/ai-agent.
 * Two-phase Groq pipeline: intent parsing → data query → natural language answer.
 * All interactions logged to MOCK_AI_INTERACTIONS for traceability.
 *
 * READ-ONLY: No create/update/delete actions in this version.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bot, Send, User, Loader2, AlertCircle, RefreshCw,
  Database, Sparkles, ChevronDown, ChevronUp, Clock,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { logAiInteraction, MOCK_AI_INTERACTIONS, type AiInteractionLog } from '@/lib/mockData'
import { useAuth } from '@/lib/auth-context'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant' | 'error'
  content: string
  data_queried?: string
  record_count?: number
  timestamp: Date
  loading?: boolean
}

// ── Suggested queries ─────────────────────────────────────────────────────────

const SUGGESTED_QUERIES = [
  'How many active leads do we have?',
  'Show me overdue follow-ups',
  'What properties are available in 01-Schm140_Mayank?',
  'Which opportunities are in negotiation stage?',
  'List qualified requirements',
  'Show me active campaigns',
  'How many buyers do we have?',
  'What tasks are pending?',
]

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, isLast }: { msg: Message; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const isUser = msg.role === 'user'
  const isError = msg.role === 'error'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {/* AI avatar */}
      {!isUser && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1 ${
          isError ? 'bg-red-100' : 'bg-amber-100'
        }`}>
          {isError ? <AlertCircle size={16} className="text-red-500" /> : <Bot size={16} className="text-amber-600" />}
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Bubble */}
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

        {/* Metadata row for AI responses */}
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

        {/* Timestamp */}
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

// ── Interaction History Panel ─────────────────────────────────────────────────

function InteractionHistory({ logs }: { logs: AiInteractionLog[] }) {
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
                Entity: {log.entity_queried} · {log.record_count} record{log.record_count !== 1 ? 's' : ''}
                · {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AIAssistantPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm PropDesk AI — your read-only assistant for CRM data. I can answer questions like:

• "How many active leads do we have?"
• "Show me overdue follow-ups"
• "What properties are available in Scheme 140?"
• "Which opportunities are in negotiation?"

What would you like to know?`,
      timestamp: new Date(),
    },
  ])
  const [sessionLogs, setSessionLogs] = useState<AiInteractionLog[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text?: string) => {
    const userText = (text ?? input).trim()
    if (!userText || loading) return

    setInput('')
    setLoading(true)

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date(),
    }

    const loadingMsg: Message = {
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
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`)
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'No response received.',
        data_queried: data.data_queried,
        record_count: data.record_count,
        timestamp: new Date(),
      }

      // Update conversation history for context
      setConversationHistory(prev => [
        ...prev,
        { role: 'user' as const, content: userText },
        { role: 'assistant' as const, content: data.answer },
      ].slice(-12)) // keep last 6 turns

      // Log the interaction
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
      setSessionLogs(prev => [log, ...prev])

      setMessages(prev => prev.map(m => m.id === loadingMsg.id ? aiMsg : m))
    } catch (err) {
      const errorMsg: Message = {
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
  }, [input, loading, conversationHistory, user])

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
      content: 'Chat cleared. What would you like to know?',
      timestamp: new Date(),
    }])
    setConversationHistory([])
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
              <p className="text-xs text-slate-500">Read-only · Powered by Groq · PropDesk CRM data</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className="text-slate-500 gap-1.5"
          >
            <RefreshCw size={14} />
            Clear Chat
          </Button>
        </div>

        {/* Chat container */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
          {/* Message list */}
          <div className="flex-1 overflow-y-auto p-6">
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id} msg={msg} isLast={i === messages.length - 1} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested queries */}
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

          {/* Session log panel */}
          <InteractionHistory logs={sessionLogs} />

          {/* Input bar */}
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-end gap-3">
              <div className="flex-1 bg-white border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-amber-400 focus-within:border-amber-400 transition-all">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about leads, properties, follow-ups, campaigns…"
                  disabled={loading}
                  className="w-full px-4 py-3 text-sm text-slate-800 placeholder-slate-400 bg-transparent resize-none focus:outline-none disabled:opacity-50"
                  style={{ maxHeight: '120px', minHeight: '44px' }}
                  onInput={e => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`
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
              Read-only access · Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

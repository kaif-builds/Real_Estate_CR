'use client'

/**
 * ClientPortal — Spec §1.5
 * Accessible by: CLIENT
 *
 * Sections:
 *  1. My Requirement summary card
 *  2. Properties Shared With You — property cards with reaction control
 *  3. My Visit History — timeline view
 *
 * Visual style: lighter, softer palette (blue accent) vs. internal amber theme.
 */

import { useEffect, useState } from 'react'
import {
  Home, ThumbsUp, Minus, ThumbsDown, MapPin, Calendar, User, CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiGet } from '@/lib/apiClient'
import {
  formatPrice, formatBudget, formatDate, formatCategory, formatIntent, statusClasses,
} from '@/lib/formatters'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Requirement {
  id: string
  category: string
  intent: string
  preferred_short_locs: string[]
  min_budget: number | null
  max_budget: number | null
  status: string
}

interface Consultant { name: string; email: string }

interface SharedProperty {
  match_id: string
  property_id: string
  short_loc: string
  category: string
  price: number
  score: number
  tier: string
  match_status: string
}

interface VisitRecord {
  id: string
  property_short_loc: string
  agent_name: string
  status: string
  planned_date: string | null
  outcome_json: Record<string, string> | null
}

interface ClientData {
  requirement: Requirement | null
  consultant: Consultant | null
  shared_properties: SharedProperty[]
  visit_history: VisitRecord[]
}

// Reactions stored locally (would be persisted to DB in a later step)
type Reaction = 'liked' | 'neutral' | 'not_interested' | null

// ── Main component ────────────────────────────────────────────────────────────

export function ClientPortal() {
  const [data, setData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reactions, setReactions] = useState<Record<string, Reaction>>({})

  useEffect(() => {
    // TODO: reconnect to real backend during wiring pass
    /*
    apiGet<ClientData>('/api/dashboard/client')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
    */
    setData({
      requirement: {
        id: 'R-2002',
        category: 'BUY_SELL_FLAT',
        intent: 'BUY',
        preferred_short_locs: ['01-Schm140_Mayank', '08-SAPNA_SANGEETA'],
        min_budget: 4000000,
        max_budget: 6000000,
        status: 'QUALIFIED',
      },
      consultant: {
        name: 'Ravi Mehta',
        email: 'ravi@propdesk.in',
      },
      shared_properties: [
        {
          match_id: 'm1',
          property_id: 'P-1003',
          short_loc: '01-Schm140_Mayank',
          category: 'BUY_SELL_FLAT',
          price: 5400000,
          score: 92,
          tier: 'HIGH',
          match_status: 'SHARED',
        },
        {
          match_id: 'm2',
          property_id: 'P-1004',
          short_loc: '08-SAPNA_SANGEETA',
          category: 'BUY_SELL_FLAT',
          price: 4200000,
          score: 85,
          tier: 'MEDIUM',
          match_status: 'SHARED',
        },
      ],
      visit_history: [
        {
          id: 'v1',
          property_short_loc: '01-Schm140_Mayank',
          agent_name: 'Ravi Mehta',
          status: 'SCHEDULED',
          planned_date: '2026-09-20T11:00:00Z',
          outcome_json: null,
        },
      ],
    })
    setLoading(false)
  }, [])

  const setReaction = (matchId: string, reaction: Reaction) => {
    setReactions((prev) => ({
      ...prev,
      [matchId]: prev[matchId] === reaction ? null : reaction,
    }))
  }

  if (loading) return <ClientSkeleton />
  if (error) return <ClientError message={error} />
  if (!data) return null

  const { requirement, consultant, shared_properties, visit_history } = data

  return (
    <div className="min-h-screen bg-blue-50/40">
      {/* Portal header — softer styling, client-facing */}
      <div className="bg-white border-b border-blue-100 px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <Home size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">My Portal</h1>
          <p className="text-xs text-slate-500">RealEstateCRM · Client View</p>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-4xl mx-auto">

        {/* ── My Requirement ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">My Requirement</h2>
          {requirement ? (
            <Card className="border-blue-100">
              <CardContent className="p-5 grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Info label="Category" value={formatCategory(requirement.category)} />
                  <Info label="Intent"   value={formatIntent(requirement.intent)} />
                  <Info label="Budget"   value={formatBudget(requirement.min_budget, requirement.max_budget)} />
                  <Info label="Status">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(requirement.status)}`}>
                      {requirement.status}
                    </span>
                  </Info>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preferred Locations</p>
                  <div className="flex flex-wrap gap-1.5">
                    {requirement.preferred_short_locs.map((loc) => (
                      <span key={loc} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-100">
                        <MapPin size={10} /> {loc}
                      </span>
                    ))}
                  </div>
                  {consultant && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                      <User size={14} className="text-blue-500" />
                      <span>Your consultant: <span className="font-medium">{consultant.name}</span></span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-blue-100">
              <CardContent className="p-5 text-sm text-slate-400">
                No active requirement found. Contact your consultant to set one up.
              </CardContent>
            </Card>
          )}
        </section>

        {/* ── Properties Shared With You ───────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Properties Shared With You
          </h2>
          {shared_properties.length === 0 ? (
            <Card className="border-blue-100">
              <CardContent className="p-5 text-sm text-slate-400">
                No properties shared yet. Your consultant will share options soon.
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {shared_properties.map((prop) => {
                const reaction = reactions[prop.match_id] ?? null
                return (
                  <Card key={prop.match_id} className="border-blue-100 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      {/* Property info */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{prop.short_loc}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{formatCategory(prop.category)}</p>
                        </div>
                        <TierBadge tier={prop.tier} />
                      </div>

                      <p className="text-2xl font-bold text-blue-700 mb-3">
                        {formatPrice(prop.price, prop.category)}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Match score: {prop.score.toFixed(0)}%</span>

                        {/* Reaction control — Liked / Neutral / Not Interested */}
                        <div className="flex items-center gap-1">
                          <ReactionButton
                            icon={ThumbsUp}
                            label="Liked"
                            active={reaction === 'liked'}
                            onClick={() => setReaction(prop.match_id, 'liked')}
                            activeClass="bg-green-100 text-green-600"
                          />
                          <ReactionButton
                            icon={Minus}
                            label="Neutral"
                            active={reaction === 'neutral'}
                            onClick={() => setReaction(prop.match_id, 'neutral')}
                            activeClass="bg-slate-200 text-slate-600"
                          />
                          <ReactionButton
                            icon={ThumbsDown}
                            label="Not Interested"
                            active={reaction === 'not_interested'}
                            onClick={() => setReaction(prop.match_id, 'not_interested')}
                            activeClass="bg-red-100 text-red-600"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        {/* ── My Visit History — timeline ──────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">My Visit History</h2>
          {visit_history.length === 0 ? (
            <Card className="border-blue-100">
              <CardContent className="p-5 text-sm text-slate-400">
                No visits yet. Your consultant will schedule property visits once properties are shortlisted.
              </CardContent>
            </Card>
          ) : (
            <div className="relative pl-5">
              {/* Timeline line */}
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-blue-100" />

              <div className="space-y-4">
                {visit_history.map((visit) => (
                  <div key={visit.id} className="relative flex gap-4">
                    {/* Timeline dot */}
                    <div className="absolute -left-3 mt-1.5 w-4 h-4 rounded-full border-2 border-blue-400 bg-white flex items-center justify-center">
                      {visit.status === 'COMPLETED' || visit.status === 'APPROVED' ? (
                        <CheckCircle2 size={10} className="text-blue-500" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      )}
                    </div>

                    <Card className="flex-1 border-blue-100">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{visit.property_short_loc}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar size={11} /> {formatDate(visit.planned_date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <User size={11} /> {visit.agent_name}
                              </span>
                            </div>
                          </div>
                          <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(visit.status)}`}>
                            {visit.status}
                          </span>
                        </div>

                        {visit.outcome_json && (
                          <div className="mt-3 pt-3 border-t border-blue-50 text-xs text-slate-600 space-y-1">
                            {visit.outcome_json.interest && (
                              <p><span className="font-medium">Interest:</span> {visit.outcome_json.interest}</p>
                            )}
                            {visit.outcome_json.remarks && (
                              <p><span className="font-medium">Notes:</span> {visit.outcome_json.remarks}</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

// ── Helper components ─────────────────────────────────────────────────────────

function Info({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}: </span>
      {children ?? <span className="text-sm text-slate-700">{value}</span>}
    </div>
  )
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    HIGH:     'bg-emerald-100 text-emerald-700',
    GOOD:     'bg-teal-100 text-teal-700',
    POSSIBLE: 'bg-yellow-100 text-yellow-700',
  }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${styles[tier] ?? 'bg-slate-100 text-slate-600'}`}>
      {tier}
    </span>
  )
}

function ReactionButton({
  icon: Icon, label, active, onClick, activeClass,
}: {
  icon: React.ElementType; label: string; active: boolean; onClick: () => void; activeClass: string
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border ${
        active ? `${activeClass} border-current` : 'text-slate-300 border-slate-200 hover:border-slate-300 hover:text-slate-500'
      }`}
    >
      <Icon size={14} />
    </button>
  )
}

function ClientSkeleton() {
  return (
    <div className="min-h-screen bg-blue-50/40 p-6 space-y-6 animate-pulse max-w-4xl mx-auto">
      <div className="h-8 w-40 bg-blue-100 rounded" />
      <div className="h-36 bg-blue-100 rounded-xl" />
      <div className="grid sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => <div key={i} className="h-40 bg-blue-100 rounded-xl" />)}
      </div>
      <div className="h-48 bg-blue-100 rounded-xl" />
    </div>
  )
}

function ClientError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-blue-50/40 p-6">
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700 max-w-lg">
        <p className="font-semibold mb-1">Could not load portal data</p>
        <p className="font-mono text-xs">{message}</p>
        <p className="mt-2 text-xs text-red-500">Make sure you are logged in as a CLIENT (X-Mock-Role: CLIENT).</p>
      </div>
    </div>
  )
}

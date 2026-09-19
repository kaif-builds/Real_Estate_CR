'use client'

/**
 * Field Staff Roster Management Page — Module 11
 *
 * Roster and live status management for Field Agents.
 *
 * Features:
 * - Table columns: Agent Name, Phone, Status (Available/On Visit/Off Duty badge),
 *   Today's Visit Count, This Week's Completed Visits, Average Rating (out of 5),
 *   Last Known Location, Actions ("View Schedule" button).
 * - 4 mock Agent-role staff in roster with real-time statistics.
 * - "View Schedule" modal/drawer showing that agent's assigned Visits for the current week
 *   (filtered dynamically from MOCK_VISITS).
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Users, UserCheck, Phone, MapPin, Star, Calendar, Clock,
  CheckCircle2, AlertCircle, X, Shield, Plus, Building2,
  CalendarDays, ChevronRight
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  formatDateTime, formatDate,
} from '@/lib/formatters'
import {
  MOCK_FIELD_AGENTS, MOCK_VISITS, type FieldAgentRosterRow, type VisitRow,
} from '@/lib/mockData'

export default function FieldStaffPage() {
  const [agents, setAgents] = useState<FieldAgentRosterRow[]>([...MOCK_FIELD_AGENTS])
  const [selectedAgent, setSelectedAgent] = useState<FieldAgentRosterRow | null>(null)

  // Filter agent's visits for the weekly schedule
  const agentVisits = useMemo(() => {
    if (!selectedAgent) return []
    return MOCK_VISITS.filter((v) => v.agent_name === selectedAgent.name)
  }, [selectedAgent])

  // ── Status Badge Helper ─────────────────────────────────────────────────────

  const renderRosterStatusBadge = (status: FieldAgentRosterRow['status']) => {
    switch (status) {
      case 'Available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Available
          </span>
        )
      case 'On Visit':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            On Visit
          </span>
        )
      case 'Off Duty':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Off Duty
          </span>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
              <Users size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Field Staff Roster
              </h1>
              <p className="text-sm text-slate-500">
                Manage on-ground agent availability, weekly inspection schedules, and rating metrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/visits">
              <Button variant="outline" className="text-slate-700 border-slate-200">
                <MapPin size={16} className="mr-1.5 text-indigo-600" />
                View All Visits
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Total Field Agents</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{agents.length}</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
                <Users size={20} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Active on Visit</p>
                <h3 className="text-2xl font-bold text-blue-700 mt-1">
                  {agents.filter((a) => a.status === 'On Visit').length}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
                <MapPin size={20} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Available for Dispatch</p>
                <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                  {agents.filter((a) => a.status === 'Available').length}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={20} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Average Roster Rating</p>
                <h3 className="text-2xl font-bold text-amber-600 mt-1">4.75 / 5.0</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Star size={20} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff Table */}
        <Card className="border-slate-200/80 shadow-xs overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900">
                Active Field Staff Roster
              </CardTitle>
              <span className="text-xs text-slate-400 font-medium">
                Real-time telemetric status
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Agent Name</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Today&apos;s Visits</th>
                    <th className="py-3 px-4 text-center">This Week Completed</th>
                    <th className="py-3 px-4 text-center">Average Rating</th>
                    <th className="py-3 px-4 min-w-[200px]">Last Known Location</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agents.map((agent) => (
                    <tr
                      key={agent.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Agent Name */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-xs">
                            {agent.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <div>{agent.name}</div>
                            <span className="text-[11px] font-mono text-slate-400 font-normal">
                              ID: {agent.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {agent.phone}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderRosterStatusBadge(agent.status)}
                      </td>

                      {/* Today's Visits */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                          {agent.today_visit_count}
                        </span>
                      </td>

                      {/* Week Completed */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {agent.week_completed_visits} visits
                        </span>
                      </td>

                      {/* Average Rating */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 font-bold text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          <Star size={12} className="text-amber-500 fill-amber-500" />
                          <span>{agent.average_rating.toFixed(1)} / 5.0</span>
                        </div>
                      </td>

                      {/* Last Known Location */}
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-xs">{agent.last_known_location}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAgent(agent)}
                          className="h-8 px-3 text-xs font-semibold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                        >
                          <Calendar size={13} className="mr-1.5 text-indigo-600" />
                          View Schedule
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ================================================================= */}
        {/* VIEW SCHEDULE MODAL                                               */}
        {/* ================================================================= */}
        {selectedAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Weekly Schedule — {selectedAgent.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Assigned visits and inspection route calendar
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between text-xs bg-indigo-50/40 p-3 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-2">
                    <UserCheck size={16} className="text-indigo-600" />
                    <span className="font-semibold text-indigo-950">Status: {selectedAgent.status}</span>
                  </div>
                  <span className="text-indigo-800 font-medium">
                    {agentVisits.length} visits scheduled this week
                  </span>
                </div>

                {agentVisits.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No active visits assigned to {selectedAgent.name} for the current week.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agentVisits.map((visit) => (
                      <div
                        key={visit.id}
                        className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-200 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-800">
                              {visit.id}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold">
                              <MapPin size={10} />
                              {visit.property_short_loc}
                            </span>
                            <Badge variant="secondary" className="text-[10px]">
                              {visit.purpose}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-600">
                            Client: <strong className="text-slate-800">{visit.client_name}</strong>
                          </div>
                          {visit.instructions && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                              &ldquo;{visit.instructions}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0 space-y-1">
                          <div className="text-xs font-semibold text-slate-700 flex items-center justify-end gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            <span>{formatDateTime(visit.scheduled_date)}</span>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-slate-50 text-slate-700">
                            {visit.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedAgent(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

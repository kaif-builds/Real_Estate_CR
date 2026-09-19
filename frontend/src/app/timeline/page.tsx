'use client'

/**
 * Timeline Page — Module 8
 *
 * Unified chronological activity feed across all record types.
 *
 * Features:
 * - A single vertical timeline:
 *   Each entry shows a Type icon (call, follow-up, WhatsApp, email, meeting, property-share, visit, task, status-change),
 *   a one-line description, who did it, when, and linked entity context.
 * - Filters at top:
 *   Activity Type dropdown, Date Range, Assigned To / Actor dropdown.
 * - 18 mock entries spanning the last 2 weeks referencing real names/IDs from mockData.ts.
 */

import { useMemo, useState } from 'react'
import {
  Clock, Filter, RefreshCw, Search, Phone, Bell, MessageSquare,
  Mail, Users, Share2, MapPin, CheckSquare, Activity, User,
  Building2, Calendar, Tag, ArrowUpRight
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  formatDateTime, formatDate,
} from '@/lib/formatters'
import {
  MOCK_TIMELINE_ACTIVITIES, MOCK_USERS, type ActivityTimelineRow,
} from '@/lib/mockData'

const ACTIVITY_TYPE_OPTIONS = [
  { value: '', label: 'All Activities' },
  { value: 'CALL', label: 'Call Log' },
  { value: 'FOLLOWUP', label: 'Follow-up' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'PROPERTY_SHARE', label: 'Property Share' },
  { value: 'VISIT', label: 'Site Visit' },
  { value: 'TASK', label: 'Internal Task' },
  { value: 'STATUS_CHANGE', label: 'Status Change' },
] as const

const DATE_RANGE_OPTIONS = [
  { value: 'ALL', label: 'All Time (Last 14 Days)' },
  { value: 'TODAY', label: 'Today (Sep 19)' },
  { value: 'YESTERDAY', label: 'Yesterday (Sep 18)' },
  { value: 'LAST_7_DAYS', label: 'Last 7 Days' },
] as const

export default function TimelinePage() {
  const [activities, setActivities] = useState<ActivityTimelineRow[]>([...MOCK_TIMELINE_ACTIVITIES])

  // Filters
  const [fType, setFType] = useState<string>('')
  const [fDateRange, setFDateRange] = useState<string>('ALL')
  const [fActor, setFActor] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // ── Filter Logic ────────────────────────────────────────────────────────────

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Activity Type
      if (fType && act.activity_type !== fType) return false

      // Actor
      if (fActor && act.actor_name !== fActor) return false

      // Date Range
      if (fDateRange === 'TODAY') {
        if (!act.timestamp.startsWith('2026-09-19')) return false
      } else if (fDateRange === 'YESTERDAY') {
        if (!act.timestamp.startsWith('2026-09-18')) return false
      } else if (fDateRange === 'LAST_7_DAYS') {
        const d = new Date(act.timestamp)
        const cutoff = new Date('2026-09-12T00:00:00Z')
        if (d < cutoff) return false
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = act.title.toLowerCase().includes(q)
        const matchDesc = act.description.toLowerCase().includes(q)
        const matchActor = act.actor_name.toLowerCase().includes(q)
        const matchLinked = (act.linked_entity_id || '').toLowerCase().includes(q)
        if (!matchTitle && !matchDesc && !matchActor && !matchLinked) return false
      }

      return true
    })
  }, [activities, fType, fDateRange, fActor, searchQuery])

  // ── Actor Options ───────────────────────────────────────────────────────────

  const actorOptions = useMemo(() => {
    return MOCK_USERS.filter((u) => u.role !== 'CLIENT').map((u) => u.name)
  }, [])

  // ── Type Icon & Color Helper ────────────────────────────────────────────────

  const getActivityConfig = (type: ActivityTimelineRow['activity_type']) => {
    switch (type) {
      case 'CALL':
        return {
          icon: <Phone size={15} className="text-blue-600" />,
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
          badgeText: 'Call',
        }
      case 'FOLLOWUP':
        return {
          icon: <Bell size={15} className="text-amber-600" />,
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          badgeText: 'Follow-up',
        }
      case 'WHATSAPP':
        return {
          icon: <MessageSquare size={15} className="text-emerald-600" />,
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          badgeText: 'WhatsApp',
        }
      case 'EMAIL':
        return {
          icon: <Mail size={15} className="text-indigo-600" />,
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
          badgeText: 'Email',
        }
      case 'MEETING':
        return {
          icon: <Users size={15} className="text-violet-600" />,
          bg: 'bg-violet-50 border-violet-200 text-violet-800',
          badgeText: 'Meeting',
        }
      case 'PROPERTY_SHARE':
        return {
          icon: <Share2 size={15} className="text-teal-600" />,
          bg: 'bg-teal-50 border-teal-200 text-teal-800',
          badgeText: 'Property Share',
        }
      case 'VISIT':
        return {
          icon: <MapPin size={15} className="text-rose-600" />,
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          badgeText: 'Site Visit',
        }
      case 'TASK':
        return {
          icon: <CheckSquare size={15} className="text-cyan-600" />,
          bg: 'bg-cyan-50 border-cyan-200 text-cyan-800',
          badgeText: 'Task',
        }
      case 'STATUS_CHANGE':
        return {
          icon: <Activity size={15} className="text-purple-600" />,
          bg: 'bg-purple-50 border-purple-200 text-purple-800',
          badgeText: 'Status Change',
        }
      default:
        return {
          icon: <Clock size={15} className="text-slate-600" />,
          bg: 'bg-slate-50 border-slate-200 text-slate-800',
          badgeText: 'Activity',
        }
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
              <Clock size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Activity Timeline
              </h1>
              <p className="text-sm text-slate-500">
                Unified chronological audit trail of all calls, follow-ups, visits, and status transitions
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px] max-w-xs">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, clients, notes..."
                className="pl-9 text-sm h-9"
              />
            </div>

            {/* Activity Type Dropdown */}
            <div className="w-full sm:w-auto min-w-[170px]">
              <Select
                value={fType}
                onChange={(e) => setFType(e.target.value)}
                className="h-9 text-sm"
              >
                {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Date Range Dropdown */}
            <div className="w-full sm:w-auto min-w-[160px]">
              <Select
                value={fDateRange}
                onChange={(e) => setFDateRange(e.target.value)}
                className="h-9 text-sm"
              >
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Actor / Assigned To Dropdown */}
            <div className="w-full sm:w-auto min-w-[150px]">
              <Select
                value={fActor}
                onChange={(e) => setFActor(e.target.value)}
                className="h-9 text-sm"
              >
                <option value="">All Staff</option>
                {actorOptions.map((actor) => (
                  <option key={actor} value={actor}>
                    {actor}
                  </option>
                ))}
              </Select>
            </div>

            {/* Reset */}
            {(fType || fDateRange !== 'ALL' || fActor || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFType('')
                  setFDateRange('ALL')
                  setFActor('')
                  setSearchQuery('')
                }}
                className="text-slate-500 hover:text-slate-800 h-9 px-2.5"
                title="Clear filters"
              >
                <RefreshCw size={14} className="mr-1.5" />
                Reset
              </Button>
            )}

            <div className="ml-auto text-xs text-slate-400 font-medium">
              {filteredActivities.length} events logged
            </div>
          </CardContent>
        </Card>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* VERTICAL TIMELINE STREAM                                          */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-xl border border-slate-200/80">
              <Clock className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No activity events found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                No activity logs match the selected filter parameters. Try clearing filters to see all history.
              </p>
            </div>
          ) : (
            filteredActivities.map((item) => {
              const cfg = getActivityConfig(item.activity_type)

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Bullet Node with Icon */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${cfg.bg} group-hover:scale-110 transition-transform`}
                  >
                    {cfg.icon}
                  </div>

                  {/* Activity Card */}
                  <Card className="border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${cfg.bg}`}
                          >
                            {cfg.badgeText}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                            {item.title}
                          </h3>
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0 font-medium">
                          <Calendar size={12} />
                          <span>{formatDateTime(item.timestamp)}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Footer: Actor & Linked Entity */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <User size={13} className="text-slate-400" />
                          <span>{item.actor_name}</span>
                          <span className="text-[11px] text-slate-400">({item.actor_role})</span>
                        </div>

                        {item.linked_entity_id && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 text-[11px]">Linked:</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              <Tag size={10} className="text-slate-500" />
                              <span>
                                {item.linked_entity_type} {item.linked_entity_id}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })
          )}
        </div>
      </div>
    </AppLayout>
  )
}

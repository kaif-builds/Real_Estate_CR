'use client'

/**
 * FieldAgentDashboard — Spec §1.4, §7.1 & Part 2
 * Accessible by: AGENT
 *
 * Features:
 *  - Continuous live GPS via navigator.geolocation.watchPosition from AuthContext
 *  - Leaflet map with accuracy radius circle (blue, 12% fill opacity)
 *  - Live reverse geocoded address via Nominatim ("Near [Locality], Indore")
 *  - Persistent alert banner if location access is lost mid-session
 *  - Stale map data suppression upon location revocation
 *  - Today's assigned visits with interactive Visit Execution (Arrival distance check)
 */

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  MapPin, Navigation, CheckSquare, FileWarning, Star,
  ShieldAlert, Calendar, Clock, ArrowRight, Play, CheckCircle2,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { MOCK_VISITS, type VisitRow } from '@/lib/mockData'
import { VisitExecutionModal } from '@/components/visits/VisitExecutionModal'

// LiveMap MUST be dynamically imported (no SSR) — Leaflet uses browser-only APIs
const LiveMap = dynamic(() => import('@/components/LiveMap'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center"
      style={{ height: 320 }}
    >
      <span className="text-sm text-slate-400">Loading live Leaflet map…</span>
    </div>
  ),
})

export function FieldAgentDashboard() {
  const { user, position, address, geoError, locationLost, isTracking, startTracking } = useAuth()

  // Visits state
  const [visits, setVisits] = useState<VisitRow[]>([...MOCK_VISITS])
  const [executingVisit, setExecutingVisit] = useState<VisitRow | null>(null)

  // Filter today's visits for this agent or general active visits
  const myVisits = visits.filter(
    (v) =>
      v.agent_id === user?.id ||
      v.agent_name === user?.name ||
      v.status === 'Assigned' ||
      v.status === 'Scheduled' ||
      v.status === 'En Route'
  )

  const handleStatusChange = (visitId: string, newStatus: VisitRow['status']) => {
    setVisits((prev) =>
      prev.map((v) => (v.id === visitId ? { ...v, status: newStatus } : v))
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Persistent Location Lost Banner (PART 2 Spec Requirement 6) ────── */}
      {locationLost && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-r-xl shadow-xs text-sm text-rose-900 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-950">
                Location access lost — required for Agent features
              </p>
              <p className="text-xs text-rose-700 mt-0.5">
                Location access was revoked or lost in your browser. Live GPS tracking has been paused and stale map data is hidden.
              </p>
            </div>
          </div>
          <Button
            onClick={startTracking}
            size="sm"
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs shrink-0"
          >
            <RefreshCw size={13} className="mr-1.5" /> Re-enable GPS
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agent Field Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time GPS dispatch, active property visits, and field inspection queue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {position ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live GPS Active (±{Math.round(position.accuracy)}m)
            </span>
          ) : locationLost ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <ShieldAlert size={13} />
              GPS Lost
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Navigation size={13} className="animate-spin" />
              Acquiring GPS…
            </span>
          )}
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/visits" className="block group no-underline">
          <Card className="border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-300 hover:bg-slate-50/70 cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide group-hover:text-blue-600 transition-colors">
                    Today&apos;s Visits
                  </p>
                  <ArrowRight size={11} className="text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-2xl font-bold text-blue-700">{myVisits.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                <MapPin size={20} />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/visits?status=COMPLETED" className="block group no-underline">
          <Card className="border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-emerald-300 hover:bg-slate-50/70 cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide group-hover:text-emerald-600 transition-colors">
                    Week Completed
                  </p>
                  <ArrowRight size={11} className="text-slate-300 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-2xl font-bold text-emerald-700">6</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
                <CheckSquare size={20} />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/visits/review" className="block group no-underline">
          <Card className="border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-amber-300 hover:bg-slate-50/70 cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide group-hover:text-amber-600 transition-colors">
                    Pending Reports
                  </p>
                  <ArrowRight size={11} className="text-slate-300 group-hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-2xl font-bold text-amber-700">1</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-100 transition-all">
                <FileWarning size={20} />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/visits" className="block group no-underline">
          <Card className="border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-amber-300 hover:bg-slate-50/70 cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide group-hover:text-amber-600 transition-colors">
                    Agent Rating
                  </p>
                  <ArrowRight size={11} className="text-slate-300 group-hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-2xl font-bold text-amber-600">4.8 ★</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-100 transition-all">
                <Star size={20} />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Live Location Map (PART 2 Spec Requirement 2 & 3) ──────────────── */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Navigation size={18} className="text-indigo-600" />
                Live Agent GPS Tracker
                {position && (
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    ±{Math.round(position.accuracy)}m accuracy circle
                  </Badge>
                )}
              </CardTitle>
              {/* Reverse geocoded address (PART 2 Spec Requirement 3) */}
              <p className="text-xs text-slate-600 flex items-center gap-1 mt-1 font-medium">
                <MapPin size={13} className="text-indigo-600 shrink-0" />
                {address || (position ? 'Indore, Madhya Pradesh' : 'Connecting to GPS…')}
              </p>
            </div>

            {position && (
              <div className="text-xs font-mono text-slate-500 text-right">
                <span>
                  {position.lat.toFixed(5)}° N, {position.lng.toFixed(5)}° E
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-4">
          {/* Stale data suppression when location is lost */}
          {locationLost ? (
            <div
              className="w-full rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center p-8 text-center"
              style={{ height: 320 }}
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
                <ShieldAlert size={26} />
              </div>
              <p className="font-bold text-slate-900 text-sm">Location Access Lost</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Live location streaming was disconnected. Stale map data has been removed for compliance.
              </p>
              <Button
                onClick={startTracking}
                variant="outline"
                size="sm"
                className="mt-4 text-xs text-slate-700"
              >
                Reconnect Location
              </Button>
            </div>
          ) : geoError ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <p className="font-bold mb-1">GPS Unavailable</p>
              <p className="text-xs text-amber-700">{geoError}</p>
              <p className="mt-2 text-xs text-amber-600">
                Click the location/lock icon in your browser address bar and select &apos;Allow&apos; to enable real-time tracking.
              </p>
            </div>
          ) : !position ? (
            <div
              className="w-full rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center"
              style={{ height: 320 }}
            >
              <Navigation size={32} className="text-indigo-600 animate-spin mb-2" />
              <p className="text-sm font-semibold text-slate-800">Acquiring GPS Signal…</p>
              <p className="text-xs text-slate-400 mt-1">Connecting to device geolocation hardware</p>
            </div>
          ) : (
            <LiveMap
              lat={position.lat}
              lng={position.lng}
              accuracy={position.accuracy}
              address={address}
              className="h-[320px]"
            />
          )}
        </CardContent>
      </Card>

      {/* ── Today's Assigned Visits with Arrival Step Trigger ──────────────── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" />
                Today&apos;s Assigned Visits
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Execute client inspections with live GPS arrival verification.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              {myVisits.length} Visits
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {myVisits.map((visit) => (
              <div
                key={visit.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-mono font-bold text-xs shrink-0">
                    {visit.id.replace('V-', '#')}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">
                        {visit.property_short_loc}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-slate-100 text-slate-700 border-slate-200"
                      >
                        {visit.purpose}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          visit.status === 'Arrived'
                            ? 'bg-purple-100 text-purple-800'
                            : visit.status === 'En Route'
                            ? 'bg-indigo-100 text-indigo-800'
                            : visit.status === 'Visit Completed'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {visit.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <span>Client: <strong className="text-slate-700">{visit.client_name}</strong></span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono text-slate-600">
                        <Clock size={11} /> {visit.scheduled_date.slice(11, 16)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={() => setExecutingVisit(visit)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-3.5 shadow-xs"
                  >
                    <Play size={13} className="mr-1.5 fill-current" />
                    {visit.status === 'Arrived' ? 'Continue Checklist' : 'Execute Visit (Arrival)'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visit Execution Modal (Arrival step + distance calculation) */}
      {executingVisit && (
        <VisitExecutionModal
          visit={executingVisit}
          onClose={() => setExecutingVisit(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}

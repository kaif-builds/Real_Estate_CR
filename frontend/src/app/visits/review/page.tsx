'use client'

/**
 * Visit Review / Review Queue Page — Module 10
 *
 * Manager & Super Admin inspection verification portal.
 *
 * Features:
 * - Review Queue list:
 *   Table of all visits with Status = Submitted
 *   Columns: Visit ID, Property, Agent, Submitted Date, Actions ("Review" button).
 * - Clicking "Review" opens the comprehensive detail view:
 *   - Side-by-side "Planned vs Actual": Location (with distance, e.g. "12m off"), Time, Duration
 *   - Photo grid (4 category tiles: Property Front, Interior, Road/Access, Signboard)
 *   - Completed checklist (read-only, 5-6 items, at least one marked N/A with a reason)
 *   - Outcome fields: Person Met, Customer Interest (Interested/Neutral/Not Interested),
 *     Property Condition (Good/Fair/Poor), Next Action, Remarks
 *   - Action buttons: Approve, Reject (opens reason textarea), Request Clarification,
 *     Schedule Re-visit. Updates local state.
 */

import { useMemo, useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ClipboardCheck, CheckCircle2, XCircle, AlertTriangle, ArrowLeft,
  MapPin, Clock, Calendar, Camera, User, FileText, Check, X,
  HelpCircle, RotateCcw, ShieldCheck, Building2, Tag, Eye
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  formatDateTime, formatDate,
} from '@/lib/formatters'
import {
  MOCK_VISITS, type VisitRow,
} from '@/lib/mockData'

function VisitReviewContent() {
  const searchParams = useSearchParams()
  const initialVisitId = searchParams.get('id')

  const [visits, setVisits] = useState<VisitRow[]>([...MOCK_VISITS])
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(initialVisitId)

  // Rejection modal / textarea state
  const [showRejectBox, setShowRejectBox] = useState<boolean>(false)
  const [rejectReason, setRejectReason] = useState<string>('')
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'warn'; message: string } | null>(null)

  // Submitted visits awaiting review
  const submittedVisits = useMemo(() => {
    return visits.filter((v) => v.status === 'Submitted')
  }, [visits])

  // Currently reviewed visit
  const activeVisit = useMemo(() => {
    if (!selectedVisitId) return null
    return visits.find((v) => v.id === selectedVisitId) || null
  }, [visits, selectedVisitId])

  useEffect(() => {
    if (initialVisitId) {
      setSelectedVisitId(initialVisitId)
    }
  }, [initialVisitId])

  // ── Action Handlers ─────────────────────────────────────────────────────────

  const handleApprove = (visitId: string) => {
    setVisits((prev) =>
      prev.map((v) => (v.id === visitId ? { ...v, status: 'Approved' } : v))
    )
    setActionNotice({
      type: 'success',
      message: `Visit ${visitId} has been successfully APPROVED. Record marked verified.`,
    })
    setShowRejectBox(false)
  }

  const handleReject = (visitId: string) => {
    if (!rejectReason.trim()) {
      alert('Please specify a rejection reason for the field agent.')
      return
    }
    setVisits((prev) =>
      prev.map((v) => (v.id === visitId ? { ...v, status: 'Rejected' } : v))
    )
    setActionNotice({
      type: 'warn',
      message: `Visit ${visitId} REJECTED. Reason logged: "${rejectReason.trim()}".`,
    })
    setShowRejectBox(false)
    setRejectReason('')
  }

  const handleClarification = (visitId: string) => {
    setActionNotice({
      type: 'warn',
      message: `Clarification request sent to ${activeVisit?.agent_name} for Visit ${visitId}.`,
    })
  }

  const handleRevisit = (visitId: string) => {
    setActionNotice({
      type: 'success',
      message: `Re-visit task scheduled for property ${activeVisit?.property_short_loc}.`,
    })
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* ================================================================= */}
        {/* VIEW 1: REVIEW QUEUE TABLE (WHEN NO VISIT SELECTED)               */}
        {/* ================================================================= */}
        {!activeVisit && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-orange-600 text-white shadow-xs">
                  <ClipboardCheck size={22} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Visit Review Queue
                  </h1>
                  <p className="text-sm text-slate-500">
                    Audit field agent submissions, GPS check-ins, photo evidence, and inspection checklists
                  </p>
                </div>
              </div>

              <Link href="/visits">
                <Button variant="outline" className="text-slate-700 border-slate-200">
                  <ArrowLeft size={16} className="mr-1.5" />
                  All Visits
                </Button>
              </Link>
            </div>

            {/* Notification banner */}
            {actionNotice && (
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  actionNotice.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <span>{actionNotice.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActionNotice(null)}
                  className="text-xs font-bold hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Review Queue Table */}
            <Card className="border-slate-200/80 shadow-xs overflow-hidden">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                    Pending Verification Submissions ({submittedVisits.length})
                  </CardTitle>
                  <span className="text-xs text-slate-400 font-medium">
                    Auto-refreshed with real-time field reports
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {submittedVisits.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <ShieldCheck className="mx-auto h-12 w-12 text-emerald-400 mb-3" />
                    <h3 className="text-base font-semibold text-slate-800">Queue is Clear!</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                      All submitted visits have been reviewed and approved. Great job!
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4">Visit ID</th>
                          <th className="py-3 px-4">Property</th>
                          <th className="py-3 px-4">Field Agent</th>
                          <th className="py-3 px-4">Submitted Date</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {submittedVisits.map((visit) => (
                          <tr
                            key={visit.id}
                            className="hover:bg-orange-50/30 transition-colors group"
                          >
                            <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-800 whitespace-nowrap">
                              {visit.id}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200">
                                <MapPin size={11} className="text-indigo-600 shrink-0" />
                                <span>{visit.property_short_loc}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                              {visit.agent_name}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                              {formatDateTime(visit.submitted_date || visit.scheduled_date)}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <Button
                                size="sm"
                                onClick={() => setSelectedVisitId(visit.id)}
                                className="h-8 px-3 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xs"
                              >
                                <ClipboardCheck size={13} className="mr-1.5" />
                                Review
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: FULL DETAIL REVIEW VIEW (SIDE-BY-SIDE + PHOTOS + CHECK)   */}
        {/* ================================================================= */}
        {activeVisit && activeVisit.review_data && (
          <div className="space-y-6">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedVisitId(null)
                  setShowRejectBox(false)
                }}
                className="text-slate-600 hover:text-slate-900 -ml-2"
              >
                <ArrowLeft size={16} className="mr-1.5" />
                Back to Review Queue
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Current Status:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
                  {activeVisit.status}
                </span>
              </div>
            </div>

            {/* Banner with Visit Key Metadata */}
            <Card className="border-slate-200/80 shadow-xs bg-gradient-to-r from-slate-50 to-indigo-50/30">
              <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      Audit Review: {activeVisit.id} — {activeVisit.property_short_loc}
                    </h2>
                    <Badge variant="secondary" className="text-xs font-medium bg-white">
                      {activeVisit.purpose}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Submitted by <strong className="text-slate-700">{activeVisit.agent_name}</strong> on {formatDateTime(activeVisit.submitted_date || '')}
                  </p>
                </div>

                {/* Top Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(activeVisit.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-3.5 shadow-xs"
                  >
                    <CheckCircle2 size={15} className="mr-1.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowRejectBox(!showRejectBox)}
                    className="border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold h-9 px-3.5"
                  >
                    <XCircle size={15} className="mr-1.5" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleClarification(activeVisit.id)}
                    className="text-slate-700 border-slate-200 h-9 px-3"
                  >
                    <HelpCircle size={14} className="mr-1" />
                    Clarification
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRevisit(activeVisit.id)}
                    className="text-slate-700 border-slate-200 h-9 px-3"
                  >
                    <RotateCcw size={14} className="mr-1" />
                    Re-visit
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Rejection Reason Form (Revealed when clicking Reject) */}
            {showRejectBox && (
              <Card className="border-rose-200 bg-rose-50/50 shadow-xs animate-in fade-in duration-150">
                <CardContent className="p-4 space-y-3">
                  <Label htmlFor="reject_reason" className="text-xs font-bold text-rose-900">
                    Reason for Rejection <span className="text-red-600">*</span>
                  </Label>
                  <Textarea
                    id="reject_reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide specific notes why this inspection is rejected (e.g. photos unclear, checklist incomplete, GPS deviation too high)..."
                    rows={2}
                    className="bg-white text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowRejectBox(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReject(activeVisit.id)}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                    >
                      Confirm Rejection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notification alert */}
            {actionNotice && (
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  actionNotice.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 size={18} />
                  <span>{actionNotice.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActionNotice(null)}
                  className="text-xs font-bold hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* SECTION 1: SIDE-BY-SIDE PLANNED VS ACTUAL                     */}
            {/* ───────────────────────────────────────────────────────────── */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin size={18} className="text-indigo-600" />
                  Planned vs Actual Field Verification
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  GPS coordinate accuracy, timestamp adherence, and on-site duration audit
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase">
                      <th className="py-2.5 px-4 w-1/4">Metric</th>
                      <th className="py-2.5 px-4 w-1/3">Planned Target</th>
                      <th className="py-2.5 px-4 w-1/3">Actual Telemetry / Checked-in</th>
                      <th className="py-2.5 px-4 text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-700">Location (GPS)</td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {activeVisit.review_data.planned_location}
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-mono text-[11px]">
                        {activeVisit.review_data.actual_location}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {activeVisit.review_data.distance_variance}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-700">Start Time</td>
                      <td className="py-3 px-4 text-slate-600">
                        {activeVisit.review_data.planned_time}
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-semibold">
                        {activeVisit.review_data.actual_time}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 font-medium">
                        +3 mins
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-700">On-site Duration</td>
                      <td className="py-3 px-4 text-slate-600">
                        {activeVisit.review_data.planned_duration}
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-semibold">
                        {activeVisit.review_data.actual_duration}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 font-medium">
                        +7 mins
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* SECTION 2: PHOTO EVIDENCE GRID (4 CATEGORY TILES)             */}
            {/* ───────────────────────────────────────────────────────────── */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Camera size={18} className="text-indigo-600" />
                  Photographic Evidence (4 Verification Tiles)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Geo-tagged photos captured by the agent during inspection
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Tile 1: Property Front */}
                  <div className="space-y-2">
                    <div className="h-40 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-3 hover:bg-slate-50 transition-colors group">
                      <div className="p-3 rounded-full bg-white shadow-xs group-hover:scale-110 transition-transform mb-2">
                        <Building2 size={24} className="text-indigo-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">Property Front Elevation</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">front_facade_01.jpg</span>
                    </div>
                    <Badge variant="outline" className="w-full justify-center text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      Geo-stamp Verified ✓
                    </Badge>
                  </div>

                  {/* Tile 2: Interior */}
                  <div className="space-y-2">
                    <div className="h-40 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-3 hover:bg-slate-50 transition-colors group">
                      <div className="p-3 rounded-full bg-white shadow-xs group-hover:scale-110 transition-transform mb-2">
                        <Camera size={24} className="text-blue-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">Interior Living / Rooms</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">interior_hall_02.jpg</span>
                    </div>
                    <Badge variant="outline" className="w-full justify-center text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      Geo-stamp Verified ✓
                    </Badge>
                  </div>

                  {/* Tile 3: Road / Access */}
                  <div className="space-y-2">
                    <div className="h-40 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-3 hover:bg-slate-50 transition-colors group">
                      <div className="p-3 rounded-full bg-white shadow-xs group-hover:scale-110 transition-transform mb-2">
                        <MapPin size={24} className="text-purple-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">Road &amp; Access Way</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">approach_road_03.jpg</span>
                    </div>
                    <Badge variant="outline" className="w-full justify-center text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      Geo-stamp Verified ✓
                    </Badge>
                  </div>

                  {/* Tile 4: Signboard */}
                  <div className="space-y-2">
                    <div className="h-40 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-3 hover:bg-slate-50 transition-colors group">
                      <div className="p-3 rounded-full bg-white shadow-xs group-hover:scale-110 transition-transform mb-2">
                        <Tag size={24} className="text-amber-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">Signboard / Nameplate</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">building_board_04.jpg</span>
                    </div>
                    <Badge variant="outline" className="w-full justify-center text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      Geo-stamp Verified ✓
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* SECTION 3: COMPLETED CHECKLIST (READ-ONLY WITH N/A ITEM)      */}
            {/* ───────────────────────────────────────────────────────────── */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-indigo-600" />
                  Completed Field Inspection Checklist
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Read-only audit of agent checklist responses and conditional explanations
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {activeVisit.review_data.checklist.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800">{item.label}</span>
                        {item.reason && (
                          <p className="text-[11px] text-amber-700 font-medium">
                            Note: {item.reason}
                          </p>
                        )}
                      </div>

                      <div>
                        {item.status === 'YES' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check size={13} /> Verified
                          </span>
                        )}
                        {item.status === 'NO' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <X size={13} /> Deficient
                          </span>
                        )}
                        {item.status === 'NA' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            N/A (Exempt)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* SECTION 4: OUTCOME FIELDS (READ-ONLY)                         */}
            {/* ───────────────────────────────────────────────────────────── */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={18} className="text-indigo-600" />
                  Visit Outcome &amp; Observations
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Client interaction details, property condition ratings, and recommended next actions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Person Met</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {activeVisit.review_data.person_met}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Customer Interest</span>
                    <div className="mt-1">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded text-xs font-bold ${
                          activeVisit.review_data.customer_interest === 'Interested'
                            ? 'bg-emerald-100 text-emerald-800'
                            : activeVisit.review_data.customer_interest === 'Neutral'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {activeVisit.review_data.customer_interest}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Property Condition</span>
                    <div className="mt-1">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded text-xs font-bold ${
                          activeVisit.review_data.property_condition === 'Good'
                            ? 'bg-emerald-100 text-emerald-800'
                            : activeVisit.review_data.property_condition === 'Fair'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {activeVisit.review_data.property_condition}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Recommended Next Action</span>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 font-semibold text-slate-900">
                    {activeVisit.review_data.next_action}
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Agent Field Remarks</span>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-700">
                    {activeVisit.review_data.remarks}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default function VisitReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
          Loading Review Queue...
        </div>
      }
    >
      <VisitReviewContent />
    </Suspense>
  )
}

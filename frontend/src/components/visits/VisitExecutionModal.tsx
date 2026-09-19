'use client'

/**
 * VisitExecutionModal — Live Agent Visit Execution Flow
 * Features the mandatory "Arrival" step using live GPS coordinates from watchPosition
 * to calculate and display real distance from the target property coordinates.
 */

import React, { useState, useMemo } from 'react'
import {
  MapPin, Navigation, CheckCircle2, AlertTriangle, Clock,
  Camera, CheckSquare, ShieldCheck, ArrowRight, X, Sparkles, Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth, type GeoPosition } from '@/lib/auth-context'
import {
  calculateDistanceMeters,
  MOCK_PROPERTIES,
  type VisitRow,
} from '@/lib/mockData'

interface VisitExecutionModalProps {
  visit: VisitRow
  onClose: () => void
  onStatusChange?: (visitId: string, newStatus: VisitRow['status']) => void
}

export function VisitExecutionModal({
  visit,
  onClose,
  onStatusChange,
}: VisitExecutionModalProps) {
  const { position, address, geoError, locationLost } = useAuth()

  // Find linked property coordinates
  const property = useMemo(() => {
    return (
      MOCK_PROPERTIES.find((p) => p.id === visit.property_id) ||
      MOCK_PROPERTIES.find((p) => p.short_loc === visit.property_short_loc) || {
        id: visit.property_id,
        short_loc: visit.property_short_loc,
        lat: 22.7050,
        lng: 75.9080,
      }
    )
  }, [visit])

  const propLat = property.lat ?? 22.7050
  const propLng = property.lng ?? 75.9080

  // Optional simulated position for testing demo if real GPS is outside Indore
  const [simulatedPos, setSimulatedPos] = useState<GeoPosition | null>(null)

  const effectivePos = simulatedPos || position

  // Calculate real distance using Haversine formula
  const distanceMeters = useMemo(() => {
    if (!effectivePos) return null
    return calculateDistanceMeters(effectivePos.lat, effectivePos.lng, propLat, propLng)
  }, [effectivePos, propLat, propLng])

  // Geo-fence threshold: 150 meters (from system settings)
  const GEOFENCE_RADIUS_METERS = 150
  const isWithinGeofence = distanceMeters !== null && distanceMeters <= GEOFENCE_RADIUS_METERS

  // Flow steps: 'arrival' | 'checklist' | 'completed'
  const [step, setStep] = useState<'arrival' | 'checklist' | 'completed'>('arrival')
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  })
  const [agentNotes, setAgentNotes] = useState('')

  const checklistItems = [
    'Confirm owner/tenant access and verify entry key code',
    'Verify electricity meter reading and water pressure',
    'Inspect interior walls, paint, and check for dampness/seepage',
    'Check lift functionality and dedicated parking slot',
    'Photograph exterior building facade and living area',
  ]

  const handleToggleCheck = (index: number) => {
    setCheckedItems((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const handleConfirmArrival = () => {
    if (onStatusChange) {
      onStatusChange(visit.id, 'Arrived')
    }
    setStep('checklist')
  }

  const handleFinishInspection = () => {
    if (onStatusChange) {
      onStatusChange(visit.id, 'Visit Completed')
    }
    setStep('completed')
  }

  const handleSimulateArrival = () => {
    // Places agent 45m from property for testing/demo
    setSimulatedPos({
      lat: propLat + 0.0003,
      lng: propLng + 0.0002,
      accuracy: 12,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Navigation size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Agent Visit Execution — {visit.id}
              </h3>
              <p className="text-xs text-slate-500">
                {visit.property_short_loc} · Client: {visit.client_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* STEP 1: ARRIVAL STEP */}
          {step === 'arrival' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                    Step 1 of 2
                  </span>
                  <h4 className="text-lg font-bold text-slate-900">GPS Arrival &amp; Check-in</h4>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  Target: {propLat.toFixed(4)}°, {propLng.toFixed(4)}°
                </Badge>
              </div>

              {/* Live Distance Callout */}
              <div
                className={`p-5 rounded-xl border transition-all ${
                  isWithinGeofence
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50/80 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isWithinGeofence
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isWithinGeofence ? <CheckCircle2 size={22} /> : <MapPin size={22} />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider opacity-75">
                        Live GPS Distance Calculation
                      </p>
                      {distanceMeters !== null ? (
                        <p className="text-2xl font-black tracking-tight mt-0.5 font-mono">
                          You are {distanceMeters}m from the listed property
                        </p>
                      ) : (
                        <p className="text-lg font-bold mt-0.5">
                          Acquiring live satellite coordinates…
                        </p>
                      )}
                      <p className="text-xs mt-1 opacity-80">
                        {isWithinGeofence
                          ? `Within check-in zone (radius: ${GEOFENCE_RADIUS_METERS}m). Arrival check-in is enabled.`
                          : `Required check-in tolerance is ${GEOFENCE_RADIUS_METERS}m. Move closer to the property or use demo simulation.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location details grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Listed Property Target
                  </span>
                  <p className="font-semibold text-slate-800">{visit.property_short_loc}</p>
                  <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                    Lat: {propLat.toFixed(5)}, Lng: {propLng.toFixed(5)}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Agent Live Coordinates
                  </span>
                  {effectivePos ? (
                    <>
                      <p className="font-semibold text-slate-800">
                        {address || 'Live Location Active'}
                      </p>
                      <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                        Lat: {effectivePos.lat.toFixed(5)}, Lng: {effectivePos.lng.toFixed(5)} (±
                        {Math.round(effectivePos.accuracy)}m)
                      </p>
                    </>
                  ) : (
                    <p className="text-amber-600 font-medium">No live GPS fix acquired</p>
                  )}
                </div>
              </div>

              {/* Demo Helper for Simulation */}
              <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Sparkles size={14} className="text-indigo-600" />
                  <span>Demo simulation (e.g. 45m from property for rapid testing):</span>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateArrival}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 underline"
                >
                  Set 45m Offset
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmArrival}
                  disabled={!isWithinGeofence}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50"
                >
                  Confirm Arrival &amp; Check-in <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: CHECKLIST STEP */}
          {step === 'checklist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                    Step 2 of 2 · Arrived (Check-in Verified)
                  </span>
                  <h4 className="text-lg font-bold text-slate-900">Inspection Checklist</h4>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                  Arrived
                </Badge>
              </div>

              <p className="text-xs text-slate-500">
                Complete the standard inspection items on site before submitting visit report.
              </p>

              <div className="space-y-2">
                {checklistItems.map((item, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                      checkedItems[idx]
                        ? 'bg-emerald-50/50 border-emerald-200 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedItems[idx]}
                      onChange={() => handleToggleCheck(idx)}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="leading-relaxed font-medium">{item}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-semibold text-slate-700">
                  Agent Observations &amp; Notes
                </Label>
                <Textarea
                  value={agentNotes}
                  onChange={(e) => setAgentNotes(e.target.value)}
                  placeholder="e.g. Property matches listing photos. Landlord confirmed key handover on October 1st..."
                  rows={3}
                  className="text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('arrival')}
                  className="text-xs"
                >
                  Back to Arrival
                </Button>
                <Button
                  onClick={handleFinishInspection}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Complete Visit &amp; Submit Report
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: COMPLETED */}
          {step === 'completed' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Visit Successfully Executed!</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  GPS coordinates, arrival timestamp, and checklist data have been logged to the visit review queue.
                </p>
              </div>
              <Button onClick={onClose} className="bg-slate-900 text-white text-xs">
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

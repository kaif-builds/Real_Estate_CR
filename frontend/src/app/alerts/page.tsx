'use client'

/**
 * Alerts Configuration Module — Module 18 (Super Admin Only)
 * Settings-style list of automated system alert rules with enabled/disabled toggles
 * and editable day-threshold parameters.
 */

import React, { useState } from 'react'
import {
  AlertTriangle, Bell, Clock, Users, Building2, TrendingUp,
  MapPin, CheckCircle2, RotateCcw, Save, ShieldAlert,
  Info, Zap, ToggleLeft, ToggleRight
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AlertRule {
  id: string
  title: string
  description: string
  parameterLabel: string
  thresholdDays: number
  defaultDays: number
  enabled: boolean
  severity: 'High' | 'Medium' | 'Critical'
  targetAudience: string
  icon: React.ElementType
}

const INITIAL_RULES: AlertRule[] = [
  {
    id: 'rule_stale_lead',
    title: 'Stale Lead Alert',
    description: 'Triggers when an active lead has no telecalling records, logged follow-ups, or notes within the specified duration.',
    parameterLabel: 'No activity for',
    thresholdDays: 7,
    defaultDays: 7,
    enabled: true,
    severity: 'Medium',
    targetAudience: 'Assigned Agent & Office Executive',
    icon: Users,
  },
  {
    id: 'rule_unverified_inv',
    title: 'Unverified Inventory Alert',
    description: 'Triggers when a property listing has not undergone a field inspection or price re-verification within the threshold window.',
    parameterLabel: 'Not verified for',
    thresholdDays: 10,
    defaultDays: 10,
    enabled: true,
    severity: 'High',
    targetAudience: 'Listing Agent & Super Admin',
    icon: Building2,
  },
  {
    id: 'rule_stalled_opp',
    title: 'Stalled Opportunity Alert',
    description: 'Triggers when an ongoing deal in Qualified, Property Shared, or Negotiation stages has not progressed or been updated.',
    parameterLabel: 'No activity for',
    thresholdDays: 7,
    defaultDays: 7,
    enabled: true,
    severity: 'High',
    targetAudience: 'Deal Owner & Office Executive',
    icon: TrendingUp,
  },
  {
    id: 'rule_overdue_followup',
    title: 'Overdue Follow-up Alert',
    description: 'Triggers when a scheduled client follow-up remains in Pending status past its due date without being marked completed or rescheduled.',
    parameterLabel: 'Past due by',
    thresholdDays: 0,
    defaultDays: 0,
    enabled: true,
    severity: 'Critical',
    targetAudience: 'Responsible Staff & Super Admin',
    icon: Clock,
  },
  {
    id: 'rule_visit_not_scheduled',
    title: 'Visit Not Scheduled Alert',
    description: 'Triggers when a strong match (>= 80% score) exists between a requirement and a property, but no site visit has been created.',
    parameterLabel: 'Strong match with no visit scheduled for',
    thresholdDays: 5,
    defaultDays: 5,
    enabled: true,
    severity: 'Medium',
    targetAudience: 'Office Executive',
    icon: MapPin,
  },
]

function SeverityBadge({ severity }: { severity: AlertRule['severity'] }) {
  switch (severity) {
    case 'Critical':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
          Critical
        </span>
      )
    case 'High':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          High
        </span>
      )
    case 'Medium':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800 border border-blue-200">
          Medium
        </span>
      )
  }
}

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>(INITIAL_RULES)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleToggle = (id: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const next = !r.enabled
          showToast(`${r.title} is now ${next ? 'Enabled' : 'Disabled'}`)
          return { ...r, enabled: next }
        }
        return r
      })
    )
  }

  const handleDaysChange = (id: string, value: number) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, thresholdDays: Math.max(0, value) } : r))
    )
  }

  const handleResetDefaults = () => {
    setRules(INITIAL_RULES.map((r) => ({ ...r, thresholdDays: r.defaultDays, enabled: true })))
    showToast('Alert rules reset to factory defaults.')
  }

  const handleSaveChanges = () => {
    showToast('Alert configuration rules updated successfully.')
  }

  const enabledCount = rules.filter((r) => r.enabled).length
  const disabledCount = rules.length - enabledCount

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Alert Configuration</h1>
              <Badge variant="secondary" className="font-mono text-xs">
                {rules.length} Rules Defined
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                Super Admin Only
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Configure trigger conditions, staleness decay timers, and alert thresholds across CRM operations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              className="text-xs text-slate-600"
            >
              <RotateCcw size={13} className="mr-1" /> Reset Defaults
            </Button>
            <Button
              size="sm"
              onClick={handleSaveChanges}
              className="bg-slate-900 text-white hover:bg-slate-800 text-xs"
            >
              <Save size={14} className="mr-1.5" /> Save Changes
            </Button>
          </div>
        </div>

        {/* Summary Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 uppercase font-medium">Active Alert Rules</span>
                <p className="text-xl font-bold text-emerald-700 mt-1">{enabledCount}</p>
                <span className="text-xs text-slate-400">Actively evaluated by scheduler</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Bell size={20} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 uppercase font-medium">Disabled Rules</span>
                <p className="text-xl font-bold text-slate-600 mt-1">{disabledCount}</p>
                <span className="text-xs text-slate-400">Suspended triggers</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <AlertTriangle size={20} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 uppercase font-medium">Evaluation Cycle</span>
                <p className="text-xl font-bold text-indigo-700 mt-1">Every 1 Hour</p>
                <span className="text-xs text-slate-400">Background cron schedule</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Clock size={20} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Rules List */}
        <div className="space-y-4">
          {rules.map((rule) => {
            const IconComponent = rule.icon
            return (
              <Card
                key={rule.id}
                className={`border transition-all shadow-sm ${
                  rule.enabled
                    ? 'border-slate-200 bg-white'
                    : 'border-slate-200 bg-slate-50/70 opacity-75'
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Icon + Title & Description */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                          rule.enabled
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        <IconComponent size={20} />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{rule.title}</h3>
                          <SeverityBadge severity={rule.severity} />
                          <span className="text-[11px] text-slate-400 font-mono">
                            Target: {rule.targetAudience}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {rule.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Editable Threshold Input + Toggle */}
                    <div className="flex items-center gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      {/* Day Threshold Input */}
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <Label className="text-xs font-medium text-slate-600 shrink-0">
                          {rule.parameterLabel}
                        </Label>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            max="90"
                            value={rule.thresholdDays}
                            disabled={!rule.enabled}
                            onChange={(e) =>
                              handleDaysChange(rule.id, parseInt(e.target.value, 10) || 0)
                            }
                            className="w-16 h-8 text-center font-mono font-bold text-sm bg-white"
                          />
                          <span className="text-xs font-medium text-slate-600">days</span>
                        </div>
                      </div>

                      {/* Enabled / Disabled Toggle */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggle(rule.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${
                            rule.enabled ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                          title={rule.enabled ? 'Click to disable' : 'Click to enable'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              rule.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-xs font-semibold w-14 ${
                            rule.enabled ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Bottom Save Bar */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info size={14} className="text-slate-400 shrink-0" />
            <span>
              Alert conditions trigger notifications on the Dashboard and push alerts to assigned staff members.
            </span>
          </div>
          <Button
            onClick={handleSaveChanges}
            className="bg-slate-900 text-white hover:bg-slate-800 text-xs px-5 w-full sm:w-auto"
          >
            Save All Changes
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}

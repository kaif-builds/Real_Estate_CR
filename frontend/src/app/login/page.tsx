'use client'

/**
 * Login Page — Module 1 & Part 1/2 Spec
 * Email + Password authentication against seeded mock users.
 * Enforces mandatory live GPS geolocation permission for Field Agents.
 */

import React, { useState } from 'react'
import {
  Building2, Lock, Mail, AlertCircle, MapPin, CheckCircle2,
  Navigation, ShieldAlert, ArrowRight, KeyRound, Sparkles
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MOCK_USERS, type UserOption } from '@/lib/mockData'

export default function LoginPage() {
  const { login, completeAgentLogin, requestLocationPermission } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [locationNotice, setLocationNotice] = useState<string | null>(null)
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Form Submit ─────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setLocationNotice(null)
    setIsSubmitting(true)

    try {
      const result = await login(email, password)

      // 1. Invalid credentials check
      if (!result.success || !result.user) {
        setErrorMessage(result.error || 'Invalid email or password')
        setIsSubmitting(false)
        return
      }

      // 2. Non-agent users log in immediately (handled in auth context)
      if (!result.isAgent) {
        return
      }

      // 3. AGENT LOGIN: Mandatory Geolocation Permission Check
      setIsVerifyingLocation(true)
      setLocationNotice('Agent role detected. Requesting required live GPS location access…')

      const locResult = await requestLocationPermission()

      if (!locResult.granted) {
        // Geolocation denied or blocked — strictly block login
        setIsVerifyingLocation(false)
        setIsSubmitting(false)
        setLocationNotice(null)
        setErrorMessage(
          locResult.error ||
            "Location access is required for Agents to log in. Click the location icon in your browser's address bar, choose 'Allow', then try again."
        )
        return
      }

      // Location granted! Complete agent login and start continuous watchPosition
      setLocationNotice('Location verified! Finalizing secure login…')
      completeAgentLogin(result.user, locResult.position)
    } catch (err) {
      setErrorMessage('An unexpected error occurred during login. Please try again.')
      setIsSubmitting(false)
      setIsVerifyingLocation(false)
    }
  }

  // ── Helper to fill demo credentials ─────────────────────────────────────────

  const handleFillDemo = (user: UserOption) => {
    setEmail(user.email)
    setPassword(user.password || 'Demo@123')
    setErrorMessage(null)
    setLocationNotice(null)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background aesthetics */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-500 blur-3xl" />
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30 mb-3">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">PropDesk CRM</h1>
          <p className="text-sm text-slate-400 mt-1">Real Estate Operations & Brokerage Platform</p>
        </div>

        {/* Main Login Card */}
        <Card className="border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-2xl text-slate-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-white">Sign in to your account</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Enter your credentials below to access the workspace.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Inline Error Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in zoom-in-95">
                <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Location Notice (when Agent requests GPS) */}
            {locationNotice && (
              <div className="p-3 rounded-lg bg-blue-950/60 border border-blue-800/80 text-blue-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                <Navigation size={15} className="text-blue-400 shrink-0 animate-spin" />
                <span className="leading-relaxed">{locationNotice}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-300">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g. aman@propdesk.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="pl-9 bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 h-10 text-sm focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-300">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pl-9 bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 h-10 text-sm focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || isVerifyingLocation}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium h-10 text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {isVerifyingLocation ? (
                  <span className="flex items-center gap-2">
                    <Navigation size={15} className="animate-spin" />
                    Verifying GPS Location…
                  </span>
                ) : isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    Sign In <ArrowRight size={15} />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Demo Credentials Helper Box ────────────────────────────────────── */}
        <div className="mt-6">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <KeyRound size={14} className="text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Demo Credentials
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Temporary Demo Aid</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              Click any user below to auto-fill credentials. Agent accounts trigger mandatory browser location verification on login.
            </p>

            <div className="space-y-1.5 pt-1">
              {MOCK_USERS.map((u) => {
                const isAgent = u.role === 'AGENT'
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-slate-200 truncate">{u.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 shrink-0 font-medium ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-purple-950/60 text-purple-300 border-purple-800'
                            : u.role === 'OFFICE_EXECUTIVE'
                            ? 'bg-blue-950/60 text-blue-300 border-blue-800'
                            : u.role === 'AGENT'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {u.role}
                      </Badge>
                      {isAgent && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-0.5 shrink-0" title="Requires GPS Location">
                          <MapPin size={10} /> GPS
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFillDemo(u)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline shrink-0 ml-2"
                    >
                      Fill
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="pt-1 text-center">
              <span className="text-[11px] text-slate-500 font-mono">Default Password for all: Demo@123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

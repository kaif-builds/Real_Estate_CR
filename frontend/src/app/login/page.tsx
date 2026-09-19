'use client'

/**
 * Login Page — Module 1 & Part 1/2 Spec
 * Styled to match Desktop/CRM exact visual style:
 * - Clean light background (bg-slate-50)
 * - White card with subtle border & shadow (bg-white border-slate-200 shadow-sm sm:rounded-2xl)
 * - Blue brand logo badge (bg-blue-600 rounded-xl)
 * - Typography, inputs, and button matching Desktop/CRM's Login.tsx
 * - Email + Password authentication against seeded mock users
 * - Preserves mandatory live GPS geolocation requirement for Field Agents
 * - Preserves demo credentials helper with role badges and GPS indicator
 */

import React, { useState } from 'react'
import {
  Building2, Lock, Mail, AlertCircle, MapPin,
  Navigation, Loader2, KeyRound
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
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
            "Location access is blocked for this site. Click the location icon in your browser's address bar, choose 'Allow', then refresh this page."
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      {/* Brand Header — Exact replica of Desktop/CRM */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          RealEstateCRM
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Sign in to your account
        </p>
      </div>

      {/* Main Login Card — Exact replica of Desktop/CRM */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message Banner */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start text-sm text-red-800">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Location Notice Banner */}
            {locationNotice && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-center text-sm text-blue-800">
                <Navigation className="w-4 h-4 text-blue-600 mr-2 shrink-0 animate-spin" />
                <span className="leading-relaxed font-medium">{locationNotice}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="e.g. aman@propdesk.in"
                  className="block w-full pl-10 border border-slate-300 rounded-md shadow-sm py-2 px-3 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="block w-full pl-10 border border-slate-300 rounded-md shadow-sm py-2 px-3 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting || isVerifyingLocation}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isVerifyingLocation ? (
                  <span className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying GPS Location…
                  </span>
                ) : isSubmitting ? (
                  <span className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  "Log In"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── Demo Credentials Helper Box (Light Theme matching overall app) ── */}
        <div className="mt-6 bg-white py-6 px-4 shadow-sm sm:rounded-2xl sm:px-8 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <KeyRound size={15} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Demo Credentials
                </h3>
                <p className="text-[11px] text-slate-500">
                  Click any account to auto-fill credentials
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Demo Mode
            </span>
          </div>

          <div className="space-y-2">
            {MOCK_USERS.map((u) => {
              const isAgent = u.role === 'AGENT'
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-slate-900 text-xs truncate">{u.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : u.role === 'OFFICE_EXECUTIVE'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : u.role === 'AGENT'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {u.role.replace('_', ' ')}
                    </span>
                    {isAgent && (
                      <span
                        className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0"
                        title="Requires GPS Location"
                      >
                        <MapPin size={10} /> GPS
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFillDemo(u)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-blue-300 shadow-2xs transition-all shrink-0 ml-2"
                  >
                    Fill
                  </button>
                </div>
              )
            })}
          </div>

          <div className="pt-1 text-center">
            <span className="text-[11px] text-slate-400">
              Default Password for all accounts: <code className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Demo@123</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

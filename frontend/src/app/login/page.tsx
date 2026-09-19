'use client'

/**
 * Login Page — Exact match of Desktop/CRM's Login.tsx
 *
 * 1. "Role Profile (Mock Auth)" section with 4 selectable buttons in a 2x2 grid:
 *    Super Admin, Office Executive, Agent, Client with active selected state styling.
 * 2. Email address and Password fields with standard icon styling.
 * 3. "Remember me" checkbox + "Forgot password?" link.
 * 4. Blue "Log In" button with loading spinner when verifying GPS.
 * 5. Logo treatment: blue rounded-xl building icon, "RealEstateCRM" heading, "Sign in to your account" subtitle.
 * 6. Clean light background (bg-slate-50) and white card (sm:rounded-2xl, border-slate-200, shadow-sm).
 * 7. Mock auth login by selecting role profile directly, enforcing Agent geolocation check.
 */

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Building2, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Role = 'Super Admin' | 'Office Executive' | 'Agent' | 'Client'

const roles: Role[] = ['Super Admin', 'Office Executive', 'Agent', 'Client']

const ROLE_DEFAULT_EMAILS: Record<Role, string> = {
  'Super Admin': 'aman@propdesk.in',
  'Office Executive': 'neha@propdesk.in',
  'Agent': 'ravi@propdesk.in',
  'Client': 'vikram@propdesk.in',
}

export default function LoginPage() {
  const { loginAsRole } = useAuth()
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role>('Super Admin')
  const [email, setEmail] = useState('demo@propdesk.in')
  const [password, setPassword] = useState('password123')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (selectedRole === 'Agent') {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        setErrorMsg('Geolocation is not supported by your browser. Location access is required for Agents to log in.')
        return
      }

      setIsLoading(true)
      // One-time grab to confirm permission, then start continuous watching
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLoading(false)
          loginAsRole('Agent', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          })
        },
        (error) => {
          setIsLoading(false)
          setErrorMsg('Location access is required for Agents to log in. Please enable location permissions and try again.')
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      loginAsRole(selectedRole)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
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

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleLogin}>
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start text-sm text-red-800">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Role Profile (Mock Auth)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r)
                      setEmail(ROLE_DEFAULT_EMAILS[r] || 'demo@propdesk.in')
                      setErrorMsg('')
                    }}
                    className={cn(
                      'flex items-center justify-center px-3 py-2 border rounded-md text-xs font-semibold transition-colors',
                      selectedRole === r
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

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
                  className="block w-full pl-10 border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900"
                />
              </div>
            </div>

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
                  className="block w-full pl-10 border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Locating...
                  </span>
                ) : (
                  'Log In'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

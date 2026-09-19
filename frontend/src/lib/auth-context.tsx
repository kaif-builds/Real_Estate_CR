'use client'

/**
 * Authentication & Location Tracking Context
 *
 * Provides:
 * 1. Mock authentication with credentials verification against MOCK_USERS
 * 2. Session persistence in sessionStorage ('propdesk_session')
 * 3. Background session resolution matching Desktop/CRM (no blocking full-page spinner)
 * 4. Route guard (redirects unauthenticated users to /login in the background)
 * 5. Agent live GPS tracking via navigator.geolocation.watchPosition
 * 6. Reverse geocoding via OpenStreetMap Nominatim with proper headers & timeout
 * 7. Permission check via navigator.permissions and mid-session lost permission handling
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { setMockUser, type MockUser, type MockRole } from '@/lib/apiClient'
import { MOCK_USERS, type UserOption } from '@/lib/mockData'

export interface GeoPosition {
  lat: number
  lng: number
  accuracy: number
}

interface AuthContextType {
  user: MockUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{
    success: boolean
    error?: string
    isAgent?: boolean
    user?: MockUser
    requiresLocation?: boolean
  }>
  loginAsRole: (roleTitle: string, initialPosition?: GeoPosition) => void
  completeAgentLogin: (agentUser: MockUser, initialPosition?: GeoPosition) => void
  logout: () => void
  // Geolocation tracking
  position: GeoPosition | null
  address: string
  geoError: string | null
  locationLost: boolean
  isTracking: boolean
  startTracking: () => void
  stopTracking: () => void
  requestLocationPermission: () => Promise<{
    granted: boolean
    error?: string
    position?: GeoPosition
    blocked?: boolean
  }>
}

const AuthContext = createContext<AuthContextType | null>(null)

const SESSION_STORAGE_KEY = 'propdesk_session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [user, setUserState] = useState<MockUser | null>(null)
  const [sessionResolved, setSessionResolved] = useState<boolean>(false)

  // Geolocation states for agents
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [address, setAddress] = useState<string>('')
  const [geoError, setGeoError] = useState<string | null>(null)
  const [locationLost, setLocationLost] = useState<boolean>(false)
  const [isTracking, setIsTracking] = useState<boolean>(false)

  const watchIdRef = useRef<number | null>(null)
  const lastGeocodeRef = useRef<{ lat: number; lng: number; time: number } | null>(null)

  // ── Reverse Geocoding via Nominatim with timeout ────────────────────────────

  const reverseGeocode = async (lat: number, lng: number) => {
    const now = Date.now()
    const last = lastGeocodeRef.current

    // Throttle: moved > 0.001° (~111m) and > 10s between calls
    if (last) {
      const movedEnough = Math.abs(lat - last.lat) > 0.001 || Math.abs(lng - last.lng) > 0.001
      const timeOk = now - last.time > 10000
      if (!movedEnough || !timeOk) return
    }

    lastGeocodeRef.current = { lat, lng, time: now }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'PropDeskCRM/1.0 (contact@propdesk.in)',
          },
          signal: controller.signal,
        }
      )
      clearTimeout(timeoutId)
      if (!res.ok) return
      const data = await res.json()
      const addr = data.address ?? {}
      const locality =
        addr.neighbourhood ||
        addr.suburb ||
        addr.residential ||
        addr.road ||
        addr.hamlet ||
        addr.village ||
        ''
      const city = addr.city || addr.town || addr.county || 'Indore'
      const area = [locality, city].filter(Boolean).join(', ')
      if (area) {
        setAddress(`Near ${area}`)
      } else if (data.display_name) {
        setAddress(data.display_name.split(',').slice(0, 3).join(','))
      }
    } catch {
      // Fallback or ignore network error/timeout for reverse geocoding
    }
  }

  // ── Start live watchPosition ────────────────────────────────────────────────

  const startTracking = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoError('Geolocation is not supported by this browser.')
      return
    }

    // Stop existing watch if running
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    setLocationLost(false)
    setIsTracking(true)

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        setPosition({ lat: latitude, lng: longitude, accuracy })
        setGeoError(null)
        setLocationLost(false)
        reverseGeocode(latitude, longitude)
      },
      (err) => {
        // If permission is revoked mid-session or position unavailable
        if (err.code === err.PERMISSION_DENIED) {
          setLocationLost(true)
          setPosition(null)
          setGeoError('Location access lost — required for Agent features.')
        } else {
          setGeoError(err.message || 'Unable to retrieve location coordinates.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 5000,
      }
    )

    watchIdRef.current = id
  }

  // ── Stop live watchPosition ─────────────────────────────────────────────────

  const stopTracking = () => {
    if (watchIdRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
    setPosition(null)
    setAddress('')
    setGeoError(null)
    setLocationLost(false)
  }

  // ── Request Location Permission (for Agent Login) ───────────────────────────

  const requestLocationPermission = async (): Promise<{
    granted: boolean
    error?: string
    position?: GeoPosition
    blocked?: boolean
  }> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return {
        granted: false,
        error: 'Geolocation is not supported by this browser. Location access is required for Agents to log in.',
      }
    }

    // First check permissions query if supported
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        if (perm.state === 'denied') {
          return {
            granted: false,
            blocked: true,
            error:
              "Location access is blocked for this site. Click the location icon in your browser's address bar, choose 'Allow', then refresh this page.",
          }
        }
      } catch {
        // Permissions query not supported or failed — continue to getCurrentPosition
      }
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords
          const coords: GeoPosition = { lat: latitude, lng: longitude, accuracy }
          setPosition(coords)
          setGeoError(null)
          setLocationLost(false)
          reverseGeocode(latitude, longitude)
          resolve({ granted: true, position: coords })
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            resolve({
              granted: false,
              blocked: true,
              error:
                "Location access is required for Agents to log in. Click the location icon in your browser's address bar, choose 'Allow', then try again.",
            })
          } else {
            resolve({
              granted: false,
              error: err.message || 'Unable to retrieve location coordinates. Please try again.',
            })
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      )
    })
  }

  // ── Initial session restore on mount (background resolution) ────────────────

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
        if (stored) {
          const parsed: MockUser = JSON.parse(stored)
          if (parsed && parsed.id && parsed.email && parsed.role) {
            setUserState(parsed)
            setMockUser(parsed)
            if (parsed.role === 'AGENT') {
              startTracking()
            }
          }
        }
      }
    } catch {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
      }
    } finally {
      setSessionResolved(true)
    }

    return () => {
      if (watchIdRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Route guard ─────────────────────────────────────────────────────────────
  // Runs in the background once session resolution completes

  useEffect(() => {
    if (!sessionResolved) return

    const isLoginPage = pathname === '/login'

    if (!user && !isLoginPage) {
      router.replace('/login')
    } else if (user && isLoginPage) {
      router.replace('/')
    }
  }, [user, sessionResolved, pathname, router])

  // ── Login Handler ───────────────────────────────────────────────────────────

  const login = async (
    emailInput: string,
    passwordInput: string
  ): Promise<{
    success: boolean
    error?: string
    isAgent?: boolean
    user?: MockUser
    requiresLocation?: boolean
  }> => {
    const cleanEmail = emailInput.trim().toLowerCase()

    // 1. Look up entered email against seeded mock Users
    const matched = MOCK_USERS.find((u) => u.email.toLowerCase() === cleanEmail)

    // 2. Generic failure if not found or password doesn't match
    if (!matched || matched.password !== passwordInput) {
      return {
        success: false,
        error: 'Invalid email or password',
      }
    }

    const mockUser: MockUser = {
      id: matched.id,
      email: matched.email,
      name: matched.name,
      role: matched.role as MockRole,
    }

    // 3. If matched user is Agent, require location verification before completing login
    if (matched.role === 'AGENT') {
      return {
        success: true,
        isAgent: true,
        user: mockUser,
        requiresLocation: true,
      }
    }

    // 4. Non-agent users log in immediately
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(mockUser))
    setUserState(mockUser)
    setMockUser(mockUser)
    router.replace('/')

    return {
      success: true,
      isAgent: false,
      user: mockUser,
    }
  }

  // ── Complete Agent Login (once location is granted) ─────────────────────────

  const completeAgentLogin = (agentUser: MockUser, initialPosition?: GeoPosition) => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(agentUser))
    setUserState(agentUser)
    setMockUser(agentUser)
    if (initialPosition) {
      setPosition(initialPosition)
    }
    startTracking()
    router.replace('/')
  }

  const loginAsRole = (roleTitle: string, initialPosition?: GeoPosition) => {
    const roleKeyMap: Record<string, { role: MockRole; user: MockUser }> = {
      'Super Admin': {
        role: 'SUPER_ADMIN',
        user: { id: 'u1', email: 'aman@propdesk.in', name: 'Aman Sharma', role: 'SUPER_ADMIN' },
      },
      'Office Executive': {
        role: 'OFFICE_EXECUTIVE',
        user: { id: 'u2', email: 'neha@propdesk.in', name: 'Neha Gupta', role: 'OFFICE_EXECUTIVE' },
      },
      'Agent': {
        role: 'AGENT',
        user: { id: 'u3', email: 'ravi@propdesk.in', name: 'Ravi Mehta', role: 'AGENT' },
      },
      'Client': {
        role: 'CLIENT',
        user: { id: 'u4', email: 'vikram@propdesk.in', name: 'Vikram Singh', role: 'CLIENT' },
      },
    }

    const item = roleKeyMap[roleTitle] || roleKeyMap['Super Admin']
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(item.user))
    setUserState(item.user)
    setMockUser(item.user)

    if (item.role === 'AGENT') {
      if (initialPosition) {
        setPosition(initialPosition)
      }
      startTracking()
    } else {
      stopTracking()
    }

    router.replace('/')
  }

  // ── Logout Handler ──────────────────────────────────────────────────────────

  const logout = () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    stopTracking()
    setUserState(null)
    setMockUser({ id: 'guest', email: '', role: 'CLIENT' })
    router.replace('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: !sessionResolved,
        login,
        loginAsRole,
        completeAgentLogin,
        logout,
        position,
        address,
        geoError,
        locationLost,
        isTracking,
        startTracking,
        stopTracking,
        requestLocationPermission,
      }}
    >
      {/* Immediately render actual routes without blocking behind a full-page spinner */}
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

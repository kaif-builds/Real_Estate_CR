'use client'

/**
 * Root page — role-based dashboard router.
 *
 * Reads the current mock user role and renders the appropriate dashboard:
 *   SUPER_ADMIN / OFFICE_EXECUTIVE → OfficeExecutiveDashboard (with sidebar)
 *   AGENT                          → FieldAgentDashboard (with sidebar)
 *   CLIENT                         → ClientPortal (standalone, no sidebar)
 *
 * When real auth is wired, this component reads the session/JWT role instead
 * of the mock user — no other changes needed in route logic.
 */

import { useAuth } from '@/lib/auth-context'
import { AppLayout } from '@/components/layout/AppLayout'
import { OfficeExecutiveDashboard } from '@/components/dashboards/OfficeExecutiveDashboard'
import { FieldAgentDashboard } from '@/components/dashboards/FieldAgentDashboard'
import { ClientPortal } from '@/components/dashboards/ClientPortal'

export default function HomePage() {
  const { user } = useAuth()

  if (!user) return null

  // CLIENT gets a standalone portal layout (no sidebar, softer theme)
  if (user.role === 'CLIENT') {
    return <ClientPortal />
  }

  // All internal roles get the sidebar + header layout
  return (
    <AppLayout>
      {(user.role === 'SUPER_ADMIN' || user.role === 'OFFICE_EXECUTIVE') && (
        <OfficeExecutiveDashboard />
      )}
      {user.role === 'AGENT' && (
        <FieldAgentDashboard />
      )}
    </AppLayout>
  )
}

'use client'

/**
 * User Management Module — Module 15
 * Manages system user accounts, assigned roles, activation states, and permissions.
 *
 * DATA SOURCE: Real FastAPI backend via apiClient.ts (/api/users)
 * ACCESS:
 *   - SUPER_ADMIN: Full CRUD (view, create, edit, deactivate, delete)
 *   - OFFICE_EXECUTIVE: Read-only view
 *   - AGENT / CLIENT: 403 Forbidden
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Users2, Plus, Shield, ShieldCheck, UserCheck, Edit2,
  CheckCircle2, Clock, AlertCircle, X, Info, Trash2,
  ShieldAlert, Loader2, RefreshCw, AlertTriangle
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { apiClient, getMockUser } from '@/lib/apiClient'
import { useAuth } from '@/lib/auth-context'

export interface ManagedUser {
  id: string
  name: string
  email: string
  role: 'SUPER_ADMIN' | 'OFFICE_EXECUTIVE' | 'AGENT' | 'CLIENT'
  status: 'Active' | 'Inactive'
  party_id?: string | null
  last_login?: string | null
  created_at?: string | null
  updated_at?: string | null
}

// ── Error Parsing Helper ──────────────────────────────────────────────────────

function parseApiError(err: unknown, defaultMsg: string): { status?: number; message: string; isForbidden?: boolean } {
  if (!(err instanceof Error)) return { message: defaultMsg }
  const raw = err.message
  const match = raw.match(/API (\d{3}):/)
  const status = match ? parseInt(match[1], 10) : undefined

  let detail = raw
  try {
    const jsonStart = raw.indexOf('{')
    if (jsonStart !== -1) {
      const parsed = JSON.parse(raw.slice(jsonStart))
      if (parsed.detail) {
        if (typeof parsed.detail === 'string') {
          detail = parsed.detail
        } else if (Array.isArray(parsed.detail)) {
          detail = parsed.detail
            .map((d: any) => {
              const msg = d.msg ? d.msg.replace(/^Value error,\s*/, '') : 'Invalid field'
              const field = d.loc?.slice(-1)[0] || 'field'
              return `${field}: ${msg}`
            })
            .join(', ')
        }
      }
    }
  } catch {
    // ignore JSON parsing issues
  }

  if (status === 403) {
    return {
      status: 403,
      message: "You don't have permission to view User Management. User management requires the Super Admin or Office Executive role.",
      isForbidden: true,
    }
  }
  if (status === 401) {
    return { status: 401, message: "Not authenticated — provide a valid session or mock role header." }
  }

  // Clean any leading "Value error, "
  detail = detail.replace(/^Value error,\s*/, '')

  return { status, message: detail || defaultMsg }
}

// ── Role Badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: ManagedUser['role'] }) {
  switch (role) {
    case 'SUPER_ADMIN':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <ShieldCheck size={12} className="text-purple-600" />
          Super Admin
        </span>
      )
    case 'OFFICE_EXECUTIVE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Shield size={12} className="text-blue-600" />
          Office Executive
        </span>
      )
    case 'AGENT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
          <UserCheck size={12} className="text-teal-600" />
          Agent
        </span>
      )
    case 'CLIENT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          Client
        </span>
      )
    default:
      return <Badge variant="outline">{role}</Badge>
  }
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Filters
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null)
  const [modalSubmitting, setModalSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Form State
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole] = useState<ManagedUser['role']>('AGENT')
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active')

  // Toast / notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Current user role checks
  const { user: authUser } = useAuth()
  const currentUser = authUser || getMockUser()
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

  // ── Fetch Users ─────────────────────────────────────────────────────────────

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const data = await apiClient.get<{ items: ManagedUser[]; total: number }>('/api/users?limit=200')
      setUsers(data.items || [])
      setTotalCount(data.total || 0)
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Failed to load system users.')
      if (parsed.isForbidden || parsed.status === 403) {
        setPermissionDenied(true)
      } else {
        setError(parsed.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers, currentUser?.role])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleToggleStatus = async (user: ManagedUser) => {
    if (!isSuperAdmin) return
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active'
    setError(null)

    try {
      const updated = await apiClient.patch<ManagedUser>(`/api/users/${user.id}`, { status: newStatus })
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: updated.status } : u)))
      showToast(`${user.name} is now ${newStatus}`)
    } catch (err: unknown) {
      const parsed = parseApiError(err, `Failed to update status for ${user.name}`)
      setError(parsed.message)
    }
  }

  const handleOpenAdd = () => {
    setFormName('')
    setFormEmail('')
    setFormRole('AGENT')
    setFormStatus('Active')
    setModalError(null)
    setShowAddModal(true)
  }

  const handleCloseAdd = () => {
    setShowAddModal(false)
    setModalError(null)
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalSubmitting(true)
    setModalError(null)

    try {
      const created = await apiClient.post<ManagedUser>('/api/users', {
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        status: formStatus,
      })
      setUsers((prev) => [...prev, created])
      setTotalCount((prev) => prev + 1)
      showToast(`User ${created.name} added successfully.`)
      setShowAddModal(false)
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Failed to create user.')
      setModalError(parsed.message)
    } finally {
      setModalSubmitting(false)
    }
  }

  const handleOpenEdit = (user: ManagedUser) => {
    setEditingUser(user)
    setFormName(user.name)
    setFormEmail(user.email)
    setFormRole(user.role)
    setFormStatus(user.status)
    setModalError(null)
  }

  const handleCloseEdit = () => {
    setEditingUser(null)
    setModalError(null)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setModalSubmitting(true)
    setModalError(null)

    try {
      const updated = await apiClient.patch<ManagedUser>(`/api/users/${editingUser.id}`, {
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        status: formStatus,
      })
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...updated } : u)))
      showToast(`User ${updated.name} updated.`)
      setEditingUser(null)
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Failed to update user.')
      setModalError(parsed.message)
    } finally {
      setModalSubmitting(false)
    }
  }

  const handleOpenDelete = (user: ManagedUser) => {
    setDeletingUser(user)
    setModalError(null)
  }

  const handleCloseDelete = () => {
    setDeletingUser(null)
    setModalError(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingUser) return
    setModalSubmitting(true)
    setModalError(null)

    try {
      await apiClient.delete(`/api/users/${deletingUser.id}`)
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id))
      setTotalCount((prev) => Math.max(0, prev - 1))
      showToast(`User ${deletingUser.name} deleted successfully.`)
      setDeletingUser(null)
    } catch (err: unknown) {
      const parsed = parseApiError(err, `Failed to delete user ${deletingUser.name}.`)
      setModalError(parsed.message)
    } finally {
      setModalSubmitting(false)
    }
  }

  // ── Pre-filtered Data ───────────────────────────────────────────────────────

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false
      return true
    })
  }, [users, roleFilter, statusFilter])

  // ── Columns ─────────────────────────────────────────────────────────────────

  const columns: ColumnDef<ManagedUser>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        sortValue: (u) => u.name,
        render: (u) => (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
              {u.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <span className="font-semibold text-slate-900">{u.name}</span>
              <span className="block text-xs font-mono text-slate-400">ID: {u.id}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'email',
        header: 'Email',
        sortValue: (u) => u.email,
        render: (u) => (
          <span className="text-slate-600 text-xs font-mono">{u.email}</span>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        sortValue: (u) => u.role,
        render: (u) => <RoleBadge role={u.role} />,
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        sortValue: (u) => u.status,
        render: (u) => {
          if (!isSuperAdmin) {
            return (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  u.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    u.status === 'Active' ? 'bg-emerald-600' : 'bg-slate-400'
                  }`}
                />
                {u.status}
              </span>
            )
          }

          return (
            <button
              type="button"
              onClick={() => handleToggleStatus(u)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
                u.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
              }`}
              title="Click to toggle status"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  u.status === 'Active' ? 'bg-emerald-600' : 'bg-slate-400'
                }`}
              />
              {u.status}
            </button>
          )
        },
      },
      {
        key: 'last_login',
        header: 'Last Login',
        sortValue: (u) => u.last_login || '',
        render: (u) => (
          <div className="flex items-center gap-1 text-slate-600 text-xs">
            <Clock size={12} className="text-slate-400 shrink-0" />
            <span>
              {u.last_login
                ? u.last_login.slice(0, 16).replace('T', ' ')
                : 'Never'}
            </span>
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        sortable: false,
        render: (u) => {
          if (!isSuperAdmin) {
            return <span className="text-xs text-slate-400 italic">Read-only</span>
          }

          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenEdit(u)}
                className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900"
              >
                <Edit2 size={13} className="mr-1" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(u)}
                className={`h-8 px-2 text-xs ${
                  u.status === 'Active'
                    ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                    : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                {u.status === 'Active' ? 'Deactivate' : 'Activate'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenDelete(u)}
                className="h-8 px-2 text-xs text-slate-400 hover:text-rose-600"
                title="Delete User"
              >
                <Trash2 size={13} />
              </Button>
            </div>
          )
        },
      },
    ],
    [isSuperAdmin]
  )

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Toast Feedback */}
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
              <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
              <Badge variant="secondary" className="font-mono text-xs">
                {totalCount} Users
              </Badge>
              {isSuperAdmin ? (
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                  Super Admin View
                </Badge>
              ) : (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                  Office Executive (Read-Only)
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Configure system user accounts, assigned roles, activation states, and access authorization.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadUsers}
              disabled={loading}
              title="Refresh users"
              className="h-9 px-3"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
            {isSuperAdmin && (
              <Button
                onClick={handleOpenAdd}
                className="bg-slate-900 text-white hover:bg-slate-800 h-9"
              >
                <Plus size={16} className="mr-1.5" /> Add User
              </Button>
            )}
          </div>
        </div>

        {/* Permission Denied (403) Banner */}
        {permissionDenied && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-6 py-8 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>
            <h2 className="text-lg font-bold">Access Restricted</h2>
            <p className="text-sm text-amber-800 max-w-md mx-auto">
              You don&apos;t have permission to view User Management. User management requires the Super Admin or Office Executive role.
            </p>
          </div>
        )}

        {/* Global Error Banner */}
        {error && !permissionDenied && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              ✕
            </button>
          </div>
        )}

        {!permissionDenied && (
          <>
            {/* Role Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <span className="text-xs text-slate-500 uppercase font-medium">Super Admin</span>
                  <p className="text-xl font-bold text-purple-700 mt-1">
                    {users.filter((u) => u.role === 'SUPER_ADMIN').length}
                  </p>
                  <span className="text-xs text-slate-400">Full system access</span>
                </CardContent>
              </Card>
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <span className="text-xs text-slate-500 uppercase font-medium">Office Executives</span>
                  <p className="text-xl font-bold text-blue-700 mt-1">
                    {users.filter((u) => u.role === 'OFFICE_EXECUTIVE').length}
                  </p>
                  <span className="text-xs text-slate-400">CRM & operations</span>
                </CardContent>
              </Card>
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <span className="text-xs text-slate-500 uppercase font-medium">Field Agents</span>
                  <p className="text-xl font-bold text-teal-700 mt-1">
                    {users.filter((u) => u.role === 'AGENT').length}
                  </p>
                  <span className="text-xs text-slate-400">Site visits & follow-ups</span>
                </CardContent>
              </Card>
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <span className="text-xs text-slate-500 uppercase font-medium">Clients</span>
                  <p className="text-xl font-bold text-slate-800 mt-1">
                    {users.filter((u) => u.role === 'CLIENT').length}
                  </p>
                  <span className="text-xs text-slate-400">Portal accounts</span>
                </CardContent>
              </Card>
            </div>

            {/* Main Content: Loading vs DataTable */}
            {loading && users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-sm bg-white rounded-lg border border-slate-200">
                <Loader2 size={24} className="animate-spin mb-2 text-indigo-600" />
                <span>Loading system users from backend…</span>
              </div>
            ) : (
              <DataTable<ManagedUser>
                columns={columns}
                data={filteredUsers}
                totalCount={totalCount}
                rowKey={(u) => u.id}
                searchPlaceholder="Search by name or email…"
                searchFields={[(u) => u.name, (u) => u.email, (u) => u.id]}
                hasActiveFilters={roleFilter !== 'ALL' || statusFilter !== 'ALL'}
                onClearFilters={() => {
                  setRoleFilter('ALL')
                  setStatusFilter('ALL')
                }}
                filterSlot={
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="h-9 text-xs w-40"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="OFFICE_EXECUTIVE">Office Executive</option>
                      <option value="AGENT">Agent</option>
                      <option value="CLIENT">Client</option>
                    </Select>

                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-9 text-xs w-36"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </Select>
                  </div>
                }
              />
            )}
          </>
        )}

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Users2 className="text-slate-700" size={18} />
                  <h2 className="text-base font-bold text-slate-900">Add New User</h2>
                </div>
                <button
                  onClick={handleCloseAdd}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded"
                >
                  <X size={18} />
                </button>
              </div>

              {modalError && (
                <div className="m-4 mb-0 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleSaveUser}>
                <div className="p-6 space-y-4">
                  {/* Name */}
                  <div>
                    <Label className="text-xs font-semibold">Full Name</Label>
                    <Input
                      placeholder="e.g. Ramesh Chandra"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      className="mt-1 text-sm"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <Label className="text-xs font-semibold">Email Address</Label>
                    <Input
                      type="email"
                      placeholder="e.g. ramesh@propdesk.in"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                      className="mt-1 text-sm"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <Label className="text-xs font-semibold">Role</Label>
                    <Select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as ManagedUser['role'])}
                      className="mt-1 text-sm"
                    >
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="OFFICE_EXECUTIVE">Office Executive</option>
                      <option value="AGENT">Agent</option>
                      <option value="CLIENT">Client</option>
                    </Select>

                    <p className="text-[11px] text-slate-500 mt-1.5 flex items-start gap-1 bg-slate-50 p-2 rounded border border-slate-200">
                      <Info size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        Field Agents handle visits and requirements; Office Executives oversee operations; Super Admins manage the platform.
                      </span>
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <Label className="text-xs font-semibold">Initial Status</Label>
                    <Select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as 'Active' | 'Inactive')}
                      className="mt-1 text-sm"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </Select>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseAdd}
                    disabled={modalSubmitting}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={modalSubmitting}
                    className="bg-slate-900 text-white text-xs"
                  >
                    {modalSubmitting ? 'Saving…' : 'Save User'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Edit2 className="text-slate-700" size={18} />
                  <h2 className="text-base font-bold text-slate-900">
                    Edit User — {editingUser.name}
                  </h2>
                </div>
                <button
                  onClick={handleCloseEdit}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded"
                >
                  <X size={18} />
                </button>
              </div>

              {modalError && (
                <div className="m-4 mb-0 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEdit}>
                <div className="p-6 space-y-4">
                  <div>
                    <Label className="text-xs font-semibold">Full Name</Label>
                    <Input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      className="mt-1 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Email Address</Label>
                    <Input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                      className="mt-1 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Role</Label>
                    <Select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as ManagedUser['role'])}
                      className="mt-1 text-sm"
                    >
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="OFFICE_EXECUTIVE">Office Executive</option>
                      <option value="AGENT">Agent</option>
                      <option value="CLIENT">Client</option>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Status</Label>
                    <Select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as 'Active' | 'Inactive')}
                      className="mt-1 text-sm"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </Select>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseEdit}
                    disabled={modalSubmitting}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={modalSubmitting}
                    className="bg-slate-900 text-white text-xs"
                  >
                    {modalSubmitting ? 'Updating…' : 'Update User'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-rose-50">
                <div className="flex items-center gap-2 text-rose-700">
                  <AlertTriangle size={18} />
                  <h2 className="text-base font-bold">Delete User</h2>
                </div>
                <button
                  onClick={handleCloseDelete}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded"
                >
                  <X size={18} />
                </button>
              </div>

              {modalError && (
                <div className="m-4 mb-0 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="p-6 space-y-3">
                <p className="text-sm text-slate-700">
                  Are you sure you want to permanently delete user{' '}
                  <strong className="text-slate-900">{deletingUser.name}</strong> ({deletingUser.email})?
                </p>
                <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="font-semibold text-slate-700">Note:</span> If this user is referenced by any existing leads, requirements, visits, tasks, or transactions, deletion will be blocked by system guard rules. We recommend deactivating the user instead.
                </p>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDelete}
                  disabled={modalSubmitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={modalSubmitting}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
                >
                  {modalSubmitting ? 'Deleting…' : 'Delete User'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

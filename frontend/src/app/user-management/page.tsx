'use client'

/**
 * User Management Module — Module 15 (Super Admin Only)
 * Manages system users with roles, activation states, last login timestamps,
 * and user creation modal with role guidance.
 */

import React, { useState, useMemo } from 'react'
import {
  Users2, Plus, Search, Filter, Shield, ShieldCheck,
  UserCheck, UserX, Edit2, CheckCircle2, Clock, Mail,
  AlertCircle, X, Info
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { MOCK_USERS, type UserOption } from '@/lib/mockData'

export interface ManagedUser {
  id: string
  name: string
  email: string
  role: 'SUPER_ADMIN' | 'OFFICE_EXECUTIVE' | 'AGENT' | 'CLIENT'
  status: 'Active' | 'Inactive'
  last_login: string
  created_at: string
}

const INITIAL_MANAGED_USERS: ManagedUser[] = [
  {
    id: 'u1',
    name: 'Aman Desai',
    email: 'aman@propdesk.in',
    role: 'SUPER_ADMIN',
    status: 'Active',
    last_login: '2026-09-19 14:45',
    created_at: '2026-01-10',
  },
  {
    id: 'u2',
    name: 'Neha Kapoor',
    email: 'neha@propdesk.in',
    role: 'OFFICE_EXECUTIVE',
    status: 'Active',
    last_login: '2026-09-19 13:30',
    created_at: '2026-02-15',
  },
  {
    id: 'u3',
    name: 'Ravi Mehta',
    email: 'ravi@propdesk.in',
    role: 'AGENT',
    status: 'Active',
    last_login: '2026-09-19 11:20',
    created_at: '2026-03-01',
  },
  {
    id: 'u4',
    name: 'Vikram Singh',
    email: 'vikram@propdesk.in',
    role: 'CLIENT',
    status: 'Active',
    last_login: '2026-09-18 16:10',
    created_at: '2026-04-12',
  },
  {
    id: 'u5',
    name: 'Priya Sharma',
    email: 'priya@propdesk.in',
    role: 'AGENT',
    status: 'Active',
    last_login: '2026-09-19 12:05',
    created_at: '2026-04-20',
  },
  {
    id: 'u6',
    name: 'Amit Patel',
    email: 'amit.p@propdesk.in',
    role: 'AGENT',
    status: 'Inactive',
    last_login: '2026-08-30 09:15',
    created_at: '2026-05-02',
  },
  {
    id: 'u7',
    name: 'Sanjay Verma',
    email: 'sanjay@propdesk.in',
    role: 'AGENT',
    status: 'Active',
    last_login: '2026-09-19 10:50',
    created_at: '2026-05-18',
  },
]

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
  const [users, setUsers] = useState<ManagedUser[]>(INITIAL_MANAGED_USERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)

  // Form State for Add User
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

  // ── Filtered Users ──────────────────────────────────────────────────────────

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })
  }, [users, roleFilter, statusFilter, searchQuery])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleToggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const newStatus = u.status === 'Active' ? 'Inactive' : 'Active'
          showToast(`${u.name} is now ${newStatus}`)
          return { ...u, status: newStatus }
        }
        return u
      })
    )
  }

  const handleOpenAdd = () => {
    setFormName('')
    setFormEmail('')
    setFormRole('AGENT')
    setFormStatus('Active')
    setShowAddModal(true)
  }

  const handleCloseAdd = () => {
    setShowAddModal(false)
  }

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock save
    showToast(`User ${formName} added successfully (mock).`)
    setShowAddModal(false)
  }

  const handleOpenEdit = (user: ManagedUser) => {
    setEditingUser(user)
    setFormName(user.name)
    setFormEmail(user.email)
    setFormRole(user.role)
    setFormStatus(user.status)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              name: formName,
              email: formEmail,
              role: formRole,
              status: formStatus,
            }
          : u
      )
    )
    showToast(`User ${formName} updated.`)
    setEditingUser(null)
  }

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
                {filteredUsers.length} Users
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                Super Admin Only
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Configure system user accounts, assigned roles, credentials, and access authorization.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenAdd}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              <Plus size={16} className="mr-1.5" /> Add User
            </Button>
          </div>
        </div>

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

        {/* Filter Bar */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              <div>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-9 text-sm"
                >
                  <option value="ALL">All Roles</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="OFFICE_EXECUTIVE">Office Executive</option>
                  <option value="AGENT">Agent</option>
                  <option value="CLIENT">Client</option>
                </Select>
              </div>

              <div>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 text-sm"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No users match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {user.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900">{user.name}</span>
                            <span className="block text-xs font-mono text-slate-400">
                              ID: {user.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap font-mono">
                        {user.email}
                      </td>

                      {/* Role (Badge) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <RoleBadge role={user.role} />
                      </td>

                      {/* Status (Active / Inactive Toggle) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
                            user.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                          }`}
                          title="Click to toggle status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.status === 'Active' ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          />
                          {user.status}
                        </button>
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Clock size={12} className="text-slate-400 shrink-0" />
                          <span>{user.last_login}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(user)}
                            className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900"
                          >
                            <Edit2 size={13} className="mr-1" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(user.id)}
                            className={`h-8 px-2 text-xs ${
                              user.status === 'Active'
                                ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                                : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                            }`}
                          >
                            {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

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

                    {/* Small note near Role dropdown as specified */}
                    <p className="text-[11px] text-slate-500 mt-1.5 flex items-start gap-1 bg-slate-50 p-2 rounded border border-slate-200">
                      <Info size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        Sub-consultants and other external collaborators are handled separately in a later phase.
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
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-slate-900 text-white text-xs">
                    Save User
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
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded"
                >
                  <X size={18} />
                </button>
              </div>

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
                    onClick={() => setEditingUser(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-slate-900 text-white text-xs">
                    Update User
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

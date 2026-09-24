'use client'

/**
 * Telemarketing Campaigns Module — Marketing Sub-module
 *
 * Outbound calling campaign & calling list management tied to parent marketing campaigns.
 * Features:
 * - Campaign overview with live computed stats: Total Contacts, Connected, Interested, Converted to Lead
 * - Calling List table with contact disposition tracking & attempt history
 * - Manual, existing party, and bulk paste contact ingestion
 * - "Log Call Outcome" dialog for disposition recording
 * - Zero-friction "Convert to Lead" flow pre-filling known contact details, campaign attribution, and notes
 * - Live reactivity across campaign summary tiles and list metrics
 *
 * Role: SUPER_ADMIN, OFFICE_EXECUTIVE
 */

import React, { useState, useMemo, useCallback, Suspense } from 'react'
import {
  PhoneCall, Plus, Megaphone, Users, UserCheck, CheckCircle2,
  Calendar, Clock, Search, ArrowRight, ArrowUpRight, Filter,
  PhoneForwarded, PhoneMissed, PhoneOutgoing, UserPlus, FileText,
  AlertCircle, Sparkles, Building2, Tag, ChevronRight, CheckSquare,
  Share2, ShieldCheck, X
} from 'lucide-react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog } from '@/components/ui/dialog'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { formatDate, formatDateTime, formatPrice } from '@/lib/formatters'
import {
  MOCK_TELEMARKETING_CAMPAIGNS,
  MOCK_TELEMARKETING_CONTACTS,
  MOCK_CAMPAIGNS,
  MOCK_PARTIES,
  MOCK_USERS,
  MOCK_LEADS,
  type TelemarketingCampaignRow,
  type TelemarketingContact,
  type CallDisposition,
  type TelemarketingCampaignStatus,
  type TelemarketingPurpose,
  type LeadRow,
} from '@/lib/mockData'

// ── Disposition Styling Constants ─────────────────────────────────────────────

const DISPOSITION_CONFIG: Record<CallDisposition, { label: string; badgeClass: string }> = {
  'Not Called':        { label: 'Not Called',        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
  'Connected':         { label: 'Connected',         badgeClass: 'bg-sky-50 text-sky-700 border-sky-200' },
  'Busy':              { label: 'Busy',              badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Call Later':        { label: 'Call Later',        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200' },
  'Interested':        { label: 'Interested',        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  'Not Interested':    { label: 'Not Interested',    badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  'Wrong Number':      { label: 'Wrong Number',      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  'Do Not Contact':    { label: 'Do Not Contact',    badgeClass: 'bg-red-50 text-red-700 border-red-200' },
  'Converted to Lead': { label: 'Converted to Lead', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold' },
}

const CAMPAIGN_STATUS_BADGES: Record<TelemarketingCampaignStatus, string> = {
  Draft:     'bg-slate-100 text-slate-700 border-slate-200',
  Active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  Paused:    'bg-amber-50 text-amber-700 border-amber-200',
  Completed: 'bg-blue-50 text-blue-700 border-blue-200',
}

const AUDIENCE_OPTIONS = [
  'Buyer',
  'Seller',
  'Owner',
  'Tenant',
  'Landlord',
  'Investor',
  'Broker',
  'Other',
] as const

const CATEGORY_OPTIONS = [
  'Residential',
  'Commercial',
  'Industrial',
  'Agricultural',
  'Mixed',
] as const

const PURPOSE_OPTIONS: TelemarketingPurpose[] = [
  'Cold Calling',
  'Market Survey',
  'Owner Acquisition',
  'Buyer Acquisition',
  'Lead Reactivation',
  'Other',
]

// ── Main Content Component ───────────────────────────────────────────────────

function TelemarketingContent() {
  // State: Campaigns & Contacts
  const [campaigns, setCampaigns] = useState<TelemarketingCampaignRow[]>([
    ...MOCK_TELEMARKETING_CAMPAIGNS,
  ])
  const [contacts, setContacts] = useState<TelemarketingContact[]>([
    ...MOCK_TELEMARKETING_CONTACTS,
  ])
  const [leads, setLeads] = useState<LeadRow[]>([...MOCK_LEADS])

  // Filters for Main Campaign Table
  const [fStatus, setFStatus] = useState<string>('')
  const [fTelecaller, setFTelecaller] = useState<string>('')
  const [fAudience, setFAudience] = useState<string>('')

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Modals
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<TelemarketingCampaignRow | null>(null)
  const [detailTab, setDetailTab] = useState<'list' | 'add' | 'overview'>('list')

  // Outcome Logging Modal
  const [selectedContactForOutcome, setSelectedContactForOutcome] = useState<TelemarketingContact | null>(null)
  const [outcomeDisposition, setOutcomeDisposition] = useState<CallDisposition>('Connected')
  const [outcomeNotes, setOutcomeNotes] = useState<string>('')
  const [outcomeNextAttempt, setOutcomeNextAttempt] = useState<string>('')

  // Convert to Lead Modal
  const [contactToConvert, setContactToConvert] = useState<TelemarketingContact | null>(null)
  const [convertLeadValue, setConvertLeadValue] = useState<number | string>(5000000)
  const [convertPriority, setConvertPriority] = useState<string>('HIGH')
  const [convertAssignedTo, setConvertAssignedTo] = useState<string>('u2')

  // "+ Add Contacts" Form State
  const [addMode, setAddMode] = useState<'manual' | 'parties' | 'paste'>('manual')
  const [singleName, setSingleName] = useState('')
  const [singlePhone, setSinglePhone] = useState('')
  const [singleCaller, setSingleCaller] = useState('Neha Kapoor')
  const [singleNotes, setSingleNotes] = useState('')
  const [selectedPartyIds, setSelectedPartyIds] = useState<string[]>([])
  const [pasteContent, setPasteContent] = useState('')

  // ── Helper: Live Computed Campaign Stats ──────────────────────────────────
  const getCampaignStats = useCallback(
    (campaignId: string) => {
      const list = contacts.filter((c) => c.campaign_id === campaignId)
      const total = list.length
      const connected = list.filter((c) =>
        ['Connected', 'Interested', 'Converted to Lead', 'Call Later', 'Not Interested'].includes(
          c.status
        )
      ).length
      const interested = list.filter((c) =>
        ['Interested', 'Converted to Lead'].includes(c.status)
      ).length
      const converted = list.filter(
        (c) => c.status === 'Converted to Lead' || Boolean(c.converted_lead_id)
      ).length

      const connectedPct = total > 0 ? Math.round((connected / total) * 100) : 0
      const convertedPct = total > 0 ? Math.round((converted / total) * 100) : 0

      return { total, connected, connectedPct, interested, converted, convertedPct }
    },
    [contacts]
  )

  // Overall Aggregate Metrics
  const aggregateMetrics = useMemo(() => {
    const totalCampaigns = campaigns.length
    const activeCampaigns = campaigns.filter((c) => c.status === 'Active').length
    const totalContacts = contacts.length
    const totalConnected = contacts.filter((c) =>
      ['Connected', 'Interested', 'Converted to Lead', 'Call Later', 'Not Interested'].includes(
        c.status
      )
    ).length
    const totalConverted = contacts.filter(
      (c) => c.status === 'Converted to Lead' || Boolean(c.converted_lead_id)
    ).length
    const totalInterested = contacts.filter((c) =>
      ['Interested', 'Converted to Lead'].includes(c.status)
    ).length

    return {
      totalCampaigns,
      activeCampaigns,
      totalContacts,
      totalConnected,
      totalConverted,
      totalInterested,
    }
  }, [campaigns, contacts])

  // Filtered Campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (fStatus && c.status !== fStatus) return false
      if (fTelecaller && !c.assigned_telecallers.includes(fTelecaller)) return false
      if (fAudience && c.target_audience !== fAudience) return false
      return true
    })
  }, [campaigns, fStatus, fTelecaller, fAudience])

  // Current Campaign Calling List (when viewing detail)
  const currentCallingList = useMemo(() => {
    if (!selectedCampaign) return []
    return contacts.filter((c) => c.campaign_id === selectedCampaign.id)
  }, [contacts, selectedCampaign])

  // Filtered contacts within the campaign detail modal
  const [callingListFilterStatus, setCallingListFilterStatus] = useState<string>('')
  const [callingListSearch, setCallingListSearch] = useState<string>('')

  const displayedCallingList = useMemo(() => {
    return currentCallingList.filter((c) => {
      if (callingListFilterStatus && c.status !== callingListFilterStatus) return false
      if (callingListSearch) {
        const q = callingListSearch.toLowerCase()
        const matchesName = c.name.toLowerCase().includes(q)
        const matchesPhone = c.phone.toLowerCase().includes(q)
        const matchesNotes = c.notes?.toLowerCase().includes(q)
        if (!matchesName && !matchesPhone && !matchesNotes) return false
      }
      return true
    })
  }, [currentCallingList, callingListFilterStatus, callingListSearch])

  // ── Create Telemarketing Campaign ─────────────────────────────────────────
  const handleCreateCampaign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = fd.get('name') as string
    const linkedCampaignId = (fd.get('linked_campaign_id') as string) || null
    const linked = linkedCampaignId ? MOCK_CAMPAIGNS.find((c) => c.id === linkedCampaignId) : null
    const targetAudience = fd.get('target_audience') as string
    const category = fd.get('category') as string
    const geography = (fd.get('geography') as string) || 'Indore'
    const startDate = (fd.get('start_date') as string) || new Date().toISOString().slice(0, 10)
    const endDate = (fd.get('end_date') as string) || new Date().toISOString().slice(0, 10)
    const purpose = fd.get('purpose') as TelemarketingPurpose

    // Multi-select telecallers from checkboxes
    const callers = fd.getAll('assigned_telecallers') as string[]
    const finalCallers = callers.length > 0 ? callers : ['Neha Kapoor']

    const newCampaign: TelemarketingCampaignRow = {
      id: `TMC-2026-${String(campaigns.length + 1).padStart(3, '0')}`,
      name,
      linked_campaign_id: linkedCampaignId,
      linked_campaign_name: linked?.name ?? null,
      target_audience: targetAudience,
      category,
      geography,
      start_date: startDate,
      end_date: endDate,
      purpose,
      assigned_telecallers: finalCallers,
      status: 'Active',
      created_at: new Date().toISOString(),
    }

    setCampaigns((prev) => [newCampaign, ...prev])
    setShowCreateCampaign(false)
    showToast(`Telemarketing campaign "${newCampaign.name}" created.`)
  }

  // ── Log Call Outcome ─────────────────────────────────────────────────────
  const openOutcomeModal = (contact: TelemarketingContact) => {
    setSelectedContactForOutcome(contact)
    setOutcomeDisposition(contact.status === 'Not Called' ? 'Connected' : contact.status)
    setOutcomeNotes(contact.notes || '')
    setOutcomeNextAttempt(contact.next_attempt_at ? contact.next_attempt_at.slice(0, 16) : '')
  }

  const handleSaveOutcome = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedContactForOutcome) return

    const contactId = selectedContactForOutcome.id
    const prevAttempts = selectedContactForOutcome.attempts_count
    const isNowConverted = outcomeDisposition === 'Converted to Lead'

    setContacts((prev) =>
      prev.map((c) => {
        if (c.id === contactId) {
          return {
            ...c,
            status: outcomeDisposition,
            attempts_count: prevAttempts + 1,
            last_attempt_at: new Date().toISOString(),
            notes: outcomeNotes.trim() || c.notes,
            next_attempt_at: outcomeNextAttempt
              ? new Date(outcomeNextAttempt).toISOString()
              : null,
          }
        }
        return c
      })
    )

    const updatedContact = {
      ...selectedContactForOutcome,
      status: outcomeDisposition,
      notes: outcomeNotes,
    }

    setSelectedContactForOutcome(null)
    showToast(`Call outcome logged: ${outcomeDisposition}`)

    // If marked Interested or Converted to Lead and not yet converted, prompt conversion dialog
    if (
      (outcomeDisposition === 'Interested' || isNowConverted) &&
      !selectedContactForOutcome.converted_lead_id
    ) {
      setTimeout(() => {
        openConvertToLead(updatedContact)
      }, 400)
    }
  }

  // ── Convert to Lead Flow ─────────────────────────────────────────────────
  const openConvertToLead = (contact: TelemarketingContact) => {
    setContactToConvert(contact)
    // Pre-fill defaults based on campaign and audience
    const campaign = campaigns.find((c) => c.id === contact.campaign_id)
    const isCommercial = campaign?.category === 'Commercial'
    setConvertLeadValue(isCommercial ? 7500000 : 4500000)
    setConvertPriority('HIGH')
    setConvertAssignedTo(
      contact.assigned_telecaller === 'Ravi Mehta'
        ? 'u3'
        : contact.assigned_telecaller === 'Aman Desai'
        ? 'u1'
        : 'u2'
    )
  }

  const handleExecuteConvertToLead = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactToConvert) return

    const campaign = campaigns.find((c) => c.id === contactToConvert.campaign_id)
    const assignedUser = MOCK_USERS.find((u) => u.id === convertAssignedTo)

    // Check if matching party exists
    const existingParty = MOCK_PARTIES.find(
      (p) =>
        p.mobile === contactToConvert.phone ||
        p.name.toLowerCase() === contactToConvert.name.toLowerCase()
    )
    const partyId = existingParty ? existingParty.id : `p-${Date.now().toString(36).slice(-4)}`

    // Generate new Lead ID
    const newLeadId = `L-${Date.now().toString(36).toUpperCase().slice(-5)}`

    // Map campaign target audience to Lead Type
    const audienceUpper = (campaign?.target_audience || 'Buyer').toUpperCase()
    const leadType = ['BUYER', 'SELLER', 'TENANT', 'LANDLORD', 'INVESTOR', 'CONSULTANT'].includes(
      audienceUpper
    )
      ? audienceUpper
      : 'BUYER'

    const newLead: LeadRow = {
      id: newLeadId,
      party_id: partyId,
      party_name: contactToConvert.name,
      channel_type: 'Offline',
      source: 'Direct Marketing',
      lead_type: leadType,
      status: 'QUALIFIED',
      priority: convertPriority,
      assigned_to_id: convertAssignedTo,
      assigned_to_name: assignedUser?.name ?? 'Neha Kapoor',
      value: typeof convertLeadValue === 'number' ? convertLeadValue : parseFloat(convertLeadValue) || 5000000,
      remarks: `Converted from Telemarketing Campaign "${campaign?.name || 'Outbound Call'}". Call Notes: ${
        contactToConvert.notes || 'Inquired through outbound telemarketing outreach.'
      }`,
      campaign_id: campaign?.linked_campaign_id || null,
      campaign_name: campaign?.linked_campaign_name || null,
      referral_code: `TMC-${campaign?.id.slice(-3) || 'OUT'}-${contactToConvert.id.slice(-3)}`,
      ad_reference: null,
      enquiry_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      next_follow_up_at: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days follow-up
      created_at: new Date().toISOString(),
    }

    // Update Leads state
    setLeads((prev) => [newLead, ...prev])

    // Update Contact state to Converted to Lead and link Lead ID
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactToConvert.id
          ? {
              ...c,
              status: 'Converted to Lead',
              converted_lead_id: newLeadId,
              notes: `${c.notes ? `${c.notes} • ` : ''}Converted to Lead ${newLeadId}`,
            }
          : c
      )
    )

    setContactToConvert(null)
    showToast(`Lead ${newLeadId} created successfully for ${newLead.party_name}!`)
  }

  // ── Add Contacts to Campaign ─────────────────────────────────────────────
  const handleAddManualContact = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCampaign || !singleName.trim() || !singlePhone.trim()) return

    // Check if phone matches existing party
    const partyMatch = MOCK_PARTIES.find(
      (p) => p.mobile.replace(/\D/g, '') === singlePhone.replace(/\D/g, '')
    )

    const newContact: TelemarketingContact = {
      id: `tmc-c-${Date.now().toString(36)}`,
      campaign_id: selectedCampaign.id,
      name: singleName.trim(),
      phone: singlePhone.trim(),
      party_id: partyMatch ? partyMatch.id : null,
      status: 'Not Called',
      attempts_count: 0,
      last_attempt_at: null,
      assigned_telecaller: singleCaller,
      notes: singleNotes.trim() || null,
      next_attempt_at: null,
      converted_lead_id: null,
      created_at: new Date().toISOString(),
    }

    setContacts((prev) => [newContact, ...prev])
    setSingleName('')
    setSinglePhone('')
    setSingleNotes('')
    setDetailTab('list')
    showToast(`Contact "${newContact.name}" added to calling list.`)
  }

  const handleAddFromParties = () => {
    if (!selectedCampaign || selectedPartyIds.length === 0) return

    const selectedParties = MOCK_PARTIES.filter((p) => selectedPartyIds.includes(p.id))
    const newContacts: TelemarketingContact[] = selectedParties.map((p, idx) => ({
      id: `tmc-c-p-${Date.now()}-${idx}`,
      campaign_id: selectedCampaign.id,
      name: p.name,
      phone: p.mobile,
      party_id: p.id,
      status: 'Not Called',
      attempts_count: 0,
      last_attempt_at: null,
      assigned_telecaller: selectedCampaign.assigned_telecallers[0] || 'Neha Kapoor',
      notes: `Imported from existing Party record (${p.roles.join(', ')})`,
      next_attempt_at: null,
      converted_lead_id: null,
      created_at: new Date().toISOString(),
    }))

    setContacts((prev) => [...newContacts, ...prev])
    setSelectedPartyIds([])
    setDetailTab('list')
    showToast(`Added ${newContacts.length} contacts from existing parties.`)
  }

  const handleBulkPasteImport = () => {
    if (!selectedCampaign || !pasteContent.trim()) return

    const lines = pasteContent.split('\n').filter((l) => l.trim().length > 0)
    const newContacts: TelemarketingContact[] = []

    lines.forEach((line, index) => {
      // Split by comma, tab, or hyphen
      const parts = line.split(/[,\t|]/).map((p) => p.trim())
      const name = parts[0]
      const phone = parts[1] || '—'

      if (name) {
        const partyMatch = MOCK_PARTIES.find(
          (p) => p.mobile.replace(/\D/g, '') === phone.replace(/\D/g, '')
        )

        newContacts.push({
          id: `tmc-c-bulk-${Date.now()}-${index}`,
          campaign_id: selectedCampaign.id,
          name,
          phone,
          party_id: partyMatch ? partyMatch.id : null,
          status: 'Not Called',
          attempts_count: 0,
          last_attempt_at: null,
          assigned_telecaller:
            selectedCampaign.assigned_telecallers[
              index % selectedCampaign.assigned_telecallers.length
            ] || 'Neha Kapoor',
          notes: 'Batch imported from prospect list',
          next_attempt_at: null,
          converted_lead_id: null,
          created_at: new Date().toISOString(),
        })
      }
    })

    if (newContacts.length > 0) {
      setContacts((prev) => [...newContacts, ...prev])
      setPasteContent('')
      setDetailTab('list')
      showToast(`Imported ${newContacts.length} contacts from paste list!`)
    }
  }

  // ── Columns: Main Campaigns Table ────────────────────────────────────────
  const columns: ColumnDef<TelemarketingCampaignRow>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Campaign Name & ID',
        sortValue: (r) => r.name,
        render: (r) => {
          return (
            <div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCampaign(r)
                  setDetailTab('list')
                }}
                className="font-semibold text-slate-900 hover:text-indigo-600 text-left text-sm transition-colors flex items-center gap-1 group"
              >
                <span>{r.name}</span>
                <ChevronRight size={13} className="text-slate-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="font-mono text-[11px] text-slate-400">{r.id}</span>
                {r.linked_campaign_name && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-medium truncate max-w-[190px]"
                    title={`Parent Marketing Campaign: ${r.linked_campaign_name}`}
                  >
                    <Megaphone size={9} />
                    {r.linked_campaign_name}
                  </span>
                )}
              </div>
            </div>
          )
        },
      },
      {
        key: 'audience',
        header: 'Audience & Category',
        sortValue: (r) => `${r.target_audience} ${r.category}`,
        render: (r) => (
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <Users size={11} /> {r.target_audience}
            </span>
            <div>
              <span className="text-[11px] text-slate-600 font-medium">
                {r.category} • <span className="text-slate-400">{r.geography}</span>
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'period',
        header: 'Period & Purpose',
        sortValue: (r) => new Date(r.start_date).getTime(),
        render: (r) => (
          <div>
            <div className="text-xs text-slate-800 font-medium">
              {formatDate(r.start_date)} – {formatDate(r.end_date)}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              Purpose: {r.purpose}
            </span>
          </div>
        ),
      },
      {
        key: 'callers',
        header: 'Assigned Telecallers',
        sortValue: (r) => r.assigned_telecallers.join(', '),
        render: (r) => (
          <div className="flex flex-wrap gap-1 max-w-[150px]">
            {r.assigned_telecallers.map((name) => (
              <span
                key={name}
                className="text-[11px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-medium"
              >
                {name}
              </span>
            ))}
          </div>
        ),
      },
      {
        key: 'progress',
        header: 'Contacts & Pipeline (Live)',
        align: 'center',
        sortValue: (r) => getCampaignStats(r.id).total,
        render: (r) => {
          const stats = getCampaignStats(r.id)
          return (
            <div className="space-y-1 text-center min-w-[180px]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-800">
                  {stats.total} <span className="text-slate-400 font-normal">contacts</span>
                </span>
                <span className="text-sky-700 font-medium">
                  {stats.connected} connected ({stats.connectedPct}%)
                </span>
              </div>
              {/* Dual progress bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${stats.convertedPct}%` }}
                  title={`${stats.converted} converted`}
                />
                <div
                  className="bg-sky-400 h-full transition-all"
                  style={{ width: `${Math.max(0, stats.connectedPct - stats.convertedPct)}%` }}
                  title={`${stats.connected} connected`}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                <span className="text-indigo-600 font-medium">
                  ★ {stats.interested} Interested
                </span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  ✓ {stats.converted} Converted
                </span>
              </div>
            </div>
          )
        },
      },
      {
        key: 'status',
        header: 'Status',
        sortValue: (r) => r.status,
        render: (r) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
              CAMPAIGN_STATUS_BADGES[r.status]
            }`}
          >
            {r.status}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        sortable: false,
        align: 'right',
        render: (r) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedCampaign(r)
                setDetailTab('list')
              }}
              className="h-7 text-xs px-2.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300"
            >
              <PhoneCall size={12} className="mr-1 text-indigo-600" />
              Calling List ({getCampaignStats(r.id).total})
            </Button>
          </div>
        ),
      },
    ],
    [getCampaignStats]
  )

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Telemarketing Campaigns</h1>
              <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                Outbound Calling Lists
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Organize target calling campaigns, track prospect dispositions, and convert interested leads directly into the sales pipeline.
            </p>
          </div>

          <Button
            onClick={() => setShowCreateCampaign(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
          >
            <Plus size={16} className="mr-1.5" /> New Telemarketing Campaign
          </Button>
        </div>

        {/* Aggregate KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Total Campaigns */}
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Active Calling Drives</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <PhoneCall size={16} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {aggregateMetrics.activeCampaigns}
                </span>
                <span className="text-xs text-slate-500">
                  / {aggregateMetrics.totalCampaigns} total
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Total Target Contacts */}
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Target Contacts</span>
                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                  <Users size={16} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-sky-700">
                  {aggregateMetrics.totalContacts}
                </span>
                <span className="text-xs text-slate-500">queued across lists</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Connected & Interested */}
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Connected & In Conversation</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <PhoneOutgoing size={16} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-700">
                  {aggregateMetrics.totalConnected}
                </span>
                <span className="text-xs text-slate-500">
                  ({aggregateMetrics.totalInterested} interested)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Converted to Pipeline Leads */}
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Converted to Pipeline Leads</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <UserCheck size={16} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-700">
                  {aggregateMetrics.totalConverted}
                </span>
                <span className="text-xs text-slate-500">active CRM leads</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DataTable of Telemarketing Campaigns */}
        <DataTable<TelemarketingCampaignRow>
          columns={columns}
          data={filteredCampaigns}
          totalCount={campaigns.length}
          rowKey={(r) => r.id}
          searchFields={[
            (r) => r.name,
            (r) => r.id,
            (r) => r.geography,
            (r) => r.target_audience,
            (r) => r.category,
            (r) => r.assigned_telecallers.join(' '),
          ]}
          searchPlaceholder="Search campaign name, ID, location, telecaller…"
          hasActiveFilters={!!fStatus || !!fTelecaller || !!fAudience}
          onClearFilters={() => {
            setFStatus('')
            setFTelecaller('')
            setFAudience('')
          }}
          emptyTitle="No telemarketing campaigns found"
          emptyDescription='Click "+ New Telemarketing Campaign" to launch an outbound calling drive.'
          filterSlot={
            <>
              {/* Status Filter */}
              <Select
                value={fStatus}
                onChange={(e) => setFStatus(e.target.value)}
                className="h-8 text-sm min-w-[120px]"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Paused">Paused</option>
                <option value="Completed">Completed</option>
              </Select>

              {/* Target Audience Filter */}
              <Select
                value={fAudience}
                onChange={(e) => setFAudience(e.target.value)}
                className="h-8 text-sm min-w-[130px]"
              >
                <option value="">All Audiences</option>
                {AUDIENCE_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>

              {/* Assigned Telecaller Filter */}
              <Select
                value={fTelecaller}
                onChange={(e) => setFTelecaller(e.target.value)}
                className="h-8 text-sm min-w-[140px]"
              >
                <option value="">All Telecallers</option>
                <option value="Neha Kapoor">Neha Kapoor</option>
                <option value="Ravi Mehta">Ravi Mehta</option>
                <option value="Aman Desai">Aman Desai</option>
              </Select>
            </>
          }
        />

        {/* ── "+ New Telemarketing Campaign" Modal ───────────────────────────── */}
        <Dialog
          open={showCreateCampaign}
          onClose={() => setShowCreateCampaign(false)}
          title="New Telemarketing Campaign"
        >
          <form onSubmit={handleCreateCampaign} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 text-xs">
            <div>
              <Label htmlFor="name" className="text-xs">Campaign Name *</Label>
              <Input
                name="name"
                id="name"
                required
                placeholder="e.g. Super Corridor Phase 2 Plot Buyer Calling"
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label htmlFor="linked_campaign_id" className="text-xs">
                Linked Marketing Campaign (Optional)
              </Label>
              <Select name="linked_campaign_id" id="linked_campaign_id" className="mt-1 text-xs">
                <option value="">None (Independent Calling Drive)</option>
                {MOCK_CAMPAIGNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="target_audience" className="text-xs">Target Audience *</Label>
                <Select name="target_audience" id="target_audience" required defaultValue="Buyer" className="mt-1 text-xs">
                  {AUDIENCE_OPTIONS.map((aud) => (
                    <option key={aud} value={aud}>
                      {aud}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="category" className="text-xs">Property Category *</Label>
                <Select name="category" id="category" required defaultValue="Commercial" className="mt-1 text-xs">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="geography" className="text-xs">Target Geography / Micro-location *</Label>
              <Input
                name="geography"
                id="geography"
                defaultValue="09-Super_Corridor, Indore"
                placeholder="e.g. Scheme 140, Vijay Nagar, Super Corridor"
                required
                className="mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start_date" className="text-xs">Start Date *</Label>
                <Input
                  type="date"
                  name="start_date"
                  id="start_date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  required
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="end_date" className="text-xs">End Date *</Label>
                <Input
                  type="date"
                  name="end_date"
                  id="end_date"
                  defaultValue={new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10)}
                  required
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="purpose" className="text-xs">Campaign Purpose *</Label>
              <Select name="purpose" id="purpose" required defaultValue="Buyer Acquisition" className="mt-1 text-xs">
                {PURPOSE_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>

            {/* Assigned Telecallers multi-checkbox */}
            <div>
              <Label className="text-xs block mb-1.5">Assigned Telecaller(s) *</Label>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {['Neha Kapoor', 'Ravi Mehta', 'Aman Desai', 'Priya Sharma'].map((staff) => (
                  <label key={staff} className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      name="assigned_telecallers"
                      value={staff}
                      defaultChecked={staff === 'Neha Kapoor' || staff === 'Ravi Mehta'}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700">{staff}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setShowCreateCampaign(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Launch Campaign
              </Button>
            </div>
          </form>
        </Dialog>

        {/* ── Campaign Detail & Calling List Modal / Drawer ──────────────────── */}
        {selectedCampaign && (
          <Dialog
            open={!!selectedCampaign}
            onClose={() => setSelectedCampaign(null)}
            title={selectedCampaign.name}
          >
            <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
              {/* Campaign Header Summary */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-500">
                      {selectedCampaign.id}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        CAMPAIGN_STATUS_BADGES[selectedCampaign.status]
                      }`}
                    >
                      {selectedCampaign.status}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Audience: <strong>{selectedCampaign.target_audience}</strong> •{' '}
                      {selectedCampaign.category} ({selectedCampaign.geography})
                    </span>
                  </div>

                  {selectedCampaign.linked_campaign_name && (
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-semibold">
                      <Megaphone size={12} />
                      {selectedCampaign.linked_campaign_name}
                    </span>
                  )}
                </div>

                {/* Progress bar and metrics */}
                {(() => {
                  const stats = getCampaignStats(selectedCampaign.id)
                  return (
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                        <span>
                          <strong>{stats.total}</strong> Total Prospects
                        </span>
                        <span>
                          <strong className="text-sky-700">{stats.connected}</strong> Connected ({stats.connectedPct}%)
                        </span>
                        <span>
                          <strong className="text-indigo-700">{stats.interested}</strong> Interested
                        </span>
                        <span>
                          <strong className="text-emerald-700 font-bold">
                            {stats.converted} Converted to Leads
                          </strong>
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${stats.convertedPct}%` }}
                          title={`${stats.converted} converted`}
                        />
                        <div
                          className="bg-sky-400 h-full"
                          style={{ width: `${Math.max(0, stats.connectedPct - stats.convertedPct)}%` }}
                          title={`${stats.connected} connected`}
                        />
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDetailTab('list')}
                  className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                    detailTab === 'list'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <PhoneCall size={14} /> Calling List ({currentCallingList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('add')}
                  className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                    detailTab === 'add'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserPlus size={14} /> + Add Contacts to List
                </button>
              </div>

              {/* TAB 1: Calling List Table */}
              {detailTab === 'list' && (
                <div className="space-y-3">
                  {/* Search and filter within the calling list */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="relative flex-1 max-w-xs">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Search contact name, phone, notes…"
                        value={callingListSearch}
                        onChange={(e) => setCallingListSearch(e.target.value)}
                        className="pl-8 h-8 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={callingListFilterStatus}
                        onChange={(e) => setCallingListFilterStatus(e.target.value)}
                        className="h-8 text-xs min-w-[130px]"
                      >
                        <option value="">All Call Statuses</option>
                        {Object.keys(DISPOSITION_CONFIG).map((disp) => (
                          <option key={disp} value={disp}>
                            {disp}
                          </option>
                        ))}
                      </Select>
                      {(callingListSearch || callingListFilterStatus) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCallingListSearch('')
                            setCallingListFilterStatus('')
                          }}
                          className="h-8 text-xs px-2 text-slate-500"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Calling List Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                            <th className="py-2.5 px-3">Contact</th>
                            <th className="py-2.5 px-3">Existing Party?</th>
                            <th className="py-2.5 px-3 text-center">Disposition Status</th>
                            <th className="py-2.5 px-3 text-center">Attempts</th>
                            <th className="py-2.5 px-3">Last Attempt</th>
                            <th className="py-2.5 px-3">Telecaller</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {displayedCallingList.length > 0 ? (
                            displayedCallingList.map((contact) => {
                              const disp = DISPOSITION_CONFIG[contact.status] || {
                                label: contact.status,
                                badgeClass: 'bg-slate-100 text-slate-700',
                              }
                              const isConverted =
                                contact.status === 'Converted to Lead' ||
                                Boolean(contact.converted_lead_id)

                              return (
                                <tr key={contact.id} className="hover:bg-slate-50/80">
                                  {/* Contact Name & Phone */}
                                  <td className="py-2.5 px-3">
                                    <div className="font-semibold text-slate-900">{contact.name}</div>
                                    <div className="text-[11px] text-slate-500 font-mono">
                                      {contact.phone}
                                    </div>
                                    {contact.notes && (
                                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 italic max-w-xs">
                                        &ldquo;{contact.notes}&rdquo;
                                      </p>
                                    )}
                                  </td>

                                  {/* Existing Party match */}
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    {contact.party_id ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                                        <ShieldCheck size={13} className="text-emerald-600" />
                                        Yes ({contact.party_id})
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-slate-400">No (New)</span>
                                    )}
                                  </td>

                                  {/* Call Status Disposition */}
                                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border font-medium ${disp.badgeClass}`}
                                    >
                                      {disp.label}
                                    </span>
                                    {contact.next_attempt_at && (
                                      <div className="text-[10px] text-amber-700 mt-0.5 flex items-center justify-center gap-0.5">
                                        <Clock size={10} /> Call back:{' '}
                                        {new Date(contact.next_attempt_at).toLocaleDateString('en-IN', {
                                          day: 'numeric',
                                          month: 'short',
                                        })}
                                      </div>
                                    )}
                                  </td>

                                  {/* Attempts Count */}
                                  <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                                    {contact.attempts_count}
                                  </td>

                                  {/* Last Attempt Date */}
                                  <td className="py-2.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                                    {contact.last_attempt_at
                                      ? formatDateTime(contact.last_attempt_at)
                                      : '—'}
                                  </td>

                                  {/* Assigned Telecaller */}
                                  <td className="py-2.5 px-3 text-[11px] text-slate-700 whitespace-nowrap">
                                    {contact.assigned_telecaller}
                                  </td>

                                  {/* Actions */}
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {/* Log Outcome button */}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openOutcomeModal(contact)}
                                        className="h-7 text-xs px-2 bg-white hover:bg-slate-100"
                                      >
                                        Log Outcome
                                      </Button>

                                      {/* Convert to Lead or Converted Badge */}
                                      {isConverted ? (
                                        <Link
                                          href={`/leads?search=${contact.converted_lead_id || contact.name}`}
                                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-1 rounded font-semibold hover:bg-emerald-100 transition-colors"
                                          title="View this Lead in the CRM Leads module"
                                        >
                                          Converted ({contact.converted_lead_id || 'Lead'})
                                          <ArrowUpRight size={11} />
                                        </Link>
                                      ) : (
                                        <Button
                                          size="sm"
                                          onClick={() => openConvertToLead(contact)}
                                          className="h-7 text-xs px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                                          title="Convert this prospect into an active sales pipeline lead"
                                        >
                                          <UserPlus size={12} className="mr-1" />
                                          Convert
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })
                          ) : (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-400">
                                No contacts in this calling list matching your filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Add Contacts */}
              {detailTab === 'add' && (
                <div className="space-y-4 pt-1">
                  {/* Mode Selector */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAddMode('manual')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold transition-all text-center ${
                        addMode === 'manual'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Single Contact (Manual)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddMode('parties')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold transition-all text-center ${
                        addMode === 'parties'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      From Existing Parties
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddMode('paste')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold transition-all text-center ${
                        addMode === 'paste'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Bulk Paste / Upload List
                    </button>
                  </div>

                  {/* Mode 1: Manual Single Contact */}
                  {addMode === 'manual' && (
                    <form onSubmit={handleAddManualContact} className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="single_name" className="text-xs">Prospect Name *</Label>
                          <Input
                            id="single_name"
                            value={singleName}
                            onChange={(e) => setSingleName(e.target.value)}
                            required
                            placeholder="e.g. Alok Verma"
                            className="mt-1 text-xs"
                          />
                        </div>
                        <div>
                          <Label htmlFor="single_phone" className="text-xs">Phone Number *</Label>
                          <Input
                            id="single_phone"
                            value={singlePhone}
                            onChange={(e) => setSinglePhone(e.target.value)}
                            required
                            placeholder="+91 98260 00000"
                            className="mt-1 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="single_caller" className="text-xs">Assign Telecaller</Label>
                          <Select
                            id="single_caller"
                            value={singleCaller}
                            onChange={(e) => setSingleCaller(e.target.value)}
                            className="mt-1 text-xs"
                          >
                            {selectedCampaign.assigned_telecallers.map((staff) => (
                              <option key={staff} value={staff}>
                                {staff}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="single_notes" className="text-xs">Initial Prospect Notes (Optional)</Label>
                          <Input
                            id="single_notes"
                            value={singleNotes}
                            onChange={(e) => setSingleNotes(e.target.value)}
                            placeholder="e.g. Looking for plot near IT Park"
                            className="mt-1 text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                          <Plus size={14} className="mr-1" /> Add to Calling List
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Mode 2: From Existing Parties */}
                  {addMode === 'parties' && (
                    <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <p className="text-slate-600">
                        Select contacts from existing CRM Parties to queue for this outbound drive:
                      </p>
                      <div className="max-h-52 overflow-y-auto divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
                        {MOCK_PARTIES.map((party) => {
                          const isAlreadyInList = currentCallingList.some(
                            (c) => c.phone.replace(/\D/g, '') === party.mobile.replace(/\D/g, '')
                          )
                          const isChecked = selectedPartyIds.includes(party.id)

                          return (
                            <label
                              key={party.id}
                              className={`flex items-center justify-between p-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${
                                isAlreadyInList ? 'opacity-50 pointer-events-none bg-slate-50' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  disabled={isAlreadyInList}
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPartyIds((prev) => [...prev, party.id])
                                    } else {
                                      setSelectedPartyIds((prev) =>
                                        prev.filter((id) => id !== party.id)
                                      )
                                    }
                                  }}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                  <span className="font-semibold text-slate-800">{party.name}</span>
                                  <span className="text-[11px] text-slate-400 font-mono ml-2">
                                    {party.mobile}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  {party.roles.join(', ')}
                                </span>
                                {isAlreadyInList && (
                                  <span className="text-[10px] text-slate-400 italic">Already in list</span>
                                )}
                              </div>
                            </label>
                          )
                        })}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-slate-500 text-xs">
                          {selectedPartyIds.length} parties selected
                        </span>
                        <Button
                          disabled={selectedPartyIds.length === 0}
                          onClick={handleAddFromParties}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                        >
                          <Plus size={14} className="mr-1" /> Add Selected to Calling List ({selectedPartyIds.length})
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Mode 3: Bulk Paste */}
                  {addMode === 'paste' && (
                    <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <Label htmlFor="paste_area" className="text-xs font-semibold text-slate-700">
                          Paste Names and Phone Numbers (Comma, Tab, or Line Separated)
                        </Label>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Format: <code>Name, Phone</code> (e.g. <code>Manish Tiwari, 9826011224</code>)
                        </p>
                      </div>

                      <Textarea
                        id="paste_area"
                        value={pasteContent}
                        onChange={(e) => setPasteContent(e.target.value)}
                        placeholder={`Kunal Patel, 9876500001\nAnita Joshi, 9876500002\nHarish Sethi, +91 98261 44556`}
                        rows={6}
                        className="font-mono text-xs mt-1"
                      />

                      {/* Live detection preview */}
                      {pasteContent.trim() && (
                        <div className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 p-2 rounded">
                          ✓ Detected{' '}
                          <strong>
                            {pasteContent.split('\n').filter((l) => l.trim().length > 0).length}
                          </strong>{' '}
                          prospects ready to import. Telecallers will be distributed evenly.
                        </div>
                      )}

                      <div className="flex justify-end pt-2">
                        <Button
                          disabled={!pasteContent.trim()}
                          onClick={handleBulkPasteImport}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                        >
                          <Plus size={14} className="mr-1" /> Import Contacts to Calling List
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-3 border-t border-slate-200">
                <Button variant="outline" onClick={() => setSelectedCampaign(null)}>
                  Close
                </Button>
              </div>
            </div>
          </Dialog>
        )}

        {/* ── Log Call Outcome Dialog ───────────────────────────────────────── */}
        {selectedContactForOutcome && (
          <Dialog
            open={!!selectedContactForOutcome}
            onClose={() => setSelectedContactForOutcome(null)}
            title="Log Call Outcome"
          >
            <form onSubmit={handleSaveOutcome} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">
                    {selectedContactForOutcome.name}
                  </h4>
                  <span className="font-mono text-slate-500 text-xs">
                    {selectedContactForOutcome.phone}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Total Attempts</span>
                  <span className="font-bold text-slate-700 text-sm">
                    {selectedContactForOutcome.attempts_count}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="outcome_disposition" className="text-xs">
                  Call Disposition *
                </Label>
                <Select
                  id="outcome_disposition"
                  value={outcomeDisposition}
                  onChange={(e) => setOutcomeDisposition(e.target.value as CallDisposition)}
                  required
                  className="mt-1 text-xs"
                >
                  {Object.keys(DISPOSITION_CONFIG).map((disp) => (
                    <option key={disp} value={disp}>
                      {disp}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Call Later date picker */}
              {outcomeDisposition === 'Call Later' && (
                <div>
                  <Label htmlFor="outcome_next_attempt" className="text-xs text-amber-800">
                    Next Attempt Date & Time *
                  </Label>
                  <Input
                    type="datetime-local"
                    id="outcome_next_attempt"
                    value={outcomeNextAttempt}
                    onChange={(e) => setOutcomeNextAttempt(e.target.value)}
                    required
                    className="mt-1 text-xs border-amber-300 ring-1 ring-amber-200"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="outcome_notes" className="text-xs">
                  Call Notes / Conversation Summary
                </Label>
                <Textarea
                  id="outcome_notes"
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="Record client response, feedback on pricing, specific requirements, objections…"
                  rows={3}
                  className="mt-1 text-xs"
                />
              </div>

              {/* Interested / Converted notice */}
              {(outcomeDisposition === 'Interested' || outcomeDisposition === 'Converted to Lead') && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                  <Sparkles size={14} className="text-emerald-600 shrink-0" />
                  <span>
                    Saving as <strong>{outcomeDisposition}</strong> will prompt the <strong>Convert to Lead</strong> workflow with all known contact and campaign details pre-filled.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedContactForOutcome(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Save Call Outcome
                </Button>
              </div>
            </form>
          </Dialog>
        )}

        {/* ── Convert to Lead Flow Dialog ───────────────────────────────────── */}
        {contactToConvert && (
          <Dialog
            open={!!contactToConvert}
            onClose={() => setContactToConvert(null)}
            title="Convert Contact to Pipeline Lead"
          >
            <form onSubmit={handleExecuteConvertToLead} className="space-y-4 text-xs">
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-indigo-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <UserPlus size={14} className="text-indigo-600" />
                  <span>Zero-Friction Conversion</span>
                </div>
                <p className="text-[11px] text-indigo-800">
                  Pre-filling known contact information, campaign attribution, and telemarketing call notes. Confirm details to create the new CRM Lead record.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-400 block">Prospect Name</span>
                  <span className="font-semibold text-slate-900 text-xs">{contactToConvert.name}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Phone</span>
                  <span className="font-mono text-slate-800 text-xs">{contactToConvert.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="convert_source" className="text-xs">Acquisition Channel & Source</Label>
                  <Input
                    id="convert_source"
                    readOnly
                    value="Offline — Direct Marketing (Telemarketing)"
                    className="mt-1 text-xs bg-slate-100 text-slate-700 font-medium"
                  />
                </div>
                <div>
                  <Label htmlFor="convert_campaign" className="text-xs">Linked Marketing Campaign</Label>
                  <Input
                    id="convert_campaign"
                    readOnly
                    value={
                      campaigns.find((c) => c.id === contactToConvert.campaign_id)
                        ?.linked_campaign_name || 'Telemarketing Outbound'
                    }
                    className="mt-1 text-xs bg-slate-100 text-slate-700 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="convert_value" className="text-xs">Estimated Deal Value (₹)</Label>
                  <Input
                    id="convert_value"
                    type="number"
                    value={convertLeadValue}
                    onChange={(e) => setConvertLeadValue(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="convert_priority" className="text-xs">Priority</Label>
                  <Select
                    id="convert_priority"
                    value={convertPriority}
                    onChange={(e) => setConvertPriority(e.target.value)}
                    className="mt-1 text-xs"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="convert_assigned" className="text-xs">Assigned Sales Executive</Label>
                <Select
                  id="convert_assigned"
                  value={convertAssignedTo}
                  onChange={(e) => setConvertAssignedTo(e.target.value)}
                  className="mt-1 text-xs"
                >
                  {MOCK_USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="convert_notes" className="text-xs">Call Notes Attached to Lead</Label>
                <Textarea
                  id="convert_notes"
                  readOnly
                  value={contactToConvert.notes || 'Interested prospect from telemarketing campaign.'}
                  rows={2}
                  className="mt-1 text-xs bg-slate-50 text-slate-700 italic"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setContactToConvert(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  <CheckCircle2 size={14} className="mr-1" />
                  Confirm & Create Pipeline Lead
                </Button>
              </div>
            </form>
          </Dialog>
        )}
      </div>
    </AppLayout>
  )
}

export default function TelemarketingCampaignsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
          Loading Telemarketing Campaigns…
        </div>
      }
    >
      <TelemarketingContent />
    </Suspense>
  )
}

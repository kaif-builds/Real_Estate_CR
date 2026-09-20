'use client'

/**
 * Call Recordings Page — Standalone AI-Analyzed Audio Library
 *
 * Dedicated module for uploading, reviewing, and searching AI-analyzed call recordings.
 * Uses Groq's whisper-large-v3 for transcription and openai/gpt-oss-20b for summarization,
 * rates extraction, sentiment analysis, and action recommendations.
 */

import { useCallback, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Mic, Plus, Search, RefreshCw, Play, Pause, FileAudio, FileText,
  Sparkles, CheckCircle2, AlertCircle, Clock, Calendar, UserCheck,
  ChevronDown, ChevronUp, Trash2, X, Upload, ExternalLink, Headphones,
  Volume2, ArrowLeft, Copy, Check
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { formatDateTime, formatDate } from '@/lib/formatters'
import {
  MOCK_CALL_RECORDINGS, MOCK_PARTIES, MOCK_LEADS, MOCK_USERS, MOCK_FOLLOW_UPS,
  type CallRecording, type FollowUpRow,
} from '@/lib/mockData'

// ── Dropdown Constants ────────────────────────────────────────────────────────

const SENTIMENT_OPTIONS = [
  { value: '', label: 'All Sentiments' },
  { value: 'Interested', label: 'Interested' },
  { value: 'Neutral', label: 'Neutral' },
  { value: 'Not Interested', label: 'Not Interested' },
] as const

const DATE_RANGE_OPTIONS = [
  { value: 'ALL', label: 'All Time' },
  { value: 'TODAY', label: 'Today (Sep 20)' },
  { value: 'YESTERDAY', label: 'Yesterday (Sep 19)' },
  { value: 'LAST_7_DAYS', label: 'Last 7 Days' },
] as const

// ── Sentiment Badge Component ─────────────────────────────────────────────────

function SentimentBadge({ sentiment }: { sentiment: CallRecording['sentiment'] }) {
  if (sentiment === 'Interested') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <CheckCircle2 size={12} className="text-emerald-600" />
        Interested
      </span>
    )
  }
  if (sentiment === 'Not Interested') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
        <AlertCircle size={12} className="text-rose-600" />
        Not Interested
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
      <Clock size={12} className="text-amber-600" />
      Neutral
    </span>
  )
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function CallRecordingsPage() {
  const [recordings, setRecordings] = useState<CallRecording[]>([...MOCK_CALL_RECORDINGS])
  const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(null)

  // Filters
  const [fSentiment, setFSentiment] = useState<string>('')
  const [fStaff, setFStaff] = useState<string>('')
  const [fDateRange, setFDateRange] = useState<string>('ALL')

  // Modals
  const [selectedRecording, setSelectedRecording] = useState<CallRecording | null>(null)
  const [playingRecording, setPlayingRecording] = useState<CallRecording | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [copiedTranscript, setCopiedTranscript] = useState(false)

  // Upload Modal State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadBlobUrl, setUploadBlobUrl] = useState<string | null>(null)
  const [uploadPartyId, setUploadPartyId] = useState<string>('p5')
  const [uploadCallerId, setUploadCallerId] = useState<string>('u3')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<{
    transcript: string
    summary: string
    rates: { mention: string; amount: string; context: string }[]
    sentiment: 'Interested' | 'Neutral' | 'Not Interested'
    nextAction: string
  } | null>(null)
  const [editableNextAction, setEditableNextAction] = useState('')
  const [modalFollowUpSaved, setModalFollowUpSaved] = useState(false)
  const [viewModalFollowUpSaved, setViewModalFollowUpSaved] = useState(false)
  const [viewModalNextAction, setViewModalNextAction] = useState('')

  // ── Staff Options ───────────────────────────────────────────────────────────

  const staffUsers = useMemo(() => {
    return MOCK_USERS.filter((u) => u.role !== 'CLIENT')
  }, [])

  // ── Filtered Recordings ─────────────────────────────────────────────────────

  const filteredRecordings = useMemo(() => {
    return recordings.filter((r) => {
      if (fSentiment && r.sentiment !== fSentiment) return false
      if (fStaff && r.uploaded_by_name !== fStaff) return false

      if (fDateRange === 'TODAY') {
        if (!r.created_at.startsWith('2026-09-20')) return false
      } else if (fDateRange === 'YESTERDAY') {
        if (!r.created_at.startsWith('2026-09-19')) return false
      } else if (fDateRange === 'LAST_7_DAYS') {
        const d = new Date(r.created_at)
        const cutoff = new Date('2026-09-13T00:00:00Z')
        if (d < cutoff) return false
      }

      return true
    })
  }, [recordings, fSentiment, fStaff, fDateRange])

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = recordings.length
    const interested = recordings.filter((r) => r.sentiment === 'Interested').length
    const neutral = recordings.filter((r) => r.sentiment === 'Neutral').length
    const notInterested = recordings.filter((r) => r.sentiment === 'Not Interested').length
    const withRates = recordings.filter((r) => r.rates && r.rates.length > 0).length
    return { total, interested, neutral, notInterested, withRates }
  }, [recordings])

  // ── Upload & Analyze Handler ────────────────────────────────────────────────

  const handleFileUpload = async (file: File) => {
    const allowedExts = /\.(mp3|m4a|wav|webm)$/i
    if (!allowedExts.test(file.name)) {
      setAnalysisError('Unsupported file type. Please upload .mp3, .m4a, .wav, or .webm audio.')
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setAnalysisError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 25MB.`)
      return
    }

    setUploadFile(file)
    const blobUrl = URL.createObjectURL(file)
    setUploadBlobUrl(blobUrl)
    setAnalysisError(null)
    setAnalysisResult(null)
    setModalFollowUpSaved(false)
    setIsAnalyzing(true)

    try {
      const formData = new FormData()
      formData.append('audio', file)

      const res = await fetch('/api/summarize-call', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setAnalysisError(data.error || `Analysis failed (${res.status})`)
        setIsAnalyzing(false)
        return
      }

      setAnalysisResult(data)
      setEditableNextAction(data.nextAction || '')
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Network error during audio analysis.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetUploadModal = () => {
    setUploadFile(null)
    if (uploadBlobUrl) URL.revokeObjectURL(uploadBlobUrl)
    setUploadBlobUrl(null)
    setUploadPartyId('p5')
    setUploadCallerId('u3')
    setIsAnalyzing(false)
    setAnalysisError(null)
    setAnalysisResult(null)
    setEditableNextAction('')
    setModalFollowUpSaved(false)
    setIsUploadModalOpen(false)
  }

  // ── Save to Library ─────────────────────────────────────────────────────────

  const handleSaveToLibrary = () => {
    if (!analysisResult) return

    const party = MOCK_PARTIES.find((p) => p.id === uploadPartyId)
    const staff = MOCK_USERS.find((u) => u.id === uploadCallerId)

    const newRec: CallRecording = {
      id: `REC-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
      party_id: uploadPartyId || undefined,
      party_name: party?.name || 'Unknown Contact',
      party_phone: party?.mobile,
      duration_seconds: 45,
      duration_formatted: '0:45',
      sentiment: analysisResult.sentiment,
      summary: analysisResult.summary,
      transcript: analysisResult.transcript,
      rates: analysisResult.rates || [],
      next_action: editableNextAction.trim() || analysisResult.nextAction,
      uploaded_by_id: uploadCallerId,
      uploaded_by_name: staff?.name || 'Ravi Mehta',
      recording_url: uploadBlobUrl,
      file_name: uploadFile?.name || 'recording.wav',
    }

    MOCK_CALL_RECORDINGS.unshift(newRec)
    setRecordings([newRec, ...recordings])
    resetUploadModal()
  }

  // ── Save as Follow-up from Upload Modal ──────────────────────────────────────

  const handleSaveFollowUpFromUpload = () => {
    if (!analysisResult || !editableNextAction.trim()) return

    const party = MOCK_PARTIES.find((p) => p.id === uploadPartyId)
    const staff = MOCK_USERS.find((u) => u.id === uploadCallerId)

    const newFollowUp: FollowUpRow = {
      id: `FU-${Date.now().toString().slice(-4)}`,
      client_name: party?.name || 'Contact',
      client_id: uploadPartyId,
      entity_type: 'Lead',
      entity_id: MOCK_LEADS.find((l) => l.party_id === uploadPartyId)?.id || 'L-0000',
      purpose: editableNextAction.trim(),
      priority: analysisResult.sentiment === 'Interested' ? 'HIGH' : 'MEDIUM',
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING',
      responsible_name: staff?.name || 'Ravi Mehta',
      responsible_id: uploadCallerId,
      expected_outcome: `AI Call Recording Insight: ${analysisResult.summary}`,
      created_at: new Date().toISOString(),
    }

    MOCK_FOLLOW_UPS.unshift(newFollowUp)
    setModalFollowUpSaved(true)
  }

  // ── Save as Follow-up from View Modal ────────────────────────────────────────

  const handleSaveFollowUpFromView = (rec: CallRecording) => {
    const actionText = viewModalNextAction.trim() || rec.next_action || 'Follow up with client'

    const newFollowUp: FollowUpRow = {
      id: `FU-${Date.now().toString().slice(-4)}`,
      client_name: rec.party_name || 'Contact',
      client_id: rec.party_id,
      entity_type: 'Lead',
      entity_id: MOCK_LEADS.find((l) => l.party_id === rec.party_id)?.id || 'L-0000',
      purpose: actionText,
      priority: rec.sentiment === 'Interested' ? 'HIGH' : 'MEDIUM',
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING',
      responsible_name: rec.uploaded_by_name,
      responsible_id: rec.uploaded_by_id,
      expected_outcome: `AI Call Recording Insight: ${rec.summary}`,
      created_at: new Date().toISOString(),
    }

    MOCK_FOLLOW_UPS.unshift(newFollowUp)
    setViewModalFollowUpSaved(true)
  }

  // ── Delete Handler ──────────────────────────────────────────────────────────

  const handleDeleteRecording = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!confirm('Are you sure you want to delete this call recording and its analysis?')) return

    const idx = MOCK_CALL_RECORDINGS.findIndex((r) => r.id === id)
    if (idx !== -1) MOCK_CALL_RECORDINGS.splice(idx, 1)

    setRecordings((prev) => prev.filter((r) => r.id !== id))
    setSelectedRecording((prev) => (prev?.id === id ? null : prev))
    setPlayingRecording((prev) => (prev?.id === id ? null : prev))
  }, [])

  // ── Table Columns ───────────────────────────────────────────────────────────

  const columns: ColumnDef<CallRecording>[] = useMemo(
    () => [
      {
        key: 'created_at',
        header: 'Date Uploaded',
        sortValue: (r) => new Date(r.created_at).getTime(),
        render: (r) => (
          <div className="space-y-0.5 whitespace-nowrap">
            <span className="text-xs font-semibold text-slate-800">
              {formatDateTime(r.created_at)}
            </span>
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <FileAudio size={10} className="text-slate-400" />
              <span>{r.file_name || `${r.id}.wav`}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'party_name',
        header: 'Linked Contact',
        sortValue: (r) => r.party_name || '',
        render: (r) => (
          <div className="space-y-0.5 whitespace-nowrap">
            <span className="font-semibold text-slate-900 text-xs">
              {r.party_name || 'Unassigned Contact'}
            </span>
            {r.party_phone && (
              <div className="text-[11px] font-mono text-slate-500">
                {r.party_phone}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'duration_formatted',
        header: 'Duration',
        sortValue: (r) => r.duration_seconds || 0,
        render: (r) => (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-700">
            <Clock size={11} className="text-slate-500" />
            {r.duration_formatted || '0:30'}
          </span>
        ),
      },
      {
        key: 'sentiment',
        header: 'Sentiment',
        sortValue: (r) => r.sentiment,
        render: (r) => <SentimentBadge sentiment={r.sentiment} />,
      },
      {
        key: 'summary',
        header: 'AI Summary',
        sortValue: (r) => r.summary,
        render: (r) => {
          const isExpanded = expandedSummaryId === r.id
          return (
            <div className="max-w-md">
              <p
                className={`text-xs text-slate-700 leading-relaxed ${
                  isExpanded ? '' : 'line-clamp-2'
                }`}
              >
                {r.summary}
              </p>
              {r.summary.length > 100 && (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSummaryId(isExpanded ? null : r.id)
                  }
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 mt-0.5"
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )
        },
      },
      {
        key: 'uploaded_by_name',
        header: 'Uploaded By',
        sortValue: (r) => r.uploaded_by_name,
        render: (r) => (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 whitespace-nowrap">
            <UserCheck size={13} className="text-slate-400" />
            {r.uploaded_by_name}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        sortable: false,
        render: (r) => (
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            {/* Play Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPlayingRecording(r)}
              className="h-7 px-2 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
              title="Play Recording"
            >
              <Play size={11} className="mr-1 fill-current" />
              Play
            </Button>

            {/* View Full Analysis */}
            <Button
              size="sm"
              onClick={() => {
                setSelectedRecording(r)
                setViewModalNextAction(r.next_action || '')
                setViewModalFollowUpSaved(false)
              }}
              className="h-7 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
              title="View Full Analysis"
            >
              <Sparkles size={12} className="mr-1" />
              Analysis
            </Button>

            {/* Delete Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => handleDeleteRecording(r.id, e)}
              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
              title="Delete Recording"
            >
              <Trash2 size={13} />
            </Button>
          </div>
        ),
      },
    ],
    [expandedSummaryId, handleDeleteRecording]
  )

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Mic size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Call Recordings
              </h1>
              <p className="text-sm text-slate-500">
                Central audio repository with automated transcription, rate detection, and client sentiment intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
            >
              <Upload size={15} className="mr-1.5" />
              Upload Recording
            </Button>
          </div>
        </div>

        {/* Quick KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Total Recordings</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Headphones size={18} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Interested</p>
                <p className="text-xl font-bold text-emerald-700 mt-0.5">{stats.interested}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={18} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Neutral</p>
                <p className="text-xl font-bold text-amber-700 mt-0.5">{stats.neutral}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Clock size={18} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Not Interested</p>
                <p className="text-xl font-bold text-rose-700 mt-0.5">{stats.notInterested}</p>
              </div>
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                <AlertCircle size={18} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Rates Detected</p>
                <p className="text-xl font-bold text-indigo-700 mt-0.5">{stats.withRates}</p>
              </div>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Sparkles size={18} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dedicated Recordings DataTable */}
        <DataTable<CallRecording>
          columns={columns}
          data={filteredRecordings}
          totalCount={recordings.length}
          rowKey={(r) => r.id}
          searchFields={[
            (r) => r.id,
            (r) => r.party_name || '',
            (r) => r.party_phone || '',
            (r) => r.summary,
            (r) => r.transcript,
            (r) => r.uploaded_by_name,
            (r) => r.file_name || '',
          ]}
          searchPlaceholder="Search by contact, summary text, transcript, or staff..."
          hasActiveFilters={!!fSentiment || !!fStaff || fDateRange !== 'ALL'}
          onClearFilters={() => {
            setFSentiment('')
            setFStaff('')
            setFDateRange('ALL')
          }}
          emptyIcon={<Mic className="h-12 w-12" />}
          emptyTitle="No call recordings found"
          emptyDescription="Upload a call recording (.mp3, .wav, .m4a) to generate automatic transcriptions and AI summaries."
          filterSlot={
            <>
              <Select
                value={fSentiment}
                onChange={(e) => setFSentiment(e.target.value)}
                className="h-8 text-sm min-w-[150px]"
              >
                {SENTIMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>

              <Select
                value={fStaff}
                onChange={(e) => setFStaff(e.target.value)}
                className="h-8 text-sm min-w-[150px]"
              >
                <option value="">All Uploaders</option>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </Select>

              <Select
                value={fDateRange}
                onChange={(e) => setFDateRange(e.target.value)}
                className="h-8 text-sm min-w-[140px]"
              >
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </>
          }
        />

        {/* ================================================================= */}
        {/* MODAL 1: UPLOAD RECORDING & AI ANALYSIS                          */}
        {/* ================================================================= */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60 sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white">
                    <Mic size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Upload Call Recording
                    </h3>
                    <p className="text-xs text-slate-500">
                      Whisper Large v3 Transcription + GPT-OSS-20B Analysis
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetUploadModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Form Inputs: Linked Contact & Staff */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Linked Contact / Lead (Optional)
                    </Label>
                    <Select
                      value={uploadPartyId}
                      onChange={(e) => setUploadPartyId(e.target.value)}
                      className="h-9 text-sm"
                    >
                      <option value="">No Contact Selected</option>
                      {MOCK_PARTIES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.mobile})
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Uploaded By / Staff
                    </Label>
                    <Select
                      value={uploadCallerId}
                      onChange={(e) => setUploadCallerId(e.target.value)}
                      className="h-9 text-sm"
                    >
                      {staffUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role.replace(/_/g, ' ')})
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* File Dropzone / Picker */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Audio Recording File</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      .mp3, .m4a, .wav, .webm (max 25MB)
                    </span>
                  </Label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/mpeg,audio/mp4,audio/wav,audio/webm,.mp3,.m4a,.wav,.webm"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleFileUpload(f)
                    }}
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      uploadFile
                        ? 'border-indigo-300 bg-indigo-50/20'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full w-fit mx-auto mb-2.5">
                      <Upload size={20} />
                    </div>
                    {uploadFile ? (
                      <div>
                        <p className="text-sm font-semibold text-slate-800 flex items-center justify-center gap-1.5">
                          <FileAudio size={16} className="text-indigo-600" />
                          {uploadFile.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {(uploadFile.size / 1024 / 1024).toFixed(2)} MB • Click to replace file
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Click to select audio recording
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Supports MP3, M4A, WAV, or WebM audio
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Audio Player Preview */}
                {uploadBlobUrl && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <Volume2 size={16} className="text-indigo-600 shrink-0" />
                    <audio controls src={uploadBlobUrl} className="w-full h-8" />
                  </div>
                )}

                {/* Loading State */}
                {isAnalyzing && (
                  <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center gap-3.5 animate-pulse">
                    <div className="p-2 rounded-full bg-indigo-600 text-white animate-spin">
                      <RefreshCw size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-indigo-900">
                        Transcribing and analyzing recording...
                      </p>
                      <p className="text-xs text-indigo-600/70 mt-0.5">
                        Running Groq Whisper transcription &amp; GPT-OSS-20B rate extraction
                      </p>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {analysisError && (
                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-3">
                    <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-rose-900">Analysis Error</p>
                      <p className="text-xs text-rose-700 mt-0.5">{analysisError}</p>
                    </div>
                  </div>
                )}

                {/* AI Analysis Preview Card */}
                {analysisResult && !isAnalyzing && (
                  <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50/40 via-purple-50/20 to-white border border-indigo-100 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                        <Sparkles size={14} className="text-indigo-600" />
                        <span>AI Analysis Complete</span>
                      </div>
                      <SentimentBadge sentiment={analysisResult.sentiment} />
                    </div>

                    {/* Summary */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Summary</span>
                      <p className="text-xs text-slate-800 bg-white/90 p-3 rounded-lg border border-slate-100 leading-relaxed">
                        {analysisResult.summary}
                      </p>
                    </div>

                    {/* Rates Table */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Rates / Prices Mentioned</span>
                      {analysisResult.rates.length > 0 ? (
                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white/90">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 text-left border-b border-slate-100">
                                <th className="px-3 py-1.5 font-semibold">Mention</th>
                                <th className="px-3 py-1.5 font-semibold">Amount</th>
                                <th className="px-3 py-1.5 font-semibold">Context</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analysisResult.rates.map((rate, i) => (
                                <tr key={i} className="border-t border-slate-50">
                                  <td className="px-3 py-1.5 font-medium text-slate-800">{rate.mention}</td>
                                  <td className="px-3 py-1.5 font-bold text-slate-900">{rate.amount}</td>
                                  <td className="px-3 py-1.5 text-slate-600">{rate.context}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic bg-white/90 p-2.5 rounded-lg border border-slate-100">
                          No specific rates or prices mentioned in the call.
                        </p>
                      )}
                    </div>

                    {/* Editable Next Action */}
                    <div className="space-y-1.5 pt-2 border-t border-indigo-100">
                      <Label className="text-[10px] text-slate-400 uppercase font-semibold">
                        Suggested Next Action (Editable)
                      </Label>
                      <Textarea
                        value={editableNextAction}
                        onChange={(e) => {
                          setEditableNextAction(e.target.value)
                          setModalFollowUpSaved(false)
                        }}
                        rows={2}
                        className="text-xs bg-white/90"
                        placeholder="Edit suggested next action..."
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleSaveFollowUpFromUpload}
                          disabled={!editableNextAction.trim() || modalFollowUpSaved}
                          className={`text-xs h-7 ${
                            modalFollowUpSaved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                          }`}
                        >
                          {modalFollowUpSaved ? (
                            <><CheckCircle2 size={12} className="mr-1 text-emerald-600" /> Follow-up Created</>
                          ) : (
                            <><Calendar size={12} className="mr-1" /> Save as Follow-up</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3 sticky bottom-0">
                <Button variant="outline" size="sm" onClick={resetUploadModal}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveToLibrary}
                  disabled={!analysisResult || isAnalyzing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  Save to Library
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL 2: FULL ANALYSIS INSPECTION MODAL                           */}
        {/* ================================================================= */}
        {selectedRecording && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      AI Call Intelligence — {selectedRecording.id}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Recorded on {formatDateTime(selectedRecording.created_at)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecording(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Meta Attributes Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Contact</span>
                    <p className="font-bold text-slate-900 text-xs mt-0.5 truncate">
                      {selectedRecording.party_name || 'Unassigned'}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Duration</span>
                    <p className="font-mono font-semibold text-slate-800 text-xs mt-0.5">
                      {selectedRecording.duration_formatted || '0:30'}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Staff / Caller</span>
                    <p className="font-semibold text-slate-800 text-xs mt-0.5 truncate">
                      {selectedRecording.uploaded_by_name}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Sentiment</span>
                    <div className="mt-1">
                      <SentimentBadge sentiment={selectedRecording.sentiment} />
                    </div>
                  </div>
                </div>

                {/* Audio Player Bar */}
                <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 flex items-center gap-3">
                  <Volume2 size={18} className="text-indigo-600 shrink-0" />
                  {selectedRecording.recording_url ? (
                    <audio controls src={selectedRecording.recording_url} className="w-full h-8" />
                  ) : (
                    <div className="text-xs text-indigo-900/80 font-medium flex items-center justify-between w-full">
                      <span>Audio File: {selectedRecording.file_name || 'recording.wav'} (Archived Audio)</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPlayingRecording(selectedRecording)}
                        className="h-7 text-xs text-indigo-700 border-indigo-200"
                      >
                        <Play size={11} className="mr-1 fill-current" />
                        Play Simulation
                      </Button>
                    </div>
                  )}
                </div>

                {/* Summary Card */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText size={13} className="text-indigo-600" />
                    Call Summary
                  </span>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm text-slate-800 leading-relaxed">
                    {selectedRecording.summary}
                  </div>
                </div>

                {/* Rates / Prices Extracted */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles size={13} className="text-indigo-600" />
                    Prices &amp; Rates Mentioned
                  </span>
                  {selectedRecording.rates && selectedRecording.rates.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 text-left border-b border-slate-100">
                            <th className="px-3.5 py-2 font-semibold">Discussion Mention</th>
                            <th className="px-3.5 py-2 font-semibold">Amount / Quote</th>
                            <th className="px-3.5 py-2 font-semibold">Contextual Detail</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRecording.rates.map((rate, i) => (
                            <tr key={i} className="border-t border-slate-100">
                              <td className="px-3.5 py-2 font-medium text-slate-900">{rate.mention}</td>
                              <td className="px-3.5 py-2 font-bold text-indigo-900">{rate.amount}</td>
                              <td className="px-3.5 py-2 text-slate-600">{rate.context}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500 italic">
                      No specific rates or commercial terms were detected in this audio conversation.
                    </div>
                  )}
                </div>

                {/* Full Monospace Transcript */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Full Audio Transcript
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedRecording.transcript)
                        setCopiedTranscript(true)
                        setTimeout(() => setCopiedTranscript(false), 2000)
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                    >
                      {copiedTranscript ? (
                        <><Check size={12} className="text-emerald-600" /> Copied</>
                      ) : (
                        <><Copy size={12} /> Copy Transcript</>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono max-h-48 overflow-y-auto leading-relaxed whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
                    {selectedRecording.transcript}
                  </div>
                </div>

                {/* Suggested Next Action & Follow-up Trigger */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Suggested Next Action
                  </span>
                  <Textarea
                    value={viewModalNextAction}
                    onChange={(e) => {
                      setViewModalNextAction(e.target.value)
                      setViewModalFollowUpSaved(false)
                    }}
                    rows={2}
                    className="text-sm bg-slate-50"
                    placeholder="Describe follow-up action..."
                  />
                  <div className="flex items-center justify-between pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleSaveFollowUpFromView(selectedRecording)}
                      disabled={viewModalFollowUpSaved}
                      className={`text-xs font-medium ${
                        viewModalFollowUpSaved
                          ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      }`}
                    >
                      {viewModalFollowUpSaved ? (
                        <><CheckCircle2 size={13} className="mr-1.5" /> Follow-up Added</>
                      ) : (
                        <><Calendar size={13} className="mr-1.5" /> Save as Follow-up Record</>
                      )}
                    </Button>
                    {viewModalFollowUpSaved && (
                      <span className="text-xs text-emerald-700 font-medium">
                        Added to Follow-ups queue (due in 48 hours)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteRecording(selectedRecording.id)}
                  className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 text-xs"
                >
                  <Trash2 size={13} className="mr-1" />
                  Delete Recording
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedRecording(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL 3: QUICK AUDIO PLAYER MODAL                                 */}
        {/* ================================================================= */}
        {playingRecording && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <Headphones size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {playingRecording.file_name || `${playingRecording.id}.wav`}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {playingRecording.party_name} • {playingRecording.duration_formatted}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPlayingRecording(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X size={16} />
                </button>
              </div>

              {playingRecording.recording_url ? (
                <audio autoPlay controls src={playingRecording.recording_url} className="w-full" />
              ) : (
                <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs">
                    <Volume2 size={16} className="text-indigo-600" />
                    <span>Playback Simulation</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    &ldquo;{playingRecording.transcript}&rdquo;
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setPlayingRecording(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

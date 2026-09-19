'use client'

/**
 * Dialog (modal) — built with native <dialog> for simplicity.
 * Used for lead/party create/edit forms.
 */

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    else if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className={cn(
        'backdrop:bg-black/40 rounded-xl border border-slate-200 shadow-xl p-0 max-w-lg w-full',
        'open:animate-in open:fade-in-0 open:zoom-in-95',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
        >
          <X size={18} />
        </button>
      </div>
      {/* Body */}
      <div className="p-6">{children}</div>
    </dialog>
  )
}

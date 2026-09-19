/**
 * Price and date formatting utilities.
 * Spec: §3.1 (INR display), §4.2 (staleness age display)
 */

/** Format a price in INR with Crore/Lakh suffix.
 *  Rental categories show "/mo" suffix. */
export function formatPrice(price: number, category?: string): string {
  const isRental = category?.includes('RENTAL')
  let label: string

  if (price >= 10_000_000) {
    label = `₹${(price / 10_000_000).toFixed(2)} Cr`
  } else if (price >= 100_000) {
    label = `₹${(price / 100_000).toFixed(1)} L`
  } else if (price >= 1_000) {
    label = `₹${(price / 1_000).toFixed(0)}k`
  } else {
    label = `₹${price.toLocaleString('en-IN')}`
  }

  return isRental ? `${label}/mo` : label
}

/** Format a budget range (min–max) with compact notation. */
export function formatBudget(min: number | null, max: number | null): string {
  const fmt = (n: number) => {
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`
    if (n >= 100_000) return `₹${(n / 100_000).toFixed(0)}L`
    return `₹${(n / 1_000).toFixed(0)}k`
  }
  if (min == null && max == null) return '—'
  if (min == null) return `Up to ${fmt(max!)}`
  if (max == null) return `From ${fmt(min)}`
  return `${fmt(min)} – ${fmt(max)}`
}

/** Return a human-readable age: "Today", "Yesterday", "N days ago". */
export function formatAgeDays(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

/** Format an ISO date string as a short locale date. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Format an ISO datetime as a short locale time. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Pretty-print a PropertyCategory enum value. */
export function formatCategory(cat: string): string {
  const MAP: Record<string, string> = {
    RENTAL_RESIDENTIAL: 'Rental Residential',
    RENTAL_COMMERCIAL: 'Rental Commercial',
    BUY_SELL_FLAT: 'Buy-Sell Flat/Duplex',
    BUY_SELL_COMMERCIAL: 'Buy-Sell Commercial',
    PLOT: 'Plot/Jameen',
  }
  return MAP[cat] ?? cat
}

/** Pretty-print an Intent enum. */
export function formatIntent(intent: string): string {
  return intent.charAt(0) + intent.slice(1).toLowerCase()
}

/** Tailwind class for a priority badge. */
export function priorityClasses(priority: string): string {
  switch (priority) {
    case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200'
    case 'HIGH':     return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'MEDIUM':   return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'LOW':      return 'bg-slate-100 text-slate-600 border-slate-200'
    default:         return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

/** Tailwind class for a follow-up / visit status badge. */
export function statusClasses(status: string): string {
  switch (status) {
    case 'OVERDUE':    return 'bg-red-100 text-red-700'
    case 'PENDING':    return 'bg-amber-100 text-amber-700'
    case 'COMPLETED':  return 'bg-green-100 text-green-700'
    case 'CANCELLED':  return 'bg-slate-100 text-slate-500'
    case 'SCHEDULED':  return 'bg-blue-100 text-blue-700'
    case 'RESCHEDULED':return 'bg-purple-100 text-purple-700'
    case 'NO_RESPONSE':return 'bg-rose-100 text-rose-700'
    case 'HIGH':       return 'bg-emerald-100 text-emerald-700'
    case 'GOOD':       return 'bg-teal-100 text-teal-700'
    case 'POSSIBLE':   return 'bg-yellow-100 text-yellow-700'
    // Lead/generic
    case 'NEW':        return 'bg-sky-100 text-sky-700'
    case 'CONTACTED':  return 'bg-blue-100 text-blue-700'
    case 'QUALIFIED':  return 'bg-indigo-100 text-indigo-700'
    case 'LOST':       return 'bg-red-100 text-red-700'
    case 'ACTIVE':     return 'bg-blue-100 text-blue-700'
    case 'FULFILLED':  return 'bg-green-100 text-green-700'
    case 'DROPPED':    return 'bg-red-100 text-red-700'
    case 'LOW_CLARITY': return 'bg-orange-100 text-orange-700'
    // Opportunity stages
    case 'NEGOTIATION':    return 'bg-amber-100 text-amber-700'
    case 'PROPOSAL':       return 'bg-blue-100 text-blue-700'
    case 'WON':            return 'bg-green-100 text-green-700'
    case 'PROPERTY_SHARED': return 'bg-teal-100 text-teal-700'
    case 'SITE_VISIT':    return 'bg-indigo-100 text-indigo-700'
    case 'DOCUMENTATION':  return 'bg-purple-100 text-purple-700'
    // Match status
    case 'SUGGESTED':      return 'bg-slate-100 text-slate-600'
    case 'SHARED':         return 'bg-blue-100 text-blue-700'
    case 'VISIT_SCHEDULED': return 'bg-indigo-100 text-indigo-700'
    case 'SHORTLISTED':   return 'bg-emerald-100 text-emerald-700'
    case 'REJECTED':       return 'bg-red-100 text-red-700'
    default:           return 'bg-slate-100 text-slate-600'
  }
}

/** Tailwind class for property status badge. Spec §1.5. */
export function propertyStatusClasses(status: string): string {
  switch (status) {
    case 'AVAILABLE':         return 'bg-green-100 text-green-700'
    case 'ACTIVE':            return 'bg-blue-100 text-blue-700'
    case 'NEW':               return 'bg-sky-100 text-sky-700'
    case 'UNDER_VERIFICATION': return 'bg-yellow-100 text-yellow-700'
    case 'UNDER_NEGOTIATION': return 'bg-amber-100 text-amber-700'
    case 'ON_HOLD':           return 'bg-orange-100 text-orange-600'
    case 'RESERVED':          return 'bg-purple-100 text-purple-700'
    case 'SOLD':              return 'bg-slate-200 text-slate-500 line-through'
    case 'RENTED':            return 'bg-slate-200 text-slate-500 line-through'
    case 'LEASED':            return 'bg-slate-200 text-slate-500 line-through'
    case 'WITHDRAWN':         return 'bg-red-100 text-red-600'
    case 'INACTIVE':          return 'bg-slate-100 text-slate-400'
    default:                  return 'bg-slate-100 text-slate-600'
  }
}

/** Tailwind class for match tier badge. Spec §1.7. */
export function tierClasses(tier: string): string {
  switch (tier) {
    case 'HIGH':     return 'bg-emerald-100 text-emerald-700'
    case 'GOOD':     return 'bg-blue-100 text-blue-700'
    case 'POSSIBLE': return 'bg-amber-100 text-amber-700'
    default:         return 'bg-slate-100 text-slate-600'
  }
}

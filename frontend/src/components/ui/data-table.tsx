'use client'

/**
 * Shared DataTable component — provides a consistent table pattern with:
 * - Click-to-sort on any column header (ascending / descending toggle with arrow indicator)
 * - Case-insensitive search across configurable fields
 * - Consistent visual style matching the project's light/professional theme
 * - "Clear all filters" button when any filter or search is active
 * - Empty state rendering
 *
 * Page-specific filters (Category dropdown, Status dropdown, etc.) live OUTSIDE
 * this component — they are rendered by each page in a slot above the table.
 * The page pre-filters data and passes the filtered array to DataTable.
 *
 * This component handles only: sorting, search, rendering the table with
 * sortable headers, the search box, a clear-all action, and the count display.
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown, Search, RefreshCw } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ColumnDef<T> {
  /** Unique key for this column */
  key: string
  /** Header label */
  header: string
  /** Accessor function to get the sortable/searchable value from a row */
  sortValue?: (row: T) => string | number | null | undefined
  /** Custom cell renderer — if omitted, sortValue's return is stringified */
  render: (row: T) => React.ReactNode
  /** Is this column sortable? Default: true */
  sortable?: boolean
  /** Header cell alignment: 'left' (default), 'center', 'right' */
  align?: 'left' | 'center' | 'right'
  /** Min width CSS class (e.g. 'min-w-[200px]') */
  className?: string
}

export interface DataTableProps<T> {
  /** Column definitions */
  columns: ColumnDef<T>[]
  /** Pre-filtered data (page handles its own filter dropdowns) */
  data: T[]
  /** Total count before page-specific filters (for "X of Y" display) */
  totalCount?: number
  /** Fields to include in text search. Each accessor receives a row. */
  searchFields?: ((row: T) => string | null | undefined)[]
  /** Initial text search query (e.g. from URL search params) */
  initialSearch?: string
  /** Placeholder text for the search box */
  searchPlaceholder?: string
  /** Unique key extractor for each row */
  rowKey: (row: T) => string
  /** Optional className on the row <tr> for conditional styling */
  rowClassName?: (row: T) => string
  /** Slot rendered between the search box and the clear button (for page-specific filter dropdowns) */
  filterSlot?: React.ReactNode
  /** Whether any page-specific filter is active (used to show "Clear all" state) */
  hasActiveFilters?: boolean
  /** Callback to clear page-specific filters */
  onClearFilters?: () => void
  /** Content rendered when data is empty */
  emptyIcon?: React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
}

type SortDir = 'asc' | 'desc'

// ── Component ─────────────────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  data,
  totalCount,
  searchFields,
  initialSearch,
  searchPlaceholder = 'Search…',
  rowKey,
  rowClassName,
  filterSlot,
  hasActiveFilters = false,
  onClearFilters,
  emptyIcon,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your filters or search criteria.',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState(initialSearch ?? '')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch)
    }
  }, [initialSearch])

  // ── Search ────────────────────────────────────────────────────────────────

  const searched = useMemo(() => {
    if (!searchQuery.trim() || !searchFields?.length) return data
    const q = searchQuery.toLowerCase()
    return data.filter(row =>
      searchFields.some(accessor => {
        const val = accessor(row)
        return val != null && String(val).toLowerCase().includes(q)
      })
    )
  }, [data, searchQuery, searchFields])

  // ── Sort ──────────────────────────────────────────────────────────────────

  const sorted = useMemo(() => {
    if (!sortKey) return searched
    const col = columns.find(c => c.key === sortKey)
    if (!col?.sortValue) return searched

    return [...searched].sort((a, b) => {
      const aVal = col.sortValue!(a)
      const bVal = col.sortValue!(b)

      // Nulls go last
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      let cmp = 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal
      } else {
        cmp = String(aVal).localeCompare(String(bVal), undefined, { sensitivity: 'base' })
      }

      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [searched, sortKey, sortDir, columns])

  // ── Sort toggle ───────────────────────────────────────────────────────────

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }, [sortKey])

  // ── Clear all ─────────────────────────────────────────────────────────────

  const isSearchActive = searchQuery.trim().length > 0
  const isSortActive = sortKey !== null
  const anyActive = isSearchActive || hasActiveFilters || isSortActive

  const handleClearAll = useCallback(() => {
    setSearchQuery('')
    setSortKey(null)
    setSortDir('asc')
    onClearFilters?.()
  }, [onClearFilters])

  // ── Sort icon helper ──────────────────────────────────────────────────────

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) {
      return <ArrowUpDown size={12} className="text-slate-300 ml-1 shrink-0" />
    }
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="text-indigo-600 ml-1 shrink-0" />
      : <ArrowDown size={12} className="text-indigo-600 ml-1 shrink-0" />
  }

  // ── Alignment class ───────────────────────────────────────────────────────

  const alignClass = (align?: 'left' | 'center' | 'right') => {
    if (align === 'center') return 'text-center'
    if (align === 'right') return 'text-right'
    return 'text-left'
  }

  const displayCount = sorted.length
  const total = totalCount ?? data.length

  return (
    <div className="space-y-3">
      {/* ── Filter / Search Bar ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-3 flex flex-wrap items-center gap-3">
        {/* Search */}
        {searchFields && searchFields.length > 0 && (
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 transition-colors placeholder:text-slate-400"
            />
          </div>
        )}

        {/* Page-specific filter slot */}
        {filterSlot}

        {/* Clear all + count */}
        {anyActive && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Clear all filters and sort"
          >
            <RefreshCw size={13} />
            Clear All
          </button>
        )}

        <span className="ml-auto text-xs text-slate-400 font-medium whitespace-nowrap">
          {displayCount === total
            ? `${displayCount} record${displayCount !== 1 ? 's' : ''}`
            : `${displayCount} of ${total}`}
        </span>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {emptyIcon && <div className="mb-3 text-slate-300">{emptyIcon}</div>}
            <h3 className="text-base font-semibold text-slate-800">{emptyTitle}</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">{emptyDescription}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {columns.map(col => {
                    const isSortable = col.sortable !== false && col.sortValue != null
                    return (
                      <th
                        key={col.key}
                        className={`py-3 px-4 ${alignClass(col.align)} ${col.className || ''} ${
                          isSortable ? 'cursor-pointer select-none hover:text-slate-700 hover:bg-slate-100/50 transition-colors' : ''
                        } ${sortKey === col.key ? 'text-indigo-700 bg-indigo-50/40' : ''}`}
                        onClick={isSortable ? () => handleSort(col.key) : undefined}
                      >
                        <span className={`inline-flex items-center gap-0.5 ${alignClass(col.align) === 'text-right' ? 'justify-end' : alignClass(col.align) === 'text-center' ? 'justify-center' : ''}`}>
                          {col.header}
                          {isSortable && <SortIcon colKey={col.key} />}
                        </span>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map(row => (
                  <tr
                    key={rowKey(row)}
                    className={`hover:bg-slate-50/80 transition-colors ${rowClassName?.(row) || ''}`}
                  >
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className={`py-3.5 px-4 ${alignClass(col.align)} ${col.className || ''}`}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

/**
 * Demand-Supply Analysis — Spec §1.21
 * Filters: Category dropdown, Location text search.
 * By Category Table: Category, Demand, Supply, Gap (color-coded).
 * Top 10 Micro-Locations Table: ShortLoc, Demand, Supply, Gap.
 * Aging Inventory: Properties unverified 5+ days.
 */

import { useMemo, useState } from 'react'
import { Search, TrendingDown, TrendingUp, Minus, AlertTriangle, BarChart3 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import {
  formatCategory, formatDate, formatAgeDays, propertyStatusClasses,
} from '@/lib/formatters'
import { MOCK_PROPERTIES, MOCK_REQUIREMENTS, type PropertyRow } from '@/lib/mockData'

const CATEGORIES = ['', 'RENTAL_RESIDENTIAL', 'RENTAL_COMMERCIAL', 'BUY_SELL_FLAT', 'BUY_SELL_COMMERCIAL', 'PLOT'] as const
const ALL_CATEGORIES = CATEGORIES.filter(Boolean) as string[]

// Terminal statuses — properties with these statuses don't count as "supply"
const TERMINAL = new Set(['SOLD', 'RENTED', 'LEASED', 'WITHDRAWN', 'INACTIVE'])

// Staleness threshold (days)
const STALE_DAYS = 5

function daysSince(iso: string | null): number {
  if (!iso) return 999
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export default function DemandSupplyPage() {
  const [fCategory, setFCategory] = useState('')
  const [locSearch, setLocSearch] = useState('')

  // ── By Category analysis ─────────────────────────────────────────────────
  const byCategory = useMemo(() => {
    return ALL_CATEGORIES.map(cat => {
      const demand = MOCK_REQUIREMENTS.filter(r => r.category === cat && r.status === 'ACTIVE').length
      const supply = MOCK_PROPERTIES.filter(p => p.category === cat && !TERMINAL.has(p.status)).length
      const gap = demand - supply
      return { category: cat, demand, supply, gap }
    }).filter(row => !fCategory || row.category === fCategory)
  }, [fCategory])

  // ── Top 10 Micro-Locations ───────────────────────────────────────────────
  const microLocations = useMemo(() => {
    const locMap = new Map<string, { demand: number; supply: number }>()

    for (const req of MOCK_REQUIREMENTS) {
      if (fCategory && req.category !== fCategory) continue
      if (req.status !== 'ACTIVE') continue
      for (const loc of req.preferred_short_locs) {
        if (locSearch && !loc.toLowerCase().includes(locSearch.toLowerCase())) continue
        const entry = locMap.get(loc) ?? { demand: 0, supply: 0 }
        entry.demand++
        locMap.set(loc, entry)
      }
    }

    for (const prop of MOCK_PROPERTIES) {
      if (fCategory && prop.category !== fCategory) continue
      if (TERMINAL.has(prop.status)) continue
      if (locSearch && !prop.short_loc.toLowerCase().includes(locSearch.toLowerCase())) continue
      const entry = locMap.get(prop.short_loc) ?? { demand: 0, supply: 0 }
      entry.supply++
      locMap.set(prop.short_loc, entry)
    }

    return Array.from(locMap.entries())
      .map(([loc, { demand, supply }]) => ({
        loc, demand, supply, gap: demand - supply, volume: demand + supply,
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10)
  }, [fCategory, locSearch])

  // ── Aging Inventory (unverified 5+ days, excluding terminal) ─────────────
  const agingInventory = useMemo(() => {
    return MOCK_PROPERTIES
      .filter(p => !TERMINAL.has(p.status) && daysSince(p.last_verified_at) >= STALE_DAYS)
      .map(p => ({ ...p, age: daysSince(p.last_verified_at) }))
      .sort((a, b) => b.age - a.age)
  }, [])

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Demand-Supply Analysis</h1>
          <p className="text-sm text-slate-500 mt-0.5">Analyze market gaps and inventory coverage.</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-3 px-4 flex flex-wrap items-center gap-3">
            <Select value={fCategory} onChange={e => setFCategory(e.target.value)} className="w-auto min-w-[160px]">
              <option value="">All Categories</option>
              {ALL_CATEGORIES.map(c => <option key={c} value={c}>{formatCategory(c)}</option>)}
            </Select>
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200 flex-1 max-w-xs">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Filter by location…"
                value={locSearch}
                onChange={e => setLocSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* By Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 size={18} className="text-blue-500" />
              Demand vs Supply — By Category
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Category</th>
                  <th className="px-3 py-3 text-center">Demand (Active Req)</th>
                  <th className="px-3 py-3 text-center">Supply (Available)</th>
                  <th className="px-3 py-3 text-center">Gap</th>
                </tr>
              </thead>
              <tbody>
                {byCategory.map(row => (
                  <tr key={row.category} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{formatCategory(row.category)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-semibold">
                        {row.demand}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-700 font-semibold">
                        {row.supply}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        row.gap > 0 ? 'bg-red-100 text-red-700' :
                        row.gap < 0 ? 'bg-green-100 text-green-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {row.gap > 0 ? <TrendingUp size={12} /> :
                         row.gap < 0 ? <TrendingDown size={12} /> :
                         <Minus size={12} />}
                        {row.gap > 0 ? `+${row.gap}` : row.gap}
                      </span>
                    </td>
                  </tr>
                ))}
                {byCategory.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-sm">No data</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Top 10 Micro-Locations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top 10 Micro-Locations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3">ShortLoc</th>
                  <th className="px-3 py-3 text-center">Demand</th>
                  <th className="px-3 py-3 text-center">Supply</th>
                  <th className="px-3 py-3 text-center">Gap</th>
                </tr>
              </thead>
              <tbody>
                {microLocations.map(row => (
                  <tr key={row.loc} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-medium text-slate-800">{row.loc}</td>
                    <td className="px-3 py-3 text-center text-blue-700 font-semibold">{row.demand}</td>
                    <td className="px-3 py-3 text-center text-green-700 font-semibold">{row.supply}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        row.gap > 0 ? 'bg-red-100 text-red-700' :
                        row.gap < 0 ? 'bg-green-100 text-green-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {row.gap > 0 ? `+${row.gap}` : row.gap}
                      </span>
                    </td>
                  </tr>
                ))}
                {microLocations.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-sm">No locations match</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Aging Inventory */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle size={18} className="text-amber-500" />
              Aging Inventory (Unverified {STALE_DAYS}+ Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {agingInventory.length === 0 ? (
              <p className="text-sm text-slate-400 p-5">All properties verified within the last {STALE_DAYS} days. ✓</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-5 py-3">ID</th>
                    <th className="px-3 py-3">ShortLoc</th>
                    <th className="px-3 py-3">Last Verified</th>
                    <th className="px-3 py-3">Age</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {agingInventory.map((prop, i) => (
                    <tr key={prop.id} className={`border-b border-slate-50 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                      <td className="px-5 py-3 font-mono text-xs text-slate-700">{prop.id}</td>
                      <td className="px-3 py-3 font-medium text-slate-800">{prop.short_loc}</td>
                      <td className="px-3 py-3 text-xs text-slate-500">{formatDate(prop.last_verified_at)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          prop.age >= 10 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {formatAgeDays(prop.age)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${propertyStatusClasses(prop.status)}`}>
                          {prop.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

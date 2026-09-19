'use client'

/**
 * Executive Reports & Analytics Module (Super Admin Only)
 * Comprehensive operational and financial reports for deal conversion,
 * lead channels, visit velocity, and commission revenue.
 */

import React, { useState } from 'react'
import {
  FileBarChart, TrendingUp, DollarSign, Users, Building2,
  Calendar, Download, Filter, BarChart3, PieChart, ArrowUpRight
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { formatPrice } from '@/lib/formatters'
import { MOCK_TRANSACTIONS, MOCK_PIPELINE_OPPORTUNITIES } from '@/lib/mockData'

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState('q3_2026')

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                Super Admin Only
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Executive business performance summaries, conversion funnel analytics, and revenue reports.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="this_month">September 2026 (MTD)</option>
              <option value="q3_2026">Q3 2026 (Jul - Sep)</option>
              <option value="ytd_2026">Year to Date (2026)</option>
            </Select>
            <Button variant="outline" size="sm" className="text-xs text-slate-700">
              <Download size={14} className="mr-1.5" /> Export PDF
            </Button>
          </div>
        </div>

        {/* High-level KPI grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase">Gross Deal Value</span>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {formatPrice(
                  MOCK_TRANSACTIONS.reduce((sum, tx) => sum + tx.transaction_value, 0)
                )}
              </p>
              <span className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                <ArrowUpRight size={13} /> +18.4% vs last quarter
              </span>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Brokerage</span>
              <p className="text-xl font-bold text-indigo-700 mt-1">
                {formatPrice(
                  MOCK_TRANSACTIONS.reduce((sum, tx) => sum + tx.commission_amount, 0)
                )}
              </p>
              <span className="text-xs text-slate-400 mt-0.5">Avg comm rate: 2.3%</span>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase">Pipeline Deals</span>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {MOCK_PIPELINE_OPPORTUNITIES.length} Active
              </p>
              <span className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                <ArrowUpRight size={13} /> 64% win probability
              </span>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase">Avg Deal Turnaround</span>
              <p className="text-xl font-bold text-slate-900 mt-1">14.2 Days</p>
              <span className="text-xs text-slate-400 mt-0.5">From Lead to Registered</span>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 size={16} className="text-indigo-600" />
                Revenue by Transaction Type
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-800">Direct Sales</span>
                <span className="font-mono font-bold text-slate-900">₹26,800,000 (87.2%)</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-800">Commercial Leases</span>
                <span className="font-mono font-bold text-slate-900">₹492,000 (8.1%)</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-800">Residential Rentals</span>
                <span className="font-mono font-bold text-slate-900">₹516,000 (4.7%)</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChart size={16} className="text-emerald-600" />
                Lead Channel Conversion Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-800">Referrals</span>
                <span className="font-mono font-bold text-emerald-700">42% Closed</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-800">Website Inquiries</span>
                <span className="font-mono font-bold text-blue-700">28% Closed</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-800">Broker Networks</span>
                <span className="font-mono font-bold text-purple-700">35% Closed</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

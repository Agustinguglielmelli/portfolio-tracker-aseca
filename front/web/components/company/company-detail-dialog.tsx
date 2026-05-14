"use client"

import { useMemo } from "react"
import { X, FileText } from "lucide-react"
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts"
import { PriceChangeBadge, TickerAvatar } from "@/components/common"
import { QuartersChart } from "@/components/edgar/quarters-chart"
import { CompanyFactsGrid } from "@/components/edgar/company-facts-grid"
import { FilingsList } from "@/components/edgar/filings-list"
import { generatePriceHistory, mockQuarters, mockCompanyFacts, mockFilings } from "@/data/mock"

interface CompanyDetailDialogProps {
  ticker: string
  name: string
  onClose: () => void
}

export function CompanyDetailDialog({ ticker, name, onClose }: CompanyDetailDialogProps) {
  const priceHistory = useMemo(() => generatePriceHistory(), [])
  const last = priceHistory[priceHistory.length - 1].p
  const first = priceHistory[0].p
  const change = ((last - first) / first) * 100

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl my-8 rounded-2xl bg-gradient-to-br from-[#0f1a35] to-[#0a1224] border border-white/10 shadow-[0_0_40px_rgba(56,189,248,0.12)]"
      >
        <div className="flex items-start justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <TickerAvatar ticker={ticker} size="lg" />
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">{ticker} - NASDAQ</div>
              <div className="text-white mt-0.5 text-lg font-medium">{name}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Last price</div>
              <div className="text-white mt-1 text-3xl font-medium">${last.toFixed(2)}</div>
              <PriceChangeBadge value={change} className="mt-2" />
            </div>
            <div className="text-right text-xs text-slate-500">Source: Yahoo Finance - Last stored price</div>
          </div>

          <div className="h-56 rounded-xl bg-white/[0.02] border border-white/5 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceHistory}>
                <defs>
                  <linearGradient id="cd-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="d" stroke="#475569" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} orientation="right" />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10,18,36,0.95)",
                    border: "1px solid rgba(56,189,248,0.2)",
                    borderRadius: 10,
                  }}
                />
                <Area type="monotone" dataKey="p" stroke="#22d3ee" strokeWidth={2} fill="url(#cd-grad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Company Facts (XBRL - SEC EDGAR)</div>
            <CompanyFactsGrid facts={mockCompanyFacts} />
          </div>

          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Quarterly Evolution</div>
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
              <QuartersChart data={mockQuarters} />
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Recent Filings</div>
            <FilingsList filings={mockFilings} />
          </div>
        </div>
      </div>
    </div>
  )
}

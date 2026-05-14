"use client"

import { useState } from "react"
import { Search, TrendingUp } from "lucide-react"
import { GlowCard } from "@/components/common"
import { QuartersChart } from "./quarters-chart"
import { CompanyFactsGrid } from "./company-facts-grid"
import { FilingsList } from "./filings-list"
import { mockCompanies, mockFilings, mockCompanyFacts, mockQuarters } from "@/data/mock"
import type { Company } from "@/types"

interface EdgarSearchProps {
  onSelect?: (ticker: string, name: string) => void
}

export function EdgarSearch({ onSelect }: EdgarSearchProps) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Company>(mockCompanies[0])

  const filteredResults = mockCompanies.filter(
    (c) =>
      !query ||
      c.ticker.includes(query.toUpperCase()) ||
      c.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="grid grid-cols-12 gap-5">
      <GlowCard glow className="col-span-12 lg:col-span-4 p-6">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">
          SEC EDGAR - Full-Text Search
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ticker or name"
            className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 h-10 text-sm text-slate-200 outline-none focus:border-cyan-400/50 focus:shadow-[0_0_10px_rgba(56,189,248,0.12)]"
          />
        </div>
        <div className="space-y-2">
          {filteredResults.map((company) => (
            <button
              key={company.cik}
              onClick={() => {
                setSelected(company)
                onSelect?.(company.ticker, company.name)
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                selected.cik === company.cik
                  ? "bg-cyan-500/10 border-cyan-400/40 shadow-[0_0_10px_rgba(56,189,248,0.12)]"
                  : "bg-white/[0.02] border-white/5 hover:border-cyan-400/20"
              }`}
            >
              <div className="text-left">
                <div className="text-white text-sm">{company.ticker}</div>
                <div className="text-xs text-slate-500">{company.name}</div>
              </div>
              <div className="text-xs text-slate-500">CIK {company.cik}</div>
            </button>
          ))}
        </div>
      </GlowCard>

      <GlowCard glow className="col-span-12 lg:col-span-8 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Company Facts (XBRL)</div>
            <div className="text-white text-xl font-medium mt-1">{selected.name}</div>
          </div>
          <div className="text-xs text-slate-500">CIK {selected.cik}</div>
        </div>

        <div className="mb-6">
          <CompanyFactsGrid facts={mockCompanyFacts} />
        </div>

        <div className="flex items-center gap-2 mb-2 text-xs text-slate-500 uppercase tracking-wider">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          Last 6 Quarters - Revenue & Net Income (B USD)
        </div>
        <QuartersChart data={mockQuarters} />

        <div className="mt-6">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Recent Filings</div>
          <FilingsList filings={mockFilings} />
        </div>
      </GlowCard>
    </div>
  )
}

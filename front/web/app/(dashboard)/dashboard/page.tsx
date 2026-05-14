"use client"

import { useState } from "react"
import { PageHeader, GlowCard } from "@/components/common"
import { StatsCards, PerformanceChart, TransactionsLog } from "@/components/dashboard"
import { PortfolioPanel } from "@/components/portfolio"
import { CompanyDetailDialog } from "@/components/company"

export default function DashboardPage() {
  const [selected, setSelected] = useState<{ ticker: string; name: string } | null>(null)

  const openCompany = (ticker: string, name: string) => setSelected({ ticker, name })

  return (
    <>
      <PageHeader label="Dashboard" title="My Wealth" />

      <StatsCards />

      <div className="grid grid-cols-12 gap-5">
        <GlowCard glow className="col-span-12 lg:col-span-8 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Performance</div>
              <div
                className="text-white text-2xl font-medium mt-1"
                style={{ textShadow: "0 0 8px rgba(34,211,238,0.2)" }}
              >
                $961,517.05
              </div>
              <div className="text-xs text-emerald-300 mt-1">+$176,084.99 - +22.42%</div>
            </div>
            <div className="flex gap-2">
              {["Portfolio", "DAX", "S&P 500"].map((label, i) => (
                <div
                  key={label}
                  className={`px-3 py-1.5 rounded-lg text-xs border ${
                    i === 0
                      ? "bg-cyan-500/10 border-cyan-400/40 text-cyan-300"
                      : i === 1
                        ? "bg-blue-500/10 border-blue-400/30 text-blue-300"
                        : "bg-emerald-500/10 border-emerald-400/30 text-emerald-300"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
          <PerformanceChart />
        </GlowCard>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7">
          <PortfolioPanel onSelect={openCompany} />
        </div>
        <div className="col-span-12 lg:col-span-5">
          <TransactionsLog />
        </div>
      </div>

      {selected && (
        <CompanyDetailDialog
          ticker={selected.ticker}
          name={selected.name}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

"use client"

import { useState } from "react"
import { PageHeader } from "@/components/common"
import { StatsCards, TransactionsLog } from "@/components/dashboard"
import { PortfolioPanel } from "@/components/portfolio"
import { CompanyDetailDialog } from "@/components/company"

export default function PortfolioPage() {
  const [selected, setSelected] = useState<{ ticker: string; name: string } | null>(null)

  const openCompany = (ticker: string, name: string) => setSelected({ ticker, name })

  return (
    <>
      <PageHeader label="Portfolio" title="My Positions" />

      <StatsCards />

      <PortfolioPanel onSelect={openCompany} />

      <TransactionsLog />

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

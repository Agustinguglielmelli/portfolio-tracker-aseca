"use client"

import { useState } from "react"
import { PageHeader } from "@/components/common"
import { WatchlistPanel } from "@/components/watchlist"
import { CompanyDetailDialog } from "@/components/company"

export default function WatchlistPage() {
  const [selected, setSelected] = useState<{ ticker: string; name: string } | null>(null)

  const openCompany = (ticker: string, name: string) => setSelected({ ticker, name })

  return (
    <>
      <PageHeader label="Watchlist" title="Tracked Companies" />

      <WatchlistPanel onSelect={openCompany} />

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

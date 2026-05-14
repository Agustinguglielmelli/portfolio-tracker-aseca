"use client"

import { useState } from "react"
import { PageHeader } from "@/components/common"
import { EdgarSearch } from "@/components/edgar"
import { CompanyDetailDialog } from "@/components/company"

export default function EdgarPage() {
  const [selected, setSelected] = useState<{ ticker: string; name: string } | null>(null)

  const openCompany = (ticker: string, name: string) => setSelected({ ticker, name })

  return (
    <>
      <PageHeader label="SEC EDGAR" title="Financial Data Explorer" />

      <EdgarSearch onSelect={openCompany} />

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

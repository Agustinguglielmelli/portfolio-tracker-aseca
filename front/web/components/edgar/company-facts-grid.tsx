"use client"

import type { CompanyFact } from "@/types"

interface CompanyFactsGridProps {
  facts: CompanyFact[]
}

export function CompanyFactsGrid({ facts }: CompanyFactsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="rounded-xl bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border border-white/5 p-3"
        >
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">{fact.label}</div>
          <div
            className="text-cyan-300 mt-1"
            style={{ textShadow: "0 0 6px rgba(34,211,238,0.2)" }}
          >
            {fact.value}
          </div>
        </div>
      ))}
    </div>
  )
}

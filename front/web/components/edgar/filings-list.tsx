"use client"

import { FileText } from "lucide-react"
import type { Filing } from "@/types"

interface FilingsListProps {
  filings: Filing[]
}

export function FilingsList({ filings }: FilingsListProps) {
  return (
    <div className="space-y-2">
      {filings.map((filing, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-400/15 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/15 flex items-center justify-center text-cyan-300">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-white text-sm">{filing.type}</div>
              <div className="text-xs text-slate-500">{filing.desc}</div>
            </div>
          </div>
          <div className="text-xs text-slate-400">{filing.date}</div>
        </div>
      ))}
    </div>
  )
}

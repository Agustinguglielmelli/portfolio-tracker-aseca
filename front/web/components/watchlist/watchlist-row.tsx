"use client"

import { X, BarChart3 } from "lucide-react"
import type { WatchItem } from "@/types"

interface WatchlistRowProps {
  item: WatchItem
  onSelect?: (ticker: string, name: string) => void
  onDelete?: (ticker: string) => void
}

export function WatchlistRow({ item, onSelect, onDelete }: WatchlistRowProps) {
  return (
    <tr className="border-t border-white/5 hover:bg-white/[0.03] group">
      <td className="px-2 py-3">
        <button
          onClick={() => onSelect?.(item.ticker, item.name)}
          className="flex items-center gap-3 text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-cyan-400/15 flex items-center justify-center text-cyan-300 text-xs">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-white group-hover:text-cyan-300">{item.ticker}</div>
            <div className="text-xs text-slate-500">{item.name}</div>
          </div>
        </button>
      </td>
      <td className="text-right px-2 py-3 text-slate-200">${item.price.toFixed(2)}</td>
      <td className={`text-right px-2 py-3 ${item.change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
        {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%
      </td>
      <td className="text-right px-2 py-3 text-slate-300">{item.revenue}</td>
      <td className="text-right px-2 py-3 text-slate-300">{item.netIncome}</td>
      <td className="text-right px-2 py-3 text-slate-300">{item.eps}</td>
      <td className="text-right px-2 py-3">
        <button
          onClick={() => onDelete?.(item.ticker)}
          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10"
        >
          <X className="w-4 h-4" />
        </button>
      </td>
    </tr>
  )
}

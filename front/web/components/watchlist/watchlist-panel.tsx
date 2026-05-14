"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { GlowCard } from "@/components/common"
import { WatchlistRow } from "./watchlist-row"
import { mockWatchlist } from "@/data/mock"
import type { WatchItem } from "@/types"

interface WatchlistPanelProps {
  onSelect?: (ticker: string, name: string) => void
}

export function WatchlistPanel({ onSelect }: WatchlistPanelProps) {
  const [items, setItems] = useState<WatchItem[]>(mockWatchlist)
  const [ticker, setTicker] = useState("")

  const handleAdd = () => {
    if (!ticker) return
    setItems([
      ...items,
      {
        ticker: ticker.toUpperCase(),
        name: ticker.toUpperCase(),
        price: Math.random() * 500,
        change: (Math.random() - 0.5) * 5,
        revenue: "-",
        netIncome: "-",
        eps: "-",
      },
    ])
    setTicker("")
  }

  const handleDelete = (tickerToDelete: string) => {
    setItems(items.filter((item) => item.ticker !== tickerToDelete))
  }

  return (
    <GlowCard glow className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">Watchlist</div>
          <div className="text-white text-xl font-medium mt-1">Tracked Companies</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="Ticker"
            className="w-28 h-10 px-3 rounded-full bg-white/5 border border-white/10 text-sm text-slate-200 outline-none focus:border-cyan-400/50"
          />
          <button
            onClick={handleAdd}
            className="h-10 px-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm flex items-center gap-2 shadow-[0_0_10px_rgba(56,189,248,0.25)]"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 uppercase tracking-wider">
              <th className="text-left px-2 py-2">Company</th>
              <th className="text-right px-2 py-2">Price</th>
              <th className="text-right px-2 py-2">Change %</th>
              <th className="text-right px-2 py-2">Revenue</th>
              <th className="text-right px-2 py-2">Net Income</th>
              <th className="text-right px-2 py-2">EPS</th>
              <th className="text-right px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <WatchlistRow
                key={item.ticker}
                item={item}
                onSelect={onSelect}
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </GlowCard>
  )
}

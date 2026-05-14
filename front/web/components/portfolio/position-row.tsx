"use client"

import { Trash2 } from "lucide-react"
import { TickerAvatar, PriceChangeBadge } from "@/components/common"
import type { Position } from "@/types"

interface PositionRowProps {
  position: Position
  onSelect?: (ticker: string, name: string) => void
  onDelete?: (id: string) => void
}

export function PositionRow({ position, onSelect, onDelete }: PositionRowProps) {
  const value = position.qty * position.lastPrice
  const pnl = (position.lastPrice - position.buyPrice) * position.qty
  const pnlPct = ((position.lastPrice - position.buyPrice) / position.buyPrice) * 100

  return (
    <tr className="border-t border-white/5 hover:bg-white/[0.03] transition-colors group">
      <td className="px-2 py-3">
        <button
          onClick={() => onSelect?.(position.ticker, position.name)}
          className="flex items-center gap-3 hover:text-cyan-300 transition-colors text-left"
        >
          <TickerAvatar ticker={position.ticker} />
          <div>
            <div className="text-white group-hover:text-cyan-300">{position.ticker}</div>
            <div className="text-xs text-slate-500">{position.name}</div>
          </div>
        </button>
      </td>
      <td className="text-right px-2 py-3 text-slate-300">{position.qty}</td>
      <td className="text-right px-2 py-3 text-slate-400">${position.buyPrice.toFixed(2)}</td>
      <td className="text-right px-2 py-3 text-slate-200">${position.lastPrice.toFixed(2)}</td>
      <td className="text-right px-2 py-3 text-white">
        ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="text-right px-2 py-3">
        <PriceChangeBadge value={pnlPct} />
      </td>
      <td className="text-right px-2 py-3">
        <button
          onClick={() => onDelete?.(position.id)}
          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  )
}

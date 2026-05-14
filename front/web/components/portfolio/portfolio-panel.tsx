"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { GlowCard } from "@/components/common"
import { PositionRow } from "./position-row"
import { AddPositionDialog } from "./add-position-dialog"
import { mockPositions } from "@/data/mock"
import type { Position } from "@/types"

interface PortfolioPanelProps {
  onSelect?: (ticker: string, name: string) => void
}

export function PortfolioPanel({ onSelect }: PortfolioPanelProps) {
  const [positions, setPositions] = useState<Position[]>(mockPositions)
  const [dialogOpen, setDialogOpen] = useState(false)

  const total = positions.reduce((sum, p) => sum + p.qty * p.lastPrice, 0)

  const handleAddPosition = (data: { ticker: string; qty: number; buyPrice: number; buyDate: string }) => {
    const newPosition: Position = {
      id: Date.now().toString(),
      ticker: data.ticker,
      name: data.ticker,
      qty: data.qty,
      buyPrice: data.buyPrice,
      buyDate: data.buyDate,
      lastPrice: data.buyPrice,
    }
    setPositions([...positions, newPosition])
  }

  const handleDelete = (id: string) => {
    setPositions(positions.filter((p) => p.id !== id))
  }

  return (
    <GlowCard glow className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">My Portfolio</div>
          <div className="text-white text-xl font-medium mt-1">
            ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="px-4 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm flex items-center gap-2 shadow-[0_0_10px_rgba(56,189,248,0.25)] hover:shadow-[0_0_16px_rgba(56,189,248,0.4)] transition-all"
        >
          <Plus className="w-4 h-4" /> Add Position
        </button>
      </div>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 uppercase tracking-wider">
              <th className="text-left px-2 py-2">Ticker</th>
              <th className="text-right px-2 py-2">Qty</th>
              <th className="text-right px-2 py-2">Buy Price</th>
              <th className="text-right px-2 py-2">Last Price</th>
              <th className="text-right px-2 py-2">Value</th>
              <th className="text-right px-2 py-2">{"P&L"}</th>
              <th className="text-right px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <PositionRow
                key={position.id}
                position={position}
                onSelect={onSelect}
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      <AddPositionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAddPosition}
      />
    </GlowCard>
  )
}

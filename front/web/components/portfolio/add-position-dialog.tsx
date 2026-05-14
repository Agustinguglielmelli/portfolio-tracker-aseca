"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AddPositionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (position: {
    ticker: string
    qty: number
    buyPrice: number
    buyDate: string
  }) => void
}

export function AddPositionDialog({ open, onOpenChange, onAdd }: AddPositionDialogProps) {
  const [form, setForm] = useState({
    ticker: "",
    qty: "",
    buyPrice: "",
    buyDate: "",
  })

  if (!open) return null

  const handleSubmit = () => {
    if (!form.ticker || !form.qty) return
    onAdd({
      ticker: form.ticker.toUpperCase(),
      qty: parseFloat(form.qty),
      buyPrice: parseFloat(form.buyPrice) || 0,
      buyDate: form.buyDate || new Date().toISOString().slice(0, 10),
    })
    setForm({ ticker: "", qty: "", buyPrice: "", buyDate: "" })
    onOpenChange(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-gradient-to-br from-[#0f1a35] to-[#0a1224] border border-white/10 shadow-[0_0_24px_rgba(56,189,248,0.1)] p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="text-white font-medium">Add Position</div>
          <button onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Ticker (e.g. AAPL)</label>
            <Input
              value={form.ticker}
              onChange={(e) => setForm({ ...form, ticker: e.target.value })}
              className="mt-1 bg-white/5 border-white/10 text-slate-200 focus:border-cyan-400/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Quantity</label>
            <Input
              type="number"
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
              className="mt-1 bg-white/5 border-white/10 text-slate-200 focus:border-cyan-400/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Buy Price (USD)</label>
            <Input
              type="number"
              value={form.buyPrice}
              onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
              className="mt-1 bg-white/5 border-white/10 text-slate-200 focus:border-cyan-400/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Operation Date</label>
            <Input
              type="date"
              value={form.buyDate}
              onChange={(e) => setForm({ ...form, buyDate: e.target.value })}
              className="mt-1 bg-white/5 border-white/10 text-slate-200 focus:border-cyan-400/50"
            />
          </div>
          <Button
            onClick={handleSubmit}
            className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(56,189,248,0.25)] mt-4 hover:shadow-[0_0_18px_rgba(56,189,248,0.4)]"
          >
            Add to Portfolio
          </Button>
        </div>
      </div>
    </div>
  )
}

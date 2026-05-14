"use client"

import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { GlowCard } from "@/components/common"
import { mockTransactions } from "@/data/mock"

export function TransactionsLog() {
  return (
    <GlowCard glow className="p-6">
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Transaction History</div>
      <div className="space-y-2">
        {mockTransactions.map((tx, i) => {
          const isBuy = tx.type === "BUY"
          return (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    isBuy ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"
                  }`}
                >
                  {isBuy ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-white text-sm">
                    {tx.type} {tx.qty} x {tx.ticker}
                  </div>
                  <div className="text-xs text-slate-500">{tx.date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-slate-200 text-sm">${(tx.qty * tx.price).toLocaleString()}</div>
                <div className="text-xs text-slate-500">@ ${tx.price.toFixed(2)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </GlowCard>
  )
}

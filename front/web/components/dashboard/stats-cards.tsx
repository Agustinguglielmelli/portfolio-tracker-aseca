"use client"

import { Wallet, TrendingUp, Activity, Eye } from "lucide-react"
import { GlowCard } from "@/components/common"
import { mockStats } from "@/data/mock"

const icons = [Wallet, TrendingUp, Activity, Eye]

export function StatsCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {mockStats.map((stat, index) => {
        const Icon = icons[index]
        return (
          <GlowCard key={stat.label} glow className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</div>
                <div
                  className="text-white text-xl font-medium mt-2"
                  style={{ textShadow: "0 0 8px rgba(34,211,238,0.15)" }}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-emerald-300 mt-1">{stat.change}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/20 flex items-center justify-center text-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.12)]">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </GlowCard>
        )
      })}
    </div>
  )
}

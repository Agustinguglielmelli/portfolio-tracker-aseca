"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface PriceChangeBadgeProps {
  value: number
  className?: string
}

export function PriceChangeBadge({ value, className }: PriceChangeBadgeProps) {
  const positive = value >= 0

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs",
        positive ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300",
        className
      )}
    >
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {value >= 0 ? "+" : ""}{value.toFixed(2)}%
    </div>
  )
}

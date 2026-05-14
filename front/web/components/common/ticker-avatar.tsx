"use client"

import { cn } from "@/lib/utils"

interface TickerAvatarProps {
  ticker: string
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-sm",
}

export function TickerAvatar({ ticker, className, size = "sm" }: TickerAvatarProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/15 flex items-center justify-center text-cyan-300",
        sizeClasses[size],
        className
      )}
    >
      {ticker.slice(0, 2)}
    </div>
  )
}

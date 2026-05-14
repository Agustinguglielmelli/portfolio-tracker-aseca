"use client"

import { cn } from "@/lib/utils"

interface GlowCardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
}

export function GlowCard({ children, className, glow = false }: GlowCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-gradient-to-br from-[#0f1a35] to-[#0a1224] border border-white/10 backdrop-blur-xl",
        glow && "shadow-[0_0_24px_rgba(56,189,248,0.08)]",
        className
      )}
    >
      {children}
    </div>
  )
}

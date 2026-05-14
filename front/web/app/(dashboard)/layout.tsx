"use client"

import { useState } from "react"
import { Sidebar, Topbar } from "@/components/dashboard"
import { CompanyDetailDialog } from "@/components/company"
import { formatTimestamp } from "@/lib/format"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState("2026-05-13 09:42:18 UTC")
  const [selected, setSelected] = useState<{ ticker: string; name: string } | null>(null)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setLastUpdate(formatTimestamp())
      setRefreshing(false)
    }, 1100)
  }

  return (
    <div className="size-full min-h-screen bg-[#050a1a] text-slate-200 relative overflow-hidden">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-indigo-600/5 blur-[120px]" />
      </div>

      <div className="relative flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar lastUpdate={lastUpdate} onRefresh={handleRefresh} refreshing={refreshing} />
          <main className="flex-1 overflow-y-auto p-6 space-y-5">
            {children}
          </main>
        </div>
      </div>

      {selected && (
        <CompanyDetailDialog
          ticker={selected.ticker}
          name={selected.name}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

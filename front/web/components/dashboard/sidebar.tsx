"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Briefcase, Eye, Search, Settings, LogOut, BarChart3 } from "lucide-react"

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/dashboard/portfolio", icon: Briefcase, label: "Portfolio" },
  { href: "/dashboard/watchlist", icon: Eye, label: "Watchlist" },
  { href: "/dashboard/edgar", icon: Search, label: "EDGAR" },
]

interface SidebarProps {
  onLogout?: () => void
}

export function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-16 shrink-0 border-r border-white/5 bg-[#0a1224]/80 flex flex-col items-center py-4 gap-2 backdrop-blur-xl">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_12px_rgba(56,189,248,0.3)] mb-4 flex items-center justify-center">
        <BarChart3 className="w-5 h-5 text-white" />
      </div>

      {navItems.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href))
        const isDashboard = item.href === "/dashboard"
        const isActive = isDashboard ? pathname === "/dashboard" : active

        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all relative group ${
              isActive
                ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.18)]"
                : "text-slate-500 hover:text-cyan-300 hover:bg-white/5"
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r bg-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
            )}
            <Icon className="w-5 h-5" />
          </Link>
        )
      })}

      <div className="flex-1" />

      <button className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-500 hover:text-cyan-300 hover:bg-white/5">
        <Settings className="w-5 h-5" />
      </button>

      <Link
        href="/login"
        onClick={onLogout}
        title="Logout"
        className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
      >
        <LogOut className="w-5 h-5" />
      </Link>
    </aside>
  )
}

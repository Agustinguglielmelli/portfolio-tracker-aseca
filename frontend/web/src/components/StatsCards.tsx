import { Card } from "./Card.tsx";
import { TrendingUp, Wallet, Activity, Eye } from "lucide-react";

const stats = [
  { label: "Total Value", value: "$994,141.48", change: "+23.38%", icon: Wallet, positive: true },
  { label: "Day Change", value: "+$12,408.20", change: "+1.26%", icon: TrendingUp, positive: true },
  { label: "Open Positions", value: "14", change: "5 sectors", icon: Activity, positive: true },
  { label: "Watchlist", value: "33", change: "2 alerts", icon: Eye, positive: true },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.label} glow className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</div>
                <div className="text-white mt-2" style={{ textShadow: "0 0 8px rgba(34,211,238,0.15)" }}>
                  {s.value}
                </div>
                <div className="text-xs text-emerald-300 mt-1">{s.change}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/20 flex items-center justify-center text-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.12)]">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

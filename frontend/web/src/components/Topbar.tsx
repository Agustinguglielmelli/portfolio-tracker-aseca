import { Search, RefreshCcw, Bell } from "lucide-react";

interface TopbarProps {
  lastUpdate: string;
  onRefresh: () => void;
  refreshing: boolean;
}

export function Topbar({ lastUpdate, onRefresh, refreshing }: TopbarProps) {
  return (
    <header className="h-16 shrink-0 border-b border-white/5 bg-[#0a1224]/60 backdrop-blur-xl flex items-center px-6 gap-6">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_8px_rgba(56,189,248,0.3)]" />
        <span className="text-white tracking-wide">Holistic</span>
      </div>

      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          placeholder="Search ticker, company..."
          className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 h-10 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-400/50 focus:shadow-[0_0_10px_rgba(56,189,248,0.12)] transition-all"
        />
      </div>

      <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1 text-xs text-slate-400">
        {["1T", "1W", "1M", "3M", "1J", "YTD", "Max"].map((t, i) => (
          <button
            key={t}
            className={`px-3 py-1.5 rounded-full transition-all ${
              i === 4
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_8px_rgba(56,189,248,0.25)]"
                : "hover:text-cyan-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <div className="text-right text-xs leading-tight">
          <div className="text-slate-500">Last price update</div>
          <div className="text-cyan-300">{lastUpdate}</div>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-cyan-300 hover:border-cyan-400/50 hover:shadow-[0_0_10px_rgba(56,189,248,0.2)] transition-all"
        >
          <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
        <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-300 transition-all relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(56,189,248,0.6)]" />
        </button>
      </div>
    </header>
  );
}

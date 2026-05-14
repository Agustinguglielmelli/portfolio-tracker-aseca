import { X, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts";

interface CompanyDetailProps {
  ticker: string;
  name: string;
  onClose: () => void;
}

const priceHistory = Array.from({ length: 40 }, (_, i) => ({
  d: `D${i + 1}`,
  p: 100 + Math.sin(i / 4) * 12 + i * 1.2 + Math.random() * 4,
}));

const quarters = [
  { q: "Q1'25", revenue: 119.6, netIncome: 36.3, eps: 2.4 },
  { q: "Q2'25", revenue: 90.8, netIncome: 21.4, eps: 1.5 },
  { q: "Q3'25", revenue: 94.9, netIncome: 22.9, eps: 1.6 },
  { q: "Q4'25", revenue: 89.5, netIncome: 19.9, eps: 1.4 },
  { q: "Q1'26", revenue: 124.3, netIncome: 40.0, eps: 2.6 },
  { q: "Q2'26", revenue: 95.4, netIncome: 23.6, eps: 1.5 },
];

const filings = [
  { type: "10-K", date: "2026-02-14", desc: "Annual report" },
  { type: "10-Q", date: "2025-11-08", desc: "Quarterly report Q3" },
  { type: "10-Q", date: "2025-08-05", desc: "Quarterly report Q2" },
  { type: "10-Q", date: "2025-05-02", desc: "Quarterly report Q1" },
  { type: "8-K", date: "2025-04-18", desc: "Material event disclosure" },
];

export function CompanyDetail({ ticker, name, onClose }: CompanyDetailProps) {
  const last = priceHistory[priceHistory.length - 1].p;
  const first = priceHistory[0].p;
  const change = ((last - first) / first) * 100;
  const positive = change >= 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl my-8 rounded-2xl bg-gradient-to-br from-[#0f1a35] to-[#0a1224] border border-white/10 shadow-[0_0_40px_rgba(56,189,248,0.12)]"
      >
        <div className="flex items-start justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/15 flex items-center justify-center text-cyan-300">
              {ticker.slice(0, 2)}
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">{ticker} · NASDAQ</div>
              <div className="text-white mt-0.5">{name}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Last price</div>
              <div className="text-white mt-1" style={{ fontSize: "2rem" }}>
                ${last.toFixed(2)}
              </div>
              <div
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs mt-2 ${
                  positive ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"
                }`}
              >
                {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {change.toFixed(2)}% (40d)
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">Source: Yahoo Finance · Last stored price</div>
          </div>

          <div className="h-56 rounded-xl bg-white/[0.02] border border-white/5 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceHistory}>
                <defs>
                  <linearGradient id="cd-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="d" stroke="#475569" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} orientation="right" />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10,18,36,0.95)",
                    border: "1px solid rgba(56,189,248,0.2)",
                    borderRadius: 10,
                  }}
                />
                <Area type="monotone" dataKey="p" stroke="#22d3ee" strokeWidth={2} fill="url(#cd-grad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Company Facts (XBRL · SEC EDGAR)</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { l: "Revenue", v: "$394.3B" },
                { l: "Net Income", v: "$94.0B" },
                { l: "EPS", v: "$6.16" },
                { l: "Total Assets", v: "$352.5B" },
                { l: "Liabilities", v: "$290.4B" },
              ].map((m) => (
                <div key={m.l} className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">{m.l}</div>
                  <div className="text-cyan-300 mt-1">{m.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Quarterly Evolution</div>
            <div className="h-44 rounded-xl bg-white/[0.02] border border-white/5 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quarters}>
                  <XAxis dataKey="q" stroke="#475569" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,18,36,0.95)",
                      border: "1px solid rgba(56,189,248,0.2)",
                      borderRadius: 10,
                    }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={2} dot={{ fill: "#22d3ee", r: 3 }} />
                  <Line type="monotone" dataKey="netIncome" stroke="#a78bfa" strokeWidth={2} dot={{ fill: "#a78bfa", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Recent Filings</div>
            <div className="space-y-2">
              {filings.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-400/15 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/15 flex items-center justify-center text-cyan-300">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-white text-sm">{f.type}</div>
                      <div className="text-xs text-slate-500">{f.desc}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">{f.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

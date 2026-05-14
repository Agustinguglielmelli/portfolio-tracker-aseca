import { useState } from "react";
import { Card } from "./Card.tsx";
import { Search, FileText, TrendingUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const mockResults = [
  { ticker: "AAPL", cik: "0000320193", name: "Apple Inc." },
  { ticker: "MSFT", cik: "0000789019", name: "Microsoft Corp." },
  { ticker: "NVDA", cik: "0001045810", name: "NVIDIA Corp." },
];

const mockFilings = [
  { type: "10-K", date: "2026-02-14", desc: "Annual report" },
  { type: "10-Q", date: "2025-11-08", desc: "Quarterly report Q3" },
  { type: "10-Q", date: "2025-08-05", desc: "Quarterly report Q2" },
  { type: "10-Q", date: "2025-05-02", desc: "Quarterly report Q1" },
];

const quarters = [
  { q: "Q1'25", revenue: 119.6, netIncome: 36.3, eps: 2.4 },
  { q: "Q2'25", revenue: 90.8, netIncome: 21.4, eps: 1.5 },
  { q: "Q3'25", revenue: 94.9, netIncome: 22.9, eps: 1.6 },
  { q: "Q4'25", revenue: 89.5, netIncome: 19.9, eps: 1.4 },
  { q: "Q1'26", revenue: 124.3, netIncome: 40.0, eps: 2.6 },
  { q: "Q2'26", revenue: 95.4, netIncome: 23.6, eps: 1.5 },
];

export function EdgarSearch({ onSelect }: { onSelect?: (ticker: string, name: string) => void }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(mockResults[0]);

  return (
    <div className="grid grid-cols-12 gap-5">
      <Card glow className="col-span-12 lg:col-span-4 p-6">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">SEC EDGAR · Full-Text Search</div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by ticker or name"
            className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 h-10 text-sm text-slate-200 outline-none focus:border-cyan-400/50 focus:shadow-[0_0_10px_rgba(56,189,248,0.12)]"
          />
        </div>
        <div className="space-y-2">
          {mockResults
            .filter((r) => !q || r.ticker.includes(q.toUpperCase()) || r.name.toLowerCase().includes(q.toLowerCase()))
            .map((r) => (
              <button
                key={r.cik}
                onClick={() => {
                  setSelected(r);
                  onSelect?.(r.ticker, r.name);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  selected.cik === r.cik
                    ? "bg-cyan-500/10 border-cyan-400/40 shadow-[0_0_10px_rgba(56,189,248,0.12)]"
                    : "bg-white/[0.02] border-white/5 hover:border-cyan-400/20"
                }`}
              >
                <div className="text-left">
                  <div className="text-white text-sm">{r.ticker}</div>
                  <div className="text-xs text-slate-500">{r.name}</div>
                </div>
                <div className="text-xs text-slate-500">CIK {r.cik}</div>
              </button>
            ))}
        </div>
      </Card>

      <Card glow className="col-span-12 lg:col-span-8 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Company Facts (XBRL)</div>
            <div className="text-white mt-1">{selected.name}</div>
          </div>
          <div className="text-xs text-slate-500">CIK {selected.cik}</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { l: "Revenue", v: "$394.3B" },
            { l: "Net Income", v: "$94.0B" },
            { l: "EPS", v: "$6.16" },
            { l: "Total Assets", v: "$352.5B" },
            { l: "Liabilities", v: "$290.4B" },
          ].map((m) => (
            <div
              key={m.l}
              className="rounded-xl bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border border-white/5 p-3"
            >
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">{m.l}</div>
              <div className="text-cyan-300 mt-1" style={{ textShadow: "0 0 6px rgba(34,211,238,0.2)" }}>
                {m.v}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-2 text-xs text-slate-500 uppercase tracking-wider">
          <TrendingUp className="w-4 h-4 text-cyan-400" /> Last 6 Quarters · Revenue & Net Income (B USD)
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={quarters}>
              <XAxis dataKey="q" stroke="#475569" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(10,18,36,0.95)",
                  border: "1px solid rgba(56,189,248,0.3)",
                  borderRadius: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={{ fill: "#22d3ee", r: 3 }}
                style={{ filter: "drop-shadow(0 0 3px rgba(34,211,238,0.4))" }}
              />
              <Line
                type="monotone"
                dataKey="netIncome"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={{ fill: "#a78bfa", r: 3 }}
                style={{ filter: "drop-shadow(0 0 3px rgba(167,139,250,0.35))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Recent Filings</div>
          <div className="space-y-2">
            {mockFilings.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-400/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300">
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
      </Card>
    </div>
  );
}

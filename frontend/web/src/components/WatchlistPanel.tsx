import { useState } from "react";
import { Card } from "./Card.tsx";
import { Plus, X, BarChart3 } from "lucide-react";

interface Watch {
  ticker: string;
  name: string;
  price: number;
  change: number;
  revenue: string;
  netIncome: string;
  eps: string;
}

const initial: Watch[] = [
  { ticker: "GOOGL", name: "Alphabet Inc", price: 174.32, change: 1.24, revenue: "307.4B", netIncome: "73.8B", eps: "5.80" },
  { ticker: "META", name: "Meta Platforms", price: 502.11, change: -0.47, revenue: "134.9B", netIncome: "39.1B", eps: "14.87" },
  { ticker: "AMZN", name: "Amazon.com", price: 188.7, change: 2.05, revenue: "574.8B", netIncome: "30.4B", eps: "2.90" },
];

export function WatchlistPanel({ onSelect }: { onSelect?: (ticker: string, name: string) => void }) {
  const [items, setItems] = useState<Watch[]>(initial);
  const [ticker, setTicker] = useState("");

  const add = () => {
    if (!ticker) return;
    setItems([
      ...items,
      {
        ticker: ticker.toUpperCase(),
        name: ticker.toUpperCase(),
        price: Math.random() * 500,
        change: (Math.random() - 0.5) * 5,
        revenue: "—",
        netIncome: "—",
        eps: "—",
      },
    ]);
    setTicker("");
  };

  return (
    <Card glow className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">Watchlist</div>
          <div className="text-white mt-1">Tracked Companies</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="Ticker"
            className="w-28 h-10 px-3 rounded-full bg-white/5 border border-white/10 text-sm text-slate-200 outline-none focus:border-cyan-400/50"
          />
          <button
            onClick={add}
            className="h-10 px-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm flex items-center gap-2 shadow-[0_0_10px_rgba(56,189,248,0.25)]"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 uppercase tracking-wider">
              <th className="text-left px-2 py-2">Company</th>
              <th className="text-right px-2 py-2">Price</th>
              <th className="text-right px-2 py-2">Δ%</th>
              <th className="text-right px-2 py-2">Revenue</th>
              <th className="text-right px-2 py-2">Net Income</th>
              <th className="text-right px-2 py-2">EPS</th>
              <th className="text-right px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((w) => (
              <tr key={w.ticker} className="border-t border-white/5 hover:bg-white/[0.03] group">
                <td className="px-2 py-3">
                  <button
                    onClick={() => onSelect?.(w.ticker, w.name)}
                    className="flex items-center gap-3 text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-cyan-400/15 flex items-center justify-center text-cyan-300 text-xs">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-white group-hover:text-cyan-300">{w.ticker}</div>
                      <div className="text-xs text-slate-500">{w.name}</div>
                    </div>
                  </button>
                </td>
                <td className="text-right px-2 py-3 text-slate-200">${w.price.toFixed(2)}</td>
                <td className={`text-right px-2 py-3 ${w.change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  {w.change >= 0 ? "+" : ""}
                  {w.change.toFixed(2)}%
                </td>
                <td className="text-right px-2 py-3 text-slate-300">{w.revenue}</td>
                <td className="text-right px-2 py-3 text-slate-300">{w.netIncome}</td>
                <td className="text-right px-2 py-3 text-slate-300">{w.eps}</td>
                <td className="text-right px-2 py-3">
                  <button
                    onClick={() => setItems(items.filter((x) => x.ticker !== w.ticker))}
                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

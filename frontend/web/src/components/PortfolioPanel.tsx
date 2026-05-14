import { useState } from "react";
import { Card } from "./Card.tsx";
import { Plus, Trash2, TrendingUp, TrendingDown, X } from "lucide-react";

export interface Position {
  id: string;
  ticker: string;
  name: string;
  qty: number;
  buyPrice: number;
  buyDate: string;
  lastPrice: number;
}

const initial: Position[] = [
  { id: "1", ticker: "NVDA", name: "NVIDIA Corp", qty: 50, buyPrice: 480.2, buyDate: "2025-08-12", lastPrice: 1210.66 },
  { id: "2", ticker: "BTC", name: "Bitcoin", qty: 0.6, buyPrice: 41200, buyDate: "2025-04-03", lastPrice: 103974 },
  { id: "3", ticker: "TSLA", name: "Tesla Inc", qty: 30, buyPrice: 250.1, buyDate: "2025-11-22", lastPrice: 130.88 },
  { id: "4", ticker: "AAPL", name: "Apple Inc", qty: 80, buyPrice: 162.0, buyDate: "2025-02-09", lastPrice: 221.43 },
  { id: "5", ticker: "MSFT", name: "Microsoft", qty: 40, buyPrice: 312.4, buyDate: "2025-06-30", lastPrice: 415.7 },
];

export function PortfolioPanel({ onSelect }: { onSelect?: (ticker: string, name: string) => void }) {
  const [positions, setPositions] = useState<Position[]>(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ticker: "", qty: "", buyPrice: "", buyDate: "" });

  const total = positions.reduce((s, p) => s + p.qty * p.lastPrice, 0);

  const addPosition = () => {
    if (!form.ticker || !form.qty) return;
    setPositions([
      ...positions,
      {
        id: Date.now().toString(),
        ticker: form.ticker.toUpperCase(),
        name: form.ticker.toUpperCase(),
        qty: parseFloat(form.qty),
        buyPrice: parseFloat(form.buyPrice) || 0,
        buyDate: form.buyDate || new Date().toISOString().slice(0, 10),
        lastPrice: parseFloat(form.buyPrice) || 0,
      },
    ]);
    setForm({ ticker: "", qty: "", buyPrice: "", buyDate: "" });
    setOpen(false);
  };

  return (
    <Card glow className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">My Portfolio</div>
          <div className="text-white mt-1">
            ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="px-4 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm flex items-center gap-2 shadow-[0_0_10px_rgba(56,189,248,0.25)] hover:shadow-[0_0_16px_rgba(56,189,248,0.4)] transition-all"
        >
          <Plus className="w-4 h-4" /> Add Position
        </button>
      </div>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 uppercase tracking-wider">
              <th className="text-left px-2 py-2">Ticker</th>
              <th className="text-right px-2 py-2">Qty</th>
              <th className="text-right px-2 py-2">Buy Price</th>
              <th className="text-right px-2 py-2">Last Price</th>
              <th className="text-right px-2 py-2">Value</th>
              <th className="text-right px-2 py-2">P&L</th>
              <th className="text-right px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => {
              const value = p.qty * p.lastPrice;
              const pnl = (p.lastPrice - p.buyPrice) * p.qty;
              const pnlPct = ((p.lastPrice - p.buyPrice) / p.buyPrice) * 100;
              const positive = pnl >= 0;
              return (
                <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors group">
                  <td className="px-2 py-3">
                    <button
                      onClick={() => onSelect?.(p.ticker, p.name)}
                      className="flex items-center gap-3 hover:text-cyan-300 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/15 flex items-center justify-center text-cyan-300 text-xs">
                        {p.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-white group-hover:text-cyan-300">{p.ticker}</div>
                        <div className="text-xs text-slate-500">{p.name}</div>
                      </div>
                    </button>
                  </td>
                  <td className="text-right px-2 py-3 text-slate-300">{p.qty}</td>
                  <td className="text-right px-2 py-3 text-slate-400">${p.buyPrice.toFixed(2)}</td>
                  <td className="text-right px-2 py-3 text-slate-200">${p.lastPrice.toFixed(2)}</td>
                  <td className="text-right px-2 py-3 text-white">${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className="text-right px-2 py-3">
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        positive
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-rose-500/10 text-rose-300"
                      }`}
                    >
                      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {pnlPct.toFixed(2)}%
                    </div>
                  </td>
                  <td className="text-right px-2 py-3">
                    <button
                      onClick={() => setPositions(positions.filter((x) => x.id !== p.id))}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-gradient-to-br from-[#0f1a35] to-[#0a1224] border border-white/10 shadow-[0_0_24px_rgba(56,189,248,0.1)] p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="text-white">Add Position</div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { k: "ticker", label: "Ticker (e.g. AAPL)", type: "text" },
                { k: "qty", label: "Quantity", type: "number" },
                { k: "buyPrice", label: "Buy Price (USD)", type: "number" },
                { k: "buyDate", label: "Operation Date", type: "date" },
              ].map((f) => (
                <div key={f.k}>
                  <label className="text-xs text-slate-500 uppercase tracking-wider">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.k]}
                    onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                    className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 h-10 text-sm text-slate-200 outline-none focus:border-cyan-400/50 focus:shadow-[0_0_16px_rgba(56,189,248,0.25)]"
                  />
                </div>
              ))}
              <button
                onClick={addPosition}
                className="w-full h-11 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(56,189,248,0.25)] mt-4"
              >
                Add to Portfolio
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

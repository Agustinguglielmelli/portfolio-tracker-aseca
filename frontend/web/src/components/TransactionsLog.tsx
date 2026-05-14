import { Card } from "./Card.tsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const txs = [
  { type: "BUY", ticker: "NVDA", qty: 20, price: 1180.5, date: "2026-05-12 14:32" },
  { type: "SELL", ticker: "TSLA", qty: 10, price: 138.4, date: "2026-05-10 09:18" },
  { type: "BUY", ticker: "AAPL", qty: 30, price: 215.7, date: "2026-05-08 11:05" },
  { type: "BUY", ticker: "MSFT", qty: 15, price: 410.3, date: "2026-05-05 16:44" },
];

export function TransactionsLog() {
  return (
    <Card glow className="p-6">
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Transaction History</div>
      <div className="space-y-2">
        {txs.map((t, i) => {
          const buy = t.type === "BUY";
          return (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    buy
                      ? "bg-emerald-500/10 text-emerald-300 "
                      : "bg-rose-500/10 text-rose-300 "
                  }`}
                >
                  {buy ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-white text-sm">
                    {t.type} {t.qty} × {t.ticker}
                  </div>
                  <div className="text-xs text-slate-500">{t.date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-slate-200 text-sm">${(t.qty * t.price).toLocaleString()}</div>
                <div className="text-xs text-slate-500">@ ${t.price.toFixed(2)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

import type { Position, Transaction, QuarterData, WatchItem, Company, Filing, CompanyFact } from "@/types"

export const mockPositions: Position[] = [
  { id: "1", ticker: "NVDA", name: "NVIDIA Corp", qty: 50, buyPrice: 480.2, buyDate: "2025-08-12", lastPrice: 1210.66 },
  { id: "2", ticker: "BTC", name: "Bitcoin", qty: 0.6, buyPrice: 41200, buyDate: "2025-04-03", lastPrice: 103974 },
  { id: "3", ticker: "TSLA", name: "Tesla Inc", qty: 30, buyPrice: 250.1, buyDate: "2025-11-22", lastPrice: 130.88 },
  { id: "4", ticker: "AAPL", name: "Apple Inc", qty: 80, buyPrice: 162.0, buyDate: "2025-02-09", lastPrice: 221.43 },
  { id: "5", ticker: "MSFT", name: "Microsoft", qty: 40, buyPrice: 312.4, buyDate: "2025-06-30", lastPrice: 415.7 },
]

export const mockTransactions: Transaction[] = [
  { type: "BUY", ticker: "NVDA", qty: 20, price: 1180.5, date: "2026-05-12 14:32" },
  { type: "SELL", ticker: "TSLA", qty: 10, price: 138.4, date: "2026-05-10 09:18" },
  { type: "BUY", ticker: "AAPL", qty: 30, price: 215.7, date: "2026-05-08 11:05" },
  { type: "BUY", ticker: "MSFT", qty: 15, price: 410.3, date: "2026-05-05 16:44" },
]

export const mockQuarters: QuarterData[] = [
  { q: "Q1'25", revenue: 119.6, netIncome: 36.3, eps: 2.4 },
  { q: "Q2'25", revenue: 90.8, netIncome: 21.4, eps: 1.5 },
  { q: "Q3'25", revenue: 94.9, netIncome: 22.9, eps: 1.6 },
  { q: "Q4'25", revenue: 89.5, netIncome: 19.9, eps: 1.4 },
  { q: "Q1'26", revenue: 124.3, netIncome: 40.0, eps: 2.6 },
  { q: "Q2'26", revenue: 95.4, netIncome: 23.6, eps: 1.5 },
]

export const mockWatchlist: WatchItem[] = [
  { ticker: "GOOGL", name: "Alphabet Inc", price: 174.32, change: 1.24, revenue: "307.4B", netIncome: "73.8B", eps: "5.80" },
  { ticker: "META", name: "Meta Platforms", price: 502.11, change: -0.47, revenue: "134.9B", netIncome: "39.1B", eps: "14.87" },
  { ticker: "AMZN", name: "Amazon.com", price: 188.7, change: 2.05, revenue: "574.8B", netIncome: "30.4B", eps: "2.90" },
]

export const mockCompanies: Company[] = [
  { ticker: "AAPL", cik: "0000320193", name: "Apple Inc." },
  { ticker: "MSFT", cik: "0000789019", name: "Microsoft Corp." },
  { ticker: "NVDA", cik: "0001045810", name: "NVIDIA Corp." },
]

export const mockFilings: Filing[] = [
  { type: "10-K", date: "2026-02-14", desc: "Annual report" },
  { type: "10-Q", date: "2025-11-08", desc: "Quarterly report Q3" },
  { type: "10-Q", date: "2025-08-05", desc: "Quarterly report Q2" },
  { type: "10-Q", date: "2025-05-02", desc: "Quarterly report Q1" },
  { type: "8-K", date: "2025-04-18", desc: "Material event disclosure" },
]

export const mockCompanyFacts: CompanyFact[] = [
  { label: "Revenue", value: "$394.3B" },
  { label: "Net Income", value: "$94.0B" },
  { label: "EPS", value: "$6.16" },
  { label: "Total Assets", value: "$352.5B" },
  { label: "Liabilities", value: "$290.4B" },
]

export const mockStats = [
  { label: "Total Value", value: "$994,141.48", change: "+23.38%" },
  { label: "Day Change", value: "+$12,408.20", change: "+1.26%" },
  { label: "Open Positions", value: "14", change: "5 sectors" },
  { label: "Watchlist", value: "33", change: "2 alerts" },
]

export function generateChartData() {
  return Array.from({ length: 60 }, (_, i) => {
    const t = i / 60
    const portfolio = 800 + Math.sin(i / 5) * 30 + i * 4 + Math.random() * 25
    const dax = 800 + Math.cos(i / 7) * 25 + i * 2 + Math.random() * 20
    const sp = 800 + Math.sin(i / 6 + 1) * 20 + i * 3 + Math.random() * 18
    return {
      name: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"][Math.floor(t * 11)] || "Jun",
      portfolio: Math.round(portfolio),
      dax: Math.round(dax),
      sp: Math.round(sp),
    }
  })
}

export function generatePriceHistory() {
  return Array.from({ length: 40 }, (_, i) => ({
    d: `D${i + 1}`,
    p: 100 + Math.sin(i / 4) * 12 + i * 1.2 + Math.random() * 4,
  }))
}

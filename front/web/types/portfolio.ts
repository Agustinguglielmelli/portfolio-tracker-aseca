export interface Position {
  id: string
  ticker: string
  name: string
  qty: number
  buyPrice: number
  buyDate: string
  lastPrice: number
}

export interface Transaction {
  type: "BUY" | "SELL"
  ticker: string
  qty: number
  price: number
  date: string
}

export interface QuarterData {
  q: string
  revenue: number
  netIncome: number
  eps: number
}

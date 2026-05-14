export function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  })
}

export function formatCompactCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })
}

export function formatPercent(value: number, showSign = true): string {
  const sign = showSign && value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatTimestamp(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC"
}

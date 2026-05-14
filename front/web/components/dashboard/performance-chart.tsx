"use client"

import { useMemo } from "react"
import {
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts"
import { generateChartData } from "@/data/mock"

export function PerformanceChart() {
  const data = useMemo(() => generateChartData(), [])

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-portfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#475569"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#475569"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            orientation="right"
          />
          <Tooltip
            contentStyle={{
              background: "rgba(10,18,36,0.95)",
              border: "1px solid rgba(56,189,248,0.3)",
              borderRadius: 12,
              boxShadow: "0 0 24px rgba(56,189,248,0.25)",
            }}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Area
            type="monotone"
            dataKey="portfolio"
            stroke="#22d3ee"
            strokeWidth={2}
            fill="url(#grad-portfolio)"
            dot={false}
            style={{ filter: "drop-shadow(0 0 3px rgba(34,211,238,0.4))" }}
          />
          <Line type="monotone" dataKey="sp" stroke="#22c55e" strokeWidth={1.5} dot={false} />
          <Line
            type="monotone"
            dataKey="dax"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="3 3"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

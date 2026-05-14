"use client"

import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import type { QuarterData } from "@/types"

interface QuartersChartProps {
  data: QuarterData[]
}

export function QuartersChart({ data }: QuartersChartProps) {
  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
  )
}

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "Tech", value: 36.39, color: "#22d3ee" },
  { name: "Finance", value: 17.31, color: "#3b82f6" },
  { name: "Energy", value: 15.5, color: "#6366f1" },
  { name: "Consumer", value: 15.49, color: "#8b5cf6" },
  { name: "Healthcare", value: 15.3, color: "#0ea5e9" },
];

export function AllocationDonut({ total }: { total: string }) {
  return (
    <div className="relative w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={70}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} style={{ filter: `drop-shadow(0 0 4px ${d.color}55)` }} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-xs text-slate-500 uppercase tracking-wider">Tech</div>
        <div className="text-cyan-300 mt-1" style={{ textShadow: "0 0 8px rgba(34,211,238,0.3)" }}>
          36.39%
        </div>
        <div className="text-xs text-slate-500 mt-1">{total}</div>
      </div>
    </div>
  );
}

"use client"

interface PageHeaderProps {
  label: string
  title: string
}

export function PageHeader({ label, title }: PageHeaderProps) {
  return (
    <div>
      <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
      <h1
        className="text-white mt-1 text-2xl font-medium"
        style={{ textShadow: "0 0 10px rgba(34,211,238,0.2)" }}
      >
        {title}
      </h1>
    </div>
  )
}

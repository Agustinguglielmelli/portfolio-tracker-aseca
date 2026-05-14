import type {ReactNode} from "react";

export function Card({
  children,
  className = "",
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl bg-gradient-to-br from-[#0f1a35]/80 to-[#0a1224]/80 border border-white/5 backdrop-blur-xl ${
        glow ? "shadow-[0_0_18px_rgba(56,189,248,0.04)]" : ""
      } ${className}`}
    >
      {glow && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/[0.02] via-transparent to-blue-600/[0.02]" />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

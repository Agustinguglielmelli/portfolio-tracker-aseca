import { useState } from "react";
import { BarChart3, Mail, Lock, ArrowRight, TrendingUp, Eye, Shield } from "lucide-react";

interface AuthProps {
    onAuth: () => void;
    goRegister: () => void;
}

export function LoginPage({ onAuth, goRegister }: AuthProps & { goRegister: () => void }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    return (
        <div className="size-full min-h-screen bg-[#050a1a] text-slate-200 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-500/8 blur-[140px] animate-pulse" />
                <div className="absolute top-1/4 -right-40 w-[700px] h-[700px] rounded-full bg-blue-600/8 blur-[160px]" />
                <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-indigo-600/8 blur-[140px] animate-pulse" />
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(56,189,248,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.5) 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                    }}
                />
            </div>

            <header className="relative flex items-center justify-between px-8 py-5">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_12px_rgba(56,189,248,0.3)] flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white tracking-wide">MATF</span>
                </div>
                <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
                    <a className="hover:text-cyan-300 transition-colors">Features</a>
                    <a className="hover:text-cyan-300 transition-colors">Pricing</a>
                    <a className="hover:text-cyan-300 transition-colors">Docs</a>
                </nav>
                <button
                    onClick={goRegister}
                    className="px-4 h-10 rounded-full bg-white/5 border border-white/10 text-sm hover:border-cyan-400/40 hover:shadow-[0_0_10px_rgba(56,189,248,0.18)] transition-all"
                >
                    Sign up
                </button>
            </header>

            <main className="relative grid lg:grid-cols-2 gap-12 px-8 lg:px-16 py-12 max-w-7xl mx-auto items-center">
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-xs text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.12)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(56,189,248,0.6)] animate-pulse" />
                        Powered by SEC EDGAR & Yahoo Finance
                    </div>
                    <h1 className="text-white" style={{ fontSize: "3.25rem", lineHeight: 1.05, textShadow: "0 0 16px rgba(34,211,238,0.18)" }}>
                        Track your portfolio<br />
                        with{" "}
                        <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">
              real market data
            </span>
                    </h1>
                    <p className="text-slate-400 max-w-lg">
                        Manage US-listed positions, watch companies, and explore SEC filings in one minimalist dashboard built for serious investors.
                    </p>

                    <div className="grid grid-cols-3 gap-3 max-w-lg">
                        {[
                            { icon: TrendingUp, label: "Live P&L" },
                            { icon: Eye, label: "Watchlists" },
                            { icon: Shield, label: "EDGAR data" },
                        ].map((f) => {
                            const Icon = f.icon;
                            return (
                                <div
                                    key={f.label}
                                    className="rounded-xl bg-white/[0.03] border border-white/5 p-3 backdrop-blur-xl hover:border-cyan-400/30 hover:shadow-[0_0_10px_rgba(56,189,248,0.12)] transition-all"
                                >
                                    <Icon className="w-4 h-4 text-cyan-300 mb-2" />
                                    <div className="text-xs text-slate-300">{f.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-cyan-400/15 via-blue-500/10 to-indigo-600/15 blur-2xl" />
                    <div className="relative rounded-3xl bg-gradient-to-br from-[#0f1a35]/95 to-[#0a1224]/95 border border-white/10 shadow-[0_0_24px_rgba(56,189,248,0.1)] p-8 backdrop-blur-xl">
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Welcome back</div>
                        <h2 className="text-white mt-1 mb-6" style={{ textShadow: "0 0 10px rgba(34,211,238,0.2)" }}>
                            Sign in to MATF
                        </h2>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                onAuth();
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider">Email</label>
                                <div className="relative mt-1">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@matf.io"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 h-11 text-sm text-slate-200 outline-none focus:border-cyan-400/50 focus:shadow-[0_0_10px_rgba(56,189,248,0.12)] transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider">Password</label>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 h-11 text-sm text-slate-200 outline-none focus:border-cyan-400/50 focus:shadow-[0_0_10px_rgba(56,189,248,0.12)] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <label className="flex items-center gap-2 text-slate-400">
                                    <input type="checkbox" className="accent-cyan-400" />
                                    Remember me
                                </label>
                                <a className="text-cyan-300 hover:text-cyan-200 cursor-pointer">Forgot password?</a>
                            </div>

                            <button
                                type="submit"
                                className="w-full h-11 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(56,189,248,0.25)] hover:shadow-[0_0_18px_rgba(56,189,248,0.4)] transition-all flex items-center justify-center gap-2"
                            >
                                Sign in <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>

                        <div className="text-center text-sm text-slate-500 mt-6">
                            No account yet?{" "}
                            <button onClick={goRegister} className="text-cyan-300 hover:text-cyan-200">
                                Create one
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
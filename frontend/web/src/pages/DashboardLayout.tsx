import { useState } from "react";
import { Sidebar } from "../components/Sidebar.tsx";
import { Topbar } from "../components/Topbar.tsx";
import { Card } from "../components/Card.tsx";
import { StatsCards } from "../components/StatsCards.tsx";
import { PerformanceChart } from "../components/PerformanceChart.tsx";
import { PortfolioPanel } from "../components/PortfolioPanel.tsx";
import { WatchlistPanel } from "../components/WatchlistPanel.tsx";
import { EdgarSearch } from "../components/EdgarSearch.tsx";
import { TransactionsLog } from "../components/TransactionsLog.tsx";
import { CompanyDetail } from "../components/CompanyDetail.tsx";
import {useNavigate} from "react-router-dom";

export type View = "dashboard" | "portfolio" | "watchlist" | "search";

export function DashboardLayout() {
    const [view, setView] = useState<View>("dashboard");
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState("2026-05-13 09:42:18 UTC");
    const [selected, setSelected] = useState<{ ticker: string; name: string } | null>(null);
    const openCompany = (ticker: string, name: string) => setSelected({ ticker, name });
    const navigate = useNavigate();

    const refresh = () => {
        setRefreshing(true);
        setTimeout(() => {
            setLastUpdate(new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC");
            setRefreshing(false);
        }, 1100);
    };
    const handleLogout = () => {
        // Con auth real: setAuth(false)
        navigate("/login");
    };

    return (
        <div className="size-full min-h-screen bg-[#050a1a] text-slate-200 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px]" />
                <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[140px]" />
                <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-indigo-600/5 blur-[120px]" />
            </div>

            <div className="relative flex h-screen">
                <Sidebar view={view} setView={setView} onLogout={handleLogout} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Topbar lastUpdate={lastUpdate} onRefresh={refresh} refreshing={refreshing} />

                    <main className="flex-1 overflow-y-auto p-6 space-y-5">
                        {view === "dashboard" && (
                            <>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wider">Dashboard</div>
                                    <h1 className="text-white mt-1" style={{ textShadow: "0 0 10px rgba(34,211,238,0.2)" }}>
                                        My Wealth
                                    </h1>
                                </div>

                                <StatsCards />

                                <div className="grid grid-cols-12 gap-5">
                                    <Card glow className="col-span-12 lg:col-span-8 p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase tracking-wider">Performance</div>
                                                <div className="text-white mt-1" style={{ textShadow: "0 0 8px rgba(34,211,238,0.2)" }}>
                                                    $961,517.05
                                                </div>
                                                <div className="text-xs text-emerald-300 mt-1">+$176,084.99 · +22.42%</div>
                                            </div>
                                            <div className="flex gap-2">
                                                {["Portfolio", "DAX", "S&P 500"].map((t, i) => (
                                                    <div
                                                        key={t}
                                                        className={`px-3 py-1.5 rounded-lg text-xs border ${
                                                            i === 0
                                                                ? "bg-cyan-500/10 border-cyan-400/40 text-cyan-300"
                                                                : i === 1
                                                                    ? "bg-blue-500/10 border-blue-400/30 text-blue-300"
                                                                    : "bg-emerald-500/10 border-emerald-400/30 text-emerald-300"
                                                        }`}
                                                    >
                                                        {t}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <PerformanceChart />
                                    </Card>
                                </div>

                                <div className="grid grid-cols-12 gap-5">
                                    <div className="col-span-12 lg:col-span-7">
                                        <PortfolioPanel onSelect={openCompany} />
                                    </div>
                                    <div className="col-span-12 lg:col-span-5">
                                        <TransactionsLog />
                                    </div>
                                </div>
                            </>
                        )}

                        {view === "portfolio" && (
                            <>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wider">Portfolio</div>
                                    <h1 className="text-white mt-1" style={{ textShadow: "0 0 10px rgba(34,211,238,0.2)" }}>
                                        My Positions
                                    </h1>
                                </div>
                                <StatsCards />
                                <PortfolioPanel onSelect={openCompany} />
                                <TransactionsLog />
                            </>
                        )}

                        {view === "watchlist" && (
                            <>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wider">Watchlist</div>
                                    <h1 className="text-white mt-1" style={{ textShadow: "0 0 10px rgba(34,211,238,0.2)" }}>
                                        Tracked Companies
                                    </h1>
                                </div>
                                <WatchlistPanel onSelect={openCompany} />
                            </>
                        )}

                        {view === "search" && (
                            <>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wider">SEC EDGAR</div>
                                    <h1 className="text-white mt-1" style={{ textShadow: "0 0 10px rgba(34,211,238,0.2)" }}>
                                        Financial Data Explorer
                                    </h1>
                                </div>
                                <EdgarSearch onSelect={openCompany} />
                            </>
                        )}
                    </main>
                </div>
            </div>
            {selected && <CompanyDetail ticker={selected.ticker} name={selected.name} onClose={() => setSelected(null)} />}
        </div>
    );
}
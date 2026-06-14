import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { TradeModal } from '../components/TradeModal';
import { TransactionHistory } from '../components/TransactionHistory';
import { portfolioApi, type PortfolioPosition } from '../services/portfolioApi';
import { pricesApi } from '../services/api';

function formatCurrency(val: number | null) {
    if (val === null) return '—';
    if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PnlBadge({ pnl, pnlPct }: { pnl: number | null; pnlPct: number | null }) {
    if (pnl === null || pnlPct === null) return <span className="text-slate-400 text-sm">—</span>;
    const positive = pnl >= 0;
    return (
        <span className={`text-sm font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
            {positive ? '+' : ''}{formatCurrency(pnl)} ({positive ? '+' : ''}{pnlPct.toFixed(2)}%)
        </span>
    );
}

function formatLastUpdate(iso: string): string {
    return new Date(iso).toLocaleString('es-AR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [positions, setPositions] = useState<PortfolioPosition[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [lastUpdate, setLastUpdate] = useState<string | null | undefined>(undefined);

    const fetchPortfolio = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await portfolioApi.getPortfolio();
            setPositions(data);
        } catch (err) {
            setError('No se pudo cargar el portfolio.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchPortfolio();
        pricesApi.getLastUpdate()
            .then((d) => setLastUpdate(d.lastUpdate ?? null))
            .catch(() => setLastUpdate(null));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const totalValue = positions.reduce((sum, p) => sum + (p.currentValue ?? 0), 0);
    const totalCost = positions.reduce((sum, p) => sum + p.totalCost, 0);
    const totalPnl = totalCost > 0 ? totalValue - totalCost : null;

    return (
        <>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Portfolio</h1>
                        <p className="text-slate-400 text-sm mt-1">Resumen de tus posiciones</p>
                        {lastUpdate === undefined ? null : lastUpdate === null ? (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-amber-500/70">
                                ⚠ Sin datos de precios cargados
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-slate-500">
                                Precios actualizados: <span className="text-slate-400">{formatLastUpdate(lastUpdate)}</span>
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            data-cy="trade-button"
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-600/25"
                        >
                            + Operar
                        </button>
                        <button
                            id="logout-button"
                            onClick={handleLogout}
                            className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/40 hover:text-red-300 transition-all text-sm font-medium"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>

                {/* Resumen total */}
                {!loading && positions.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Valor actual</p>
                            <p className="text-xl font-bold text-slate-100">{formatCurrency(totalValue)}</p>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Invertido</p>
                            <p className="text-xl font-bold text-slate-100">{formatCurrency(totalCost)}</p>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">P&L total</p>
                            <p className={`text-xl font-bold ${totalPnl !== null && totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {totalPnl !== null ? `${totalPnl >= 0 ? '+' : ''}${formatCurrency(totalPnl)}` : '—'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Posiciones */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                    {loading && (
                        <p className="text-slate-400 text-center py-10 animate-pulse">Cargando portfolio...</p>
                    )}

                    {!loading && error && (
                        <p className="text-red-400 text-center py-10">{error}</p>
                    )}

                    {!loading && !error && positions.length === 0 && (
                        <div data-cy="portfolio-empty" className="text-center py-12">
                            <p className="text-slate-400 mb-2">No tenés posiciones abiertas.</p>
                            <p className="text-slate-500 text-sm">Buscá una empresa y registrá tu primera compra.</p>
                        </div>
                    )}

                    {!loading && !error && positions.length > 0 && (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700/50">
                                    <th className="text-left text-xs text-slate-400 uppercase tracking-widest px-5 py-3">Ticker</th>
                                    <th className="text-right text-xs text-slate-400 uppercase tracking-widest px-5 py-3">Acciones</th>
                                    <th className="text-right text-xs text-slate-400 uppercase tracking-widest px-5 py-3">Costo prom.</th>
                                    <th className="text-right text-xs text-slate-400 uppercase tracking-widest px-5 py-3">Precio actual</th>
                                    <th className="text-right text-xs text-slate-400 uppercase tracking-widest px-5 py-3">Valor actual</th>
                                    <th className="text-right text-xs text-slate-400 uppercase tracking-widest px-5 py-3">P&L</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {positions.map((pos) => (
                                    <tr key={pos.ticker} data-cy={`position-row-${pos.ticker}`} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-5 py-4 font-semibold text-slate-100">{pos.ticker}</td>
                                        <td className="px-5 py-4 text-right text-slate-300">{pos.totalShares}</td>
                                        <td className="px-5 py-4 text-right text-slate-300">{formatCurrency(pos.avgCost)}</td>
                                        <td className="px-5 py-4 text-right text-slate-300">{formatCurrency(pos.currentPrice)}</td>
                                        <td className="px-5 py-4 text-right text-slate-300">{formatCurrency(pos.currentValue)}</td>
                                        <td className="px-5 py-4 text-right">
                                            <PnlBadge pnl={pos.pnl} pnlPct={pos.pnlPct} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                <TransactionHistory refreshKey={refreshKey} />
                </div>
            </div>
        </div>

        {showModal && (
            <TradeModal
                onClose={() => setShowModal(false)}
                onSuccess={() => {
                    void fetchPortfolio();
                    setRefreshKey((k) => k + 1);
                }}
            />
        )}
        </>
    );
}


// US 3.4 — Dashboard with last price update widget
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pricesApi } from '../services/api';

// US 3.4 — Shape of the response from GET /prices/last-update
interface TickerDetail {
    ticker: string;
    price?: number;
    error?: string;
}

interface LastUpdateInfo {
    lastUpdate: string | null;
    message: string;
    tickersProcessed: number;
    success: number;
    errors: number;
    details: TickerDetail[];
}

// US 3.4 — Helper: returns true if the timestamp is older than 24 hours
function isStale(isoTimestamp: string): boolean {
    const updatedAt = new Date(isoTimestamp).getTime();
    const now = Date.now();
    return now - updatedAt > 24 * 60 * 60 * 1000; // US 3.4
}

// US 3.4 — Format ISO timestamp to a human-readable local date/time string
function formatTimestamp(isoTimestamp: string): string {
    return new Date(isoTimestamp).toLocaleString('es-AR', {
        dateStyle: 'full',
        timeStyle: 'medium',
    });
}

export default function Dashboard() {
    const navigate = useNavigate();

    // US 3.4 — State for last update data
    const [lastUpdateInfo, setLastUpdateInfo] = useState<LastUpdateInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // US 3.4 — Fetch last update on mount (updates on reload as per requirement)
    useEffect(() => {
        pricesApi
            .getLastUpdate()
            .then((data: LastUpdateInfo) => {
                setLastUpdateInfo(data);
            })
            .catch((err: Error) => {
                setFetchError(err.message);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const stale =
        lastUpdateInfo?.lastUpdate ? isStale(lastUpdateInfo.lastUpdate) : false; // US 3.4

    return (
        /* <!-- US 3.4 --> */
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
            {/* Header */}
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                            Portfolio Tracker
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Panel de control</p>
                    </div>
                    <button
                        id="logout-button"
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/40 hover:text-red-300 transition-all duration-200 text-sm font-medium"
                    >
                        Cerrar Sesión
                    </button>
                </div>

                {/* US 3.4 — Last Price Update Widget */}
                <div
                    id="last-update-widget"
                    className={`rounded-2xl border p-6 mb-6 transition-all duration-300 ${
                        loading
                            ? 'bg-slate-800/50 border-slate-700/50'
                            : fetchError
                            ? 'bg-red-900/20 border-red-500/30'
                            : !lastUpdateInfo?.lastUpdate
                            ? 'bg-amber-900/20 border-amber-500/40'
                            : stale
                            ? 'bg-orange-900/20 border-orange-500/40'
                            : 'bg-emerald-900/20 border-emerald-500/30'
                    }`}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                                loading
                                    ? 'bg-slate-700'
                                    : fetchError
                                    ? 'bg-red-600/30'
                                    : !lastUpdateInfo?.lastUpdate
                                    ? 'bg-amber-600/30'
                                    : stale
                                    ? 'bg-orange-600/30'
                                    : 'bg-emerald-600/30'
                            }`}
                        >
                            {loading ? '⏳' : fetchError ? '❌' : !lastUpdateInfo?.lastUpdate ? '⚠️' : stale ? '🕐' : '✅'}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-100">
                                Última actualización de precios
                            </h2>
                            <p className="text-xs text-slate-400">GET /prices/last-update</p>
                        </div>
                    </div>

                    {/* Loading state */}
                    {loading && (
                        <div className="flex items-center gap-2 text-slate-400">
                            <div className="w-4 h-4 border-2 border-slate-500 border-t-blue-400 rounded-full animate-spin" />
                            <span className="text-sm">Cargando información de precios…</span>
                        </div>
                    )}

                    {/* Error fetching */}
                    {!loading && fetchError && (
                        <p className="text-red-400 text-sm">
                            Error al obtener datos: {fetchError}
                        </p>
                    )}

                    {/* US 3.4 — Empty state: batch has never run */}
                    {!loading && !fetchError && !lastUpdateInfo?.lastUpdate && (
                        <div
                            id="no-prices-warning"
                            className="flex items-start gap-3 bg-amber-900/30 border border-amber-500/40 rounded-xl p-4"
                        >
                            {/* <!-- US 3.4 --> */}
                            <span className="text-amber-400 text-2xl mt-0.5">⚠️</span>
                            <div>
                                <p className="text-amber-300 font-semibold">No hay precios registrados</p>
                                <p className="text-amber-400/80 text-sm mt-1">
                                    {lastUpdateInfo?.message ||
                                        'El proceso de actualización de precios nunca fue ejecutado.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* US 3.4 — Timestamp and details when data is available */}
                    {!loading && !fetchError && lastUpdateInfo?.lastUpdate && (
                        <div>
                            {/* US 3.4 — Stale warning (older than 24 hours) */}
                            {stale && (
                                <div
                                    id="stale-data-warning"
                                    className="flex items-center gap-2 bg-orange-900/30 border border-orange-500/40 rounded-lg px-4 py-2 mb-4"
                                >
                                    {/* <!-- US 3.4 --> */}
                                    <span className="text-orange-400 text-lg">⚠️</span>
                                    <p className="text-orange-300 text-sm font-medium">
                                        Los precios tienen más de 24 horas de antigüedad. Se recomienda ejecutar una nueva actualización.
                                    </p>
                                </div>
                            )}

                            {/* US 3.4 — Last update timestamp display */}
                            <div className="mb-4">
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                                    Última ejecución
                                </p>
                                <p
                                    id="last-update-timestamp"
                                    className={`text-xl font-bold ${stale ? 'text-orange-300' : 'text-emerald-300'}`}
                                >
                                    {/* <!-- US 3.4 --> */}
                                    {formatTimestamp(lastUpdateInfo.lastUpdate)}
                                </p>
                            </div>

                            {/* Batch summary stats */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-slate-200">
                                        {lastUpdateInfo.tickersProcessed}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">Procesados</p>
                                </div>
                                <div className="bg-emerald-900/30 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-emerald-300">
                                        {lastUpdateInfo.success}
                                    </p>
                                    <p className="text-xs text-emerald-400/70 mt-1">Exitosos</p>
                                </div>
                                <div className="bg-red-900/30 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-red-300">
                                        {lastUpdateInfo.errors}
                                    </p>
                                    <p className="text-xs text-red-400/70 mt-1">Errores</p>
                                </div>
                            </div>

                            {/* US 3.4 — Per-ticker detail table */}
                            {lastUpdateInfo.details && lastUpdateInfo.details.length > 0 && (
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                                        Estado por ticker
                                    </p>
                                    <div className="rounded-xl overflow-hidden border border-slate-700/50">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-800/80 text-slate-400">
                                                    <th className="text-left px-4 py-2 font-medium">Ticker</th>
                                                    <th className="text-left px-4 py-2 font-medium">Estado</th>
                                                    <th className="text-right px-4 py-2 font-medium">Precio / Error</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* <!-- US 3.4 --> */}
                                                {lastUpdateInfo.details.map((d, idx) => (
                                                    <tr
                                                        key={d.ticker}
                                                        className={`border-t border-slate-700/30 ${idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/10'}`}
                                                    >
                                                        <td className="px-4 py-2 font-mono font-bold text-slate-200">
                                                            {d.ticker}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {d.price !== undefined ? (
                                                                <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                                                    OK
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-red-400 text-xs font-medium">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                                                                    ERROR
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-mono">
                                                            {d.price !== undefined ? (
                                                                <span className="text-slate-200">
                                                                    ${d.price.toFixed(2)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-red-400/80 text-xs">
                                                                    {d.error}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
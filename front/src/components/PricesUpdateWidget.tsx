import { useEffect, useState } from 'react';
import { pricesApi } from '../services/api';
import { PricesSummary } from './PricesSummary';
import { PricesTable } from './PricesTable';
import { PricesEmptyState, PricesStaleWarning } from './PricesAlerts';

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

function isStale(isoTimestamp: string): boolean {
    const updatedAt = new Date(isoTimestamp).getTime();
    const now = Date.now();
    return now - updatedAt > 24 * 60 * 60 * 1000;
}

function formatTimestamp(isoTimestamp: string): string {
    return new Date(isoTimestamp).toLocaleString('es-AR', {
        dateStyle: 'full',
        timeStyle: 'medium',
    });
}

export function PricesUpdateWidget() {
    const [lastUpdateInfo, setLastUpdateInfo] = useState<LastUpdateInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const fetchStatus = () => {
        setLoading(true);
        pricesApi
            .getLastUpdate()
            .then((data: LastUpdateInfo) => {
                setLastUpdateInfo(data);
                setFetchError(null);
            })
            .catch((err: Error) => {
                setFetchError(err.message);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleUpdatePrices = async () => {
        setUpdating(true);
        setFetchError(null);
        try {
            await pricesApi.updatePrices();
            fetchStatus();
        } catch (error: any) {
            setFetchError(error.message || 'Error al disparar la actualización');
        } finally {
            setUpdating(false);
        }
    };

    const stale =
        lastUpdateInfo?.lastUpdate ? isStale(lastUpdateInfo.lastUpdate) : false;

    return (
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
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                            loading || updating
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
                        {loading || updating ? '⏳' : fetchError ? '❌' : !lastUpdateInfo?.lastUpdate ? '⚠️' : stale ? '🕐' : '✅'}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-100">
                            Última actualización de precios
                        </h2>
                    </div>
                </div>

                <button
                    onClick={handleUpdatePrices}
                    disabled={updating || loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-medium rounded-lg text-sm transition-colors"
                >
                    {updating ? 'Actualizando...' : 'Actualizar Precios'}
                </button>
            </div>

            {(loading || updating) && (
                <div className="flex items-center gap-2 text-slate-400 mb-4">
                    <div className="w-4 h-4 border-2 border-slate-500 border-t-blue-400 rounded-full animate-spin" />
                    <span className="text-sm">
                        {updating ? 'Ejecutando proceso por lotes (POST /prices/update)…' : 'Cargando información de precios…'}
                    </span>
                </div>
            )}

            {!(loading || updating) && fetchError && (
                <p className="text-red-400 text-sm mb-4">
                    Error: {fetchError}
                </p>
            )}

            {!(loading || updating) && !fetchError && !lastUpdateInfo?.lastUpdate && (
                <PricesEmptyState message={lastUpdateInfo?.message || ''} />
            )}

            {!(loading || updating) && !fetchError && lastUpdateInfo?.lastUpdate && (
                <div>
                    {stale && <PricesStaleWarning />}
                    <div className="mb-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            Última ejecución
                        </p>
                        <p
                            id="last-update-timestamp"
                            className={`text-xl font-bold ${stale ? 'text-orange-300' : 'text-emerald-300'}`}
                        >
                            {formatTimestamp(lastUpdateInfo.lastUpdate)}
                        </p>
                    </div>
                    <PricesSummary 
                        processed={lastUpdateInfo.tickersProcessed} 
                        success={lastUpdateInfo.success} 
                        errors={lastUpdateInfo.errors} 
                    />
                    <PricesTable details={lastUpdateInfo.details} />
                </div>
            )}
        </div>
    );
}

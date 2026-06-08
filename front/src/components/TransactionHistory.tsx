import { useEffect, useState } from 'react';
import { portfolioApi, type PortfolioTransaction } from '../services/portfolioApi';

function formatDate(isoDate: string) {
    return new Date(isoDate).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function formatPrice(val: number) {
    return `$${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface TransactionHistoryProps {
    refreshKey: number;
}

export function TransactionHistory({ refreshKey }: TransactionHistoryProps) {
    const [transactions, setTransactions] = useState<PortfolioTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        portfolioApi.getTransactions()
            .then(setTransactions)
            .catch(() => setTransactions([]))
            .finally(() => setLoading(false));
    }, [open, refreshKey]);

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden mt-6">
            {/* Header colapsable */}
            <button
                data-cy="history-toggle"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/30 transition-colors"
            >
                <span className="text-sm font-semibold text-slate-300 uppercase tracking-widest">
                    Historial de transacciones
                </span>
                <span className="text-slate-400 text-lg">{open ? '▲' : '▼'}</span>
            </button>

            {open && (
                <>
                    {loading && (
                        <p className="text-slate-400 text-center py-8 animate-pulse">Cargando historial...</p>
                    )}

                    {!loading && transactions.length === 0 && (
                        <p className="text-slate-500 text-center py-8 text-sm">No hay transacciones registradas.</p>
                    )}

                    {!loading && transactions.length > 0 && (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-t border-b border-slate-700/50">
                                    <th className="text-left text-xs text-slate-400 uppercase tracking-widest px-5 py-3">Tipo</th>
                                    <th className="text-left text-xs text-slate-400 uppercase tracking-widest px-5 py-3">Ticker</th>
                                    <th className="text-right text-xs text-slate-400 uppercase tracking-widest px-5 py-3">Cantidad</th>
                                    <th className="text-right text-xs text-slate-400 uppercase tracking-widest px-5 py-3">Precio</th>
                                    <th className="text-right text-xs text-slate-400 uppercase tracking-widest px-5 py-3">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} data-cy="transaction-row" className="hover:bg-slate-700/20 transition-colors">
                                        <td className="px-5 py-3">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                                                tx.type === 'BUY'
                                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                                    : 'bg-red-500/15 text-red-300 border-red-500/30'
                                            }`}>
                                                {tx.type === 'BUY' ? 'Compra' : 'Venta'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 font-semibold text-slate-100">{tx.ticker}</td>
                                        <td className="px-5 py-3 text-right text-slate-300">{tx.quantity}</td>
                                        <td className="px-5 py-3 text-right text-slate-300">{formatPrice(tx.priceAtOp)}</td>
                                        <td className="px-5 py-3 text-right text-slate-400">{formatDate(tx.date)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}
        </div>
    );
}

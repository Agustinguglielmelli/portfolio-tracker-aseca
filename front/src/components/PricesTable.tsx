interface TickerDetail {
    ticker: string;
    price?: number;
    error?: string;
}

interface PricesTableProps {
    details: TickerDetail[];
}

export function PricesTable({ details }: PricesTableProps) {
    if (!details || details.length === 0) return null;

    return (
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
                        {details.map((d, idx) => (
                            <tr
                                key={d.ticker}
                                className={`border-t border-slate-700/30 ${idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/10'}`}
                            >
                                <td className="px-4 py-2 font-mono font-bold text-slate-200">
                                    {d.ticker}
                                </td>
                                <td className="px-4 py-2">
                                    {d.price != null ? (
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
                                    {d.price != null ? (
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
    );
}

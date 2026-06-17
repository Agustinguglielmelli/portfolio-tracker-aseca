import {useEffect, useState} from 'react';
import {companiesApi} from '../services/api';

interface Props {
    tickers: string[];
}

type MetricValue = string | number | null;
type MetricsMap = Record<string, Record<string, MetricValue>>;

export const WatchlistComparison = ({ tickers }: Props) => {
    const [metricsData, setMetricsData] = useState<MetricsMap>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchMetrics = async () => {
            if (tickers.length === 0) {
                setMetricsData({});
                return;
            }

            setLoading(true);
            const newMetrics: MetricsMap = {};

            for (const ticker of tickers) {
                try {
                    newMetrics[ticker] = await companiesApi.getMetrics(ticker) as Record<string, MetricValue>;
                } catch {
                    newMetrics[ticker] = { error: 'No disponible' };
                }
            }

            if (isMounted) {
                setMetricsData(newMetrics);
                setLoading(false);
            }
        };

        void fetchMetrics();

        return () => {
            isMounted = false;
        };
    }, [tickers]);

    if (tickers.length === 0) return null;

    const allKeys = Array.from(
        new Set(
            Object.values(metricsData)
                .flatMap((data) => Object.keys(data))
                .filter(key => key !== 'error')
        )
    );

    return (
        <div className="mt-8 bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden p-6">
            <h2 className="text-xl font-bold text-white mb-4">Comparación Visual</h2>
            {loading ? (
                <p className="text-slate-400">Cargando métricas para comparación...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr>
                            <th className="p-3 border-b border-slate-700 text-slate-300 font-semibold">Métrica</th>
                            {tickers.map(ticker => (
                                <th key={ticker} className="p-3 border-b border-slate-700 text-slate-300 font-semibold">{ticker}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {allKeys.map(key => (
                            <tr key={key} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                                <td className="p-3 text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                                {tickers.map(ticker => (
                                    <td key={ticker} className="p-3 text-slate-100">
                                        {metricsData[ticker]?.[key] !== undefined ? String(metricsData[ticker][key]) : '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
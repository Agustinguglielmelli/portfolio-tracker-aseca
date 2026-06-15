import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { companiesApi } from '../services/api';
import { Navbar } from './Navbar';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface FinancialMetrics {
    revenue: number | null;
    netIncome: number | null;
    eps: number | null;
    totalAssets: number | null;
}

interface Filing {
    accessionNumber: string;
    type: string;
    date: string;
}

interface HistoricalData {
    revenue?: { date: string; value: number }[];
    netIncome?: { date: string; value: number }[];
    eps?: { date: string; value: number }[];
}

interface ChartDataPoint {
    date: string;
    revenue?: number;
    netIncome?: number;
    eps?: number;
    [key: string]: string | number | undefined;
}

const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'N/A';

    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const sign = isNegative ? '-' : '';

    if (absVal >= 1e9) return `${sign}$${(absVal / 1e9).toFixed(2)}B`;
    if (absVal >= 1e6) return `${sign}$${(absVal / 1e6).toFixed(2)}M`;

    return `${sign}$${absVal.toLocaleString()}`;
};

const formatChartData = (history: HistoricalData | null): ChartDataPoint[] => {
    if (!history) return [];
    const dateMap = new Map<string, ChartDataPoint>();

    const processMetric = (metricArray: { date: string; value: number }[] | undefined, key: keyof ChartDataPoint) => {
        if (!metricArray) return;
        metricArray.forEach((item) => {
            if (!dateMap.has(item.date)) dateMap.set(item.date, { date: item.date });
            const dataPoint = dateMap.get(item.date)!;
            dataPoint[key as string] = item.value;
        });
    };

    processMetric(history.revenue, 'revenue');
    processMetric(history.netIncome, 'netIncome');
    processMetric(history.eps, 'eps');

    return Array.from(dateMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
};

export const CompanyDetail = () => {
    const { ticker } = useParams<{ ticker: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
    const [filings, setFilings] = useState<Filing[]>([]);
    const [history, setHistory] = useState<HistoricalData | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!ticker || ticker === 'null') {
                setError('Ticker inválido. Regresa al buscador e intenta con otra empresa.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError('');
                const [metricsData, filingsData, historyData] = await Promise.all([
                    companiesApi.getMetrics(ticker),
                    companiesApi.getFilings(ticker),
                    companiesApi.getHistorical(ticker),
                ]);

                setMetrics(metricsData);
                setFilings(filingsData);
                setHistory(historyData);
            } catch (err) {
                console.error(err);
                setError('No se pudo cargar la información financiera de esta empresa.');
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
    }, [ticker]);

    if (loading) return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
            <p className="text-slate-400 animate-pulse">Cargando datos de {ticker}...</p>
        </div>
    );
    if (error) return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
            <div className="text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-md">{error}</div>
        </div>
    );

    const chartData = formatChartData(history);

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-white">{ticker}</h1>
                    <p className="text-slate-400 text-sm mt-1">Datos financieros</p>
                </header>
                <section>
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Métricas Actuales</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard title="Revenue" value={formatCurrency(metrics?.revenue)} />
                        <MetricCard title="Net Income" value={formatCurrency(metrics?.netIncome)} />
                        <MetricCard title="EPS" value={formatCurrency(metrics?.eps)} />
                        <MetricCard title="Total Assets" value={formatCurrency(metrics?.totalAssets)} />
                    </div>
                </section>

                <section>
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Evolución Histórica</h2>
                    <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis
                                        yAxisId="left"
                                        tickFormatter={(val) => `$${(val / 1e9).toFixed(1)}B`}
                                        width={80}
                                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tickFormatter={(val) => `$${val.toFixed(2)}`}
                                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#e2e8f0' }}
                                        formatter={(value, name) => [
                                            name === 'EPS' ? `$${Number(value).toFixed(2)}` : formatCurrency(Number(value)),
                                            name as string
                                        ]}
                                    />
                                    <Legend wrapperStyle={{ color: '#94a3b8' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
                                    <Line yAxisId="left" type="monotone" dataKey="netIncome" name="Net Income" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
                                    <Line yAxisId="right" type="monotone" dataKey="eps" name="EPS" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} activeDot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-slate-500 text-center py-10">No hay datos históricos suficientes para graficar.</p>
                        )}
                    </div>
                </section>

                <section>
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Filings Recientes (10-K / 10-Q)</h2>
                    <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl divide-y divide-slate-700/50 overflow-hidden">
                        {filings.length > 0 ? filings.map((filing: Filing) => (
                            <div key={filing.accessionNumber} className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center hover:bg-slate-700/40 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${filing.type === '10-K' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'}`}>
                                        {filing.type}
                                    </span>
                                    <span className="text-slate-400 text-sm font-mono">{filing.accessionNumber}</span>
                                </div>
                                <div className="flex items-center gap-4 mt-2 sm:mt-0">
                                    <span className="text-slate-400 text-sm">{filing.date}</span>

                                    <a
                                        href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&accession=${filing.accessionNumber}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 text-xs underline"
                                    >
                                        Ver filing →
                                    </a>
                                </div>
                            </div>
                        )) : (
                            <p className="text-slate-500 text-center py-6">No hay filings recientes disponibles.</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

const MetricCard = ({title, value}: { title: string; value: string | number }) => (
    <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-2xl hover:border-slate-600/60 transition-colors">
        <h3 className="text-slate-400 text-xs font-medium uppercase tracking-widest">{title}</h3>
        <p className="text-2xl font-bold mt-2 text-slate-100">{value}</p>
    </div>
);
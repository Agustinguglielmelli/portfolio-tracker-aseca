import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { companiesApi } from '../services/api';
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
}

// Función auxiliar para formatear moneda en tarjetas
const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'N/A';
    if (val > 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val > 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
};

// Función para transformar los datos del backend para el gráfico de Recharts
const formatChartData = (history: HistoricalData | null): ChartDataPoint[] => {
    if (!history) return [];
    const dateMap = new Map<string, ChartDataPoint>();

    const processMetric = (metricArray: { date: string; value: number }[] | undefined, key: keyof ChartDataPoint) => {
        if (!metricArray) return;
        metricArray.forEach((item) => {
            if (!dateMap.has(item.date)) dateMap.set(item.date, { date: item.date });
            const dataPoint = dateMap.get(item.date)!;
            (dataPoint as any)[key] = item.value;
        });
    };

    processMetric(history.revenue, 'revenue');
    processMetric(history.netIncome, 'netIncome');
    processMetric(history.eps, 'eps');

    // Ordenar cronológicamente (del más viejo al más nuevo para que el gráfico vaya hacia adelante)
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

        fetchData();
    }, [ticker]);

    if (loading) return <div className="text-center p-10">Cargando datos de {ticker}...</div>;
    if (error) return <div className="text-red-500 text-center p-10 bg-red-50 rounded m-4 border border-red-200">{error}</div>;

    const chartData = formatChartData(history);

    return (
        <div className="max-w-5xl mx-auto p-4 space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-gray-800">Detalle de {ticker}</h1>
            </header>

            {/* US 2.6: Métricas Actuales */}
            <section>
                <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">Métricas Actuales</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard title="Revenue" value={formatCurrency(metrics?.revenue)} />
                    <MetricCard title="Net Income" value={formatCurrency(metrics?.netIncome)} />
                    <MetricCard title="EPS" value={formatCurrency(metrics?.eps)} />
                    <MetricCard title="Total Assets" value={formatCurrency(metrics?.totalAssets)} />
                </div>
            </section>

            {/* US 2.8: Evolución Histórica (GRÁFICO INTERACTIVO) */}
            <section>
                <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">Evolución Histórica (Últimos Quarters)</h2>
                <div className="bg-white p-4 shadow rounded-lg border border-gray-100">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tick={{fontSize: 12}} />
                                {/* Eje Y izquierdo para grandes montos (Revenue / Net Income) */}
                                <YAxis
                                    yAxisId="left"
                                    tickFormatter={(val) => `$${(val / 1e9).toFixed(1)}B`}
                                    width={80}
                                    tick={{fontSize: 12}}
                                />
                                {/* Eje Y derecho para montos pequeños (EPS) */}
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tickFormatter={(val) => `$${val.toFixed(2)}`}
                                    tick={{fontSize: 12}}
                                />
                                <Tooltip
                                    formatter={(value: number, name: string) => [
                                        name === 'EPS' ? `$${value.toFixed(2)}` : formatCurrency(value),
                                        name
                                    ]}
                                    labelStyle={{ color: 'black' }}
                                />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line yAxisId="left" type="monotone" dataKey="netIncome" name="Net Income" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line yAxisId="right" type="monotone" dataKey="eps" name="EPS" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-500 text-center py-10">No hay datos históricos suficientes para graficar.</p>
                    )}
                </div>
            </section>

            {/* US 2.7: Filings Recientes */}
            <section>
                <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">Filings Recientes (10-K / 10-Q)</h2>
                <div className="bg-white shadow rounded-lg divide-y">
                    {filings.length > 0 ? filings.map((filing: any) => (
                        <div key={filing.accessionNumber} className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center hover:bg-gray-50 transition">
                            <div>
                                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded text-sm">{filing.type}</span>
                                <span className="ml-3 text-gray-500 text-sm">Acc: {filing.accessionNumber}</span>
                            </div>
                            <div className="text-gray-600 text-sm mt-2 sm:mt-0 font-medium">{filing.date}</div>
                        </div>
                    )) : (
                        <p className="text-gray-500 text-center py-4">No hay filings recientes disponibles.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

// Componente visual para las tarjetas
const MetricCard = ({ title, value }: { title: string; value: string | number }) => (
    <div className="bg-white p-5 rounded-lg shadow border border-gray-100 hover:shadow-md transition">
        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">{title}</h3>
        <p className="text-2xl font-bold mt-2 text-gray-900">{value}</p>
    </div>
);
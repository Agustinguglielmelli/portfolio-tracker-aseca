import { useState, useRef, useEffect, type ChangeEvent, type SyntheticEvent } from 'react';
import { portfolioApi } from '../services/portfolioApi';
import { companiesApi } from '../services/api';

interface CompanyResult {
    cik: string;
    name: string;
    ticker: string;
}

interface TradeModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

type TradeType = 'BUY' | 'SELL';

export function TradeModal({ onClose, onSuccess }: TradeModalProps) {
    const [type, setType] = useState<TradeType>('BUY');
    const [ticker, setTicker] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CompanyResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Buscar con debounce mientras el usuario escribe
    useEffect(() => {
        if (!query.trim() || ticker) {
            setResults([]);
            setShowDropdown(false);
            return;
        }
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            try {
                const data = await companiesApi.search(query);
                setResults(data.filter((c: CompanyResult) => c.ticker));
                setShowDropdown(true);
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 350);
    }, [query, ticker]);

    // Cerrar dropdown al clickear fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelectCompany = (company: CompanyResult) => {
        setTicker(company.ticker);
        setCompanyName(company.name);
        setQuery('');
        setResults([]);
        setShowDropdown(false);
    };

    const handleClearTicker = () => {
        setTicker('');
        setCompanyName('');
        setQuery('');
    };

    const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        const qty = parseFloat(quantity);
        if (!ticker) return setError('Seleccioná una empresa.');
        if (isNaN(qty) || qty <= 0) return setError('La cantidad debe ser mayor a cero.');
        if (!date) return setError('La fecha es requerida.');

        try {
            setLoading(true);
            const dto = { ticker, quantity: qty, date };
            if (type === 'BUY') {
                await portfolioApi.buy(dto);
            } else {
                await portfolioApi.sell(dto);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm bg-slate-800/90 border border-slate-700/60 rounded-2xl shadow-2xl p-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">Registrar operación</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors text-xl leading-none">
                        ✕
                    </button>
                </div>

                {/* Selector BUY / SELL */}
                <div className="flex rounded-xl overflow-hidden border border-slate-600/50 mb-5">
                    {(['BUY', 'SELL'] as TradeType[]).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setType(t)}
                            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                                type === t
                                    ? t === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                                    : 'bg-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {t === 'BUY' ? 'Compra' : 'Venta'}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mb-4 flex items-start gap-2 bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-xl px-3 py-2.5">
                        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Ticker con búsqueda */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Empresa</label>

                        {ticker ? (
                            // Empresa seleccionada
                            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl">
                                <div>
                                    <span className="text-slate-100 font-semibold text-sm">{ticker}</span>
                                    <span className="text-slate-400 text-xs ml-2">{companyName}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClearTicker}
                                    className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            // Input de búsqueda
                            <div className="relative" ref={dropdownRef}>
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o ticker..."
                                    value={query}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 text-slate-100 placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition"
                                />
                                {searching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-slate-500 border-t-blue-400 rounded-full animate-spin" />
                                    </div>
                                )}
                                {showDropdown && results.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700/60 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                                        {results.map((company) => (
                                            <button
                                                key={company.cik}
                                                type="button"
                                                onClick={() => handleSelectCompany(company)}
                                                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-700/60 transition-colors text-left"
                                            >
                                                <span className="text-slate-100 text-sm truncate">{company.name}</span>
                                                <span className="text-blue-300 text-xs font-semibold ml-2 shrink-0">{company.ticker}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {showDropdown && results.length === 0 && !searching && query.trim() && (
                                    <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700/60 rounded-xl shadow-xl px-4 py-3">
                                        <p className="text-slate-400 text-sm">Sin resultados para "{query}"</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Cantidad</label>
                        <input
                            type="number"
                            placeholder="0"
                            min="0.01"
                            step="any"
                            value={quantity}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 text-slate-100 placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Fecha de operación</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2.5 font-semibold rounded-xl text-sm transition shadow-lg focus:outline-none disabled:opacity-50 ${
                            type === 'BUY'
                                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                                : 'bg-red-600 hover:bg-red-500 shadow-red-600/25'
                        } text-white`}
                    >
                        {loading ? 'Procesando...' : type === 'BUY' ? 'Registrar compra' : 'Registrar venta'}
                    </button>
                </form>
            </div>
        </div>
    );
}

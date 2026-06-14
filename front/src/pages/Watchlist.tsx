import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { watchlistApi } from '../services/api';
import { WatchlistComparison } from '../components/WatchlistComparison';
import { CompanySearchDropdown, type CompanyResult } from '../components/CompanySearchDropdown';

interface WatchlistItem {
    ticker: string;
}

export default function Watchlist() {
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const [query, setQuery] = useState('');
    const [ticker, setTicker] = useState('');
    const [companyName, setCompanyName] = useState('');

    const showMessage = useCallback((text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3500);
    }, []);

    const loadWatchlist = useCallback(async () => {
        try {
            const data = await watchlistApi.getList();
            setWatchlist(data);
        } catch (error: unknown) {
            if (error instanceof Error) showMessage(error.message, 'error');
        }
    }, [showMessage]);

    useEffect(() => {
        const fetchInitialData = async () => {
            await loadWatchlist();
        };
        fetchInitialData().catch(() => {});
    }, [loadWatchlist]);

    const handleSelectCompany = (company: CompanyResult) => {
        setTicker(company.ticker);
        setCompanyName(company.name);
        setQuery('');
    };

    const handleClearTicker = () => {
        setTicker('');
        setCompanyName('');
        setQuery('');
    };

    const handleAdd = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        const tickerToAdd = ticker || query.trim().toUpperCase();
        if (!tickerToAdd) return;

        try {
            await watchlistApi.add(tickerToAdd);
            handleClearTicker();
            showMessage('Empresa agregada a la watchlist correctamente', 'success');
            await loadWatchlist();
        } catch (error: unknown) {
            if (error instanceof Error) showMessage(error.message, 'error');
        }
    };

    const handleRemove = async (tickerToRemove: string) => {
        try {
            await watchlistApi.remove(tickerToRemove);
            setSelectedTickers(prev => prev.filter(t => t !== tickerToRemove));
            showMessage('Empresa eliminada de la watchlist', 'success');
            await loadWatchlist();
        } catch (error: unknown) {
            if (error instanceof Error) showMessage(error.message, 'error');
        }
    };

    const toggleSelect = (tickerToSelect: string) => {
        setSelectedTickers(prev =>
            prev.includes(tickerToSelect)
                ? prev.filter(t => t !== tickerToSelect)
                : [...prev, tickerToSelect]
        );
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-white mb-6">Mi Watchlist</h1>

                {message && (
                    <div className={`p-4 mb-6 rounded-xl border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleAdd} className="flex gap-2 mb-8 items-start">
                    <div className="flex-1 max-w-sm">
                        <CompanySearchDropdown
                            selectedTicker={ticker}
                            selectedCompanyName={companyName}
                            onSelect={handleSelectCompany}
                            onClear={handleClearTicker}
                            query={query}
                            setQuery={setQuery}
                        />
                    </div>
                    <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-600/30 h-11">
                        Agregar
                    </button>
                </form>

                <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl divide-y divide-slate-700/50 overflow-hidden">
                    {watchlist.length === 0 ? (
                        <p className="text-slate-400 p-6 text-center">No tienes empresas en tu watchlist actualmente.</p>
                    ) : (
                        watchlist.map((item) => (
                            <div key={item.ticker} className="p-4 flex justify-between items-center hover:bg-slate-700/40 transition-colors">
                                <div className="flex items-center gap-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedTickers.includes(item.ticker)}
                                        onChange={() => toggleSelect(item.ticker)}
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500/50 cursor-pointer"
                                    />
                                    <span className="font-semibold text-slate-100">{item.ticker}</span>
                                </div>
                                <button
                                    onClick={() => handleRemove(item.ticker)}
                                    className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition"
                                >
                                    Eliminar
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {selectedTickers.length > 0 && (
                    <WatchlistComparison tickers={selectedTickers} />
                )}
            </div>
        </div>
    );
}
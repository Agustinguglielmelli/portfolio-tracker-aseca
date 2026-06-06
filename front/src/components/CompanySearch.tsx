import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companiesApi } from '../services/api';
import { Navbar } from './Navbar';

interface CompanySearchResult {
    cik: string;
    name: string;
    ticker: string;
}

export const CompanySearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CompanySearchResult[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        try {
            const data = await companiesApi.search(query);
            setResults(data);
            setHasSearched(true);
        } catch (error) {
            console.error("Error buscando empresas", error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-white mb-6">Buscar empresa</h1>

                <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                    <input
                        type="text"
                        placeholder="Nombre o ticker (ej. AAPL, Apple)"
                        className="flex-1 px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 text-slate-100 placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-600/30">
                        Buscar
                    </button>
                </form>

                {hasSearched && results.length === 0 && (
                    <p className="text-slate-400 text-center py-6">No se encontraron resultados para "{query}".</p>
                )}

                <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl divide-y divide-slate-700/50 overflow-hidden">
                    {results.map((company) => (
                        <div
                            key={company.cik}
                            onClick={() => {
                                console.log(company);
                                navigate(`/companies/${company.ticker}`);
                            }}
                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-700/40 transition-colors"
                        >
                            <div>
                                <p className="font-semibold text-slate-100">{company.name}</p>
                                <p className="text-sm text-slate-400 mt-0.5">CIK: {company.cik}</p>
                            </div>
                            <span className="bg-blue-500/15 text-blue-300 border border-blue-500/30 text-sm font-semibold px-3 py-1 rounded-full">
                                {company.ticker || 'N/A'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
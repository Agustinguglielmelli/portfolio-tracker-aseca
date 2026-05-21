import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companiesApi } from '../services/api';

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
        <div className="max-w-2xl mx-auto p-4">
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <input
                    type="text"
                    placeholder="Buscar por nombre o ticker (ej. AAPL, Apple)"
                    className="flex-1 p-3 border border-gray-300 rounded shadow-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">
                    Buscar
                </button>
            </form>

            {hasSearched && results.length === 0 && (
                <p className="text-gray-500 text-center py-4">No se encontraron resultados para "{query}".</p>
            )}

            <div className="bg-white shadow rounded-lg divide-y">
                {results.map((company) => (
                    <div
                        key={company.cik}
                        onClick={() => {
                            console.log(company); // imprime el objeto (expandible en DevTools)
                            navigate(`/companies/${company.ticker}`);
                        }}
                        className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
                    >
                        <div>
                            <p className="font-semibold text-lg">{company.name}</p>
                            <p className="text-sm text-gray-500">CIK: {company.cik}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              {company.ticker || 'N/A'}
            </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
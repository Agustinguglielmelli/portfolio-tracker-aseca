import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { companiesApi } from '../services/api';

export interface CompanyResult {
    cik: string;
    name: string;
    ticker: string;
}

interface CompanySearchDropdownProps {
    selectedTicker: string;
    selectedCompanyName: string;
    onSelect: (company: CompanyResult) => void;
    onClear: () => void;
    query: string;
    setQuery: (val: string) => void;
    placeholder?: string;
}

export function CompanySearchDropdown({
                                          selectedTicker,
                                          selectedCompanyName,
                                          onSelect,
                                          onClear,
                                          query,
                                          setQuery,
                                          placeholder = "Buscar por nombre o ticker..."
                                      }: CompanySearchDropdownProps) {
    const [results, setResults] = useState<CompanyResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!query.trim() || selectedTicker) {
            const timeoutId = setTimeout(() => {
                setResults([]);
                setShowDropdown(false);
            }, 0);
            return () => clearTimeout(timeoutId);
        }

        const timeoutId = setTimeout(async () => {
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

        return () => clearTimeout(timeoutId);
    }, [query, selectedTicker]);

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
        onSelect(company);
        setShowDropdown(false);
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {selectedTicker ? (
                <div data-cy="selected-ticker" className="flex items-center justify-between px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl w-full h-11">
                    <div>
                        <span className="text-slate-100 font-semibold text-sm">{selectedTicker}</span>
                        <span className="text-slate-400 text-xs ml-2">{selectedCompanyName}</span>
                    </div>
                    <button
                        type="button"
                        data-cy="clear-ticker"
                        onClick={onClear}
                        className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
                    >
                        ✕
                    </button>
                </div>
            ) : (
                <>
                    <input
                        data-cy="ticker-search"
                        type="text"
                        placeholder={placeholder}
                        value={query}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 text-slate-100 placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition h-11"
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
                                    data-cy={`ticker-option-${company.ticker}`}
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
                </>
            )}
        </div>
    );
}
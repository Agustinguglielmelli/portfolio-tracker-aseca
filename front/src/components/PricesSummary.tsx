interface PricesSummaryProps {
    processed: number;
    success: number;
    errors: number;
}

export function PricesSummary({ processed, success, errors }: PricesSummaryProps) {
    return (
        <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-slate-200">
                    {processed}
                </p>
                <p className="text-xs text-slate-400 mt-1">Procesados</p>
            </div>
            <div className="bg-emerald-900/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-emerald-300">
                    {success}
                </p>
                <p className="text-xs text-emerald-400/70 mt-1">Exitosos</p>
            </div>
            <div className="bg-red-900/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-300">
                    {errors}
                </p>
                <p className="text-xs text-red-400/70 mt-1">Errores</p>
            </div>
        </div>
    );
}

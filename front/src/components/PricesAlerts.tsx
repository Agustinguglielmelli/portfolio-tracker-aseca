interface PricesEmptyStateProps {
    message: string;
}

export function PricesEmptyState({ message }: PricesEmptyStateProps) {
    return (
        <div
            id="no-prices-warning"
            className="flex items-start gap-3 bg-amber-900/30 border border-amber-500/40 rounded-xl p-4 mb-4"
        >
            <span className="text-amber-400 text-2xl mt-0.5">⚠️</span>
            <div>
                <p className="text-amber-300 font-semibold">No hay precios registrados</p>
                <p className="text-amber-400/80 text-sm mt-1">
                    {message || 'El proceso de actualización de precios nunca fue ejecutado.'}
                </p>
            </div>
        </div>
    );
}

export function PricesStaleWarning() {
    return (
        <div
            id="stale-data-warning"
            className="flex items-center gap-2 bg-orange-900/30 border border-orange-500/40 rounded-lg px-4 py-2 mb-4"
        >
            <span className="text-orange-400 text-lg">⚠️</span>
            <p className="text-orange-300 text-sm font-medium">
                Los precios tienen más de 24 horas de antigüedad. Se recomienda ejecutar una nueva actualización.
            </p>
        </div>
    );
}

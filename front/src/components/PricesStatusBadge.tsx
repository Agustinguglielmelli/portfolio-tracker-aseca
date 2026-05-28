import { useEffect, useState } from 'react';
import { pricesApi } from '../services/api';

export function PricesStatusBadge() {
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        pricesApi.getLastUpdate()
            .then(data => setLastUpdate(data.lastUpdate))
            .catch(() => setLastUpdate(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 text-xs font-medium animate-pulse">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            Verificando precios...
        </div>
    );

    if (!lastUpdate) return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Sin precios registrados
        </div>
    );

    const isStale = Date.now() - new Date(lastUpdate).getTime() > 24 * 60 * 60 * 1000;
    const formattedDate = new Date(lastUpdate).toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short'
    });

    if (isStale) {
        return (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium" title="Los precios tienen más de 24 horas">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Precios desactualizados ({formattedDate})
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Precios vigentes ({formattedDate})
        </div>
    );
}

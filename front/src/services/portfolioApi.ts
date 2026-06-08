const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function authHeaders() {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No autenticado');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

export type PortfolioPosition = {
    ticker: string;
    totalShares: number;
    avgCost: number;
    totalCost: number;
    currentPrice: number | null;
    currentValue: number | null;
    pnl: number | null;
    pnlPct: number | null;
};

export type PortfolioTransaction = {
    id: number;
    ticker: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    priceAtOp: number;
    date: string;
    createdAt: string;
};

export type BuyDto = { ticker: string; quantity: number; date: string };
export type SellDto = { ticker: string; quantity: number; date: string };

export const portfolioApi = {
    async getPortfolio(): Promise<PortfolioPosition[]> {
        const res = await fetch(`${API_URL}/portfolio`, {
            headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Error al cargar el portfolio');
        return res.json();
    },

    async getTransactions(): Promise<PortfolioTransaction[]> {
        const res = await fetch(`${API_URL}/portfolio/transactions`, {
            headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Error al cargar transacciones');
        return res.json();
    },

    async buy(dto: BuyDto): Promise<PortfolioTransaction> {
        const res = await fetch(`${API_URL}/portfolio/buy`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(dto),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || 'Error al registrar compra');
        }
        return res.json();
    },

    async sell(dto: SellDto): Promise<PortfolioTransaction> {
        const res = await fetch(`${API_URL}/portfolio/sell`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(dto),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || 'Error al registrar venta');
        }
        return res.json();
    },

};

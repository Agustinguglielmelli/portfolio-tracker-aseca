const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const authApi = {
    async login(credentials: Record<string, string>) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) throw new Error('Credenciales inválidas');
        return response.json();
    },

    async register(data: Record<string, string>) {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en el registro');
        }
        return response.json();
    }
};

export const companiesApi = {
    search: async (query: string) => {
        const res = await fetch(`${API_URL}/companies/search?q=${query}`);
        return res.json();
    },
    getMetrics: async (ticker: string) => {
        const res = await fetch(`${API_URL}/companies/${ticker}/metrics`);
        if (!res.ok) throw new Error('Error al cargar métricas');
        return res.json();
    },
    getFilings: async (ticker: string) => {
        const res = await fetch(`${API_URL}/companies/${ticker}/filings`);
        if (!res.ok) throw new Error('Error al cargar filings');
        return res.json();
    },
    getHistorical: async (ticker: string) => {
        const res = await fetch(`${API_URL}/companies/${ticker}/historical-metrics`);
        if (!res.ok) throw new Error('Error al cargar historial');
        return res.json();
    }
};
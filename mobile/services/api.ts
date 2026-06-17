import { getToken } from '@/utils/auth';

const API_URL = 'http://localhost:3000';

export const authApi = {
  async login(credentials: { email: string; password: string }) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) throw new Error('Credenciales inválidas');
    return response.json();
  },

  async register(data: { email: string; password: string; confirmPassword: string }) {
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
  },
};

export const portfolioApi = {
  async getPortfolio() {
    const token = await getToken();
    const response = await fetch(`${API_URL}/portfolio`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Error al cargar el portfolio');
    return response.json();
  },

  async getTransactions() {
    const token = await getToken();
    const response = await fetch(`${API_URL}/portfolio/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Error al cargar transacciones');
    return response.json();
  },

  async buy(data: { ticker: string; quantity: number; date: string }) {
    const token = await getToken();
    const response = await fetch(`${API_URL}/portfolio/buy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al registrar compra');
    }
    return response.json();
  },

  async sell(data: { ticker: string; quantity: number; date: string }) {
    const token = await getToken();
    const response = await fetch(`${API_URL}/portfolio/sell`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al registrar venta');
    }
    return response.json();
  },
};

export interface WatchlistItem {
  ticker: string;
  currentPrice: number | null;
  companyName?: string;
}

export interface CompareItem {
  ticker: string;
  [key: string]: unknown;
}

export const watchlistApi = {
  async getList(): Promise<WatchlistItem[]> {
    const token = await getToken();
    const response = await fetch(`${API_URL}/watchlist`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Error al cargar la watchlist');
    return response.json();
  },

  async add(ticker: string): Promise<WatchlistItem> {
    const token = await getToken();
    const response = await fetch(`${API_URL}/watchlist`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al agregar a la watchlist');
    }
    return response.json();
  },

  async remove(ticker: string): Promise<void> {
    const token = await getToken();
    const response = await fetch(`${API_URL}/watchlist/${ticker}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Error al eliminar de la watchlist');
  },

  async compare(tickers: string[]): Promise<CompareItem[]> {
    const token = await getToken();
    const response = await fetch(`${API_URL}/watchlist/compare?tickers=${tickers.join(',')}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Error al comparar empresas');
    return response.json();
  },
};

export interface LastUpdateData {
  lastUpdate: string | null;
  message: string;
  tickersProcessed: number;
  success: number;
  errors: number;
}

export const pricesApi = {
  async getLastUpdate(): Promise<LastUpdateData> {
    const token = await getToken();
    const response = await fetch(`${API_URL}/prices/last-update`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Error al obtener la última actualización de precios');
    return response.json();
  },
};

export const companiesApi = {
  async search(q: string): Promise<{ ticker: string; name: string }[]> {
    const token = await getToken();
    const response = await fetch(`${API_URL}/companies/search?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Error al buscar empresas');
    return response.json();
  },
  async getMetrics(ticker: string) {
    const token = await getToken();
    const response = await fetch(`${API_URL}/companies/${ticker}/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Error al cargar métricas');
    return response.json();
  },
  async getFilings(ticker: string) {
    const token = await getToken();
    const response = await fetch(`${API_URL}/companies/${ticker}/filings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Error al cargar filings');
    return response.json();
  },
  async getHistorical(ticker: string) {
    const token = await getToken();
    const response = await fetch(`${API_URL}/companies/${ticker}/historical-metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Error al cargar historial');
    return response.json();
  },
};

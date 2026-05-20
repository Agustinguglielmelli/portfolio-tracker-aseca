const API_URL = 'http://localhost:3000';

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
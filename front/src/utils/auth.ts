type JwtPayload = {
    role?: string;
};

const decodeTokenPayload = (token: string): JwtPayload | null => {
    const payload = token.split('.')[1];
    if (!payload) return null;
    try {
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = atob(normalized);
        const parsed = JSON.parse(decoded) as JwtPayload;
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
};

export const getRoleFromToken = (token?: string | null): string | null => {
    if (!token) return null;
    const payload = decodeTokenPayload(token);
    return typeof payload?.role === 'string' ? payload.role : null;
};

export const getRedirectPathForToken = (token?: string | null): string | null => {
    if (!token) return null;
    const role = getRoleFromToken(token);
    return role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
};

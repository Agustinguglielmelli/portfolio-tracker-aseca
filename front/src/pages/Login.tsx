import { useState, type SyntheticEvent, type ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { getRedirectPathForToken } from '../utils/auth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (email.length > 256 || password.length > 256) {
            setError('El email y la contraseña no pueden superar los 256 caracteres.');
            return;
        }

        try {
            const data = await authApi.login({ email, password });
            const token = data.token || data.access_token;
            localStorage.setItem('token', token);
            const redirectPath = getRedirectPathForToken(token) || '/dashboard';
            navigate(redirectPath);
        } catch (err) {
            if (err instanceof Error) {
                setError('Credenciales inválidas');
            } else {
                setError('Ocurrió un error inesperado');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Iniciar sesión</h1>
                    <p className="text-slate-400 text-sm mt-1">Portfolio Tracker</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 shadow-xl">

                    {error && (
                        <div className="mb-5 flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-xl px-4 py-3">
                            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                            <input
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 text-slate-100 placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Contraseña</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 text-slate-100 placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        >
                            Ingresar
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-slate-500 mt-5">
                    ¿No tenés cuenta?{' '}
                    <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition">
                        Registrate
                    </Link>
                </p>
            </div>
        </div>
    );
}
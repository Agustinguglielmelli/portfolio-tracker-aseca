import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        /* <!-- US 3.4 --> */
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
            {/* Header */}
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                            Portfolio Tracker
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Panel de control</p>
                    </div>
                    <button
                        id="logout-button"
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/40 hover:text-red-300 transition-all duration-200 text-sm font-medium"
                    >
                        Cerrar Sesión
                    </button>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6">
                    <h2 className="text-xl font-semibold text-slate-100 mb-2">Bienvenido al Dashboard</h2>
                    <p className="text-slate-400 text-sm">Aquí verás el resumen de tu portafolio.</p>
                </div>
            </div>
        </div>
    );
}
import { useNavigate } from 'react-router-dom';
import { PricesUpdateWidget } from '../components/PricesUpdateWidget';

export default function AdminDashboard() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
            {/* Header */}
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
                            Admin Dashboard
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Panel de control de administración</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                        >
                            Ir a Dashboard Usuario
                        </button>
                        <button
                            id="logout-button"
                            onClick={handleLogout}
                            className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/40 hover:text-red-300 transition-all duration-200 text-sm font-medium"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>

                <PricesUpdateWidget />
            </div>
        </div>
    );
}

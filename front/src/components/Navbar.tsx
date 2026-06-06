import { NavLink } from 'react-router-dom';

const links = [
    { to: '/dashboard', label: 'Portfolio' },
    { to: '/search',    label: 'Empresas' },
    { to: '/watchlist', label: 'Watchlist' },
];

export function Navbar() {
    return (
        <nav className="bg-slate-900/80 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
                <span className="text-white font-bold tracking-tight">
                    Portfolio <span className="text-blue-400">Tracker</span>
                </span>
                <div className="flex items-center gap-1">
                    {links.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                                }`
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                </div>
            </div>
        </nav>
    );
}

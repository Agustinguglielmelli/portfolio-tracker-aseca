import { Navbar } from '../components/Navbar';

export default function Watchlist() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-white mb-2">Watchlist</h1>
                <p className="text-slate-400 text-sm">Próximamente.</p>
            </div>
        </div>
    );
}

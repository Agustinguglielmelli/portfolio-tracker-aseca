import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <h1 className="mb-4 text-3xl font-bold">Bienvenido al Dashboard</h1>
            <button
                onClick={handleLogout}
                className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
            >
                Cerrar Sesión
            </button>
        </div>
    );
}
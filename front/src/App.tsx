// front/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import type { JSX } from "react";
import { CompanySearch } from "./components/CompanySearch.tsx";
import { CompanyDetail } from "./components/CompanyDetail.tsx";
import AdminDashboard from './pages/AdminDashboard';
import { getRedirectPathForToken, getRoleFromToken } from './utils/auth';

// Rutas Públicas: Si TIENE token, lo expulsa al dashboard
const PublicRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem('token');
    const redirectPath = getRedirectPathForToken(token);
    if (redirectPath) return <Navigate to={redirectPath} />;
    return children;
};

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/" />;
    return children;
};

const AdminRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/" />;
    const role = getRoleFromToken(token);
    if (role !== 'ADMIN') {
        return <Navigate to="/dashboard" />;
    }
    return children;
};

const RootRedirect = () => {
    const token = localStorage.getItem('token');
    // Si hay token, vas al dashboard. Si no, al login.
    const redirectPath = getRedirectPathForToken(token);
    return redirectPath ? <Navigate to={redirectPath} /> : <Navigate to="/login" />;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<RootRedirect />} />

                {/* --- Rutas Públicas --- */}
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <PublicRoute>
                            <Register />
                        </PublicRoute>
                    }
                />

                {/* --- Rutas Protegidas --- */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/search"
                    element={
                        <ProtectedRoute>
                            <CompanySearch />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/companies/:ticker"
                    element={
                        <ProtectedRoute>
                            <CompanyDetail />
                        </ProtectedRoute>
                    }
                />

                {/* --- Rutas de Admin --- */}
                <Route
                    path="/admin/dashboard"
                    element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
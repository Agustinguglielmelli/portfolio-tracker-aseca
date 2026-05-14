import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { DashboardLayout } from "./components/DashboardLayout";

// Componente intermedio para poder usar los hooks de React Router
function AppRoutes() {
    const navigate = useNavigate();

    // Función que simula el autologin y redigire (todavía no está el isAuthenticated)
    const handleAuth = () => {
        navigate("/dashboard");
    };

    // Función que mueve internamente entre login y register
    const goToRegister = () => navigate("/register");
    const goToLogin = () => navigate("/login");

    return (
        <Routes>
            <Route
                path="/login"
                element={<LoginPage onAuth={handleAuth} goRegister={goToRegister} />}
            />
            <Route
                path="/register"
                element={<RegisterPage onAuth={handleAuth} goLogin={goToLogin} />}
            />
            <Route path="/dashboard" element={<DashboardLayout />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}
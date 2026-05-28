import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import type {JSX} from "react";
import {CompanySearch} from "./components/CompanySearch.tsx";
import {CompanyDetail} from "./components/CompanyDetail.tsx";
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" />;
    return children;
};

const AdminRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" />;
    
    try {
        // Decode the JWT payload using atob
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'ADMIN') {
            return <Navigate to="/dashboard" />;
        }
        return children;
    } catch (e) {
        return <Navigate to="/login" />;
    }
};

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
          />
          <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
          />
            <Route path="/search" element={<CompanySearch />} />
            <Route path="/companies/:ticker" element={<CompanyDetail />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;
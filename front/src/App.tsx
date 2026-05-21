import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import type {JSX} from "react";
import {CompanySearch} from "./components/CompanySearch.tsx";
import {CompanyDetail} from "./components/CompanyDetail.tsx";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return children;
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
            <Route path="/search" element={<CompanySearch />} />
            <Route path="/companies/:ticker" element={<CompanyDetail />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ReportPage from './pages/ReportPage';
import MyReports from './pages/MyReports';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
    return children;
}

function AppRoutes() {
    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/register" element={<AuthPage mode="register" />} />
                <Route path="/report" element={
                    <ProtectedRoute><ReportPage /></ProtectedRoute>
                } />
                <Route path="/my-reports" element={
                    <ProtectedRoute><MyReports /></ProtectedRoute>
                } />
                <Route path="/admin" element={
                    <ProtectedRoute roles={['ngo_admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: { background: '#1a1a2e', color: '#f1f1f5', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 },
                    success: { iconTheme: { primary: '#22c55e', secondary: '#1a1a2e' } },
                    error: { iconTheme: { primary: '#ef4444', secondary: '#1a1a2e' } },
                }}
            />
        </BrowserRouter>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

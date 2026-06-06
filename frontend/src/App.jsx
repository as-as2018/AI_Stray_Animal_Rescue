import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './Shared/Components/Navbar';
import HomePage from './Shared/Pages/HomePage';
import AuthPage from './Shared/Pages/AuthPage';

import AdminLayout from './Portals/Admin/AdminLayout';
import AdminDashboard from './Portals/Admin/AdminDashboard';
import AdminReports from './Portals/Admin/AdminReports';
import AdminReportDetail from './Portals/Admin/AdminReportDetail';

import AdminNGOs from './Portals/Admin/AdminNGOs';
import AdminNGODetail from './Portals/Admin/AdminNGODetail';
import AdminUsers from './Portals/Admin/AdminUsers';
import AdminSettings from './Portals/Admin/AdminSettings';

import UserLayout from './Portals/User/UserLayout';
import ReportPage from './Portals/User/ReportPage';
import MyReports from './Portals/User/MyReports';
import UserSettings from './Portals/User/UserSettings';

import NGOLayout from './Portals/NGO/NGOLayout';
import NGODashboard from './Portals/NGO/NGODashboard';
import NGOReports from './Portals/NGO/NGOReports';
import NGOSettings from './Portals/NGO/NGOSettings';

function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(Number(user.role))) return <Navigate to="/" replace />;
    return children;
}

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<><Navbar /><HomePage /></>} />
                <Route path="/login" element={<><Navbar /><AuthPage mode="login" /></>} />
                <Route path="/register" element={<><Navbar /><AuthPage mode="register" /></>} />
                
                {/* Admin Portal */}
                <Route path="/admin" element={<ProtectedRoute roles={[1]}><AdminLayout /></ProtectedRoute>}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="reports/:id" element={<AdminReportDetail />} />
                    <Route path="ngos" element={<AdminNGOs />} />
                    <Route path="ngos/:id" element={<AdminNGODetail />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="settings" element={<AdminSettings />} />
                </Route>
                
                {/* User Portal */}
                <Route path="/user" element={<ProtectedRoute roles={[2]}><UserLayout /></ProtectedRoute>}>
                    <Route path="report" element={<ReportPage />} />
                    <Route path="my-reports" element={<MyReports />} />
                    <Route path="settings" element={<UserSettings />} />
                </Route>

                {/* NGO Portal */}
                <Route path="/ngo" element={<ProtectedRoute roles={[3]}><NGOLayout /></ProtectedRoute>}>
                    <Route index element={<NGODashboard />} />
                    <Route path="reports" element={<NGOReports />} />
                    <Route path="rlhf" element={<NGOReports />} />
                    <Route path="settings" element={<NGOSettings />} />
                </Route>
                
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: { background: 'var(--bg-card)', color: 'var(--text-1)', border: '1px solid var(--border)', borderRadius: 10, backdropFilter: 'var(--glass-blur)' },
                    success: { iconTheme: { primary: 'var(--low)', secondary: 'var(--bg-card)' } },
                    error: { iconTheme: { primary: 'var(--critical)', secondary: 'var(--bg-card)' } },
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

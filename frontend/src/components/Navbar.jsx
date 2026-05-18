import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const handleLogout = () => { logout(); navigate('/'); };
    const active = (path) => pathname === path ? 'nav-link active' : 'nav-link';

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">
                <span>🐾</span> StrayRescue AI
            </Link>
            <div className="navbar-links">
                {user ? (
                    <>
                        <Link to="/report" className={active('/report')}>📋 Report</Link>
                        <Link to="/my-reports" className={active('/my-reports')}>My Reports</Link>
                        {(user.role === 'ngo_admin' || user.role === 'super_admin') && (
                            <Link to="/admin" className={active('/admin')}>⚙️ Dashboard</Link>
                        )}
                        <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className={active('/login')}>Login</Link>
                        <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

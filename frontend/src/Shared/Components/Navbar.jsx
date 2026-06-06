import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar({ hideNavLinks }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const handleLogout = () => { logout(); navigate('/'); };
    const active = (path) => pathname === path ? 'nav-link active' : 'nav-link';

    return (
        <nav className="navbar" style={hideNavLinks ? { borderBottom: '1px solid var(--border)', background: 'transparent', backdropFilter: 'none' } : {}}>
            <Link to="/" className="navbar-brand">
                <span>🐾</span> StrayRescue AI
            </Link>
            <div className="navbar-links">
                <ThemeToggle />
                
                {hideNavLinks ? (
                    <div className="flex-gap">
                        {user && <span className="text-sm">Hi, {user.name}</span>}
                        <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
                    </div>
                ) : (
                    <>
                        {user ? (
                            <>
                                <Link to="/user/report" className={active('/user/report')}>📋 Report</Link>
                                <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className={active('/login')}>Login</Link>
                                <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
                            </>
                        )}
                    </>
                )}
            </div>
        </nav>
    );
}

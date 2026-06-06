import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AuthPage({ mode }) {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const isLogin = mode === 'login';

    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
    const [isNgo, setIsNgo] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                const u = await login(form.email, form.password);
                toast.success(`Welcome back, ${u.name}!`);
                let redirectUrl = '/';
                if (u.role === 1) redirectUrl = '/admin';
                else if (u.role === 2) redirectUrl = '/user/report';
                else if (u.role === 3) redirectUrl = '/ngo';
                navigate(redirectUrl);
            } else {
                if (form.password.length < 6) { toast.error('Password must be 6+ characters'); return; }
                const u = await register(form.name, form.email, form.password, form.phone, isNgo);
                toast.success(`Account created! Welcome, ${u.name}`);
                navigate(isNgo ? '/ngo/settings' : '/user/report');
            }
        } catch (err) {
            toast.error(err?.response?.data?.detail || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div style={{ fontSize: 36, marginBottom: 12, textAlign: 'center' }}>🐾</div>
                <h1 className="auth-title text-center">{isLogin ? 'Welcome back' : 'Create account'}</h1>
                <p className="auth-sub text-center">
                    {isLogin ? 'Sign in to report stray animals' : 'Join the rescue network today'}
                </p>
                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                            <button type="button" onClick={() => setIsNgo(false)} className={`btn ${!isNgo ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }}>Citizen</button>
                            <button type="button" onClick={() => setIsNgo(true)} className={`btn ${isNgo ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }}>NGO / Clinic</button>
                        </div>
                    )}
                    {!isLogin && (
                        <div className="form-group">
                            <label className="label">Full Name</label>
                            <input className="input" name="name" value={form.name} onChange={handleChange} required placeholder="Your name" />
                        </div>
                    )}
                    <div className="form-group">
                        <label className="label">Email Address</label>
                        <input className="input" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
                    </div>
                    <div className="form-group">
                        <label className="label">Password</label>
                        <input className="input" name="password" type="password" value={form.password} onChange={handleChange} required placeholder="••••••••" />
                    </div>
                    {!isLogin && (
                        <div className="form-group">
                            <label className="label">Phone <span style={{ color: 'var(--text-3)' }}>(optional)</span></label>
                            <input className="input" name="phone" value={form.phone} onChange={handleChange} placeholder="+91-XXXXXXXXXX" />
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary btn-full mt-4" disabled={loading}>
                        {loading ? <span className="spinner" /> : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>
                <p className="auth-switch">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Register' : 'Sign in'}</Link>
                </p>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';

export default function NGODashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setErrorMsg(null);
            try {
                const res = await API.get('/ngo/dashboard');
                setStats(res.data);
            } catch (err) {
                const detail = err?.response?.data?.detail;
                setErrorMsg(detail || 'Failed to load NGO dashboard stats');
                if (!detail) toast.error('Failed to load NGO dashboard stats');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="page text-center" style={{ paddingTop: 80 }}>
            <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        </div>
    );

    return (
        <div className="page" style={{ padding: '0px' }}>
            {errorMsg ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', marginTop: 40 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                    <h1 style={{ marginBottom: 8, color: 'var(--critical)' }}>Access Denied</h1>
                    <p className="text-muted" style={{ maxWidth: 500, margin: '0 auto' }}>{errorMsg}</p>
                </div>
            ) : (
                <>
                    <h1 className="page-title">🏥 {stats?.ngo_name || 'NGO Portal'} Dashboard</h1>
                    <p className="page-subtitle">Welcome back. View your active triage queue below.</p>

                    {stats && (
                        <div className="grid-4 mb-8">
                            {[
                                { label: 'Assigned Rescues', value: stats.total, icon: '📋', color: '#6366f1' },
                                { label: '🔴 Critical', value: stats.critical, icon: '🚨', color: '#ef4444' },
                                { label: 'Pending Action', value: stats.pending, icon: '⏳', color: '#f59e0b' },
                                { label: 'Resolved', value: stats.resolved, icon: '✅', color: '#22c55e' },
                            ].map((s) => (
                                <div className="stat-card" key={s.label}>
                                    <div className="stat-icon">{s.icon}</div>
                                    <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                                    <div className="stat-label">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

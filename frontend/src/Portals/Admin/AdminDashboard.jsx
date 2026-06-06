import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { UrgencyBadge, StatusBadge } from '../../Shared/Components/Badges';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

const TIER_COLORS = { CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#3b82f6', LOW: '#22c55e', MONITOR: '#6b7280' };

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const statsRes = await API.get('/admin/dashboard');
            setStats(statsRes.data);
        } catch { toast.error('Failed to load dashboard'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) return (
        <div className="page text-center" style={{ paddingTop: 80 }}>
            <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
            <p className="text-muted mt-4">Loading dashboard...</p>
        </div>
    );

    const pieData = stats ? [
        { name: 'Critical', value: stats.critical, color: TIER_COLORS.CRITICAL },
        { name: 'High', value: stats.high, color: TIER_COLORS.HIGH },
        { name: 'Resolved', value: stats.resolved, color: TIER_COLORS.LOW },
        { name: 'Pending', value: stats.pending, color: '#6366f1' },
    ].filter(d => d.value > 0) : [];

    const barData = stats ? [
        { name: 'Pending', value: stats.pending },
        { name: 'In Progress', value: stats.in_progress },
        { name: 'Resolved', value: stats.resolved },
    ] : [];

    return (
        <div className="page">
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>👑</span> Super Admin Dashboard
            </h1>
            <p className="page-subtitle">Platform-wide overview of rescues, NGOs, and citizens</p>

            {/* Platform Metrics */}
            {stats && (
                <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
                    <div className="card" style={{ flex: 1, minWidth: 200, padding: 24, background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99, 102, 241, 0.1) 100%)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👥</div>
                            <div>
                                <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Registered Citizens</div>
                                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)' }}>{stats.total_users}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card" style={{ flex: 1, minWidth: 200, padding: 24, background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(34, 197, 94, 0.1) 100%)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏥</div>
                            <div>
                                <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Active NGOs</div>
                                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)' }}>{stats.active_ngos}</div>
                                {stats.total_ngos - stats.active_ngos > 0 && (
                                    <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 4, fontWeight: 500 }}>
                                        {stats.total_ngos - stats.active_ngos} pending approval
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ flex: 1, minWidth: 200, padding: 24, background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(245, 158, 11, 0.1) 100%)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🚨</div>
                            <div>
                                <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Rescues</div>
                                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)' }}>{stats.total}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rescue Report Metrics */}
            {stats && (
                <div className="grid-4 mb-8">
                    {[
                        { label: 'Pending Assignment', value: stats.pending, icon: '⏳', color: '#f59e0b' },
                        { label: 'In Progress', value: stats.in_progress, icon: '🚑', color: '#3b82f6' },
                        { label: 'Resolved Successfully', value: stats.resolved, icon: '✅', color: '#22c55e' },
                        { label: 'Critical Emergencies', value: stats.critical, icon: '🔴', color: '#ef4444' },
                    ].map((s) => (
                        <div className="stat-card" key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <div className="stat-icon" style={{ background: `${s.color}15` }}>{s.icon}</div>
                            <div className="stat-value" style={{ color: s.color, fontSize: 32, fontWeight: 800 }}>{s.value}</div>
                            <div className="stat-label" style={{ fontWeight: 600 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Charts */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 32 }}>
                    <div className="card">
                        <h3 style={{ marginBottom: 24, fontWeight: 700, fontSize: 18 }}>Rescue Pipeline</h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" tick={{ fill: 'var(--text-2)', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} 
                                    cursor={{ fill: 'var(--bg-2)' }}
                                />
                                <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: 24, fontWeight: 700, fontSize: 18 }}>AI Urgency Distribution</h3>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <ResponsiveContainer width="60%" height={240}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={4} stroke="none">
                                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                                {pieData.map((d) => (
                                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: d.color }}></div>
                                            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{d.name}</span>
                                        </div>
                                        <span style={{ fontSize: 16, fontWeight: 700, color: d.color }}>{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Reports List */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>Live Rescue Feed</h3>
                    <Link to="/admin/reports" className="btn btn-outline btn-sm">View All</Link>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {stats?.recent_reports?.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg-2)', borderRadius: 12 }}>
                            <div style={{ fontSize: 32, marginBottom: 12 }}>🐾</div>
                            <p className="text-muted">No rescue reports yet.</p>
                        </div>
                    ) : stats?.recent_reports?.map(r => (
                        <Link 
                            to={`/admin/reports/${r.report_id}`} 
                            key={r.report_id} 
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: 16, padding: 16, 
                                background: 'var(--bg-2)', borderRadius: 12, textDecoration: 'none', color: 'inherit',
                                transition: 'all 0.2s ease', border: '1px solid transparent'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <img src={r.thumbnail_url || r.image_url} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{r.species || 'Unknown Animal'}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-3)', fontFamily: 'monospace' }}>{r.report_id}</div>
                            </div>
                            <div style={{ flex: 1 }}>
                                {r.address ? (
                                    <div style={{ fontSize: 13, color: 'var(--text-2)' }}>📍 {r.address}</div>
                                ) : (
                                    <div style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic' }}>GPS coordinates only</div>
                                )}
                                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                                    {new Date(r.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                <UrgencyBadge tier={r.urgency_tier} />
                                <StatusBadge status={r.status} />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

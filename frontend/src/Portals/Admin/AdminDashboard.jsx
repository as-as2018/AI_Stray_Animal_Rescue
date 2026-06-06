import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { UrgencyBadge, StatusBadge } from '../../Shared/Components/Badges';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const TIER_COLORS = { CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#3b82f6', LOW: '#22c55e', MONITOR: '#6b7280' };

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [tierFilter, setTierFilter] = useState('');
    const [updating, setUpdating] = useState(null);

    const fetchData = async () => {
        try {
            const [statsRes, reportsRes] = await Promise.all([
                API.get('/admin/dashboard'),
                API.get('/admin/reports', { params: { status: statusFilter || undefined, tier: tierFilter || undefined } }),
            ]);
            setStats(statsRes.data);
            setReports(reportsRes.data.items || reportsRes.data);
        } catch { toast.error('Failed to load dashboard'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [statusFilter, tierFilter]);

    const updateStatus = async (reportId, newStatus) => {
        setUpdating(reportId);
        try {
            await API.patch(`/admin/reports/${reportId}`, { status: newStatus });
            toast.success(`Status updated to "${newStatus}"`);
            fetchData();
        } catch { toast.error('Update failed'); }
        finally { setUpdating(null); }
    };

    const updateTier = async (reportId, newTier) => {
        setUpdating(reportId);
        try {
            await API.patch(`/admin/reports/${reportId}/tier`, { tier: newTier });
            toast.success(`Urgency Tier updated to "${newTier}"! RLHF reward logged.`);
            fetchData();
        } catch { toast.error('Update failed'); }
        finally { setUpdating(null); }
    };

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
            <h1 className="page-title">⚙️ NGO Dashboard</h1>
            <p className="page-subtitle">Manage rescue reports and track outcomes</p>

            {/* Stat cards */}
            {stats && (
                <div className="grid-4 mb-8">
                    {[
                        { label: 'Total Reports', value: stats.total, icon: '📋', color: '#6366f1' },
                        { label: '🔴 Critical', value: stats.critical, icon: '🚨', color: '#ef4444' },
                        { label: 'Pending', value: stats.pending, icon: '⏳', color: '#f59e0b' },
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

            {/* Charts */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 32 }}>
                    <div className="card">
                        <h3 style={{ marginBottom: 16, fontWeight: 600, fontSize: 15 }}>Cases by Status</h3>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={barData}>
                                <XAxis dataKey="name" tick={{ fill: '#a0a0b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#a0a0b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: 16, fontWeight: 600, fontSize: 15 }}>Urgency Distribution</h3>
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                                    dataKey="value" paddingAngle={3}>
                                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                            {pieData.map((d) => (
                                <span key={d.name} style={{ fontSize: 12, color: d.color }}>● {d.name} ({d.value})</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Reports List (Lightweight) */}
            <div className="card">
                <h3 style={{ marginBottom: 16, fontWeight: 600, fontSize: 15 }}>Recent Reports</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {stats?.recent_reports?.length === 0 ? (
                        <p className="text-muted text-sm">No recent reports.</p>
                    ) : stats?.recent_reports?.map(r => (
                        <div key={r.report_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg-2)', borderRadius: 8 }}>
                            <img src={r.thumbnail_url || r.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>{r.species || 'Unknown Species'}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>ID: {r.report_id}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <UrgencyBadge tier={r.urgency_tier} />
                                <div style={{ marginTop: 4 }}><StatusBadge status={r.status} /></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

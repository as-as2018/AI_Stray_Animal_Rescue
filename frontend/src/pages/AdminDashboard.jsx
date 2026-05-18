import { useEffect, useState } from 'react';
import API from '../services/api';
import { UrgencyBadge, StatusBadge } from '../components/Badges';
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
            setReports(reportsRes.data);
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

            {/* Filters */}
            <div className="flex-gap mb-4" style={{ flexWrap: 'wrap' }}>
                <select className="input" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    {['pending', 'assigned', 'in_progress', 'resolved'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="input" style={{ width: 'auto' }} value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
                    <option value="">All Tiers</option>
                    {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MONITOR'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {/* Reports Table */}
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Photo</th>
                            <th>Report ID</th>
                            <th>Species / Condition</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Location</th>
                            <th>Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>No reports found</td></tr>
                        ) : reports.map((r) => (
                            <tr key={r.id}>
                                <td>
                                    <img src={r.thumbnail_url || r.image_url} alt="" className="animal-thumb" />
                                </td>
                                <td>
                                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--primary-hover)' }}>{r.report_id}</span>
                                </td>
                                <td>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.species || '—'}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{r.injury_label || '—'}</div>
                                    <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>{r.urgency_score}/100</div>
                                </td>
                                <td><UrgencyBadge tier={r.urgency_tier} /></td>
                                <td><StatusBadge status={r.status} /></td>
                                <td style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 140 }}>
                                    {r.address ? r.address.slice(0, 40) + (r.address.length > 40 ? '…' : '') : (
                                        r.latitude ? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}` : '—'
                                    )}
                                </td>
                                <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                </td>
                                <td>
                                    <select
                                        className="input btn-sm"
                                        style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
                                        value={r.status}
                                        disabled={updating === r.report_id}
                                        onChange={(e) => updateStatus(r.report_id, e.target.value)}
                                    >
                                        {['pending', 'assigned', 'in_progress', 'resolved'].map(s =>
                                            <option key={s} value={s}>{s}</option>
                                        )}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

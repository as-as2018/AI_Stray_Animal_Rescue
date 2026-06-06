import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { UrgencyBadge, StatusBadge } from '../../Shared/Components/Badges';
import toast from 'react-hot-toast';

export default function AdminReports() {
    const [reports, setReports] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    
    const [statusFilter, setStatusFilter] = useState('');
    const [tierFilter, setTierFilter] = useState('');
    const [updating, setUpdating] = useState(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    const [page, setPage] = useState(0);
    const limit = 10;

    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await API.get('/admin/reports', { 
                params: { 
                    status: statusFilter || undefined, 
                    tier: tierFilter || undefined,
                    search: debouncedSearch || undefined,
                    skip: page * limit,
                    limit
                } 
            });
            setReports(res.data.items || res.data);
            setTotal(res.data.total || 0);
        } catch { toast.error('Failed to load reports'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchReports(); }, [statusFilter, tierFilter, page, debouncedSearch]);

    const updateStatus = async (reportId, newStatus) => {
        setUpdating(reportId);
        try {
            await API.patch(`/admin/reports/${reportId}`, { status: newStatus });
            toast.success(`Status updated to "${newStatus}"`);
            fetchReports();
        } catch { toast.error('Update failed'); }
        finally { setUpdating(null); }
    };

    const updateTier = async (reportId, newTier) => {
        setUpdating(reportId);
        try {
            await API.patch(`/admin/reports/${reportId}/tier`, { tier: newTier });
            toast.success(`Urgency Tier updated to "${newTier}"! RLHF reward logged.`);
            fetchReports();
        } catch { toast.error('Update failed'); }
        finally { setUpdating(null); }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="page" style={{ padding: '0px' }}>
            <h1 className="page-title">📋 Manage Reports</h1>
            <p className="page-subtitle">View, triage, and re-assign incoming rescue reports</p>

            <div className="flex-between mb-4" style={{ flexWrap: 'wrap' }}>
                <input
                    type="text"
                    className="input"
                    placeholder="Search ID or Species..."
                    style={{ maxWidth: 260 }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="flex-gap">
                    <select className="input" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                        <option value="">All Statuses</option>
                        {['pending', 'assigned', 'in_progress', 'resolved'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select className="input" style={{ width: 'auto' }} value={tierFilter} onChange={(e) => { setTierFilter(e.target.value); setPage(0); }}>
                        <option value="">All Tiers</option>
                        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MONITOR'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

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
                        {loading ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                        ) : reports.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>No reports found</td></tr>
                        ) : reports.map((r) => (
                            <tr key={r.id}>
                                <td>
                                    <img src={r.thumbnail_url || r.image_url} alt="" className="animal-thumb" />
                                </td>
                                <td>
                                    <Link to={`/admin/reports/${r.report_id}`} style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'var(--primary-hover)', textDecoration: 'none' }}>
                                        {r.report_id}
                                    </Link>
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
                                        style={{ padding: '4px 8px', fontSize: 12, width: 'auto', marginBottom: 4 }}
                                        value={r.status}
                                        disabled={updating === r.report_id}
                                        onChange={(e) => updateStatus(r.report_id, e.target.value)}
                                    >
                                        {['pending', 'assigned', 'in_progress', 'resolved'].map(s =>
                                            <option key={s} value={s}>{s}</option>
                                        )}
                                    </select>
                                    <br/>
                                    <select
                                        className="input btn-sm"
                                        style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
                                        value={r.urgency_tier}
                                        disabled={updating === r.report_id}
                                        onChange={(e) => updateTier(r.report_id, e.target.value)}
                                        title="Correct AI Tier for RLHF"
                                    >
                                        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MONITOR'].map(s =>
                                            <option key={s} value={s}>{s}</option>
                                        )}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="pagination">
                    <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</button>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Page {page + 1} of {totalPages || 1}</span>
                    <button className="page-btn" disabled={page >= totalPages - 1 || totalPages === 0} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
            </div>
        </div>
    );
}

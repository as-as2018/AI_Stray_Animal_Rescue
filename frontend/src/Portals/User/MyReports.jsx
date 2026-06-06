import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { UrgencyBadge, StatusBadge } from '../../Shared/Components/Badges';
import ListControls from '../../Shared/Components/ListControls';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function MyReports() {
    const [reports, setReports] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [dashboard, setDashboard] = useState(null);
    
    // Pagination & Search & Filter & Sort
    const [page, setPage] = useState(0);
    const limit = 10;
    const [statusFilter, setStatusFilter] = useState('');
    const [tierFilter, setTierFilter] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        setLoading(true);
        // Fetch dashboard stats once or when reports update
        API.get('/reports/dashboard').then(({ data }) => setDashboard(data)).catch(() => {});
        
        API.get('/reports/', { 
            params: { 
                skip: page * limit, 
                limit,
                search: debouncedSearch || undefined,
                status: statusFilter || undefined,
                tier: tierFilter || undefined,
                sort_by: sortBy,
                sort_order: sortOrder
            } 
        })
        .then(({ data }) => {
            setReports(data.items || data);
            setTotal(data.total || 0);
        })
        .catch(() => toast.error('Failed to load reports'))
        .finally(() => setLoading(false));
    }, [page, debouncedSearch, statusFilter, tierFilter, sortBy, sortOrder]);

    const totalPages = Math.ceil(total / limit);

    if (loading && reports.length === 0) return (
        <div className="page text-center" style={{ paddingTop: 80 }}>
            <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
            <p className="text-muted mt-4">Loading your reports...</p>
        </div>
    );

    return (
        <div className="page">
            <div className="flex-between mb-6">
                <div>
                    <h1 className="page-title">My Reports</h1>
                    <p className="page-subtitle">Track your submitted rescue cases</p>
                </div>
                <Link to="/user/report" className="btn btn-primary">+ New Report</Link>
            </div>

            {/* KPI Dashboard */}
            {dashboard && (
                <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
                    <div className="card" style={{ flex: 1, minWidth: 150, textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-1)' }}>{dashboard.total}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Total Submitted</div>
                    </div>
                    <div className="card" style={{ flex: 1, minWidth: 150, textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--critical)' }}>{dashboard.pending}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Pending Assignment</div>
                    </div>
                    <div className="card" style={{ flex: 1, minWidth: 150, textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)' }}>{dashboard.in_progress}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>In Progress</div>
                    </div>
                    <div className="card" style={{ flex: 1, minWidth: 150, textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--low)' }}>{dashboard.resolved}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Resolved</div>
                    </div>
                </div>
            )}
            
            <ListControls 
                searchPlaceholder="Search your reports..."
                onSearchChange={(val) => { setDebouncedSearch(val); setPage(0); }}
                statusFilter={statusFilter}
                onStatusChange={(val) => { setStatusFilter(val); setPage(0); }}
                tierFilter={tierFilter}
                onTierChange={(val) => { setTierFilter(val); setPage(0); }}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
            />

            {total === 0 && !loading ? (
                <div className="card text-center" style={{ padding: 60 }}>
                    <div style={{ fontSize: 48 }}>🐾</div>
                    <h3 style={{ marginTop: 12, marginBottom: 8 }}>No reports yet</h3>
                    <p className="text-muted text-sm" style={{ marginBottom: 20 }}>You haven't submitted any animal rescue reports.</p>
                    <Link to="/user/report" className="btn btn-primary">Submit Your First Report</Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {reports.map((r) => (
                        <div key={r.id} className="card card-hover" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            <img
                                src={r.thumbnail_url || r.image_url}
                                alt="Animal"
                                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="flex-gap mb-4" style={{ flexWrap: 'wrap' }}>
                                    <UrgencyBadge tier={r.urgency_tier} />
                                    <StatusBadge status={r.status} />
                                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-3)' }}>{r.report_id}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 14 }}>
                                        <span className="text-muted">Species:</span> <strong>{r.species || '—'}</strong>
                                    </span>
                                    <span style={{ fontSize: 14 }}>
                                        <span className="text-muted">Condition:</span>{' '}
                                        <strong>{r.user_injury_label || r.injury_label || '—'}</strong>
                                        {r.user_injury_label && r.user_injury_label !== r.injury_label && (
                                            <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6 }} title="AI Prediction">
                                                (AI: {r.injury_label})
                                            </span>
                                        )}
                                    </span>
                                    <span style={{ fontSize: 14 }}>
                                        <span className="text-muted">Score:</span> <strong style={{ color: '#6366f1' }}>{r.urgency_score}/100</strong>
                                    </span>
                                </div>
                                {r.address && <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>📍 {r.address}</p>}
                            </div>
                            <div style={{ flexShrink: 0, textAlign: 'right' }}>
                                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="pagination" style={{ marginTop: 20 }}>
                        <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</button>
                        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Page {page + 1} of {totalPages || 1}</span>
                        <button className="page-btn" disabled={page >= totalPages - 1 || totalPages === 0} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                </div>
            )}
        </div>
    );
}

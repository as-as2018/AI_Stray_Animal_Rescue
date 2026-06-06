import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { UrgencyBadge, StatusBadge } from '../../Shared/Components/Badges';

export default function AdminNGODetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [ngo, setNgo] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ngoRes, reportsRes] = await Promise.all([
                API.get(`/admin/ngos/${id}`),
                API.get('/admin/reports', { params: { ngo_id: id, limit: 50 } })
            ]);
            setNgo(ngoRes.data);
            setReports(reportsRes.data.items);
        } catch (err) {
            toast.error("Failed to load NGO details");
            navigate('/admin/ngos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const toggleStatus = async () => {
        try {
            await API.patch(`/admin/ngos/${id}/toggle`);
            toast.success('Status updated');
            fetchData();
        } catch (err) {
            toast.error(err?.response?.data?.detail || 'Failed to update status');
        }
    };

    if (loading) return <div className="page text-center" style={{ paddingTop: 80 }}><span className="spinner" /></div>;
    if (!ngo) return null;

    const isMissingData = !ngo.latitude || !ngo.longitude;

    return (
        <div className="page" style={{ padding: '0px' }}>
            <div className="mb-4">
                <Link to="/admin/ngos" style={{ color: 'var(--text-2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>←</span> Back to NGOs
                </Link>
            </div>

            <div className="card mb-8">
                <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
                            🏥 {ngo.name}
                            {ngo.is_active ? 
                                <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--low)' }}>Approved & Active</span> : 
                                <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--critical)' }}>Pending Approval</span>
                            }
                        </h1>
                        <p className="text-muted" style={{ fontSize: 15 }}>{ngo.city} • Contact: {ngo.contact_email}</p>
                    </div>

                    <div>
                        {(!ngo.is_active && isMissingData) ? (
                            <button 
                                className="btn btn-outline"
                                disabled
                                title="The NGO must complete their profile (GPS coordinates) first"
                                style={{ opacity: 0.5, cursor: 'not-allowed' }}
                            >
                                Incomplete Profile
                            </button>
                        ) : (
                            <button 
                                className="btn btn-outline"
                                onClick={toggleStatus}
                            >
                                {ngo.is_active ? 'Revoke Approval' : 'Approve NGO'}
                            </button>
                        )}
                    </div>
                </div>

                <hr style={{ margin: '24px 0', borderColor: 'var(--border)' }} />

                <div className="grid-4">
                    <div>
                        <div className="text-muted text-sm mb-2" style={{ fontWeight: 600 }}>COVERAGE RADIUS</div>
                        <div style={{ fontSize: 16 }}>{ngo.coverage_radius_km} km</div>
                    </div>
                    <div>
                        <div className="text-muted text-sm mb-2" style={{ fontWeight: 600 }}>TOTAL RESCUES</div>
                        <div style={{ fontSize: 16, color: 'var(--primary)', fontWeight: 700 }}>{ngo.total_rescues}</div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <div className="text-muted text-sm mb-2" style={{ fontWeight: 600 }}>GEOGRAPHIC COORDINATES</div>
                        {isMissingData ? (
                            <div style={{ color: 'var(--critical)', fontWeight: 500, fontSize: 14 }}>
                                ⚠️ Missing Coordinates. NGO must log in and fetch location.
                            </div>
                        ) : (
                            <div style={{ fontSize: 14, fontFamily: 'monospace' }}>
                                Lat: {ngo.latitude} <br/>
                                Lng: {ngo.longitude}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <h3 style={{ marginBottom: 16 }}>Rescues Assigned to this NGO</h3>
            
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Report ID</th>
                            <th>Species / Condition</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Location</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>No assigned reports yet</td></tr>
                        ) : reports.map((r) => (
                            <tr key={r.id}>
                                <td>
                                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--primary-hover)' }}>{r.report_id}</span>
                                </td>
                                <td>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.species || '—'}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{r.injury_label || '—'}</div>
                                </td>
                                <td><UrgencyBadge tier={r.urgency_tier} /></td>
                                <td><StatusBadge status={r.status} /></td>
                                <td style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 200 }}>
                                    {r.address ? r.address.slice(0, 50) + (r.address.length > 50 ? '…' : '') : '—'}
                                </td>
                                <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

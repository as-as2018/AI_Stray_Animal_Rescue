import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../services/api';
import { UrgencyBadge, StatusBadge } from '../../Shared/Components/Badges';
import toast from 'react-hot-toast';

export default function AdminReportDetail() {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        API.get(`/admin/reports/${id}`)
            .then(({ data }) => setReport(data))
            .catch(() => toast.error('Failed to load report detail'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="page text-center" style={{ paddingTop: 80 }}>
                <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
                <p className="text-muted mt-4">Loading report...</p>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="page text-center" style={{ paddingTop: 80 }}>
                <h2 className="text-muted">Report not found</h2>
                <Link to="/admin/reports" className="btn btn-outline mt-4">Back to Reports</Link>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="flex-between mb-6">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <Link to="/admin/reports" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>← Back</Link>
                        <h1 className="page-title" style={{ marginBottom: 0 }}>Report Detail</h1>
                    </div>
                    <p className="page-subtitle" style={{ fontFamily: 'monospace', fontSize: 16 }}>{report.report_id}</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <StatusBadge status={report.status} />
                    <UrgencyBadge tier={report.urgency_tier} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
                {/* Left Column: Image & Media */}
                <div>
                    <div className="card mb-4" style={{ padding: 12 }}>
                        <img
                            src={report.image_url}
                            alt="Reported Animal"
                            style={{ width: '100%', borderRadius: 8, objectFit: 'cover' }}
                        />
                    </div>
                </div>

                {/* Right Column: Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    
                    {/* Prediction vs User Feedback (Side by Side) */}
                    <div className="card" style={{ display: 'flex', gap: 20 }}>
                        <div style={{ flex: 1, padding: 16, background: 'rgba(99,102,241,0.05)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginBottom: 8, textTransform: 'uppercase' }}>
                                🤖 AI Prediction
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                                {report.injury_label || '—'}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                                Confidence: {report.ai_confidence ? (report.ai_confidence * 100).toFixed(1) + '%' : 'N/A'}
                            </div>
                        </div>

                        <div style={{ flex: 1, padding: 16, background: 'rgba(34,197,94,0.05)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.2)' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--low)', marginBottom: 8, textTransform: 'uppercase' }}>
                                👤 User Given Feedback
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                                {report.user_injury_label ? report.user_injury_label : (
                                    <span className="text-muted" style={{ fontWeight: 400, fontStyle: 'italic' }}>No override provided</span>
                                )}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                                {report.user_injury_label ? 'User corrected the AI prediction' : 'User accepted AI prediction'}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>Animal Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                            <div>
                                <div className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>Species</div>
                                <div style={{ fontWeight: 600 }}>{report.species?.toUpperCase() || '—'}</div>
                            </div>
                            <div>
                                <div className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>Urgency Score</div>
                                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{report.urgency_score}/100</div>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <div className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>Description</div>
                                <div style={{ lineHeight: 1.5 }}>{report.description || 'No description provided.'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>Location & Reporter</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                            <div>
                                <div className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>Address</div>
                                <div>{report.address || '—'}</div>
                            </div>
                            <div>
                                <div className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>Coordinates</div>
                                <div>{report.latitude ? `${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}` : '—'}</div>
                            </div>
                            <div>
                                <div className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>Reporter Name</div>
                                <div>{report.reporter_name}</div>
                            </div>
                            <div>
                                <div className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>Reported On</div>
                                <div>{new Date(report.created_at).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../services/api';
import { UrgencyBadge } from '../components/Badges';

export default function ReportPage() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [form, setForm] = useState({ description: '', is_juvenile: false });
    const [location, setLocation] = useState({ latitude: null, longitude: null, address: '' });
    const [gpsLoading, setGpsLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const onDrop = useCallback((accepted) => {
        const f = accepted[0];
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setResult(null);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: { 'image/*': [] }, maxFiles: 1,
    });

    const getGPS = () => {
        if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, address: '' });
                setGpsLoading(false);
                toast.success('Location captured!');
            },
            () => { toast.error('Location permission denied'); setGpsLoading(false); }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) { toast.error('Please upload an image'); return; }
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            if (location.latitude) fd.append('latitude', location.latitude);
            if (location.longitude) fd.append('longitude', location.longitude);
            if (location.address) fd.append('address', location.address);
            if (form.description) fd.append('description', form.description);
            fd.append('is_juvenile', form.is_juvenile);

            const { data } = await API.post('/reports/', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResult(data);
            toast.success('Report submitted successfully!');
        } catch (err) {
            toast.error(err?.response?.data?.detail || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    const tierColor = {
        CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#3b82f6', LOW: '#22c55e', MONITOR: '#6b7280'
    };

    return (
        <div className="page" style={{ maxWidth: 720 }}>
            <h1 className="page-title">📋 Report an Animal</h1>
            <p className="page-subtitle">Upload a photo and our AI will assess the animal's condition instantly.</p>

            {!result ? (
                <form onSubmit={handleSubmit}>
                    {/* Image upload */}
                    <div className="card mb-6">
                        <h3 style={{ marginBottom: 14, fontWeight: 600 }}>1. Upload Photo</h3>
                        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                            <input {...getInputProps()} />
                            <div className="dropzone-icon">📷</div>
                            <p style={{ fontWeight: 600 }}>Drag & drop or click to upload</p>
                            <p className="dropzone-text">JPG, PNG — max 10MB</p>
                        </div>
                        {preview && <img src={preview} alt="Preview" className="preview-img" />}
                    </div>

                    {/* Location */}
                    <div className="card mb-6">
                        <h3 style={{ marginBottom: 14, fontWeight: 600 }}>2. Location</h3>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                            <button type="button" className="btn btn-outline" onClick={getGPS} disabled={gpsLoading}>
                                {gpsLoading ? <span className="spinner" /> : '📍'} Use My Location
                            </button>
                            {location.latitude && (
                                <span style={{ color: 'var(--low)', fontSize: 14, alignSelf: 'center' }}>
                                    ✅ {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                                </span>
                            )}
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="label">Address / Landmark (optional)</label>
                            <input className="input" value={location.address}
                                onChange={(e) => setLocation({ ...location, address: e.target.value })}
                                placeholder="e.g. Near Central Park, Gate 3" />
                        </div>
                    </div>

                    {/* Details */}
                    <div className="card mb-6">
                        <h3 style={{ marginBottom: 14, fontWeight: 600 }}>3. Additional Details</h3>
                        <div className="form-group">
                            <label className="label">Description (optional)</label>
                            <textarea className="input" value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Describe the animal's condition, behaviour, surroundings..." />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                            <input type="checkbox" checked={form.is_juvenile}
                                onChange={(e) => setForm({ ...form, is_juvenile: e.target.checked })}
                                style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                            <span>This appears to be a pup / kitten (juvenile)</span>
                        </label>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" style={{ fontSize: 16, padding: '14px' }} disabled={loading}>
                        {loading ? <><span className="spinner" /> &nbsp;Analyzing with AI...</> : '🚀 Submit Report'}
                    </button>
                </form>
            ) : (
                /* Result */
                <div>
                    <div className="result-card mb-6">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Urgency Score</div>
                                <div className="result-score" style={{ color: tierColor[result.urgency_tier] || '#fff' }}>
                                    {result.urgency_score}
                                </div>
                                <div style={{ marginTop: 8 }}><UrgencyBadge tier={result.urgency_tier} /></div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Report ID</div>
                                <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: 'var(--primary-hover)' }}>{result.report_id}</div>
                            </div>
                        </div>

                        <div className="result-grid">
                            {[
                                ['Species', result.ai_result.species?.toUpperCase() || '—'],
                                ['Condition', result.ai_result.injury_label],
                                ['Detection Confidence', `${(result.ai_result.detection_confidence * 100).toFixed(1)}%`],
                                ['AI Confidence', `${(result.ai_result.ai_confidence * 100).toFixed(1)}%`],
                            ].map(([l, v]) => (
                                <div className="result-field" key={l}>
                                    <div className="result-field-label">{l}</div>
                                    <div className="result-field-value">{v}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(34,197,94,0.08)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.2)', fontSize: 14 }}>
                            ✅ {result.message}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={() => { setResult(null); setFile(null); setPreview(null); }}>
                            📋 Report Another
                        </button>
                        <button className="btn btn-outline" onClick={() => navigate('/my-reports')}>
                            View My Reports →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

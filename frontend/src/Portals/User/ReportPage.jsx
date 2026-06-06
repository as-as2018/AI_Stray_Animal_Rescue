import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../../services/api';
import { UrgencyBadge } from '../../Shared/Components/Badges';
import LocationPicker from '../../Shared/Components/LocationPicker';

export default function ReportPage() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [form, setForm] = useState({ description: '', is_juvenile: false });
    const [location, setLocation] = useState({ latitude: null, longitude: null, address: '' });
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [result, setResult] = useState(null);

    const onDrop = useCallback((accepted) => {
        const f = accepted[0];
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setResult(null);
        setAiResult(null); // Reset AI result when new image is chosen
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, 
        accept: { 'image/*': [] }, 
        maxFiles: 1,
        disabled: !location.latitude
    });

    const handleAnalyze = async () => {
        if (!file) { toast.error('Please upload an image first'); return; }
        setAnalyzing(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const { data } = await API.post('/reports/analyze-image', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAiResult(data);
            setForm({ 
                ...form, 
                description: data.moondream_text, 
                user_injury_label: data.injury_label 
            });
            toast.success('AI Analysis Complete! Please verify.');
        } catch (err) {
            toast.error(err?.response?.data?.detail || 'Analysis failed');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location.latitude || !location.longitude) { toast.error('Please provide a location first'); return; }
        if (!file) { toast.error('Please upload an image'); return; }
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            fd.append('latitude', location.latitude);
            fd.append('longitude', location.longitude);
            if (location.address) fd.append('address', location.address);
            if (form.description) fd.append('description', form.description);
            fd.append('is_juvenile', form.is_juvenile);
            
            // HITL: Pass original AI analysis and the user's selected injury label
            if (aiResult) {
                fd.append('moondream_text', aiResult.moondream_text);
                fd.append('ai_species', aiResult.species);
                fd.append('ai_injury_label', aiResult.injury_label);
                fd.append('ai_confidence', aiResult.ai_confidence);
                fd.append('user_injury_label', form.user_injury_label);
            }

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
            <p className="page-subtitle">Provide location and upload a photo. Our AI will assess the animal's condition instantly.</p>

            {!result ? (
                <form onSubmit={handleSubmit}>
                    
                    {/* Location */}
                    <div className="card mb-6">
                        <h3 style={{ marginBottom: 14, fontWeight: 600 }}>1. Location Required</h3>
                        <p className="text-muted text-sm mb-4">We need the location first to determine if there's an NGO available in this area.</p>
                        <LocationPicker location={location} setLocation={setLocation} />
                    </div>

                    {/* Image upload */}
                    <div className="card mb-6" style={{ opacity: !location.latitude ? 0.5 : 1, transition: 'opacity 0.3s' }}>
                        <h3 style={{ marginBottom: 14, fontWeight: 600 }}>2. Upload Photo</h3>
                        {!location.latitude ? (
                            <div style={{ padding: 30, textAlign: 'center', background: 'var(--bg-card)', border: '2px dashed var(--border)', borderRadius: 12 }}>
                                <p style={{ fontWeight: 600, color: 'var(--text-3)' }}>Please select a location above first.</p>
                            </div>
                        ) : (
                            <>
                                <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                                    <input {...getInputProps()} />
                                    <div className="dropzone-icon">📷</div>
                                    <p style={{ fontWeight: 600 }}>Drag & drop or click to upload</p>
                                    <p className="dropzone-text">JPG, PNG — max 10MB</p>
                                </div>
                                {preview && (
                                    <div style={{ marginTop: 16 }}>
                                        <img src={preview} alt="Preview" className="preview-img" style={{ marginBottom: 16 }} />
                                        {!aiResult && (
                                            <button 
                                                type="button" 
                                                className="btn btn-primary btn-full" 
                                                onClick={handleAnalyze} 
                                                disabled={analyzing}
                                            >
                                                {analyzing ? <><span className="spinner" /> &nbsp;⏳ Waiting for AI prediction...</> : '🤖 Analyze Image'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Details */}
                    <div className="card mb-6" style={{ opacity: !aiResult ? 0.5 : 1, transition: 'opacity 0.3s' }}>
                        <h3 style={{ marginBottom: 14, fontWeight: 600 }}>3. Additional Details</h3>
                        
                        {aiResult && (
                            <div style={{ padding: '12px 16px', background: 'rgba(99,102,241,0.1)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.3)', marginBottom: 20 }}>
                                <span style={{ fontSize: 18, marginRight: 8 }}>🤖</span>
                                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--primary)' }}>
                                    AI has analysed the image. You may correct the description if needed — the urgency level is determined by trained experts.
                                </span>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="label">Description (optional)</label>
                            <textarea className="input" rows={4} value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Describe the animal's condition, behaviour, surroundings..." 
                                disabled={!aiResult} />
                        </div>


                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: !aiResult ? 'not-allowed' : 'pointer', fontSize: 14 }}>
                            <input type="checkbox" checked={form.is_juvenile}
                                onChange={(e) => setForm({ ...form, is_juvenile: e.target.checked })}
                                disabled={!aiResult}
                                style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                            <span style={{ color: !aiResult ? 'var(--text-3)' : 'inherit' }}>This appears to be a pup / kitten (juvenile)</span>
                        </label>
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary btn-full" 
                        style={{ fontSize: 16, padding: '14px' }} 
                        disabled={loading || !aiResult || !location.latitude}
                        title={!location.latitude ? "Location required" : !aiResult ? "You must click 'Analyze Image' first" : ""}
                    >
                        {loading ? <><span className="spinner" /> &nbsp;Submitting...</> : '🚀 Submit Report'}
                    </button>
                </form>
            ) : (
                /* Result */
                <div>
                    <div className="result-card mb-6">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
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

                        {(preview || result.image_url) && (
                            <div style={{ marginBottom: 20, textAlign: 'center' }}>
                                <img 
                                    src={preview || result.image_url} 
                                    alt="Reported Animal" 
                                    style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} 
                                />
                            </div>
                        )}

                        <div className="result-grid">
                            {[
                                ['Species', result.ai_result.species?.toUpperCase() || '—'],
                                ['Condition', result.ai_result.moondream_text || result.ai_result.injury_label],
                                ['Urgency Score Predicts', result.ai_result.injury_label],
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
                        <button className="btn btn-primary" onClick={() => { setResult(null); setFile(null); setPreview(null); setLocation({ latitude: null, longitude: null, address: '' }); setAiResult(null); }}>
                            📋 Report Another
                        </button>
                        <button className="btn btn-outline" onClick={() => navigate('/user/my-reports')}>
                            View My Reports →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

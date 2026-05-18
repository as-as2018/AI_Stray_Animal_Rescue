import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
    { icon: '📸', title: 'Photo + GPS Reporting', desc: 'Upload a photo and pin the exact location. Our AI handles the rest.' },
    { icon: '🤖', title: 'AI Triage in 3 Seconds', desc: 'YOLOv8 detects species; EfficientNetV2-S assesses injury severity instantly.' },
    { icon: '🔴', title: 'Urgency Scoring', desc: 'Every case gets a 0–100 urgency score so NGOs triage critical animals first.' },
    { icon: '📧', title: 'Instant NGO Alerts', desc: 'The nearest NGO gets an email with full case details the moment you submit.' },
    { icon: '🗺️', title: 'Live Map Dashboard', desc: 'View all reports on an interactive map, filtered by urgency and status.' },
    { icon: '📊', title: 'Analytics & Trends', desc: 'Track rescue rates, response times, and hotspots over time.' },
];

export default function HomePage() {
    const { user } = useAuth();

    return (
        <div className="hero">
            <p style={{
                color: 'var(--primary-hover)', fontWeight: 600, fontSize: 14, marginBottom: 12,
                background: 'rgba(99,102,241,0.12)', padding: '4px 14px', borderRadius: 999,
                border: '1px solid rgba(99,102,241,0.25)'
            }}>
                🤖 Powered by YOLOv8 + EfficientNetV2-S
            </p>
            <h1 className="hero-title">
                Save Animals Faster<br /><span>with AI Triage</span>
            </h1>
            <p className="hero-sub">
                Report injured stray animals in seconds. Our AI assesses injury severity and dispatches the nearest NGO automatically.
            </p>
            <div className="hero-cta">
                {user ? (
                    <Link to="/report" className="btn btn-primary" style={{ fontSize: 16, padding: '12px 28px' }}>
                        📋 Report an Animal
                    </Link>
                ) : (
                    <>
                        <Link to="/register" className="btn btn-primary" style={{ fontSize: 16, padding: '12px 28px' }}>
                            Get Started — It's Free
                        </Link>
                        <Link to="/login" className="btn btn-outline" style={{ fontSize: 16, padding: '12px 28px' }}>
                            Sign In
                        </Link>
                    </>
                )}
            </div>

            <div className="hero-features">
                {features.map((f) => (
                    <div className="feature-card card-hover" key={f.title}>
                        <div className="feature-icon">{f.icon}</div>
                        <div className="feature-title">{f.title}</div>
                        <div className="feature-desc">{f.desc}</div>
                    </div>
                ))}
            </div>

            <div style={{
                marginTop: 64, padding: '32px', background: 'var(--bg-card)', borderRadius: 16,
                border: '1px solid var(--border)', maxWidth: 700, width: '100%', textAlign: 'left'
            }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                    {['YOLOv8m', 'EfficientNetV2-S', 'FastAPI', 'MongoDB', 'React.js'].map(t => (
                        <span key={t} style={{
                            background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-2)',
                            padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600
                        }}>{t}</span>
                    ))}
                </div>
                <h3 style={{ marginBottom: 8 }}>How It Works</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                    {[
                        ['1', 'Upload a photo of the animal', '📸'],
                        ['2', 'AI detects species & assesses injury in ~3 sec', '🧠'],
                        ['3', 'Urgency score assigned (0–100)', '🔢'],
                        ['4', 'Nearest NGO notified via email', '📧'],
                    ].map(([n, text, icon]) => (
                        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{
                                width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 800, flexShrink: 0
                            }}>{n}</span>
                            <span style={{ fontSize: 14, color: 'var(--text-2)' }}>{icon} {text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

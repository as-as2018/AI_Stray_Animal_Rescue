import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const features = [
    { icon: '📸', title: 'Photo + GPS Reporting', desc: 'Upload a photo and pin the exact location. Our AI handles the rest.' },
    { icon: '🧠', title: 'Custom AI Triage', desc: 'Our custom-trained AI model assesses injury severity instantly.' },
    { icon: '📊', title: 'Severity & Confidence', desc: 'Predicts severity (LOW, MEDIUM, HIGH, CRITICAL) with a precise AI Confidence score.' },
    { icon: '🚑', title: 'Smart NGO Assignment', desc: 'Automatically dispatches the report to the nearest NGO based on precise geospatial routing.' },
    { icon: '🔄', title: 'RLHF Feedback Loop', desc: 'NGOs provide real-world feedback on AI predictions to continuously improve the model.' },
    { icon: '🏢', title: 'Dedicated Portals', desc: 'Role-based access with specialized dashboards for Admins, Users, and NGOs.' },
];

export default function HomePage() {
    const { user } = useAuth();

    return (
        <div className="hero">
            <p style={{
                color: 'var(--primary-hover)', fontWeight: 600, fontSize: 14, marginBottom: 12,
                background: 'var(--primary-glow)', padding: '4px 14px', borderRadius: 999,
                border: '1px solid var(--border)'
            }}>
                🤖 Powered by Custom Trained AI
            </p>
            <h1 className="hero-title">
                Save Animals Faster<br /><span>with AI Triage</span>
            </h1>
            <p className="hero-sub">
                Report injured stray animals in seconds. Our AI assesses injury severity and dispatches the nearest NGO automatically.
            </p>
            <div className="hero-cta">
                {user ? (
                    <Link to="/user/report" className="btn btn-primary" style={{ fontSize: 16, padding: '12px 28px' }}>
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
                    {['Custom AI Model', 'FastAPI', 'Beanie ODM', 'MongoDB', 'React.js', 'Geospatial Routing'].map(t => (
                        <span key={t} style={{
                            background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-2)',
                            padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600
                        }}>{t}</span>
                    ))}
                </div>
                <h3 style={{ marginBottom: 8 }}>How It Works</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                    {[
                        ['1', 'Upload a photo and details of the animal', '📸'],
                        ['2', 'Custom AI assesses injury severity & confidence', '🧠'],
                        ['3', 'Report is auto-assigned to nearest active NGO', '🚑'],
                        ['4', 'NGO provides RLHF feedback to improve AI', '🔄'],
                    ].map(([n, text, icon]) => (
                        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{
                                width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
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

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import API from '../../services/api';

export default function UserSettings() {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);

    // Profile State
    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    // Preferences State
    const [prefs, setPrefs] = useState({
        emailAlerts: localStorage.getItem('emailAlerts') !== 'false', // Default true
        pushAlerts: localStorage.getItem('pushAlerts') === 'true',
    });

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.patch('/auth/me', { name: profile.name, phone: profile.phone });
            toast.success('Profile updated successfully!');
            window.location.reload();
        } catch (err) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const togglePref = (key) => {
        const newValue = !prefs[key];
        setPrefs({ ...prefs, [key]: newValue });
        localStorage.setItem(key, newValue.toString());
        toast.success('Preference saved!');
    };

    return (
        <div className="page" style={{ padding: '0px', maxWidth: 900 }}>
            <h1 className="page-title">⚙️ User Settings</h1>
            <p className="page-subtitle">Manage your personal profile and notification preferences.</p>

            <div style={{ display: 'flex', gap: 24, marginTop: 24, flexWrap: 'wrap' }}>
                {/* Sidebar Navigation */}
                <div style={{ width: 220, flexShrink: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button 
                            onClick={() => setActiveTab('profile')}
                            style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                background: activeTab === 'profile' ? 'var(--bg-card)' : 'transparent',
                                border: `1px solid ${activeTab === 'profile' ? 'var(--primary)' : 'transparent'}`,
                                borderRadius: 8,
                                color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-2)',
                                fontWeight: activeTab === 'profile' ? 600 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            👤 Profile Information
                        </button>
                        <button 
                            onClick={() => setActiveTab('preferences')}
                            style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                background: activeTab === 'preferences' ? 'var(--bg-card)' : 'transparent',
                                border: `1px solid ${activeTab === 'preferences' ? 'var(--primary)' : 'transparent'}`,
                                borderRadius: 8,
                                color: activeTab === 'preferences' ? 'var(--primary)' : 'var(--text-2)',
                                fontWeight: activeTab === 'preferences' ? 600 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            🎨 App Preferences
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div style={{ flex: 1, minWidth: 300 }}>
                    {activeTab === 'profile' && (
                        <div className="card" style={{ animation: 'fadeIn 0.3s ease' }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--text-1)' }}>Profile Information</h2>
                            <form onSubmit={handleSaveProfile}>
                                <div style={{ display: 'flex', gap: 20, marginBottom: 24, alignItems: 'center' }}>
                                    <div style={{ width: 80, height: 80, borderRadius: 40, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700 }}>
                                        {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div>
                                        <button type="button" className="btn btn-outline btn-sm">Upload Photo</button>
                                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>JPG, GIF or PNG. Max size of 800K</div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="label">Full Name</label>
                                    <input className="input" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label className="label">Email Address (Read-only)</label>
                                    <input className="input" value={profile.email} disabled style={{ opacity: 0.7 }} />
                                </div>
                                <div className="form-group">
                                    <label className="label">Phone Number (Optional)</label>
                                    <input className="input" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} placeholder="+91" />
                                </div>
                                
                                <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text-1)' }}>Security & Authentication</h3>
                                    <button type="button" className="btn btn-outline" style={{ marginBottom: 20 }}>
                                        Change Password
                                    </button>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? <span className="spinner" style={{ width: 16, height: 16 }}></span> : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="card" style={{ animation: 'fadeIn 0.3s ease' }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--text-1)' }}>App Preferences</h2>
                            
                            <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Theme Mode</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Switch between Dark and Light mode</div>
                                </div>
                                <button className="btn btn-outline" onClick={() => { toggleTheme(); toast.success(`${theme === 'dark' ? 'Light' : 'Dark'} mode enabled!`); }}>
                                    {theme === 'dark' ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
                                </button>
                            </div>

                            <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Email Alerts</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Receive emails when your reported animals are rescued</div>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={prefs.emailAlerts} onChange={() => togglePref('emailAlerts')} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                                </label>
                            </div>

                            <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Browser Push Notifications</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Get instant browser alerts for important updates</div>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={prefs.pushAlerts} onChange={() => togglePref('pushAlerts')} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                                </label>
                            </div>

                            <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#ef4444' }}>Danger Zone</h3>
                                <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
                                    Permanently delete your account and all associated data. This action cannot be undone.
                                </p>
                                <button type="button" className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => toast.error('This action requires administrator approval.')}>
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

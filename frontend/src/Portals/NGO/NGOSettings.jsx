import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import API from '../../services/api';
import toast from 'react-hot-toast';
import ChangePasswordModal from '../../Shared/Components/ChangePasswordModal';

export default function NGOSettings() {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { profile, setProfile } = useOutletContext();
    
    const [activeTab, setActiveTab] = useState('user');
    const [savingUser, setSavingUser] = useState(false);
    const [savingNGO, setSavingNGO] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // User Profile State
    const [userForm, setUserForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    // NGO Profile State
    const [ngoForm, setNgoForm] = useState({
        name: profile?.name || '',
        city: profile?.city || '',
        coverage_radius_km: profile?.coverage_radius_km || 20,
        latitude: profile?.latitude || '',
        longitude: profile?.longitude || '',
    });

    useEffect(() => {
        if (profile) {
            setNgoForm({
                name: profile.name || '',
                city: profile.city || '',
                coverage_radius_km: profile.coverage_radius_km || 20,
                latitude: profile.latitude || '',
                longitude: profile.longitude || '',
            });
        }
    }, [profile]);

    // Handle User Profile Save
    const handleSaveUser = async (e) => {
        e.preventDefault();
        setSavingUser(true);
        try {
            await API.patch('/auth/me', { name: userForm.name, phone: userForm.phone });
            toast.success('User profile updated successfully!');
            window.location.reload();
        } catch (err) {
            toast.error('Failed to update user profile');
        } finally {
            setSavingUser(false);
        }
    };

    // Handle NGO Location Fetch
    const handleFetchLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }
        toast('Fetching location...', { icon: '📍' });
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setNgoForm(f => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
                toast.success("Location acquired successfully");
            },
            () => {
                toast.error("Failed to fetch location. Please ensure location permissions are granted.");
            }
        );
    };

    // Handle NGO Profile Save
    const handleSaveNGO = async (e) => {
        e.preventDefault();
        const lat = parseFloat(ngoForm.latitude);
        const lng = parseFloat(ngoForm.longitude);

        if (isNaN(lat) || isNaN(lng)) {
            toast.error("Please click 'Auto-Fetch Current Location' to get your coordinates.");
            return;
        }

        setSavingNGO(true);
        try {
            await API.patch('/ngo/profile', {
                ...ngoForm,
                latitude: lat,
                longitude: lng
            });
            toast.success("NGO details updated successfully!");
            setProfile({ ...profile, ...ngoForm, latitude: lat, longitude: lng });
        } catch {
            toast.error("Failed to save NGO profile");
        } finally {
            setSavingNGO(false);
        }
    };

    return (
        <div className="page" style={{ padding: '0px', maxWidth: 900 }}>
            <h1 className="page-title">⚙️ Settings</h1>
            <p className="page-subtitle">Manage your personal preferences and NGO operational details.</p>

            <div style={{ display: 'flex', gap: 24, marginTop: 24, flexWrap: 'wrap' }}>
                {/* Sidebar Navigation */}
                <div style={{ width: 220, flexShrink: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button 
                            onClick={() => setActiveTab('user')}
                            style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                background: activeTab === 'user' ? 'var(--bg-card)' : 'transparent',
                                border: `1px solid ${activeTab === 'user' ? 'var(--primary)' : 'transparent'}`,
                                borderRadius: 8,
                                color: activeTab === 'user' ? 'var(--primary)' : 'var(--text-2)',
                                fontWeight: activeTab === 'user' ? 600 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            👤 User Profile
                        </button>
                        <button 
                            onClick={() => setActiveTab('ngo')}
                            style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                background: activeTab === 'ngo' ? 'var(--bg-card)' : 'transparent',
                                border: `1px solid ${activeTab === 'ngo' ? 'var(--primary)' : 'transparent'}`,
                                borderRadius: 8,
                                color: activeTab === 'ngo' ? 'var(--primary)' : 'var(--text-2)',
                                fontWeight: activeTab === 'ngo' ? 600 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            🏥 NGO Details
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div style={{ flex: 1, minWidth: 300 }}>
                    {activeTab === 'user' && (
                        <div className="card" style={{ animation: 'fadeIn 0.3s ease' }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--text-1)' }}>User Profile Settings</h2>
                            
                            <form onSubmit={handleSaveUser}>
                                <div className="form-group">
                                    <label className="label">Full Name</label>
                                    <input className="input" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label className="label">Email Address (Read-only)</label>
                                    <input className="input" value={userForm.email} disabled style={{ opacity: 0.7 }} />
                                </div>
                                <div className="form-group">
                                    <label className="label">Phone Number</label>
                                    <input className="input" value={userForm.phone} onChange={(e) => setUserForm({...userForm, phone: e.target.value})} />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                                    <button type="submit" className="btn btn-primary" disabled={savingUser}>
                                        {savingUser ? <span className="spinner" style={{ width: 16, height: 16 }}></span> : 'Save User Profile'}
                                    </button>
                                </div>
                            </form>

                            <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text-1)' }}>Security & Authentication</h3>
                                <button type="button" className="btn btn-outline" style={{ marginBottom: 20 }} onClick={() => setShowPasswordModal(true)}>
                                    Change Password
                                </button>
                            </div>

                            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text-1)' }}>App Preferences</h3>
                                <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Theme Mode</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Switch between Dark and Light mode</div>
                                    </div>
                                    <button type="button" className="btn btn-outline" onClick={() => { toggleTheme(); toast.success(`${theme === 'dark' ? 'Light' : 'Dark'} mode enabled!`); }}>
                                        {theme === 'dark' ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ngo' && (
                        <div className="card" style={{ animation: 'fadeIn 0.3s ease' }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--text-1)' }}>NGO Operations Details</h2>
                            
                            <form onSubmit={handleSaveNGO}>
                                <div className="form-group">
                                    <label className="label">Registered Email Address</label>
                                    <input className="input" value={profile?.contact_email || ''} disabled style={{ opacity: 0.7 }} />
                                </div>
                                
                                <div className="form-group">
                                    <label className="label">NGO / Clinic Name</label>
                                    <input 
                                        className="input" 
                                        value={ngoForm.name} 
                                        onChange={(e) => setNgoForm({...ngoForm, name: e.target.value})} 
                                        required 
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label">City</label>
                                    <input 
                                        className="input" 
                                        value={ngoForm.city} 
                                        onChange={(e) => setNgoForm({...ngoForm, city: e.target.value})} 
                                        required 
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label">Coverage Radius (in km)</label>
                                    <input 
                                        type="number"
                                        className="input" 
                                        value={ngoForm.coverage_radius_km} 
                                        onChange={(e) => setNgoForm({...ngoForm, coverage_radius_km: Number(e.target.value)})} 
                                        required 
                                        min={1}
                                        max={100}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label">Geographic Coordinates (Required for AI Routing)</label>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <input className="input" placeholder="Latitude" value={ngoForm.latitude} readOnly required />
                                        <input className="input" placeholder="Longitude" value={ngoForm.longitude} readOnly required />
                                    </div>
                                    <button type="button" className="btn btn-outline mt-2" onClick={handleFetchLocation}>
                                        📍 Auto-Fetch Current Location
                                    </button>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 30 }}>
                                    <button type="submit" className="btn btn-primary" disabled={savingNGO}>
                                        {savingNGO ? <span className="spinner" style={{ width: 16, height: 16 }}></span> : 'Save NGO Details'}
                                    </button>
                                </div>
                            </form>
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
            {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
        </div>
    );
}

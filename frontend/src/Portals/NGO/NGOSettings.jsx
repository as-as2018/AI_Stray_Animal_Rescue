import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import toast from 'react-hot-toast';

export default function NGOSettings() {
    const { user } = useAuth();
    const { profile, setProfile } = useOutletContext();
    
    const [form, setForm] = useState({
        name: profile?.name || '',
        city: profile?.city || '',
        coverage_radius_km: profile?.coverage_radius_km || 20,
        latitude: profile?.latitude || '',
        longitude: profile?.longitude || '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setForm({
                name: profile.name || '',
                city: profile.city || '',
                coverage_radius_km: profile.coverage_radius_km || 20,
                latitude: profile.latitude || '',
                longitude: profile.longitude || '',
            });
        }
    }, [profile]);

    const handleFetchLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }
        toast('Fetching location...', { icon: '📍' });
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setForm(f => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
                toast.success("Location acquired successfully");
            },
            (err) => {
                toast.error("Failed to fetch location. Please ensure location permissions are granted.");
            }
        );
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        const lat = parseFloat(form.latitude);
        const lng = parseFloat(form.longitude);

        if (isNaN(lat) || isNaN(lng)) {
            toast.error("Please click 'Auto-Fetch Current Location' to get your coordinates.");
            return;
        }

        setSaving(true);
        try {
            await API.patch('/ngo/profile', {
                ...form,
                latitude: lat,
                longitude: lng
            });
            toast.success("Profile updated successfully!");
            setProfile({ ...profile, ...form, latitude: lat, longitude: lng });
        } catch {
            toast.error("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page" style={{ padding: '0px' }}>
            <h1 className="page-title">⚙️ Profile Settings</h1>
            <p className="page-subtitle">Manage your NGO geographic and operational preferences</p>

            <form onSubmit={handleSave} className="card" style={{ maxWidth: 600 }}>
                <div className="form-group">
                    <label className="label">Registered Email Address</label>
                    <input className="input" value={profile?.contact_email || ''} disabled style={{ opacity: 0.7 }} />
                </div>
                
                <div className="form-group">
                    <label className="label">NGO / Clinic Name</label>
                    <input 
                        className="input" 
                        value={form.name} 
                        onChange={(e) => setForm({...form, name: e.target.value})} 
                        required 
                    />
                </div>

                <div className="form-group">
                    <label className="label">City</label>
                    <input 
                        className="input" 
                        value={form.city} 
                        onChange={(e) => setForm({...form, city: e.target.value})} 
                        required 
                    />
                </div>

                <div className="form-group">
                    <label className="label">Coverage Radius (in km)</label>
                    <input 
                        type="number"
                        className="input" 
                        value={form.coverage_radius_km} 
                        onChange={(e) => setForm({...form, coverage_radius_km: Number(e.target.value)})} 
                        required 
                        min={1}
                        max={100}
                    />
                </div>

                <div className="form-group">
                    <label className="label">Geographic Coordinates (Required for AI Routing)</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input className="input" placeholder="Latitude" value={form.latitude} readOnly required />
                        <input className="input" placeholder="Longitude" value={form.longitude} readOnly required />
                    </div>
                    <button type="button" className="btn btn-outline mt-2" onClick={handleFetchLocation}>
                        📍 Auto-Fetch Current Location
                    </button>
                </div>
                
                <hr style={{ margin: '24px 0', borderColor: 'var(--border)' }} />

                <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Profile Settings'}
                </button>
            </form>
        </div>
    );
}

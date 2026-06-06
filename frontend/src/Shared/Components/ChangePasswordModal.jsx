import React, { useState } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';

export default function ChangePasswordModal({ onClose }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match!");
            return;
        }
        
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            await API.patch('/auth/password', {
                current_password: currentPassword,
                new_password: newPassword
            });
            toast.success("Password changed successfully!");
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="card" style={{ width: 400, animation: 'fadeIn 0.2s ease', position: 'relative' }}>
                <button 
                    onClick={onClose} 
                    style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-2)' }}
                >
                    ✕
                </button>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Change Password</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="label">Current Password</label>
                        <input 
                            type="password" 
                            className="input" 
                            value={currentPassword} 
                            onChange={(e) => setCurrentPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">New Password</label>
                        <input 
                            type="password" 
                            className="input" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">Confirm New Password</label>
                        <input 
                            type="password" 
                            className="input" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Change Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

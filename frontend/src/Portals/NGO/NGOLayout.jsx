import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Sidebar from '../../Shared/Components/Sidebar';
import Navbar from '../../Shared/Components/Navbar';
import API from '../../services/api';
import toast from 'react-hot-toast';

export default function NGOLayout() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        API.get('/ngo/me')
            .then(({ data }) => setProfile(data))
            .catch(() => toast.error('Failed to load NGO profile'))
            .finally(() => setLoading(false));
    }, []);

    const isMissingData = profile && (!profile.latitude || !profile.longitude);

    const ngoLinks = [
        { label: 'Dashboard', href: '/ngo', icon: '📊' },
        { label: 'Assigned Reports', href: '/ngo/reports', icon: '🚑' },
        { label: 'Profile Settings', href: '/ngo/settings', icon: '⚙️' }
    ];

    if (loading) return <div className="page text-center" style={{ paddingTop: 80 }}><span className="spinner" /></div>;

    // Force redirect to settings if data is missing, unless they are already there
    if (isMissingData && location.pathname !== '/ngo/settings') {
        return <Navigate to="/ngo/settings" replace />;
    }

    return (
        <div className="layout-wrapper">
            <Sidebar links={ngoLinks} portalName="NGO Portal" />
            <div className="main-content">
                <Navbar hideNavLinks />
                
                {isMissingData && (
                    <div style={{ background: '#ef4444', color: 'white', padding: '12px 24px', textAlign: 'center', fontWeight: 600 }}>
                        Action Required: Please complete your NGO Profile with your geographic location to start receiving rescues.
                    </div>
                )}
                
                <div style={{ padding: '24px' }}>
                    <Outlet context={{ profile, setProfile }} />
                </div>
            </div>
        </div>
    );
}

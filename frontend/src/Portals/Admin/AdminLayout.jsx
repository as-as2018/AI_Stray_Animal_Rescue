import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../Shared/Components/Sidebar';
import Navbar from '../../Shared/Components/Navbar';

export default function AdminLayout() {
    const adminLinks = [
        { label: 'Dashboard', href: '/admin', icon: '📊' },
        { label: 'Manage Reports', href: '/admin/reports', icon: '📋' },
        { label: 'Manage NGOs', href: '/admin/ngos', icon: '🏥' },
        { label: 'Manage Users', href: '/admin/users', icon: '👥' },
        { label: 'Profile Settings', href: '/admin/settings', icon: '⚙️' }
    ];

    return (
        <div className="layout-wrapper">
            <Sidebar links={adminLinks} portalName="Super Admin" />
            <div className="main-content">
                <Navbar hideNavLinks />
                <div style={{ padding: '24px' }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

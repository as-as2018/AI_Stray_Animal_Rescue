import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../Shared/Components/Sidebar';
import Navbar from '../../Shared/Components/Navbar';

export default function UserLayout() {
    const userLinks = [
        { label: 'Submit Report', href: '/user/report', icon: '📸' },
        { label: 'My Reports', href: '/user/my-reports', icon: '📋' },
        { label: 'Profile Settings', href: '/user/settings', icon: '⚙️' }
    ];

    return (
        <div className="layout-wrapper">
            <Sidebar links={userLinks} portalName="Citizen Portal" />
            <div className="main-content">
                <Navbar hideNavLinks />
                <div style={{ padding: '24px' }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ links, portalName }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="flex-between" style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                {!collapsed && <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{portalName}</h3>}
                <button 
                    onClick={() => setCollapsed(!collapsed)} 
                    className="btn btn-outline btn-sm"
                    style={{ padding: '6px', minWidth: '32px', border: 'none' }}
                >
                    {collapsed ? '▶' : '◀'}
                </button>
            </div>
            <nav style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {links.map((link) => (
                    <NavLink
                        key={link.href}
                        to={link.href}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 14px' }}
                    >
                        <span style={{ fontSize: '18px' }}>{link.icon}</span>
                        {!collapsed && <span>{link.label}</span>}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}

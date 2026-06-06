import React, { useState, useEffect } from 'react';

export default function ListControls({
    searchPlaceholder = "Search...",
    onSearchChange,
    
    statusFilter,
    onStatusChange,
    hideStatus = false,
    statusOptions = [
        { label: 'Pending', value: 'pending' },
        { label: 'Assigned', value: 'assigned' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Resolved', value: 'resolved' }
    ],
    
    tierFilter,
    onTierChange,
    hideTier = false,
    tierOptions = [
        { label: 'Critical', value: 'CRITICAL' },
        { label: 'High', value: 'HIGH' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'Low', value: 'LOW' },
        { label: 'Monitor', value: 'MONITOR' }
    ],
    
    sortBy,
    onSortByChange,
    sortOrder,
    onSortOrderChange,
    sortOptions = [
        { label: 'Date Created', value: 'created_at' },
        { label: 'Urgency Score', value: 'urgency_score' }
    ],
    hideSort = false
}) {
    const [searchValue, setSearchValue] = useState('');

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (onSearchChange) {
                onSearchChange(searchValue);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchValue, onSearchChange]);

    return (
        <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 260 }}>
                <input
                    type="text"
                    className="input"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                />
            </div>
            
            <div className="flex-gap" style={{ flexWrap: 'wrap' }}>
                {!hideStatus && (
                    <select 
                        className="input" 
                        style={{ width: 'auto' }} 
                        value={statusFilter} 
                        onChange={(e) => onStatusChange(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                )}

                {!hideTier && (
                    <select 
                        className="input" 
                        style={{ width: 'auto' }} 
                        value={tierFilter} 
                        onChange={(e) => onTierChange(e.target.value)}
                    >
                        <option value="all">All Tiers</option>
                        {tierOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                )}

                {!hideSort && (
                    <div className="flex-gap" style={{ background: 'var(--bg)', borderRadius: 8, padding: 4 }}>
                        <select 
                            className="input" 
                            style={{ width: 'auto', border: 'none', background: 'transparent' }} 
                            value={sortBy} 
                            onChange={(e) => onSortByChange(e.target.value)}
                        >
                            {sortOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <button 
                            className="btn btn-outline" 
                            style={{ padding: '8px', border: 'none' }}
                            onClick={() => onSortOrderChange(sortOrder === 'desc' ? 'asc' : 'desc')}
                            title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
                        >
                            {sortOrder === 'desc' ? '⬇️' : '⬆️'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

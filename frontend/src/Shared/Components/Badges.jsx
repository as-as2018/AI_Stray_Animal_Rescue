const TIER_CONFIG = {
    CRITICAL: { cls: 'badge-critical', dot: '🔴', label: 'CRITICAL' },
    HIGH: { cls: 'badge-high', dot: '🟠', label: 'HIGH' },
    MEDIUM: { cls: 'badge-medium', dot: '🔵', label: 'MEDIUM' },
    LOW: { cls: 'badge-low', dot: '🟢', label: 'LOW' },
    MONITOR: { cls: 'badge-monitor', dot: '⚪', label: 'MONITOR' },
};

const STATUS_CONFIG = {
    pending: { cls: 'badge-pending', label: 'Pending' },
    assigned: { cls: 'badge-assigned', label: 'Assigned' },
    in_progress: { cls: 'badge-in_progress', label: 'In Progress' },
    resolved: { cls: 'badge-resolved', label: 'Resolved' },
};

export function UrgencyBadge({ tier }) {
    const cfg = TIER_CONFIG[tier] || TIER_CONFIG.MONITOR;
    return <span className={`badge ${cfg.cls}`}>{cfg.dot} {cfg.label}</span>;
}

export function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

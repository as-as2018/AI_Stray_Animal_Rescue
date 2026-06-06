import { useAuth } from '../../context/AuthContext';

export default function UserSettings() {
    const { user } = useAuth();

    return (
        <div className="page" style={{ padding: '0px' }}>
            <h1 className="page-title">⚙️ Profile Settings</h1>
            <p className="page-subtitle">Manage your personal preferences</p>

            <div className="card" style={{ maxWidth: 600 }}>
                <div className="form-group">
                    <label className="label">Display Name</label>
                    <input className="input" value={user?.name || ''} disabled />
                </div>
                <div className="form-group">
                    <label className="label">Account Status</label>
                    <input className="input" value="Active Citizen" disabled />
                    <p className="text-muted text-sm mt-4">Your account is verified for reporting stray animals.</p>
                </div>
            </div>
        </div>
    );
}

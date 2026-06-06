import { useAuth } from '../../context/AuthContext';

export default function AdminSettings() {
    const { user } = useAuth();

    return (
        <div className="page" style={{ padding: '0px' }}>
            <h1 className="page-title">⚙️ Profile Settings</h1>
            <p className="page-subtitle">Manage your account preferences</p>

            <div className="card" style={{ maxWidth: 600 }}>
                <div className="form-group">
                    <label className="label">Account Name</label>
                    <input className="input" value={user?.name || ''} disabled />
                </div>
                <div className="form-group">
                    <label className="label">Account ID</label>
                    <input className="input" value={user?.id || ''} disabled />
                    <p className="text-muted text-sm mt-4">System roles and preferences are managed by the Root Administrator. To change your account details, please contact IT support.</p>
                </div>
            </div>
        </div>
    );
}

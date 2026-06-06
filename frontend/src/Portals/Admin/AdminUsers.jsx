import { useState, useEffect } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // Pagination & Search
    const [page, setPage] = useState(0);
    const limit = 10;
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await API.get('/admin/users', {
                params: { skip: page * limit, limit, search: debouncedSearch || undefined }
            });
            setUsers(res.data.items || res.data);
            setTotal(res.data.total || 0);
        } catch { toast.error('Failed to load Users'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, [page, debouncedSearch]);

    const changeRole = async (id, newRole) => {
        try {
            await API.patch(`/admin/users/${id}/role`, null, { params: { role: newRole } });
            toast.success('User role updated');
            fetchUsers();
        } catch { toast.error('Failed to update role'); }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="page" style={{ padding: '0px' }}>
            <div className="flex-between mb-4">
                <div>
                    <h1 className="page-title">👥 Manage Users</h1>
                    <p className="page-subtitle mb-0">View registered users and modify access roles</p>
                </div>
            </div>

            <div className="flex-between mb-4">
                <input
                    type="text"
                    className="input"
                    placeholder="Search by name or email..."
                    style={{ maxWidth: 300 }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>User Name</th>
                            <th>Email Address</th>
                            <th>Reports Submitted</th>
                            <th>System Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>No Users found</td></tr>
                        ) : (
                            users.map(u => (
                                <tr key={u.id}>
                                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                                    <td style={{ color: 'var(--text-2)' }}>{u.email}</td>
                                    <td>{u.reports_submitted}</td>
                                    <td>
                                        <select
                                            className="input btn-sm"
                                            style={{ padding: '4px 8px', fontSize: 13, width: 'auto' }}
                                            value={u.role}
                                            onChange={(e) => changeRole(u.id, e.target.value)}
                                        >
                                            <option value={1}>Admin</option>
                                            <option value={2}>User</option>
                                            <option value={3}>NGO</option>
                                        </select>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="pagination">
                    <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</button>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Page {page + 1} of {totalPages || 1}</span>
                    <button className="page-btn" disabled={page >= totalPages - 1 || totalPages === 0} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';
import ListControls from '../../Shared/Components/ListControls';
import { Link } from 'react-router-dom';

export default function AdminNGOs() {
    const [ngos, setNgos] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // Pagination, Search, Filter & Sort
    const [page, setPage] = useState(0);
    const limit = 10;
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');

    // Form
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', city: '', contact_email: '', latitude: '', longitude: '' });

    // Form

    const fetchNGOs = async () => {
        setLoading(true);
        try {
            const res = await API.get('/admin/ngos', {
                params: { 
                    skip: page * limit, 
                    limit, 
                    search: debouncedSearch || undefined,
                    status: statusFilter === 'all' ? undefined : statusFilter,
                    sort_by: sortBy,
                    sort_order: sortOrder
                }
            });
            setNgos(res.data.items || res.data);
            setTotal(res.data.total || 0);
        } catch { toast.error('Failed to load NGOs'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchNGOs(); }, [page, debouncedSearch, statusFilter, sortBy, sortOrder]);

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const SortIcon = ({ field }) => {
        if (sortBy !== field) return null;
        return <span style={{ marginLeft: 4, color: 'var(--primary)' }}>{sortOrder === 'asc' ? '⬆️' : '⬇️'}</span>;
    };

    const toggleStatus = async (id) => {
        try {
            await API.patch(`/admin/ngos/${id}/toggle`);
            toast.success('Status updated');
            fetchNGOs();
        } catch { toast.error('Failed to update status'); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                city: formData.city,
                contact_email: formData.contact_email,
                location: {
                    type: "Point",
                    coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
                }
            };
            await API.post('/admin/ngos', payload);
            toast.success('NGO registered successfully!');
            setShowForm(false);
            setFormData({ name: '', city: '', contact_email: '', latitude: '', longitude: '' });
            fetchNGOs();
        } catch (err) {
            toast.error(err?.response?.data?.detail || 'Registration failed');
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="page" style={{ padding: '0px' }}>
            <div className="flex-between mb-4">
                <div>
                    <h1 className="page-title">🏥 Manage NGOs</h1>
                    <p className="page-subtitle mb-0">Manage active NGOs and pending approvals</p>
                </div>
            </div>

            <ListControls 
                searchPlaceholder="Search NGOs by name, city, email..."
                onSearchChange={(val) => { setDebouncedSearch(val); setPage(0); }}
                statusFilter={statusFilter}
                onStatusChange={(val) => { setStatusFilter(val); setPage(0); }}
                statusOptions={[
                    { label: 'Approved', value: 'active' },
                    { label: 'Pending Approval', value: 'inactive' }
                ]}
                hideTier={true}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                sortOptions={[
                    { label: 'Created Date', value: 'created_at' },
                    { label: 'Name', value: 'name' },
                    { label: 'City', value: 'city' },
                    { label: 'Rescues', value: 'total_rescues' },
                ]}
            />

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>NGO Name <SortIcon field="name" /></th>
                            <th onClick={() => handleSort('city')} style={{ cursor: 'pointer' }}>City <SortIcon field="city" /></th>
                            <th onClick={() => handleSort('contact_email')} style={{ cursor: 'pointer' }}>Contact Email <SortIcon field="contact_email" /></th>
                            <th onClick={() => handleSort('total_rescues')} style={{ cursor: 'pointer' }}>Rescues <SortIcon field="total_rescues" /></th>
                            <th onClick={() => handleSort('is_active')} style={{ cursor: 'pointer' }}>Status <SortIcon field="is_active" /></th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                        ) : ngos.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>No NGOs found</td></tr>
                        ) : (
                            ngos.map(n => (
                                <tr key={n.id}>
                                    <td style={{ fontWeight: 600 }}>
                                        <Link to={`/admin/ngos/${n.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                            {n.name}
                                        </Link>
                                    </td>
                                    <td>{n.city}</td>
                                    <td>{n.contact_email}</td>
                                    <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{n.total_rescues}</td>
                                    <td>
                                        {n.is_active ? 
                                            <span style={{ color: 'var(--low)', fontWeight: 600 }}>Approved</span> : 
                                            <span style={{ color: 'var(--critical)', fontWeight: 600 }}>Pending Approval</span>}
                                    </td>
                                    <td>
                                        {(!n.is_active && (!n.latitude || !n.longitude)) ? (
                                            <button 
                                                className="btn btn-outline btn-sm"
                                                disabled
                                                title="The NGO must complete their profile (GPS coordinates) first"
                                                style={{ opacity: 0.5, cursor: 'not-allowed' }}
                                            >
                                                Incomplete Profile
                                            </button>
                                        ) : (
                                            <button 
                                                className="btn btn-outline btn-sm"
                                                onClick={() => toggleStatus(n.id)}
                                            >
                                                {n.is_active ? 'Revoke Approval' : 'Approve NGO'}
                                            </button>
                                        )}
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

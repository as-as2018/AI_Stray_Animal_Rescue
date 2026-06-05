import { useState, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function RuleEngine() {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTier, setEditingTier] = useState(null);
    const [editData, setEditData] = useState(null);

    const fetchRules = async () => {
        try {
            const res = await API.get('/rules');
            // Sort by base score descending
            const sorted = res.data.sort((a, b) => b.base_score - a.base_score);
            setRules(sorted);
        } catch { toast.error('Failed to load rules'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchRules(); }, []);

    const startEdit = (rule) => {
        setEditingTier(rule.tier_name);
        setEditData({
            base_score: rule.base_score,
            action: rule.action,
            conditions: rule.conditions.join(', ')
        });
    };

    const saveEdit = async () => {
        try {
            const conditionsArray = editData.conditions.split(',').map(c => c.trim()).filter(Boolean);
            await API.put(`/rules/${editingTier}`, {
                base_score: editData.base_score,
                action: editData.action,
                conditions: conditionsArray
            });
            toast.success('Rule Engine updated! AI memory refreshed.');
            setEditingTier(null);
            fetchRules();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Update failed');
        }
    };

    if (loading) return <div>Loading rules...</div>;

    return (
        <div className="card mt-8" style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 18, marginBottom: 16 }}>🧠 Dynamic Rule Engine</h2>
            <p style={{ color: 'var(--text-2)', marginBottom: 20, fontSize: 14 }}>
                Configure the AI's urgency score calculator. The NLP agent dynamically parses these conditions in real-time. Add comma-separated conditions.
            </p>
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Tier</th>
                            <th>Base Score</th>
                            <th>Action</th>
                            <th style={{ width: '40%' }}>Conditions (Triggers)</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rules.map(r => (
                            <tr key={r.tier_name}>
                                <td style={{ fontWeight: 600 }}>{r.tier_name}</td>
                                <td>
                                    {editingTier === r.tier_name ? (
                                        <input type="number" className="input btn-sm" value={editData.base_score} onChange={e => setEditData({...editData, base_score: parseInt(e.target.value)})} />
                                    ) : r.base_score}
                                </td>
                                <td>
                                    {editingTier === r.tier_name ? (
                                        <input type="text" className="input btn-sm" value={editData.action} onChange={e => setEditData({...editData, action: e.target.value})} />
                                    ) : r.action}
                                </td>
                                <td>
                                    {editingTier === r.tier_name ? (
                                        <textarea className="input" rows={3} style={{ width: '100%', fontSize: 13 }} value={editData.conditions} onChange={e => setEditData({...editData, conditions: e.target.value})} />
                                    ) : (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {r.conditions.map(c => (
                                                <span key={c} style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{c}</span>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    {editingTier === r.tier_name ? (
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-sm" onClick={saveEdit}>Save</button>
                                            <button className="btn btn-sm btn-ghost" onClick={() => setEditingTier(null)}>Cancel</button>
                                        </div>
                                    ) : (
                                        <button className="btn btn-sm btn-ghost" onClick={() => startEdit(r)}>Edit</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { ShieldAlert, Trash2, CheckCircle2, XCircle } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (userId, currentStatus) => {
        try {
            const res = await fetch(`http://localhost:8000/api/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !currentStatus })
            });
            if (res.ok) fetchUsers();
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to permanently delete this user? This will also wipe their prescriptions and pharmacy if applicable.")) return;

        try {
            const res = await fetch(`http://localhost:8000/api/admin/users/${userId}`, { method: 'DELETE' });
            if (res.ok) fetchUsers();
        } catch (err) {
            console.error("Failed to delete user", err);
        }
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-outfit text-white mb-2">User Management</h1>
                <p className="text-slate-400">View and manage all registered platform users.</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-white">Registered Users</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700/50 text-sm tracking-wider uppercase">
                                <th className="p-4 font-medium">User ID</th>
                                <th className="p-4 font-medium">Name</th>
                                <th className="p-4 font-medium">Email</th>
                                <th className="p-4 font-medium">Role</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {users.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400">No users found.</td>
                                </tr>
                            )}
                            {users.map(user => (
                                <tr key={user.user_id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 text-slate-300 font-mono text-sm">#{user.user_id}</td>
                                    <td className="p-4 text-white font-medium">{user.name}</td>
                                    <td className="p-4 text-slate-300">{user.email}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${user.role === 'Pharmacy Owner'
                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                : user.role === 'Admin'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`flex items-center gap-1.5 text-sm font-medium ${user.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {user.is_active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                            {user.is_active ? 'Active' : 'Suspended'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex items-center justify-end gap-3 text-right">
                                        <button
                                            onClick={() => toggleStatus(user.user_id, user.is_active)}
                                            className={`p-2 rounded-lg border transition-colors ${user.is_active
                                                    ? 'text-orange-400 border-orange-500/30 hover:bg-orange-500/10'
                                                    : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
                                                }`}
                                            title={user.is_active ? "Suspend User" : "Activate User"}
                                        >
                                            <ShieldAlert size={18} />
                                        </button>
                                        <button
                                            onClick={() => deleteUser(user.user_id)}
                                            className="p-2 rounded-lg text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
                                            title="Delete User"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default UserManagement;

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Store, ShieldAlert, CheckCircle, Ban, Trash2 } from 'lucide-react';

const PharmacyManagement = () => {
    const [pharmacies, setPharmacies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPharmacies();
    }, []);

    const fetchPharmacies = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/admin/pharmacies');
            if (res.ok) {
                const data = await res.json();
                setPharmacies(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (pharmacyId, newStatus) => {
        try {
            const res = await fetch(`http://localhost:8000/api/admin/pharmacies/${pharmacyId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) fetchPharmacies();
        } catch (err) {
            console.error("Failed to update pharmacy status", err);
        }
    };

    const deletePharmacy = async (pharmacyId) => {
        if (!window.confirm("Are you sure you want to delete this pharmacy? This wipes their entire inventory from the platform.")) return;

        try {
            const res = await fetch(`http://localhost:8000/api/admin/pharmacies/${pharmacyId}`, { method: 'DELETE' });
            if (res.ok) fetchPharmacies();
        } catch (err) {
            console.error("Failed to delete pharmacy", err);
        }
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-outfit text-white mb-2">Pharmacy Providers</h1>
                <p className="text-slate-400">Approve, suspend, or remove third-party pharmacy integrations.</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center text-white">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><Store size={22} className="text-emerald-400" /> Registered Pharmacies</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700/50 text-sm tracking-wider uppercase">
                                <th className="p-4 font-medium">Pharmacy Name</th>
                                <th className="p-4 font-medium">Owner ID</th>
                                <th className="p-4 font-medium">Location</th>
                                <th className="p-4 font-medium">Contact</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {pharmacies.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400">No pharmacies found.</td>
                                </tr>
                            )}
                            {pharmacies.map(pharm => (
                                <tr key={pharm.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 text-white font-medium">{pharm.name}</td>
                                    <td className="p-4 text-slate-300 font-mono text-sm">#{pharm.user_id}</td>
                                    <td className="p-4 text-slate-300 truncate max-w-[200px]" title={pharm.location}>{pharm.location}</td>
                                    <td className="p-4 text-slate-300">{pharm.phone}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 w-max ${pharm.status === 'Approved'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : pharm.status === 'Pending'
                                                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {pharm.status === 'Approved' ? <CheckCircle size={14} /> : pharm.status === 'Pending' ? <ShieldAlert size={14} /> : <Ban size={14} />}
                                            {pharm.status}
                                        </span>
                                    </td>
                                    <td className="p-4 flex items-center justify-end gap-2 text-right">
                                        {pharm.status !== 'Approved' && (
                                            <button
                                                onClick={() => updateStatus(pharm.id, 'Approved')}
                                                className="p-2 rounded-lg text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors"
                                                title="Approve Pharmacy"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                        {pharm.status !== 'Suspended' && (
                                            <button
                                                onClick={() => updateStatus(pharm.id, 'Suspended')}
                                                className="p-2 rounded-lg text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 transition-colors"
                                                title="Suspend Pharmacy"
                                            >
                                                <Ban size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deletePharmacy(pharm.id)}
                                            className="p-2 rounded-lg text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors ml-1"
                                            title="Delete Pharmacy"
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

export default PharmacyManagement;

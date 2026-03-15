import React, { useState, useEffect } from 'react';
import PharmacyDashboardLayout from '../../components/PharmacyDashboardLayout';
import { ClipboardList, Check, X } from 'lucide-react';

const Requests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const pharmacyId = 1; // Demo ID

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/pharmacy/requests?pharmacy_id=${pharmacyId}`);
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (err) {
            console.error("Failed to fetch requests", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await fetch(`http://localhost:8000/api/pharmacy/requests/${id}/status?status=${newStatus}`, {
                method: 'PUT'
            });
            fetchRequests(); // Refresh list automatically
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    return (
        <PharmacyDashboardLayout>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-outfit text-white mb-2">Customer Requests</h1>
                    <p className="text-slate-400">Manage and fulfill medicine requests sent from customers.</p>
                </div>

                {loading ? (
                    <div className="text-center text-slate-400 py-12">Loading requests...</div>
                ) : requests.length === 0 ? (
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-dashed border-slate-700 p-12 rounded-2xl text-center">
                        <ClipboardList size={48} className="mx-auto text-slate-500 mb-4 opacity-50" />
                        <h3 className="text-xl font-medium text-white mb-2">No Pending Requests</h3>
                        <p className="text-slate-400">You currently have no new customer medicine requests.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {requests.map((req) => (
                            <div key={req.id} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:bg-slate-800/80">

                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-slate-400 text-sm">Request #{req.id}</span>
                                        <span className="text-slate-500 text-sm">•</span>
                                        <span className="text-slate-400 text-sm">Customer ID: {req.user_id}</span>
                                        <span className="text-slate-500 text-sm">•</span>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${req.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                req.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-medium text-white">Requested Medicines:</h3>
                                    <p className="text-blue-400 mt-1">{req.requested_medicines}</p>
                                    <p className="text-slate-500 text-sm mt-3">Requested on: {new Date(req.request_date).toLocaleString()}</p>
                                </div>

                                {req.status === 'Pending' ? (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleStatusUpdate(req.id, 'Rejected')}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all font-medium"
                                        >
                                            <X size={18} /> Reject
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(req.id, 'Confirmed')}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all font-medium"
                                        >
                                            <Check size={18} /> Confirm Availability
                                        </button>
                                    </div>
                                ) : (
                                    <div className="px-4 py-2 text-slate-500 italic text-sm border border-dashed border-slate-700 rounded-xl">
                                        Processed Status
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PharmacyDashboardLayout>
    );
};

export default Requests;

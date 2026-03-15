import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Users, Store, FileText, Database } from 'lucide-react';

const Overview = () => {
    const [stats, setStats] = useState({
        total_users: 0,
        total_pharmacies: 0,
        total_prescriptions: 0,
        total_medicines_dataset: 0
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/admin/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error("Failed to fetch admin stats:", err);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: "Total Users",
            value: stats.total_users,
            icon: <Users size={32} className="text-emerald-400" />,
            color: "from-emerald-500/20 to-emerald-500/5",
            border: "border-emerald-500/20"
        },
        {
            title: "Total Pharmacies",
            value: stats.total_pharmacies,
            icon: <Store size={32} className="text-blue-400" />,
            color: "from-blue-500/20 to-blue-500/5",
            border: "border-blue-500/20"
        },
        {
            title: "Prescriptions Uploaded",
            value: stats.total_prescriptions,
            icon: <FileText size={32} className="text-purple-400" />,
            color: "from-purple-500/20 to-purple-500/5",
            border: "border-purple-500/20"
        },
        {
            title: "Medicines in Dataset",
            value: stats.total_medicines_dataset,
            icon: <Database size={32} className="text-orange-400" />,
            color: "from-orange-500/20 to-orange-500/5",
            border: "border-orange-500/20"
        }
    ];

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-outfit text-white mb-2">Admin Overview</h1>
                <p className="text-slate-400">System-wide monitoring and metrics.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((card, idx) => (
                        <div key={idx} className={`bg-gradient-to-br ${card.color} border ${card.border} backdrop-blur-xl rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-900/50 rounded-xl border border-white/5">
                                    {card.icon}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-slate-400 text-sm font-medium mb-1">{card.title}</h3>
                                <p className="text-3xl font-bold text-white tracking-tight">{card.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
};

export default Overview;

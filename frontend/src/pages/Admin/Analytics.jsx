import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

const Analytics = () => {
    const [weeklyData, setWeeklyData] = useState([]);
    const [topMedicines, setTopMedicines] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/admin/analytics');
            if (res.ok) {
                const data = await res.json();
                setWeeklyData(data.weeklyData);
                setTopMedicines(data.topMedicines);
            }
        } catch (err) {
            console.error("Failed to fetch analytics:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-outfit text-white mb-2">System Analytics</h1>
                <p className="text-slate-400">Platform utilization trends and prediction statistics.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Upload Volume Chart */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <BarChart3 className="text-emerald-400" size={20} />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Prescriptions Uploaded (7 Days)</h2>
                        </div>

                        <div className="flex items-end justify-between h-48 gap-2 pt-4">
                            {weeklyData.map((d, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full">
                                    <div className="relative w-full flex-1 flex justify-center group">
                                        <div
                                            className="absolute bottom-0 w-8 md:w-12 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm transition-all duration-500 group-hover:brightness-110"
                                            style={{ height: d.height }}
                                        ></div>
                                        <span className="absolute -top-6 text-xs text-emerald-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                            {d.uploads}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium">{d.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Medicines */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                <Activity className="text-orange-400" size={20} />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Most Detected Medicines</h2>
                        </div>

                        <div className="space-y-4">
                            {topMedicines.map((med, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                                    <div className="flex items-center gap-4">
                                        <span className="text-slate-500 font-mono font-bold text-sm">0{i + 1}</span>
                                        <span className="text-slate-200 font-medium">{med.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={14} className="text-emerald-400" />
                                        <span className="text-emerald-400 font-bold">{med.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default Analytics;

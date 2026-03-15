import React, { useState, useEffect } from 'react';
import PharmacyDashboardLayout from '../../components/PharmacyDashboardLayout';
import { Package, CheckCircle, Clock, Star, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon, trend, colorClass }) => (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl flex flex-col justify-between hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
        <div className={`absolute -right-6 -top-6 w-24 h-24 ${colorClass} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity duration-300`}></div>
        <div className="flex justify-between items-start z-10">
            <div>
                <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold font-outfit text-white">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-20`}>
                {icon}
            </div>
        </div>
        {trend && (
            <div className="mt-4 flex items-center text-sm z-10">
                <TrendingUp size={16} className="text-emerald-400 mr-2" />
                <span className="text-emerald-400 font-medium">{trend}</span>
                <span className="text-slate-500 ml-2">vs last week</span>
            </div>
        )}
    </div>
);

const Overview = () => {
    const [stats, setStats] = useState({
        totalInventory: 0,
        availableToday: 0,
        pendingRequests: 0,
        rating: 4.5
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, fetch these from /api/pharmacy/stats
        // For now, fetching inventory and requests to aggregate
        const fetchStats = async () => {
            try {
                const pharmacyId = 1; // Demo ID, should come from auth context

                const [invRes, reqRes, profRes] = await Promise.all([
                    fetch(`http://localhost:8000/api/pharmacy/inventory?pharmacy_id=${pharmacyId}`),
                    fetch(`http://localhost:8000/api/pharmacy/requests?pharmacy_id=${pharmacyId}`),
                    fetch(`http://localhost:8000/api/pharmacy/profile?user_id=${localStorage.getItem('user_id') || 1}`)
                ]);

                const inventory = await invRes.json();
                const requests = await reqRes.json();
                const profile = profRes.ok ? await profRes.json() : { rating: 4.5 };

                const available = inventory.filter(i => i.status === 'Available').length;
                const pending = requests.filter(r => r.status === 'Pending').length;

                setStats({
                    totalInventory: inventory.length,
                    availableToday: available,
                    pendingRequests: pending,
                    rating: profile.rating || 4.5
                });
            } catch (err) {
                console.error("Error fetching stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <PharmacyDashboardLayout><div className="flex items-center justify-center h-full text-blue-400">Loading Dashboard...</div></PharmacyDashboardLayout>;

    return (
        <PharmacyDashboardLayout>
            <div className="mb-8 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold font-outfit text-white mb-2">Dashboard Overview</h1>
                        <p className="text-slate-400">Welcome back. Here's what's happening at your pharmacy today.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Inventory Items"
                        value={stats.totalInventory}
                        icon={<Package className="text-blue-400" size={24} />}
                        colorClass="bg-blue-500"
                        trend="+12%"
                    />
                    <StatCard
                        title="Available Today"
                        value={stats.availableToday}
                        icon={<CheckCircle className="text-emerald-400" size={24} />}
                        colorClass="bg-emerald-500"
                        trend="+5%"
                    />
                    <StatCard
                        title="Pending Requests"
                        value={stats.pendingRequests}
                        icon={<Clock className="text-amber-400" size={24} />}
                        colorClass="bg-amber-500"
                        trend="+2 New"
                    />
                    <StatCard
                        title="Pharmacy Rating"
                        value={`${stats.rating}/5.0`}
                        icon={<Star className="text-purple-400" size={24} />}
                        colorClass="bg-purple-500"
                    />
                </div>

                <div className="mt-8 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl">
                    <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
                    <div className="text-center py-12 text-slate-500 border border-dashed border-slate-700 rounded-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <Clock size={32} className="mx-auto mb-3 opacity-50" />
                        <p>Activity feed will appear here as customers interact with your pharmacy.</p>
                    </div>
                </div>
            </div>
        </PharmacyDashboardLayout>
    );
};

export default Overview;

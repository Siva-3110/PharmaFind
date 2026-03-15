import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Store, FileText, Database, BarChart3, LogOut } from 'lucide-react';
import Navbar from './Navbar';

const AdminSidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_role");
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Users', path: '/admin/users', icon: <Users size={20} /> },
        { name: 'Pharmacies', path: '/admin/pharmacies', icon: <Store size={20} /> },
        { name: 'Prescriptions', path: '/admin/prescriptions', icon: <FileText size={20} /> },
        { name: 'Medicine Dataset', path: '/admin/dataset', icon: <Database size={20} /> },
        { name: 'Analytics', path: '/admin/analytics', icon: <BarChart3 size={20} /> },
    ];

    return (
        <div className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50 min-h-[calc(100vh-64px)] p-6 pt-10 flex flex-col">
            <div className="flex-1 space-y-2">
                <h3 className="text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-6 px-4">
                    Admin Portal
                </h3>

                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${isActive
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white border border-transparent hover:border-slate-700/50'
                            }`
                        }
                    >
                        {item.icon}
                        {item.name}
                    </NavLink>
                ))}
            </div>

            <div className="pt-8 border-t border-slate-700/50 mt-auto">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

const AdminLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#0f172a] bg-gradient-to-br from-[#0f172a] via-[#064e3b] to-[#022c22] text-white selection:bg-emerald-500/30">
            <Navbar />
            <div className="flex pt-20">
                <AdminSidebar />
                <main className="flex-1 p-8 overflow-y-auto max-h-[calc(100vh-80px)]">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;

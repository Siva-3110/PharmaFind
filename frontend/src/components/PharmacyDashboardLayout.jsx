import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PackageSearch, ClipboardList, UserCircle, LogOut } from 'lucide-react';
import Navbar from './Navbar';

const PharmacySidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_role");
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/pharmacy/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Inventory', path: '/pharmacy/inventory', icon: <PackageSearch size={20} /> },
        { name: 'Requests', path: '/pharmacy/requests', icon: <ClipboardList size={20} /> },
        { name: 'Profile', path: '/pharmacy/profile', icon: <UserCircle size={20} /> },
    ];

    return (
        <div className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50 min-h-[calc(100vh-64px)] p-6 pt-10 flex flex-col">
            <div className="flex-1 space-y-2">
                <h3 className="text-slate-400 text-xs font-semibold tracking-wider uppercase mb-6 px-4">
                    Pharmacy Portal
                </h3>

                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${isActive
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
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

// Layout Wrapper Component
const PharmacyDashboardLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#0f172a] bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#172554] text-white selection:bg-blue-500/30">
            <Navbar />
            <div className="flex pt-20">
                <PharmacySidebar />
                <main className="flex-1 p-8 overflow-y-auto max-h-[calc(100vh-64px)]">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default PharmacyDashboardLayout;

import React, { useState, useEffect } from 'react';
import PharmacyDashboardLayout from '../../components/PharmacyDashboardLayout';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const pharmacyId = 1; // Demo pharmacy ID, should come from auth

    const [formData, setFormData] = useState({
        medicine_name: "",
        composition: "",
        price: "",
        quantity: "",
        expiry_date: "",
        status: "Available"
    });

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/pharmacy/inventory?pharmacy_id=${pharmacyId}`);
            if (res.ok) {
                const data = await res.json();
                setInventory(data);
            }
        } catch (err) {
            console.error("Failed to fetch inventory", err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            setEditingItem(null);
            setFormData({
                medicine_name: "", composition: "", price: "", quantity: "", expiry_date: "", status: "Available"
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                // Update existing
                await fetch(`http://localhost:8000/api/pharmacy/inventory/${editingItem.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                // Add new
                await fetch(`http://localhost:8000/api/pharmacy/inventory?pharmacy_id=${pharmacyId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }
            setIsModalOpen(false);
            fetchInventory();
        } catch (err) {
            console.error("Failed to save item", err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this medicine?")) {
            try {
                await fetch(`http://localhost:8000/api/pharmacy/inventory/${id}`, { method: 'DELETE' });
                fetchInventory();
            } catch (err) {
                console.error("Failed to delete", err);
            }
        }
    };

    const filteredInventory = inventory.filter(item =>
        item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.composition.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <PharmacyDashboardLayout>
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-outfit text-white mb-2">Inventory Management</h1>
                        <p className="text-slate-400">Manage your pharmacy's medicine stocks and availability.</p>
                    </div>

                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-medium shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all duration-300 hover:-translate-y-1"
                    >
                        <Plus size={20} />
                        Add Medicine
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-4 rounded-xl mb-6 flex items-center gap-3">
                    <Search className="text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search medicines by name or composition..."
                        className="bg-transparent border-none text-white w-full focus:ring-0 placeholder-slate-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Inventory Table */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700/50 text-sm tracking-wider uppercase">
                                    <th className="p-4 font-semibold">Medicine Name</th>
                                    <th className="p-4 font-semibold">Composition</th>
                                    <th className="p-4 font-semibold">Quantity</th>
                                    <th className="p-4 font-semibold">Price (₹)</th>
                                    <th className="p-4 font-semibold">Expiry</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInventory.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center p-8 text-slate-500 italic">No medicines found in inventory.</td>
                                    </tr>
                                ) : (
                                    filteredInventory.map(item => (
                                        <tr key={item.id} className="border-b border-slate-700/30 hover:bg-slate-800/80 transition-colors">
                                            <td className="p-4 font-medium text-white">{item.medicine_name}</td>
                                            <td className="p-4 text-slate-400 text-sm max-w-[200px] truncate" title={item.composition}>{item.composition}</td>
                                            <td className="p-4 text-white">{item.quantity}</td>
                                            <td className="p-4 text-emerald-400 font-medium">₹{item.price}</td>
                                            <td className="p-4 text-slate-400">{item.expiry_date}</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${item.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="p-4 flex justify-end gap-3">
                                                <button onClick={() => handleOpenModal(item)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                        <div className="bg-slate-800 border border-slate-600 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">{editingItem ? "Edit Medicine" : "Add New Medicine"}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Medicine Name</label>
                                    <input required name="medicine_name" value={formData.medicine_name} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Composition</label>
                                    <input name="composition" value={formData.composition} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Price (₹)</label>
                                        <input required type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Quantity</label>
                                        <input required type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Expiry Date</label>
                                        <input required type="month" name="expiry_date" value={formData.expiry_date} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                                        <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors">
                                            <option value="Available">Available</option>
                                            <option value="Out of Stock">Out of Stock</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-700 transition-colors">Cancel</button>
                                    <button type="submit" className="px-5 py-2.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all">Save Medicine</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </PharmacyDashboardLayout>
    );
};

export default Inventory;

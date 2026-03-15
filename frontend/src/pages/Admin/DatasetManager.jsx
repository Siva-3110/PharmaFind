import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Database, UploadCloud, Plus, Trash2, Search } from 'lucide-react';

const DatasetManager = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newMed, setNewMed] = useState({ medicine_name: '', generic_name: '', strength: '', medicine_type: '' });

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/admin/medicines?limit=100');
            if (res.ok) {
                const data = await res.json();
                setMedicines(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:8000/api/admin/dataset/upload', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                alert("Dataset uploaded successfully!");
                fetchMedicines();
            } else {
                alert("Upload failed.");
            }
        } catch (err) {
            console.error("Upload error:", err);
            alert("Upload error.");
        } finally {
            setUploading(false);
            e.target.value = null;
        }
    };

    const handleAddMedicine = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:8000/api/admin/medicines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMed)
            });
            if (res.ok) {
                fetchMedicines();
                setShowModal(false);
                setNewMed({ medicine_name: '', generic_name: '', strength: '', medicine_type: '' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteMedicine = async (id) => {
        if (!window.confirm("Delete this medicine?")) return;
        try {
            const res = await fetch(`http://localhost:8000/api/admin/medicines/${id}`, { method: 'DELETE' });
            if (res.ok) fetchMedicines();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-outfit text-white mb-2">Medicine Dataset</h1>
                    <p className="text-slate-400">Manage the core dataset used by the OCR Prediction Engine.</p>
                </div>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 cursor-pointer transition-colors">
                        <UploadCloud size={18} />
                        {uploading ? "Uploading..." : "Upload CSV"}
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/20 transition-all"
                    >
                        <Plus size={18} /> Add Term
                    </button>
                </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center text-white">
                    <div className="flex items-center gap-4 w-full max-w-md">
                        <Search className="text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search dataset terms..."
                            className="bg-transparent border-none outline-none w-full text-slate-300 placeholder-slate-500"
                        />
                    </div>
                </div>

                <div className="overflow-auto max-h-[600px]">
                    <table className="w-full text-left relative">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-slate-900 border-b border-slate-700 text-sm tracking-wider uppercase text-slate-400">
                                <th className="p-4 font-medium">ID</th>
                                <th className="p-4 font-medium">Medicine Name</th>
                                <th className="p-4 font-medium">Generic Name</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {medicines.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-400">Dataset is empty. Upload a CSV.</td>
                                </tr>
                            )}
                            {medicines.map(med => (
                                <tr key={med.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 text-slate-400 font-mono text-xs">#{med.id}</td>
                                    <td className="p-4 text-white font-medium">{med.medicine_name}</td>
                                    <td className="p-4 text-slate-300 text-sm">{med.generic_name || '-'}</td>
                                    <td className="p-4 flex items-center justify-end">
                                        <button
                                            onClick={() => deleteMedicine(med.id)}
                                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-700">
                            <h2 className="text-xl font-bold text-white">Add Medicine Term</h2>
                        </div>
                        <form onSubmit={handleAddMedicine} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Medicine Name</label>
                                <input required value={newMed.medicine_name} onChange={e => setNewMed({ ...newMed, medicine_name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none" placeholder="E.g. Crocin Advance" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Generic Name / Composition</label>
                                <input value={newMed.generic_name} onChange={e => setNewMed({ ...newMed, generic_name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none" placeholder="E.g. Paracetamol" />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-medium shadow-lg shadow-emerald-500/20 transition-colors">Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default DatasetManager;

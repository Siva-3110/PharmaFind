import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { FileText } from 'lucide-react';

const PrescriptionLogs = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/admin/prescriptions');
            if (res.ok) {
                const data = await res.json();
                setPrescriptions(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-outfit text-white mb-2">Prescription Logs</h1>
                <p className="text-slate-400">System-wide feed of all customer uploaded healthcare documents.</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center text-white">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FileText size={22} className="text-emerald-400" /> System Logs
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700/50 text-sm tracking-wider uppercase">
                                <th className="p-4 font-medium">Log ID</th>
                                <th className="p-4 font-medium">Upload Date</th>
                                <th className="p-4 font-medium">Extracted Terms</th>
                                <th className="p-4 font-medium">Success Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {prescriptions.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-400">No prescriptions found in the database.</td>
                                </tr>
                            )}
                            {prescriptions.map(log => {
                                const validMedCount = log.extracted_medicines.filter(m => m.status === 'Confirmed' || m.confidence_score > 0.5).length;
                                const totalCount = log.extracted_medicines.length;
                                const rate = totalCount > 0 ? Math.round((validMedCount / totalCount) * 100) : 0;

                                return (
                                    <tr key={log.prescription_id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 text-white font-mono text-sm">#{log.prescription_id}</td>
                                        <td className="p-4 text-slate-300">
                                            {new Date(log.upload_date).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-2">
                                                {log.extracted_medicines.length > 0 ? (
                                                    log.extracted_medicines.slice(0, 3).map((med, idx) => (
                                                        <span key={idx} className="bg-slate-900 border border-slate-700 text-slate-300 px-2 py-1 rounded-md text-xs">
                                                            {med.medicine_name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-500 text-xs italic">No medicines extracted</span>
                                                )}
                                                {log.extracted_medicines.length > 3 && (
                                                    <span className="text-emerald-400 text-xs font-medium self-center">
                                                        +{log.extracted_medicines.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-full bg-slate-700/50 rounded-full h-2 max-w-[120px]">
                                                    <div
                                                        className={`h-2 rounded-full ${rate > 70 ? 'bg-emerald-400' : rate > 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                                        style={{ width: `${rate}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-slate-300 text-xs font-medium">{rate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default PrescriptionLogs;

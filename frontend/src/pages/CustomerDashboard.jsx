import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaUpload, FaFilePrescription, FaSignOutAlt, FaUser,
    FaCheckCircle, FaTrash, FaPlus, FaSave, FaSpinner, FaCloudUploadAlt
} from 'react-icons/fa';
import { MdOutlineMedication } from 'react-icons/md';
import axios from 'axios';
import VideoBackground from '../components/VideoBackground';

function CustomerDashboard() {
    const [file, setFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [prescription, setPrescription] = useState(null);
    const [medicines, setMedicines] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const navigate = useNavigate();
    const fileInputRef = useRef();
    const userId = localStorage.getItem('user_id');
    const role = localStorage.getItem('role');

    useEffect(() => {
        if (!localStorage.getItem('token')) navigate('/login');
    }, [navigate]);

    const handleFile = (selectedFile) => {
        if (selectedFile) setFile(selectedFile);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setSaved(false);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', userId);
        try {
            const res = await axios.post('http://localhost:8000/upload-prescription', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPrescription(res.data);
            setMedicines(res.data.extracted_medicines);
            const predRes = await axios.get(`http://localhost:8000/predict-unknown/${res.data.prescription_id}`);
            setPredictions(predRes.data.predictions);
        } catch {
            alert('Error processing prescription. Please try again.');
        }
        setLoading(false);
    };

    const handleEdit = (idx, field, val) => {
        const updated = [...medicines];
        updated[idx] = { ...updated[idx], [field]: val };
        setMedicines(updated);
    };

    const handleSave = async () => {
        try {
            await axios.post(`http://localhost:8000/update-medicines/${prescription.prescription_id}`, medicines);
            setSaved(true);
            setTimeout(() => { setPrescription(null); setFile(null); setSaved(false); }, 1800);
        } catch {
            alert('Error saving medicines.');
        }
    };

    const logout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <div style={{ minHeight: '100vh', color: '#fff', position: 'relative' }}>
            <VideoBackground />

            {/* TOP NAVBAR */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 50,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 40px',
                background: 'rgba(5,15,40,0.92)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MdOutlineMedication size={26} color="#38bdf8" />
                    <span style={{ fontWeight: 800, fontSize: '20px' }}>
                        Pharma<span style={{ color: '#38bdf8' }}>Find</span>
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(255,255,255,0.07)', borderRadius: '10px', padding: '8px 16px',
                    }}>
                        <FaUser size={14} color="#38bdf8" />
                        <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>{role || 'Customer'}</span>
                    </div>
                    <motion.button
                        onClick={logout}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '10px', padding: '8px 18px',
                            color: '#fca5a5', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        <FaSignOutAlt /> Logout
                    </motion.button>
                </div>
            </nav>

            {/* MAIN CONTENT */}
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '50px 24px' }}>

                {/* Page Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <FaFilePrescription size={28} color="#38bdf8" />
                        <h1 style={{ fontSize: '30px', fontWeight: 800 }}>Customer Dashboard</h1>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '36px' }}>
                        Upload your prescription and let AI identify your medicines.
                    </p>
                </motion.div>

                <AnimatePresence mode="wait">

                    {/* ===== UPLOAD SECTION ===== */}
                    {!prescription && (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '24px', padding: '40px',
                            }}
                        >
                            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '28px', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FaUpload color="#38bdf8" /> Upload New Prescription
                            </h2>

                            {/* Drag and Drop Zone */}
                            <motion.div
                                onDrop={handleDrop}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onClick={() => fileInputRef.current?.click()}
                                animate={{ borderColor: dragOver ? '#38bdf8' : 'rgba(255,255,255,0.12)' }}
                                style={{
                                    border: `2px dashed ${dragOver ? '#38bdf8' : 'rgba(255,255,255,0.18)'}`,
                                    borderRadius: '18px', padding: '56px 32px',
                                    textAlign: 'center', cursor: 'pointer',
                                    background: dragOver ? 'rgba(56,189,248,0.07)' : 'rgba(255,255,255,0.02)',
                                    transition: 'all 0.25s ease',
                                    marginBottom: '24px',
                                }}
                            >
                                <FaCloudUploadAlt size={52} color={dragOver ? '#38bdf8' : '#334155'} style={{ marginBottom: '16px' }} />
                                <p style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>
                                    {file ? `📄 ${file.name}` : 'Drag & Drop your prescription here'}
                                </p>
                                <p style={{ color: '#475569', fontSize: '14px', marginBottom: '6px' }}>
                                    {!file && 'or click to browse files'}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    {['JPG', 'PNG', 'PDF'].map(f => (
                                        <span key={f} style={{
                                            background: 'rgba(56,189,248,0.15)', color: '#38bdf8',
                                            borderRadius: '999px', padding: '3px 12px', fontSize: '12px', fontWeight: 600,
                                        }}>{f}</span>
                                    ))}
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*,.pdf"
                                    style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
                            </motion.div>

                            <motion.button
                                onClick={handleUpload}
                                disabled={!file || loading}
                                className="btn-gradient"
                                whileHover={file && !loading ? { scale: 1.03 } : {}}
                                whileTap={file && !loading ? { scale: 0.97 } : {}}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    opacity: !file || loading ? 0.5 : 1, cursor: !file ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {loading ? (
                                    <><FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Processing OCR...</>
                                ) : (
                                    <><FaUpload /> Upload & Extract Medicines</>
                                )}
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ===== RESULTS SECTION ===== */}
                    {prescription && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
                        >
                            {/* Success banner */}
                            <div style={{
                                background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
                                borderRadius: '14px', padding: '16px 22px', marginBottom: '28px',
                                display: 'flex', alignItems: 'center', gap: '12px', color: '#6ee7b7',
                            }}>
                                <FaCheckCircle size={20} />
                                <div>
                                    <div style={{ fontWeight: 700 }}>Extraction Complete!</div>
                                    <div style={{ fontSize: '13px', opacity: 0.8 }}>Review and edit the medicines below before confirming.</div>
                                </div>
                            </div>

                            {/* Medicine Cards */}
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MdOutlineMedication color="#38bdf8" /> Extracted Medicines
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {medicines.map((med, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.07 }}
                                            style={{
                                                background: med.medicine_name === 'Unknown'
                                                    ? 'rgba(239,68,68,0.1)'
                                                    : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${med.medicine_name === 'Unknown' ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.1)'}`,
                                                borderRadius: '16px', padding: '18px 22px',
                                            }}
                                        >
                                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <div style={{ flex: '1 1 200px' }}>
                                                    <label style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                                                        Medicine Name
                                                    </label>
                                                    <input
                                                        value={med.medicine_name}
                                                        onChange={e => handleEdit(idx, 'medicine_name', e.target.value)}
                                                        className="glass-input" placeholder="Medicine name"
                                                        style={{ fontSize: '14px', padding: '10px 14px' }}
                                                    />
                                                </div>
                                                <div style={{ flex: '0 1 140px' }}>
                                                    <label style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                                                        Dosage
                                                    </label>
                                                    <input
                                                        value={med.dosage}
                                                        onChange={e => handleEdit(idx, 'dosage', e.target.value)}
                                                        className="glass-input" placeholder="e.g. 500mg"
                                                        style={{ fontSize: '14px', padding: '10px 14px' }}
                                                    />
                                                </div>
                                                <div style={{ paddingTop: '18px' }}>
                                                    <span style={{
                                                        fontSize: '11px', fontWeight: 600, padding: '4px 10px',
                                                        borderRadius: '999px',
                                                        background: med.confidence_score > 70 ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
                                                        color: med.confidence_score > 70 ? '#6ee7b7' : '#fde68a',
                                                    }}>
                                                        {Math.round(med.confidence_score || 0)}% match
                                                    </span>
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                    onClick={() => setMedicines(medicines.filter((_, i) => i !== idx))}
                                                    style={{
                                                        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)',
                                                        borderRadius: '10px', padding: '10px 14px', cursor: 'pointer',
                                                        color: '#fca5a5', marginTop: '18px',
                                                    }}
                                                >
                                                    <FaTrash size={14} />
                                                </motion.button>
                                            </div>

                                            {/* Predictions for Unknown */}
                                            {med.medicine_name === 'Unknown' && predictions.length > 0 && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                    style={{ marginTop: '14px', padding: '12px 14px', background: 'rgba(251,191,36,0.08)', borderRadius: '10px', border: '1px solid rgba(251,191,36,0.2)' }}>
                                                    <p style={{ color: '#fde68a', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>🤖 AI Predictions:</p>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {predictions.map((p, pi) => (
                                                            <motion.button key={pi} whileHover={{ scale: 1.05 }}
                                                                onClick={() => handleEdit(idx, 'medicine_name', p.medicine_name)}
                                                                style={{
                                                                    background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(56,189,248,0.3)',
                                                                    borderRadius: '8px', padding: '5px 14px', color: '#7dd3fc',
                                                                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                                                }}>
                                                                {p.medicine_name} ({p.frequency}×)
                                                            </motion.button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                                <motion.button
                                    onClick={() => { setPrescription(null); setFile(null); }}
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    className="btn-outline"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <FaUpload size={13} /> Upload Another
                                </motion.button>
                                <motion.button
                                    onClick={() => setMedicines([...medicines, { medicine_name: '', dosage: '', confidence_score: 100, status: 'Manually Added' }])}
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
                                        borderRadius: '12px', padding: '13px 24px', color: '#6ee7b7',
                                        fontWeight: 600, cursor: 'pointer', fontSize: '15px',
                                    }}
                                >
                                    <FaPlus size={13} /> Add Medicine
                                </motion.button>
                                <motion.button
                                    onClick={handleSave}
                                    className="btn-gradient"
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}
                                >
                                    {saved ? <><FaCheckCircle /> Saved!</> : <><FaSave /> Confirm & Save</>}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}

export default CustomerDashboard;

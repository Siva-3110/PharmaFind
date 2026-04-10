import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaUserTag, FaArrowRight } from 'react-icons/fa';
import axios from 'axios';
import VideoBackground from '../components/VideoBackground';
import Navbar from '../components/Navbar';

function Signup() {
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: '', role: 'Customer'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post('http://localhost:8000/signup', formData);
            navigate('/login', { state: { success: 'Account created! Please login.' } });
        } catch (err) {
            setError('Signup failed. Email might already be registered.');
        }
        setLoading(false);
    };

    const fields = [
        { icon: <FaUser />, name: 'name', type: 'text', placeholder: 'Full Name', label: 'Full Name', autoComplete: 'name' },
        { icon: <FaEnvelope />, name: 'email', type: 'email', placeholder: 'Email Address', label: 'Email', autoComplete: 'email' },
        { icon: <FaPhone />, name: 'phone', type: 'tel', placeholder: 'Phone Number', label: 'Phone', autoComplete: 'tel' },
        { icon: <FaLock />, name: 'password', type: 'password', placeholder: 'Create Password', label: 'Password', autoComplete: 'new-password' },
    ];

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '90px 20px 30px' }}>
            <VideoBackground />
            <Navbar />

            <motion.div
                className="glass-card-dark"
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, type: 'spring' }}
                style={{ width: '100%', maxWidth: '480px', padding: '44px 40px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏥</div>
                    <h2 style={{ color: '#fff', fontSize: '26px', fontWeight: 800, marginBottom: '8px' }}>Create Account</h2>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Join PharmaFind and find your medicines faster</p>
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{
                            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
                            borderRadius: '10px', padding: '12px 16px', color: '#fca5a5',
                            fontSize: '14px', marginBottom: '20px',
                        }}>
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSignup}>
                    {fields.map(({ icon, name, type, placeholder, label, autoComplete }) => (
                        <div key={name} style={{ marginBottom: '16px' }}>
                            <label htmlFor={name} style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '7px' }}>
                                {label}
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }}>
                                    {icon}
                                </span>
                                <input
                                    id={name} type={type} name={name} required
                                    onChange={handleChange} placeholder={placeholder}
                                    autoComplete={autoComplete}
                                    className="glass-input" style={{ paddingLeft: '42px' }}
                                />
                            </div>
                        </div>
                    ))}

                    {/* Role */}
                    <div style={{ marginBottom: '28px' }}>
                        <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '7px' }}>
                            Account Type
                        </label>
                        <div style={{ position: 'relative' }}>
                            <FaUserTag style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', zIndex: 1 }} />
                            <select name="role" onChange={handleChange} className="glass-input" style={{ paddingLeft: '42px' }}>
                                <option value="Customer">Customer (Patient)</option>
                                <option value="Pharmacy Owner">Pharmacy Owner</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <motion.button
                        type="submit" disabled={loading}
                        className="btn-gradient"
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        {loading ? 'Creating Account...' : (<>Create Account <FaArrowRight size={13} /></>)}
                    </motion.button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', color: '#64748b', fontSize: '14px' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
                </p>
            </motion.div>
        </div>
    );
}

export default Signup;

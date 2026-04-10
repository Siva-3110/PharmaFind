import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaArrowRight } from 'react-icons/fa';
import axios from 'axios';
import VideoBackground from '../components/VideoBackground';
import Navbar from '../components/Navbar';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const res = await axios.post('http://localhost:8000/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('user_id', res.data.user_id);
            localStorage.setItem('user_name', res.data.name); // Assuming 'name' is returned
            localStorage.setItem('user_role', res.data.role);

            if (res.data.role === "Pharmacy Owner") {
                navigate('/pharmacy/dashboard');
            } else if (res.data.role === "Customer") {
                navigate('/dashboard');
            } else if (res.data.role === "Admin") {
                navigate('/admin/dashboard');
            } else {
                // Handle other roles or unexpected roles
                setError('Unsupported user role. Please contact support.');
            }
        } catch (err) {
            setError('Invalid email or password. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px 20px' }}>
            <VideoBackground />
            <Navbar />

            <motion.div
                className="glass-card-dark"
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, type: 'spring' }}
                style={{ width: '100%', maxWidth: '440px', padding: '44px 40px' }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>💊</div>
                    <h2 style={{ color: '#fff', fontSize: '26px', fontWeight: 800, marginBottom: '8px' }}>
                        Welcome Back
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>
                        Sign in to your PharmaFind account
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
                            borderRadius: '10px', padding: '12px 16px', color: '#fca5a5',
                            fontSize: '14px', marginBottom: '20px',
                        }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleLogin}>
                    {/* Email */}
                    <div style={{ marginBottom: '18px' }}>
                        <label htmlFor="email" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                            Email Address
                        </label>
                        <div style={{ position: 'relative' }}>
                            <FaEnvelope style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
                            <input
                                id="email" name="email" type="email" required
                                value={email} onChange={e => setEmail(e.target.value)}
                                autoComplete="email"
                                className="glass-input" placeholder="your@email.com"
                                style={{ paddingLeft: '42px' }}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: '28px' }}>
                        <label htmlFor="password" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <FaLock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
                            <input
                                id="password" name="password" type="password" required
                                value={password} onChange={e => setPassword(e.target.value)}
                                autoComplete="current-password"
                                className="glass-input" placeholder="Enter your password"
                                style={{ paddingLeft: '42px' }}
                            />
                        </div>
                    </div>

                    <motion.button
                        type="submit"
                        disabled={loading}
                        className="btn-gradient"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        {loading ? 'Signing in...' : (<>Sign In <FaArrowRight size={13} /></>)}
                    </motion.button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', color: '#64748b', fontSize: '14px' }}>
                    Don't have an account?{' '}
                    <Link to="/signup" style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>
                        Sign Up
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}

export default Login;

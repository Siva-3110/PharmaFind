import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUpload, FaDatabase, FaBrain, FaArrowRight } from 'react-icons/fa';
import VideoBackground from '../components/VideoBackground';
import Navbar from '../components/Navbar';

const features = [
    {
        icon: <FaUpload size={26} color="#38bdf8" />,
        title: 'OCR Extraction',
        desc: 'Reads handwritten prescriptions using advanced image recognition technology.',
        delay: 0,
    },
    {
        icon: <FaDatabase size={26} color="#34d399" />,
        title: 'Dataset Matching',
        desc: 'Corrects spelling errors against a verified medicine database with fuzzy matching.',
        delay: 0.15,
    },
    {
        icon: <FaBrain size={26} color="#f472b6" />,
        title: 'AI Prediction',
        desc: 'Predicts unknown medicines by learning from historical prescription patterns.',
        delay: 0.3,
    },
];

function Home() {
    return (
        <div style={{ minHeight: '100vh', color: '#fff', position: 'relative' }}>
            <VideoBackground />
            <Navbar />

            {/* Single centered column for everything */}
            <div style={{
                maxWidth: '900px',
                margin: '0 auto',
                padding: '150px 32px 60px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
            }}>

                {/* ── TITLE ── */}
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{
                        fontSize: 'clamp(52px, 8vw, 88px)',
                        fontWeight: 900, lineHeight: 1.06, marginBottom: '16px',
                        textShadow: '0 2px 8px rgba(0,0,0,1), 0 4px 32px rgba(0,0,0,0.9)',
                        width: '100%',
                    }}
                >
                    Pharma<span style={{ color: '#38bdf8' }}>Find</span>
                </motion.h1>

                {/* ── SUBTITLE ── */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    style={{
                        fontSize: '20px', color: '#ffffff', fontWeight: 700,
                        marginBottom: '18px', lineHeight: 1.5,
                        textShadow: '0 2px 12px rgba(0,0,0,1)',
                        width: '100%',
                    }}
                >
                    AI-Based Medicine Availability & Navigation System
                </motion.p>

                {/* ── DESCRIPTION ── */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    style={{
                        fontSize: '15px', color: '#e2e8f0', lineHeight: 1.8,
                        width: '100%',
                        marginBottom: '36px',
                        background: 'rgba(0,10,40,0.5)',
                        borderRadius: '14px', padding: '14px 24px',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    Upload your doctor's prescription. Our AI reads the handwriting,
                    identifies medicines, corrects errors, and predicts missing drugs — in seconds.
                </motion.p>

                {/* ── BUTTONS ── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '48px' }}
                >
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                        <Link to="/signup" className="btn-gradient" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none',
                        }}>
                            Get Started <FaArrowRight size={14} />
                        </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                        <Link to="/login" className="btn-outline" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none',
                        }}>
                            Sign In
                        </Link>
                    </motion.div>
                </motion.div>

                {/* ── FEATURE CARDS ── */}
                <div id="features" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '20px',
                    width: '100%',
                }}>
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + f.delay, duration: 0.6, type: 'spring' }}
                            whileHover={{ scale: 1.04, y: -4 }}
                            style={{
                                padding: '24px',
                                background: 'rgba(2,10,35,0.75)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255,255,255,0.13)',
                                borderRadius: '18px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                                textAlign: 'left',
                            }}
                        >
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(255,255,255,0.1)', marginBottom: '14px',
                            }}>
                                {f.icon}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px', color: '#ffffff' }}>
                                {f.title}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.7 }}>{f.desc}</div>
                        </motion.div>
                    ))}
                </div>

            </div>

            {/* Footer */}
            <footer style={{
                textAlign: 'center', padding: '20px',
                color: 'rgba(255,255,255,0.2)', fontSize: '13px',
                borderTop: '1px solid rgba(255,255,255,0.07)',
            }}>
                © 2025 PharmaFind — AI-Based Medicine Availability & Navigation System
            </footer>
        </div>
    );
}

export default Home;

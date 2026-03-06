import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPills } from 'react-icons/fa';

function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const isHome = location.pathname === '/';

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 48px',
                transition: 'all 0.3s ease',
                background: scrolled || !isHome
                    ? 'rgba(5,15,40,0.92)'
                    : 'rgba(0,0,0,0.2)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
        >
            {/* Logo */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <FaPills color="#38bdf8" size={22} />
                <span style={{ color: '#fff', fontWeight: 800, fontSize: '20px', letterSpacing: '0.3px' }}>
                    Pharma<span style={{ color: '#38bdf8' }}>Find</span>
                </span>
            </Link>

            {/* Nav Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
                {isHome && (
                    <>
                        <NavLink href="#features">Features</NavLink>
                        <NavLink href="#about">About</NavLink>
                    </>
                )}
                <Link to="/login" style={{
                    color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 600,
                    textDecoration: 'none', transition: 'color 0.2s',
                }}>
                    Login
                </Link>
                <Link to="/signup" style={{
                    background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                    color: '#fff', fontSize: '14px', fontWeight: 700,
                    padding: '8px 22px', borderRadius: '10px',
                    textDecoration: 'none', boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
                    transition: 'all 0.2s',
                }}>
                    Sign Up
                </Link>
            </div>
        </motion.nav>
    );
}

function NavLink({ href, children }) {
    return (
        <a href={href} style={{
            color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 500,
            textDecoration: 'none', transition: 'color 0.2s',
        }}
            onMouseEnter={e => e.target.style.color = '#38bdf8'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
        >
            {children}
        </a>
    );
}

export default Navbar;

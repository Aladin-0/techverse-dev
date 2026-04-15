// src/pages/LoginPage.tsx — Login + Registration only. Password reset is handled on the profile page.
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient, { API_BASE_URL } from '../api';
import { useUserStore } from '../stores/userStore';

type Tab = 'login' | 'register';

export const LoginPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const login = useUserStore((state) => state.login);

    const [tab, setTab] = useState<Tab>('login');
    const [infoMessage, setInfoMessage] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const t = (searchParams.get('tab') || '').toLowerCase();
        setTab(t === 'signup' || t === 'register' ? 'register' : 'login');
        const info = (searchParams.get('info') || '').toLowerCase();
        setInfoMessage(info === 'no_account' ? 'Identity not found. Please create an account or sign in with Google.' : '');
    }, [searchParams]);

    const clearError = () => setError('');

    // ── Login ─────────────────────────────────────────────────
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            const data = err.response?.data || {};
            setError(data?.detail || data?.non_field_errors?.[0] || 'Access denied. Invalid credentials.');
        } finally {
            setLoading(false);
        }
    };

    // ── Register ──────────────────────────────────────────────
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        if (password !== passwordConfirm) { setError('Passwords do not match.'); return; }
        setLoading(true);
        try {
            const response = await apiClient.post('/api/auth/registration/', {
                email, name, password1: password, password2: passwordConfirm
            });
            localStorage.setItem('access_token', response.data.access);
            useUserStore.setState({ user: response.data.user, isAuthenticated: true });
            navigate('/');
        } catch (err: any) {
            const data = err.response?.data || {};
            const emailErr = data?.email?.[0] || '';
            if (emailErr.toLowerCase().includes('already')) {
                setError('This email is already registered. Try signing in with Google or use the login tab.');
            } else {
                setError(
                    data?.detail || data?.non_field_errors?.[0] ||
                    emailErr || data?.password1?.[0] || data?.name?.[0] ||
                    'Registration failed. Please try again.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Google OAuth ──────────────────────────────────────────
    const handleGoogleLogin = () => {
        window.location.href = `${API_BASE_URL}/auth/google/login/`;
    };

    const EyeIcon = ({ open }: { open: boolean }) => open
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }} className="bg-[#FAF8F5] text-[#0a0a0a] min-h-screen overflow-hidden">
            <style>{`
                .bg-mesh {
                    background-color: #FAF8F5;
                    background-image:
                        radial-gradient(at 0% 0%, rgba(28,43,74,0.08) 0px, transparent 50%),
                        radial-gradient(at 100% 100%, rgba(28,43,74,0.06) 0px, transparent 50%);
                }
                .glass { background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); border: 1px solid rgba(28,43,74,0.12); }
                .tv-input {
                    width: 100%; background: white; border: 1.5px solid #e2e8f0;
                    border-radius: 12px; padding: 14px 16px 14px 46px;
                    color: #1A1814; outline: none; font-family: 'Inter', sans-serif;
                    font-size: 14px; transition: border-color 0.2s, box-shadow 0.2s;
                    box-sizing: border-box;
                }
                .tv-input:focus { border-color: #1C2B4A; box-shadow: 0 0 0 3px rgba(28,43,74,0.08); }
                .tv-input::placeholder { color: #94a3b8; }
                .tv-btn {
                    width: 100%; background: #1C2B4A; color: #fff; border: none;
                    border-radius: 12px; padding: 15px; font-weight: 700; font-size: 14px;
                    font-family: 'Inter', sans-serif; cursor: pointer; letter-spacing: 0.05em;
                    transition: all 0.2s;
                }
                .tv-btn:hover:not(:disabled) { background: #243660; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(28,43,74,0.2); }
                .tv-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                .tv-google {
                    width: 100%; background: white; border: 1.5px solid #e2e8f0;
                    border-radius: 12px; padding: 13px; font-weight: 700; font-size: 13px;
                    font-family: 'Inter', sans-serif; cursor: pointer; color: #1A1814;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    transition: all 0.2s;
                }
                .tv-google:hover { border-color: #1C2B4A; box-shadow: 0 4px 16px rgba(28,43,74,0.08); }
            `}</style>

            <div className="relative flex min-h-screen w-full flex-col bg-mesh">
                {/* Ambient blobs */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#1C2B4A]/10 blur-[120px] rounded-full" />
                    <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-[#1C2B4A]/05 blur-[120px] rounded-full" />
                </div>

                <div className="relative z-10 flex flex-col min-h-screen">
                    {/* Header */}
                    <header className="flex items-center justify-between px-6 py-6 lg:px-12">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => navigate('/')}>
                            <span className="text-2xl font-black tracking-tighter text-[#1A1814]">TECH</span>
                            <span className="text-2xl font-black tracking-tighter text-[#1C2B4A]">VERSE</span>
                        </div>
                        <button onClick={() => navigate('/')} className="flex items-center justify-center rounded-xl h-10 w-10 glass text-[#6B6156] hover:text-[#1C2B4A] transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                    </header>

                    {/* Main */}
                    <main className="flex-1 flex flex-col lg:flex-row items-center justify-center px-6 gap-12 lg:gap-24 pb-20">
                        {/* Left brand */}
                        <div className="hidden lg:block relative w-full max-w-md">
                            <div className="relative glass rounded-2xl p-4 overflow-hidden aspect-square flex items-center justify-center bg-white">
                                <img alt="TechVerse" className="w-full h-full object-cover drop-shadow-xl rounded-xl" src="/stitch-headset.jpg" />
                                <div className="absolute inset-0 bg-white/20" />
                            </div>
                            <div className="mt-8 space-y-2">
                                <h1 className="text-5xl font-black text-[#1A1814] leading-none uppercase">
                                    THE NEXT <br />
                                    <span className="text-[#1C2B4A] font-light italic">DIMENSION</span>
                                </h1>
                                <p className="text-[#6B6156] text-lg">One account. All of TechVerse.</p>
                            </div>
                        </div>

                        {/* Card */}
                        <div className="w-full max-w-[420px]">
                            <div className="glass rounded-2xl p-8 lg:p-10" style={{ boxShadow: '0 4px 24px rgba(28,43,74,0.08)' }}>

                                {/* Tab switcher */}
                                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 28 }}>
                                    {(['login', 'register'] as Tab[]).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => { setTab(t); clearError(); }}
                                            style={{
                                                paddingBottom: 12, paddingRight: 20, border: 'none', background: 'none',
                                                cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'Inter', sans-serif",
                                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                                color: tab === t ? '#1C2B4A' : '#94a3b8',
                                                borderBottom: tab === t ? '2px solid #1C2B4A' : '2px solid transparent',
                                                marginBottom: -1,
                                                transition: 'color 0.2s',
                                            }}
                                        >
                                            {t === 'login' ? 'Login' : 'Sign Up'}
                                        </button>
                                    ))}
                                </div>

                                {/* Title */}
                                <div style={{ marginBottom: 24 }}>
                                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1814', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                                        {tab === 'login' ? 'Welcome back' : 'Create your account'}
                                    </h2>
                                    <p style={{ fontSize: 13, color: '#6B6156', margin: 0 }}>
                                        {tab === 'login' ? 'Sign in to your TechVerse account' : 'Join TechVerse today'}
                                    </p>
                                </div>

                                {/* Info / Error */}
                                {infoMessage && (
                                    <div style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 10, background: 'rgba(28,43,74,0.05)', border: '1px solid rgba(28,43,74,0.12)', color: '#1C2B4A', fontSize: 13, fontWeight: 600 }}>
                                        {infoMessage}
                                    </div>
                                )}
                                {error && (
                                    <div style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
                                        {error}
                                    </div>
                                )}

                                {/* ── LOGIN ── */}
                                {tab === 'login' && (
                                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        <div style={{ position: 'relative' }}>
                                            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/><polyline points="22 6 12 13 2 6"/></svg>
                                            <input id="login-email" className="tv-input" type="email" placeholder="Email address" required value={email} onChange={e => setEmail(e.target.value)} />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                            <input id="login-password" className="tv-input" style={{ paddingRight: 46 }} type={showPass ? 'text' : 'password'} placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
                                            <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                                                <EyeIcon open={showPass} />
                                            </button>
                                        </div>
                                        <button id="login-submit" type="submit" className="tv-btn" disabled={loading} style={{ marginTop: 4 }}>
                                            {loading ? 'Signing in...' : 'SIGN IN'}
                                        </button>
                                    </form>
                                )}

                                {/* ── REGISTER ── */}
                                {tab === 'register' && (
                                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        <div style={{ position: 'relative' }}>
                                            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                            <input id="reg-name" className="tv-input" type="text" placeholder="Full name" required value={name} onChange={e => setName(e.target.value)} />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/><polyline points="22 6 12 13 2 6"/></svg>
                                            <input id="reg-email" className="tv-input" type="email" placeholder="Email address" required value={email} onChange={e => setEmail(e.target.value)} />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                            <input id="reg-password" className="tv-input" style={{ paddingRight: 46 }} type={showPass ? 'text' : 'password'} placeholder="Password (min 8 chars)" required value={password} onChange={e => setPassword(e.target.value)} />
                                            <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                                                <EyeIcon open={showPass} />
                                            </button>
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                            <input id="reg-confirm" className="tv-input" style={{ paddingRight: 46 }} type={showConfirm ? 'text' : 'password'} placeholder="Confirm password" required value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />
                                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                                                <EyeIcon open={showConfirm} />
                                            </button>
                                        </div>
                                        <button id="register-submit" type="submit" className="tv-btn" disabled={loading} style={{ marginTop: 4 }}>
                                            {loading ? 'Creating account...' : 'CREATE ACCOUNT'}
                                        </button>
                                    </form>
                                )}

                                {/* Google + toggle */}
                                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                                        <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>or</span>
                                        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                                    </div>

                                    <button id="google-login-btn" onClick={handleGoogleLogin} className="tv-google">
                                        <svg width="18" height="18" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        {tab === 'login' ? 'Continue with Google' : 'Sign up with Google'}
                                    </button>

                                    <p style={{ textAlign: 'center', fontSize: 13, color: '#6B6156', margin: 0 }}>
                                        {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                                        <button type="button"
                                            onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); clearError(); }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1C2B4A', fontWeight: 700, fontSize: 13, fontFamily: "'Inter', sans-serif", textDecoration: 'underline' }}
                                        >
                                            {tab === 'login' ? 'Create one' : 'Sign in'}
                                        </button>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </main>

                    <footer style={{ textAlign: 'center', padding: '16px 24px', opacity: 0.5, fontSize: 11, fontWeight: 600, color: '#6B6156', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        © 2026 TechVerse Core · <a href="/privacy-policy" style={{ color: 'inherit' }}>Privacy</a> · <a href="/terms-conditions" style={{ color: 'inherit' }}>Terms</a>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
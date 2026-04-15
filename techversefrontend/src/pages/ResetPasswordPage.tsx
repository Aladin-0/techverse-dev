// src/pages/ResetPasswordPage.tsx
// Handles the password-reset confirm flow.
// The URL format is: /reset-password?uid=ABC&token=XYZ
// These params come from the link in the password-reset email.
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';

export const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const confirmPasswordReset = useUserStore(state => state.confirmPasswordReset);

    const uid = searchParams.get('uid') || '';
    const token = searchParams.get('token') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!uid || !token) {
            setError('Invalid or expired reset link. Please request a new one.');
        }
    }, [uid, token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
        setLoading(true);
        try {
            await confirmPasswordReset(uid, token, newPassword, confirmPassword);
            setDone(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            // Error is already set by the store action
            setError(useUserStore.getState().error || 'Reset failed. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    const EyeIcon = ({ open }: { open: boolean }) => open ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
    ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    );

    return (
        <div style={{
            minHeight: '100vh', background: '#FAF8F5', display: 'flex',
            flexDirection: 'column', fontFamily: "'Inter', sans-serif",
        }}>
            <style>{`
                .rp-input {
                    width: 100%; background: white; border: 1.5px solid #e2e8f0;
                    border-radius: 12px; padding: 14px 16px 14px 46px;
                    color: #1A1814; outline: none; font-family: 'Inter', sans-serif;
                    font-size: 14px; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box;
                }
                .rp-input:focus { border-color: #1C2B4A; box-shadow: 0 0 0 3px rgba(28,43,74,0.08); }
                .rp-input::placeholder { color: #94a3b8; }
                .rp-btn {
                    width: 100%; background: #1C2B4A; color: white; border: none;
                    border-radius: 12px; padding: 15px; font-weight: 700; font-size: 14px;
                    font-family: 'Inter', sans-serif; cursor: pointer; letter-spacing: 0.05em;
                    transition: all 0.2s;
                }
                .rp-btn:hover:not(:disabled) { background: #243660; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(28,43,74,0.2); }
                .rp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            `}</style>

            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 48px', flexShrink: 0 }}>
                <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', gap: 2 }}>
                    <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: '#1A1814' }}>TECH</span>
                    <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: '#1C2B4A' }}>VERSE</span>
                </div>
            </header>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <div style={{
                    width: '100%', maxWidth: 420,
                    background: 'rgba(255,255,255,0.97)',
                    border: '1px solid rgba(28,43,74,0.12)',
                    borderRadius: 24, padding: '40px 36px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                }}>
                    {done ? (
                        // ── Success State ──
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: 20, background: 'rgba(34,197,94,0.1)',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20
                            }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            </div>
                            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1814', margin: '0 0 10px', letterSpacing: '-0.02em' }}>Password Reset!</h2>
                            <p style={{ fontSize: 14, color: '#6B6156', lineHeight: 1.6, margin: '0 0 24px' }}>
                                Your password has been updated. Redirecting you to login...
                            </p>
                            <button className="rp-btn" onClick={() => navigate('/login')}>Go to Login</button>
                        </div>
                    ) : (
                        // ── Form State ──
                        <>
                            <div style={{ marginBottom: 28 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 14, background: 'rgba(28,43,74,0.06)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
                                }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1C2B4A" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                    </svg>
                                </div>
                                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1A1814', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Set New Password</h2>
                                <p style={{ fontSize: 14, color: '#6B6156', margin: 0, lineHeight: 1.5 }}>
                                    Choose a strong password for your TechVerse account.
                                </p>
                            </div>

                            {error && (
                                <div style={{
                                    marginBottom: 20, padding: '14px 16px', borderRadius: 12,
                                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                                    color: '#dc2626', fontSize: 13, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'flex-start'
                                }}>
                                    <svg style={{ flexShrink: 0, marginTop: 1 }} width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                    {error}
                                </div>
                            )}

                            {!uid || !token ? (
                                <div style={{ textAlign: 'center' }}>
                                    <button className="rp-btn" style={{ marginTop: 16 }} onClick={() => navigate('/login?tab=login')}>
                                        Request New Link
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ position: 'relative' }}>
                                        <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                        </svg>
                                        <input
                                            id="reset-new-password"
                                            className="rp-input"
                                            type={showPass ? 'text' : 'password'}
                                            placeholder="New password (min 8 chars)"
                                            required value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            style={{ paddingRight: '46px' }}
                                        />
                                        <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                                            <EyeIcon open={showPass} />
                                        </button>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                        </svg>
                                        <input
                                            id="reset-confirm-password"
                                            className="rp-input"
                                            type={showConfirm ? 'text' : 'password'}
                                            placeholder="Confirm new password"
                                            required value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            style={{ paddingRight: '46px' }}
                                        />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                                            <EyeIcon open={showConfirm} />
                                        </button>
                                    </div>

                                    <button id="reset-submit" type="submit" className="rp-btn" disabled={loading} style={{ marginTop: 4 }}>
                                        {loading ? 'Updating password...' : 'SET NEW PASSWORD'}
                                    </button>

                                    <button type="button" onClick={() => navigate('/login')} style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: '#94a3b8', fontSize: 12, fontWeight: 600, textAlign: 'center',
                                        fontFamily: "'Inter', sans-serif"
                                    }}>
                                        Remember your password? Sign in
                                    </button>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;

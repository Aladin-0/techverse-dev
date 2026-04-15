// src/pages/PaymentRedirectPage.tsx - Redesigned with Premium Glass Aesthetics
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api';
import { CircularProgress } from '@mui/material';
import { useCartStore } from '../stores/cartStore';

const PaymentRedirectPage: React.FC = () => {
    const { transactionId } = useParams<{ transactionId: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'error'>('loading');
    const { clearCart } = useCartStore();

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const verifyStatus = async () => {
            try {
                const response = await apiClient.post('/api/payments/callback/', {
                    code: 'VERIFY',
                    merchantId: 'PGTESTPAYUAT', 
                    transactionId: transactionId
                });

                if (response.data.status === 'SUCCESS') {
                    setStatus('success');
                    clearCart();
                } else if (response.data.status === 'FAILED') {
                    setStatus('failed');
                } else {
                    setTimeout(verifyStatus, 3000);
                }
            } catch (err) {
                setStatus('error');
            }
        };

        if (transactionId) {
            verifyStatus();
        }
    }, [transactionId, clearCart]);

    // Format current date for display
    const currentDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const isError = status === 'failed' || status === 'error';
    const isSuccess = status === 'success';
    const isLoading = status === 'loading';

    // Premium Color Palette
    const colors = {
        bg: '#0a0b10',
        surface: 'rgba(255, 255, 255, 0.03)',
        border: 'rgba(255, 255, 255, 0.08)',
        primary: '#8b5cff',
        success: '#10b981', // Emerald
        error: '#f43f5e',   // Rose
        text: '#f8fafc',
        muted: '#94a3b8'
    };

    return (
        <div style={{ backgroundColor: colors.bg, color: colors.text, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '16px' : '2rem', fontFamily: "'Inter', sans-serif", overflow: 'hidden', position: 'relative' }}>
            
            {/* Ambient Background Glows */}
            <div style={{ position: 'absolute', top: isMobile ? '10%' : '20%', left: isMobile ? '-10%' : '10%', width: isMobile ? 250 : 400, height: isMobile ? 250 : 400, background: isSuccess ? colors.success : isError ? colors.error : colors.primary, filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%', pointerEvents: 'none', transition: 'all 1s ease' }} />
            <div style={{ position: 'absolute', bottom: isMobile ? '10%' : '20%', right: isMobile ? '-10%' : '10%', width: isMobile ? 250 : 400, height: isMobile ? 250 : 400, background: isSuccess ? '#059669' : isError ? '#be123c' : '#6d28d9', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%', pointerEvents: 'none', transition: 'all 1s ease' }} />

            <div style={{ maxWidth: 600, width: '100%', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                
                {/* Logo */}
                <div style={{ marginBottom: isMobile ? 24 : 40, cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <span style={{ fontSize: isMobile ? 24 : 28, fontWeight: 900, letterSpacing: '-1px' }}>TECH<span style={{ color: colors.primary }}>VERSE</span></span>
                </div>

                {/* Main Card */}
                <div style={{ width: '100%', background: colors.surface, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${colors.border}`, borderRadius: isMobile ? 20 : 24, padding: isMobile ? '32px 20px' : '48px 40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
                    
                    {/* Top Glow Edge */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${isSuccess ? colors.success : isError ? colors.error : colors.primary}, transparent)` }} />

                    {isLoading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                            <CircularProgress size={64} thickness={2} sx={{ color: colors.primary, mb: 4 }} />
                            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Verifying Payment</h1>
                            <p style={{ color: colors.muted, fontSize: 15 }}>Please wait while we securely process your transaction...</p>
                        </div>
                    )}

                    {isSuccess && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: `2px solid ${colors.success}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: `0 0 30px rgba(16, 185, 129, 0.2)` }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Payment Successful!</h1>
                            <p style={{ color: colors.muted, fontSize: 16, marginBottom: 32 }}>Your order has been confirmed and is being processed.</p>
                            
                            <div style={{ width: '100%', background: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 20, marginBottom: 32, textAlign: 'left', border: `1px solid ${colors.border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span style={{ color: colors.muted, fontSize: 13 }}>Transaction ID</span>
                                    <span style={{ fontWeight: 600, fontSize: 13, fontFamily: 'monospace' }}>{transactionId}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span style={{ color: colors.muted, fontSize: 13 }}>Date</span>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{currentDate}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: colors.muted, fontSize: 13 }}>Status</span>
                                    <span style={{ color: colors.success, fontWeight: 700, fontSize: 13 }}>COMPLETED</span>
                                </div>
                            </div>

                            <button onClick={() => navigate('/my-orders')} style={{ width: '100%', padding: '16px', background: colors.success, color: '#000', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'transform 0.2s', boxShadow: '0 10px 20px -10px rgba(16,185,129,0.5)' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                View My Orders
                            </button>
                        </div>
                    )}

                    {isError && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(244, 63, 94, 0.1)', border: `2px solid ${colors.error}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: `0 0 30px rgba(244, 63, 94, 0.2)` }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.error} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </div>
                            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Payment Failed</h1>
                            <p style={{ color: colors.muted, fontSize: 16, marginBottom: 32, lineHeight: 1.5 }}>
                                {status === 'failed' ? "Your payment was declined or cancelled. No charges were made." : "An error occurred while verifying your payment."}
                            </p>
                            
                            <div style={{ width: '100%', background: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 20, marginBottom: 32, textAlign: 'left', border: `1px solid ${colors.border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span style={{ color: colors.muted, fontSize: 13 }}>Transaction ID</span>
                                    <span style={{ fontWeight: 600, fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all' }}>{transactionId || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: colors.muted, fontSize: 13 }}>Status</span>
                                    <span style={{ color: colors.error, fontWeight: 700, fontSize: 13 }}>FAILED</span>
                                </div>
                            </div>

                            <button onClick={() => navigate('/store')} style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.05)', color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = colors.border; }}>
                                Return to Store
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(0.98); }
                }
            `}</style>
        </div>
    );
};

export default PaymentRedirectPage;

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Skeleton, Chip } from '@mui/material';
import apiClient from '../api';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import MouseIcon from '@mui/icons-material/Mouse';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';

const ACCENT = '#1C2B4A';
const SECONDARY_ACCENT = '#D4922A';
const BG_DARK = '#0a0b10'; // Premium dark theme for Affiliate Dashboard
const SURFACE = 'rgba(255, 255, 255, 0.03)';
const BORDER = 'rgba(255, 255, 255, 0.08)';
const TEXT_LIGHT = '#f8fafc';
const TEXT_MUTED = '#94a3b8';

interface AffiliateStats {
    id: number;
    code: string;
    commission_rate: string;
    is_active: boolean;
    total_clicks: number;
    total_sales: number;
    total_earnings: string;
    recent_sales: Array<{
        id: number;
        order_id: number;
        order_total: string;
        commission_amount: string;
        created_at: string;
    }>;
}

export const AffiliateDashboard: React.FC = () => {
    const [stats, setStats] = useState<AffiliateStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await apiClient.get('/api/affiliates/dashboard/');
                setStats(response.data);
            } catch (err: any) {
                console.error("Dashboard error:", err);
                setError(err.response?.data?.error || "Failed to load dashboard. Make sure you are an active affiliate.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return (
        <Box sx={{ p: 4, background: BG_DARK, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
                <Skeleton variant="circular" width={64} height={64} sx={{ bgcolor: 'rgba(255,255,255,0.05)', mx: 'auto', mb: 2 }} />
                <Typography sx={{ color: TEXT_MUTED }}>Loading Creator Dashboard...</Typography>
            </Box>
        </Box>
    );

    if (error || !stats) {
        return (
            <Box sx={{ 
                height: '100vh', 
                width: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: BG_DARK,
                p: 3,
                textAlign: 'center'
            }}>
                <ErrorIcon sx={{ color: SECONDARY_ACCENT, fontSize: 64, mb: 2 }} />
                <Typography variant="h4" sx={{ color: TEXT_LIGHT, fontWeight: 900, mb: 1 }}>ACCESS DENIED</Typography>
                <Typography sx={{ color: TEXT_MUTED, mb: 4, maxWidth: 400 }}>{error || "This creator page has been moved or terminated."}</Typography>
                <Button variant="contained" onClick={() => window.location.href = '/'} sx={{ bgcolor: TEXT_LIGHT, color: '#000', px: 4, py: 1.5, borderRadius: 2, fontWeight: 800, '&:hover': { bgcolor: '#e2e8f0' } }}>Return to Home</Button>
            </Box>
        );
    }

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: BG_DARK, 
            color: TEXT_LIGHT,
            fontFamily: "'Inter', sans-serif",
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Ambient Background */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(28,43,74,0.4) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(212,146,42,0.15) 0%, transparent 60%)', filter: 'blur(120px)', zIndex: 0, pointerEvents: 'none' }} />

            <div style={{ 
                maxWidth: 1200, 
                margin: '0 auto', 
                padding: isMobile ? '80px 16px 40px' : '100px 32px 64px',
                position: 'relative',
                zIndex: 10
            }}>
                {/* Header Sub-navigation */}
                <button 
                    onClick={() => window.location.href = '/profile'}
                    style={{ background: 'transparent', border: 'none', color: TEXT_MUTED, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', marginBottom: isMobile ? 24 : 32, padding: 0 }}
                >
                    <KeyboardBackspaceIcon fontSize="small" /> RETURN TO PROFILE
                </button>

                {/* Dashboard Header */}
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: 24, marginBottom: isMobile ? 32 : 48 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                            <h1 style={{ margin: 0, fontSize: isMobile ? 36 : 48, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1 }}>CREATOR <span style={{ color: SECONDARY_ACCENT }}>ARENA</span></h1>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, border: '1px solid rgba(16,185,129,0.2)' }}>
                                <CheckCircleIcon sx={{ fontSize: 12 }} /> VERIFIED
                            </span>
                        </div>
                        <p style={{ margin: 0, color: TEXT_MUTED, fontSize: 14, fontWeight: 500 }}>
                            Tracking ID: <span style={{ color: TEXT_LIGHT, fontWeight: 700, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 4, marginLeft: 4 }}>{stats.code}</span>
                        </p>
                    </div>
                    
                    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, padding: '16px 24px', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'flex-end', width: isMobile ? '100%' : 'auto', backdropFilter: 'blur(10px)' }}>
                        <span style={{ color: TEXT_MUTED, fontSize: 10, fontWeight: 800, letterSpacing: '1px', marginBottom: 4 }}>ACTIVE COMMISSION RATE</span>
                        <span style={{ color: '#10b981', fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{stats.commission_rate}%</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                    
                    {/* Clicks */}
                    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24, backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                            <span style={{ color: TEXT_MUTED, fontWeight: 800, fontSize: 11, letterSpacing: '0.05em' }}>TOTAL CLICKS</span>
                            <MouseIcon sx={{ color: TEXT_MUTED, opacity: 0.5 }} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: 40, fontWeight: 900, color: TEXT_LIGHT }}>{stats.total_clicks}</h2>
                        <p style={{ margin: '8px 0 0', color: SECONDARY_ACCENT, fontSize: 12, fontWeight: 700 }}>Link interactions</p>
                    </div>

                    {/* Sales */}
                    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24, backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                            <span style={{ color: TEXT_MUTED, fontWeight: 800, fontSize: 11, letterSpacing: '0.05em' }}>TOTAL SALES</span>
                            <TrendingUpIcon sx={{ color: TEXT_MUTED, opacity: 0.5 }} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: 40, fontWeight: 900, color: TEXT_LIGHT }}>{stats.total_sales}</h2>
                        <p style={{ margin: '8px 0 0', color: '#10b981', fontSize: 12, fontWeight: 700 }}>Converted orders</p>
                    </div>

                    {/* Revenue */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(28,43,74,0.4) 0%, rgba(20,30,50,0.8) 100%)', border: `1px solid rgba(139,92,246,0.3)`, borderRadius: 20, padding: 24, backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px -10px rgba(28,43,74,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                            <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 11, letterSpacing: '0.05em' }}>YOUR REVENUE</span>
                            <AccountBalanceWalletIcon sx={{ color: '#8b5cff' }} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: 40, fontWeight: 900, color: '#fff' }}>₹{parseFloat(stats.total_earnings).toLocaleString()}</h2>
                        <p style={{ margin: '8px 0 0', color: '#8b5cff', fontSize: 12, fontWeight: 700 }}>Successful commission</p>
                    </div>

                </div>

                {/* Bottom Section - Split Grid on Desktop */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: 24 }}>
                    
                    {/* Sales Table */}
                    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                            <span style={{ color: TEXT_LIGHT, fontWeight: 800, letterSpacing: '0.05em', fontSize: 13 }}>RECENT REVENUE STREAM</span>
                            <BarChartIcon sx={{ color: SECONDARY_ACCENT, fontSize: 20 }} />
                        </div>
                        <div style={{ padding: 0, flex: 1 }}>
                            {stats.recent_sales.length > 0 ? (
                                stats.recent_sales.map((sale, i) => (
                                    <div key={sale.id} style={{ 
                                        padding: '20px 24px', 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        borderBottom: i === stats.recent_sales.length - 1 ? 'none' : `1px solid ${BORDER}`,
                                        transition: 'background 0.2s',
                                    }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <div>
                                            <p style={{ margin: '0 0 4px', color: TEXT_LIGHT, fontWeight: 700, fontSize: 14 }}>Order #{sale.order_id}</p>
                                            <p style={{ margin: 0, color: TEXT_MUTED, fontSize: 12 }}>
                                                {new Date(sale.created_at).toLocaleDateString()} &middot; {new Date(sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ margin: '0 0 4px', color: TEXT_LIGHT, fontWeight: 700, fontSize: 14 }}>₹{parseFloat(sale.order_total).toLocaleString()}</p>
                                            <p style={{ margin: 0, color: '#10b981', fontSize: 12, fontWeight: 800 }}>+₹{parseFloat(sale.commission_amount).toLocaleString()} Comm.</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: 48, textAlign: 'center' }}>
                                    <span style={{ materialSymbolsOutlined: 'true', fontSize: 48, color: 'rgba(255,255,255,0.1)', marginBottom: 16 }}>receipt_long</span>
                                    <p style={{ margin: 0, color: TEXT_MUTED, fontWeight: 600, fontSize: 14 }}>No sales recorded yet. Start promoting your link!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Promo Section */}
                    <div style={{ background: `linear-gradient(180deg, rgba(212,146,42,0.05) 0%, rgba(0,0,0,0) 100%)`, border: `1px solid rgba(212,146,42,0.2)`, borderRadius: 20, padding: 32, backdropFilter: 'blur(20px)', height: 'fit-content' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(212,146,42,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                            <span className="material-symbols-outlined" style={{ color: SECONDARY_ACCENT }}>campaign</span>
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: TEXT_LIGHT }}>Share Your Promo Link</h3>
                        <p style={{ margin: '0 0 24px', color: TEXT_MUTED, fontSize: 13, lineHeight: 1.5 }}>
                            Distribute this unique link across your channels to automatically earn commission on referred sales.
                        </p>
                        
                        <div style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${BORDER}`, borderRadius: 12, display: 'flex', overflow: 'hidden' }}>
                            <div style={{ flex: 1, padding: '16px', color: TEXT_MUTED, fontFamily: 'monospace', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {window.location.origin}/{stats.code}
                            </div>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/${stats.code}`);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                style={{ 
                                    background: copied ? '#10b981' : TEXT_LIGHT, 
                                    color: copied ? '#fff' : '#000', 
                                    border: 'none', 
                                    padding: '0 20px', 
                                    fontWeight: 800, 
                                    fontSize: 12, 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 6,
                                    transition: 'all 0.2s',
                                }}
                            >
                                {copied ? <CheckCircleIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                                {copied ? 'COPIED' : 'COPY'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
            <style>{`
                .material-symbols-outlined {
                    font-family: 'Material Symbols Outlined';
                    font-weight: normal;
                    font-style: normal;
                    font-size: 24px;
                    line-height: 1;
                    letter-spacing: normal;
                    text-transform: none;
                    display: inline-block;
                    white-space: nowrap;
                    word-wrap: normal;
                    direction: ltr;
                    font-feature-settings: 'liga';
                    -webkit-font-feature-settings: 'liga';
                    -webkit-font-smoothing: antialiased;
                }
            `}</style>
        </div>
    );
};

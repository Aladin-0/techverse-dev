// src/pages/ServiceCategoryPage.tsx - Creative Premium Services Page
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Alert } from '@mui/material';

// Material Icons
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LaptopIcon from '@mui/icons-material/Laptop';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BuildIcon from '@mui/icons-material/Build';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SpeedIcon from '@mui/icons-material/Speed';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import HandymanIcon from '@mui/icons-material/Handyman';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShieldIcon from '@mui/icons-material/Shield';

import { useServiceStore } from '../stores/serviceStore';

const ACCENT = '#1C2B4A';
const GOLD = '#D4922A';
const TEXT = '#1A1814';
const MUTED = '#8A8279';
const BG = '#FAF9F5';
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

export const ServiceCategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const categories = useServiceStore((state) => state.categories);
  const fetchCategories = useServiceStore((state) => state.fetchCategories);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchCategories();
      } catch (err) {
        console.error('Error fetching service categories:', err);
        setError('Failed to load service categories. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, [fetchCategories]);

  const handleCategorySelect = (categoryId: number) => {
    navigate(`/services/request/${categoryId}`);
  };

  const getServiceIcon = (name: string, size: number = 32) => {
    const n = name.toLowerCase();
    if (n.includes('laptop')) return <LaptopIcon sx={{ fontSize: size }} />;
    if (n.includes('pc') || n.includes('computer')) return <DesktopWindowsIcon sx={{ fontSize: size }} />;
    return <MiscellaneousServicesIcon sx={{ fontSize: size }} />;
  };

  const getCategoryAccent = (index: number) => {
    const accents = [ACCENT, GOLD, '#8B5CF6', '#22C55E', '#2563EB', '#EC4899'];
    return accents[index % accents.length];
  };

  const featuresScrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isMobile) return;
    const interval = setInterval(() => {
      if (featuresScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = featuresScrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          featuresScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          featuresScrollRef.current.scrollBy({ left: 232, behavior: 'smooth' }); // width (220) + gap (12)
        }
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [isMobile]);

  if (loading) {
    // ----------------- SKIP LOADING & DESKTOP LOGIC (DO NOT OVERWRITE) -----------------
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: BG }}>
        <CircularProgress sx={{ color: ACCENT }} />
      </Box>
    );
  }

  // ════════════ MOBILE VIEW ════════════
  if (isMobile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `radial-gradient(circle at top right, rgba(212, 146, 42, 0.05), transparent 60%), ${BG}`,
        color: TEXT,
        fontFamily: "'Inter', sans-serif",
        paddingTop: 80,
        paddingBottom: 40,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ width: '100%', padding: '0 12px', position: 'relative', zIndex: 1 }}>

          {/* HERO BANNER - MOBILE (Store Format Height) */}
          <section style={{ marginBottom: 24, borderRadius: 14, overflow: 'hidden', height: 160, position: 'relative' }}>
            <div style={{
              background: `linear-gradient(135deg, ${ACCENT} 0%, #2a3f6a 100%)`,
              width: '100%', height: '100%', padding: '24px 20px', position: 'relative',
              display: 'flex', flexDirection: 'column', justifyContent: 'center'
            }}>
              <div style={{ position: 'absolute', top: -30, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(212,146,42,0.15)', filter: 'blur(20px)' }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(212,146,42,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BuildIcon sx={{ fontSize: 14, color: GOLD }} />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>TechVerse Services</span>
                </div>

                <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 4px', color: '#fff', textTransform: 'uppercase' }}>
                  Expert Tech <br /><span style={{ color: GOLD, fontStyle: 'italic' }}>Services</span>
                </h1>

                <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                  <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>4.9★ Rating</span>
                  <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>5K+ Repairs</span>
                </div>
              </div>
            </div>
          </section>

          {/* FEATURE CARDS - HORIZONTAL SCROLL FOR MOBILE */}
          <section ref={featuresScrollRef} style={{ display: 'flex', overflowX: 'auto', gap: 12, paddingBottom: 16, marginBottom: 24, margin: '0 -12px', paddingLeft: 12, paddingRight: 12, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {[
              { icon: <VerifiedUserIcon sx={{ fontSize: 24, color: ACCENT }} />, title: 'Certified Pros', desc: 'Vetted and trained technicians', bg: 'rgba(28,43,74,0.06)' },
              { icon: <SpeedIcon sx={{ fontSize: 24, color: GOLD }} />, title: 'Fast Turnaround', desc: 'Same-day service available', bg: 'rgba(212,146,42,0.08)' },
              { icon: <ShieldIcon sx={{ fontSize: 24, color: '#22C55E' }} />, title: 'Quality Parts', desc: 'only on Techverse', bg: 'rgba(34,197,94,0.08)' },
              { icon: <SupportAgentIcon sx={{ fontSize: 24, color: '#8B5CF6' }} />, title: '24/7 Support', desc: 'Always here to help', bg: 'rgba(139,92,246,0.08)' },
            ].map((feat, i) => (
              <div key={i} style={{
                background: '#fff', border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12,
                flexShrink: 0, width: 220, boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: feat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {feat.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: TEXT, margin: '0 0 4px' }}>{feat.title}</h4>
                  <p style={{ fontSize: 11, color: MUTED, margin: 0, lineHeight: 1.4 }}>{feat.desc}</p>
                </div>
              </div>
            ))}
          </section>

          {/* SECTION TITLE */}
          {categories.length > 0 && (
            <div style={{ marginBottom: 12, paddingLeft: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {categories.length} Categories Available
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT, letterSpacing: '-0.02em', margin: '2px 0 0' }}>
                Choose Your Service
              </h2>
            </div>
          )}

          {/* SERVICE CARDS GRID - MOBILE (Store List Format) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#e0e0e0', borderTop: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0', margin: '0 -12px 32px' }}>
            {categories.map((cat, index) => {
              const accent = getCategoryAccent(index);
              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  style={{
                    background: '#fff', padding: '16px', display: 'flex', gap: 16, cursor: 'pointer', position: 'relative'
                  }}
                >
                  {/* Left Column: Icon Box (acting like the product image) */}
                  <div style={{ width: 80, height: 80, borderRadius: 12, background: 'rgba(240,240,240,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                    {/* The SR number like '01' */}
                    <span style={{ position: 'absolute', top: 4, left: 6, fontSize: 10, fontWeight: 900, color: 'rgba(0,0,0,0.1)' }}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div style={{ color: accent }}>
                      {getServiceIcon(cat.name, 36)}
                    </div>
                  </div>

                  {/* Right Column: Details */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px', color: TEXT, lineHeight: 1.3 }}>{cat.name}</h3>

                    <p style={{ color: MUTED, fontSize: 12, lineHeight: 1.4, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      Expert diagnostics and repair by certified technicians. Quality guaranteed.
                    </p>

                    <button
                      style={{
                        padding: '6px 16px', background: '#fff', border: `1px solid #dcdcdc`, color: TEXT,
                        fontWeight: 600, fontSize: 12, borderRadius: 4, display: 'inline-flex', alignItems: 'center',
                        justifyContent: 'center', gap: 6, width: 'fit-content'
                      }}
                    >
                      Request Service
                      <ArrowForwardIcon sx={{ fontSize: 12, color: MUTED }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* HOW IT WORKS - MOBILE (Vertical Steps) */}
          <section style={{ marginBottom: 48, background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.02)' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Process</span>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: TEXT, letterSpacing: '-0.02em', margin: '4px 0 0' }}>How It Works</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
              {/* Vertical line connector */}
              <div style={{ position: 'absolute', left: 24, top: 24, bottom: 24, width: 2, background: 'rgba(0,0,0,0.05)' }} />

              {[
                { step: '01', title: 'Choose Service', desc: 'Select repair type.', icon: <HandymanIcon sx={{ fontSize: 20, color: ACCENT }} /> },
                { step: '02', title: 'Book & Pay', desc: 'Pick time & pay securely.', icon: <SpeedIcon sx={{ fontSize: 20, color: GOLD }} /> },
                { step: '03', title: 'We Fix It', desc: 'Tech arrives & fixes it.', icon: <CheckCircleOutlineIcon sx={{ fontSize: 20, color: '#22C55E' }} /> },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: '#fff', border: '2px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    {item.icon}
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 800, color: TEXT, margin: '0 0 4px' }}>{item.step}. {item.title}</h4>
                    <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* BOTTOM STATS - MOBILE (2x2 Grid) */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { val: '99%', label: 'Uptime', color: ACCENT },
              { val: '15m', label: 'Response', color: GOLD },
              { val: '5K+', label: 'Serviced', color: '#22C55E' },
              { val: '4.9', label: 'Rating', color: '#8B5CF6' },
            ].map((stat, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '20px 10px', borderRadius: 16,
                background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
              }}>
                <p style={{ fontSize: 24, fontWeight: 900, color: stat.color, letterSpacing: '-0.02em', margin: '0 0 4px' }}>{stat.val}</p>
                <p style={{ fontSize: 9, fontWeight: 800, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{stat.label}</p>
              </div>
            ))}
          </section>

        </div>
      </div>
    );
  }

  // ════════════ DESKTOP VIEW ════════════
  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(circle at 15% 50%, rgba(20, 30, 50, 0.04), transparent 35%),
        radial-gradient(circle at 85% 30%, rgba(212, 146, 42, 0.06), transparent 35%),
        ${BG}
      `,
      color: TEXT,
      fontFamily: "'Inter', sans-serif",
      paddingTop: '100px',
      paddingBottom: '80px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Decorative Blobs */}
      <div style={{
        position: 'absolute', top: '5%', right: '-8%', width: '500px', height: '500px',
        borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212, 146, 42, 0.12) 0%, rgba(255, 255, 255, 0) 100%)',
        filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', left: '-12%', width: '600px', height: '600px',
        borderRadius: '50%', background: 'linear-gradient(135deg, rgba(28, 43, 74, 0.08) 0%, rgba(255, 255, 255, 0) 100%)',
        filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', top: '55%', right: '15%', width: '300px', height: '300px',
        borderRadius: '50%', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(255, 255, 255, 0) 100%)',
        filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', padding: '0 48px', position: 'relative', zIndex: 1 }}>

        {/* ═══════════════════════════════════════════════════════════════════
            HERO BANNER
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={{ marginBottom: 56 }}>
          <div style={{
            background: `linear-gradient(135deg, ${ACCENT} 0%, #2a3f6a 50%, #1a2540 100%)`,
            borderRadius: 28, padding: '64px 64px 56px', position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative elements */}
            <div style={{ position: 'absolute', top: -60, right: -40, width: 250, height: 250, borderRadius: '50%', background: 'rgba(212,146,42,0.15)', filter: 'blur(50px)' }} />
            <div style={{ position: 'absolute', bottom: -80, left: '25%', width: 350, height: 350, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', filter: 'blur(60px)' }} />
            <div style={{ position: 'absolute', top: 30, right: 80, width: 140, height: 140, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'absolute', bottom: 40, right: 250, width: 70, height: 70, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)' }} />
            <div style={{ position: 'absolute', top: 60, right: 180, width: 40, height: 40, borderRadius: '50%', background: 'rgba(212,146,42,0.12)' }} />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 48, flexWrap: 'wrap' }}>
              <div style={{ maxWidth: 650 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(212,146,42,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BuildIcon sx={{ fontSize: 22, color: '#D4922A' }} />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>TechVerse Services</span>
                </div>

                <h1 style={{ fontSize: 'clamp(40px, 5vw, 60px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 16px', color: '#fff', textTransform: 'uppercase' }}>
                  Expert Tech <br /><span style={{ color: GOLD, fontStyle: 'italic' }}>Services</span>
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, fontWeight: 500, margin: 0, lineHeight: 1.7, maxWidth: 480 }}>
                  Professional diagnostics, precision repair, and reliable maintenance for all your devices. Brought to you by certified technicians.
                </p>
              </div>

              {/* Quick stats in hero */}
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {[
                  { val: '4.9★', label: 'Rating' },
                  { val: '5K+', label: 'Repairs' },
                  { val: '15min', label: 'Response' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.03em' }}>{s.val}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            WHY CHOOSE US — FEATURE PILLS
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 56 }}>
          {[
            { icon: <VerifiedUserIcon sx={{ fontSize: 22, color: ACCENT }} />, label: 'Certified Pros', desc: 'Vetted and trained technicians', bg: 'rgba(28,43,74,0.05)' },
            { icon: <SpeedIcon sx={{ fontSize: 22, color: GOLD }} />, label: 'Fast Turnaround', desc: 'Same-day service available', bg: 'rgba(212,146,42,0.08)' },
            { icon: <ShieldIcon sx={{ fontSize: 22, color: '#22C55E' }} />, label: 'Quality Parts', desc: 'only on Techverse', bg: 'rgba(34,197,94,0.08)' },
            { icon: <SupportAgentIcon sx={{ fontSize: 22, color: '#8B5CF6' }} />, label: '24/7 Support', desc: 'Always here to help', bg: 'rgba(139,92,246,0.08)' },
          ].map((feat, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.85)', borderRadius: 22, padding: '24px 24px',
                display: 'flex', alignItems: 'center', gap: 16,
                transition: `all 0.35s ${EASE}`, cursor: 'default',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 32px rgba(28,43,74,0.06)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: feat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {feat.icon}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: '0 0 3px' }}>{feat.label}</p>
                <p style={{ fontSize: 12, color: MUTED, margin: 0, fontWeight: 500 }}>{feat.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            ERROR / EMPTY STATES
        ═══════════════════════════════════════════════════════════════════ */}
        {error && (
          <Alert severity="error" sx={{
            background: 'rgba(239, 68, 68, 0.06)', color: '#dc2626',
            border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 3, mb: 4,
            fontWeight: 500, margin: '0 auto 40px',
          }}>
            {error}
          </Alert>
        )}
        {!loading && !error && categories.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '80px 40px',
            background: 'rgba(255, 255, 255, 0.55)', backdropFilter: 'blur(16px)',
            border: '1px dashed rgba(28,43,74,0.15)', borderRadius: 28,
          }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(28,43,74,0.05)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <HandymanIcon sx={{ fontSize: 28, color: MUTED }} />
            </div>
            <p style={{ color: TEXT, fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>No Services Available</p>
            <p style={{ color: MUTED, fontWeight: 500, fontSize: 14, margin: 0 }}>Services are currently being set up. Please check back soon.</p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION TITLE
        ═══════════════════════════════════════════════════════════════════ */}
        {categories.length > 0 && (
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 2, background: ACCENT }} />
            <h2 style={{ fontSize: 22, fontWeight: 900, color: TEXT, textTransform: 'uppercase', letterSpacing: '-0.03em', margin: 0 }}>
              Choose Your Service
            </h2>
            <span style={{ fontSize: 12, fontWeight: 600, color: MUTED }}>
              {categories.length} {categories.length === 1 ? 'category' : 'categories'} available
            </span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            SERVICE CARDS GRID
        ═══════════════════════════════════════════════════════════════════ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: 28,
          marginBottom: 80,
        }}>
          {categories.map((cat, index) => {
            const accent = getCategoryAccent(index);
            return (
              <div
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                style={{
                  background: 'rgba(255,255,255,0.65)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.85)',
                  borderRadius: 24,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  padding: 0,
                  position: 'relative',
                  transition: `all 0.4s ${EASE}`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 50px rgba(28,43,74,0.1)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(28,43,74,0.15)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.85)';
                }}
              >
                {/* Top accent gradient bar */}
                <div style={{
                  height: 4,
                  background: `linear-gradient(90deg, ${accent}, ${accent}44)`,
                }} />

                <div style={{ padding: '36px 32px 32px' }}>
                  {/* Header row: Icon + Category number */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 18,
                      background: `${accent}10`,
                      border: `1px solid ${accent}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: accent,
                      transition: `all 0.4s ${EASE}`,
                    }}>
                      {getServiceIcon(cat.name, 30)}
                    </div>
                    <span style={{
                      fontSize: 48, fontWeight: 900, color: 'rgba(28,43,74,0.04)',
                      letterSpacing: '-0.04em', lineHeight: 1,
                    }}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em',
                    margin: '0 0 12px 0', color: TEXT,
                  }}>
                    {cat.name}
                  </h3>

                  {/* Description */}
                  <p style={{
                    color: MUTED, fontSize: 14, lineHeight: 1.7, marginBottom: 28,
                    fontWeight: 500,
                  }}>
                    Expert diagnostics and repair by certified technicians. Fast turnaround with highest quality standards guaranteed.
                  </p>

                  {/* Feature tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
                    {[
                      { icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />, text: 'Certified' },
                      { icon: <AccessTimeIcon sx={{ fontSize: 14 }} />, text: 'Same-Day' },
                      { icon: <StarIcon sx={{ fontSize: 14 }} />, text: '4.9 Rated' },
                    ].map((tag, i) => (
                      <span key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 12px', borderRadius: 10,
                        background: 'rgba(28,43,74,0.04)',
                        fontSize: 11, fontWeight: 600, color: TEXT,
                      }}>
                        {tag.icon} {tag.text}
                      </span>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    style={{
                      width: '100%', padding: '16px 20px',
                      background: 'rgba(28,43,74,0.04)',
                      border: `1.5px solid rgba(28,43,74,0.1)`,
                      color: ACCENT, fontWeight: 700, fontSize: 14,
                      letterSpacing: '-0.01em', borderRadius: 14,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 10,
                      transition: `all 0.3s ${EASE}`,
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = ACCENT;
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.borderColor = ACCENT;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(28,43,74,0.04)';
                      e.currentTarget.style.color = ACCENT;
                      e.currentTarget.style.borderColor = 'rgba(28,43,74,0.1)';
                    }}
                  >
                    Request Service
                    <ArrowForwardIcon sx={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            HOW IT WORKS SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Simple Process</span>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: TEXT, letterSpacing: '-0.03em', margin: '8px 0 0', textTransform: 'uppercase' }}>
              How It Works
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, position: 'relative' }}>
            {/* Connecting line */}
            <div style={{
              position: 'absolute', top: 40, left: 'calc(16.66% + 30px)', right: 'calc(16.66% + 30px)',
              height: 2, background: 'linear-gradient(90deg, rgba(28,43,74,0.1) 0%, rgba(212,146,42,0.2) 50%, rgba(28,43,74,0.1) 100%)',
              zIndex: 0,
            }} />

            {[
              { step: '01', title: 'Choose Service', desc: 'Select the type of repair or maintenance you need from our catalog.', icon: <HandymanIcon sx={{ fontSize: 24, color: ACCENT }} /> },
              { step: '02', title: 'Book & Pay', desc: 'Pick a time slot and complete secure payment — all online.', icon: <SpeedIcon sx={{ fontSize: 24, color: GOLD }} /> },
              { step: '03', title: 'We Fix It', desc: 'A certified technician arrives at your door and gets the job done.', icon: <CheckCircleOutlineIcon sx={{ fontSize: 24, color: '#22C55E' }} /> },
            ].map((item, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '36px 28px', borderRadius: 24,
                background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.7)', position: 'relative', zIndex: 1,
                transition: `all 0.35s ${EASE}`,
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(28,43,74,0.06)';
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.8)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.5)';
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: 20, background: 'rgba(28,43,74,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step {item.step}</span>
                <h4 style={{ fontSize: 18, fontWeight: 800, color: TEXT, margin: '8px 0', letterSpacing: '-0.02em' }}>{item.title}</h4>
                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            BOTTOM STATS BAR
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={{ padding: '40px 0', borderTop: '1px solid rgba(28,43,74,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
            {[
              { val: '99.9%', label: 'Service Uptime', color: ACCENT },
              { val: '15 min', label: 'Avg Response', color: GOLD },
              { val: '5,000+', label: 'Devices Serviced', color: '#22C55E' },
              { val: '4.9 / 5', label: 'Customer Rating', color: '#8B5CF6' },
            ].map((stat, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '32px 20px', borderRadius: 22,
                background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.6)',
                transition: `all 0.35s ${EASE}`,
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.7)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.4)';
                }}
              >
                <p style={{ fontSize: 32, fontWeight: 900, color: stat.color, letterSpacing: '-0.04em', margin: '0 0 8px' }}>{stat.val}</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

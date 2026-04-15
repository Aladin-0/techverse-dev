import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Site palette (matches navbar & rest of website) ── */
const BG      = '#1C2B4A';
const SURFACE = 'rgba(255,255,255,0.05)';
const BORDER  = 'rgba(255,255,255,0.08)';
const AMBER   = '#D4922A';
const AMBER_L = '#E8A845';
const TEXT    = 'rgba(255,255,255,0.9)';
const MUTED   = 'rgba(255,255,255,0.5)';
const DIM     = 'rgba(255,255,255,0.25)';

const NAV = [
  {
    heading: 'Products',
    items: [
      { label: 'Laptops & Computers',     path: '/store?category=laptops-computers' },
      { label: 'Smartphones & Tablets',   path: '/store?category=smartphones' },
      { label: 'Monitors & Displays',     path: '/store?category=monitors' },
      { label: 'Audio & Headphones',      path: '/store?category=audio' },
      { label: 'Keyboards & Peripherals', path: '/store?category=peripherals' },
      { label: 'View All Products',       path: '/store' },
    ],
  },
  {
    heading: 'Services',
    items: [
      { label: 'Laptop Repair',     path: '/services' },
      { label: 'Smartphone Repair', path: '/services' },
      { label: 'Data Recovery',     path: '/services' },
      { label: 'Networking Setup',  path: '/services' },
      { label: 'CCTV & Security',   path: '/services' },
      { label: 'Smart Home Setup',  path: '/services' },
    ],
  },
  {
    heading: 'Account',
    items: [
      { label: 'My Orders',       path: '/my-orders' },
      { label: 'Service History', path: '/service-history' },
      { label: 'Profile',         path: '/profile' },
      { label: 'Track Repair',    path: '/service-history' },
    ],
  },
  {
    heading: 'Legal',
    items: [
      { label: 'Privacy Policy',     path: '/privacy-policy' },
      { label: 'Terms & Conditions', path: '/terms-conditions' },
      { label: 'Refund Policy',      path: '/refund-policy' },
      { label: 'Return Policy',      path: '/return-policy' },
      { label: 'Shipping Policy',    path: '/shipping-policy' },
    ],
  },
];

const TRUST = [
  { icon: '🔒', label: 'Secure Payments' },
  { icon: '📦', label: 'Fast Delivery' },
  { icon: '🛡', label: '1-Year Warranty' },
  { icon: '🔧', label: 'Expert Repairs' },
];

// Instagram gradient icon as SVG (proper colors)
const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail]     = useState('');
  const [subDone, setSubDone] = useState(false);
  const [focused, setFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const subscribe = () => {
    if (email.includes('@')) { setSubDone(true); setEmail(''); }
  };

  const navLink = (label: string, path: string) => (
    <button key={label} onClick={() => navigate(path)} style={{
      background: 'none', border: 'none', padding: '4px 0',
      color: MUTED, cursor: 'pointer', fontSize: 13,
      fontWeight: 400, fontFamily: "'Inter', sans-serif",
      letterSpacing: '-0.01em', textAlign: 'left',
      lineHeight: 1.7, display: 'block', width: '100%',
      transition: 'color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
      onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
    >
      {label}
    </button>
  );

  // ════════════ MOBILE FOOTER VIEW ════════════
  if (isMobile) {
    return (
      <footer style={{ background: BG, fontFamily: "'Inter', sans-serif", borderTop: `1px solid ${BORDER}`, paddingBottom: 20 }}>
        <div style={{ padding: '24px 16px 0' }}>

          {/* Top Block: Logo & Newsletter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: `linear-gradient(135deg, ${AMBER}, ${AMBER_L})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 900, lineHeight: 1 }}>T</span>
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, color: TEXT, letterSpacing: '-0.04em' }}>
                Tech<span style={{ color: AMBER }}>Verse</span>
              </span>
            </div>

            {subDone ? (
               <div style={{ padding: '10px', borderRadius: 8, background: 'rgba(74,222,128,0.1)', color: '#4ade80', fontSize: 12, fontWeight: 600 }}>✓ Subscribed</div>
            ) : (
               <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 2, border: `1px solid ${BORDER}` }}>
                 <input type="email" placeholder="Join newsletter..." value={email} onChange={e => setEmail(e.target.value)} style={{ flex: 1, padding: '8px 12px', background: 'transparent', border: 'none', color: TEXT, fontSize: 12, outline: 'none' }} />
                 <button onClick={subscribe} style={{ padding: '0 14px', borderRadius: 6, background: AMBER, border: 'none', color: '#fff', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>JOIN</button>
               </div>
            )}
          </div>

          {/* Links Grid: 2 Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 12px', marginBottom: 24 }}>
            {NAV.slice(0, 4).map((section) => (
              <div key={section.heading}>
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: AMBER, margin: '0 0 8px' }}>
                  {section.heading}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {section.items.slice(0, 4).map(({ label, path }) => (
                     <button key={label} onClick={() => { window.scrollTo(0, 0); navigate(path); }} style={{ background: 'none', border: 'none', padding: 0, color: '#B3B9C4', cursor: 'pointer', fontSize: 12, fontWeight: 500, textAlign: 'left', lineHeight: 1.4 }}>
                       {label}
                     </button>
                  ))}
                  {section.items.length > 4 && (
                     <button onClick={() => navigate(section.items[0].path)} style={{ background: 'none', border: 'none', padding: 0, color: MUTED, cursor: 'pointer', fontSize: 11, fontWeight: 500, textAlign: 'left', marginTop: 2, fontStyle: 'italic' }}>
                       + More
                     </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Contact + Social Links — Combined section */}
          <div style={{ marginBottom: 20, padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: AMBER, margin: '0 0 12px' }}>Connect With Us</p>
            
            {/* Phone */}
            <a href="tel:+918805147490" style={{ color: MUTED, fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ color: AMBER, display: 'flex' }}><PhoneIcon /></span>
              <span>+91 8805147490</span>
            </a>

            {/* Email as button-style row */}
            <a href="mailto:contact@techverseservices.in" style={{ color: MUTED, fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ color: AMBER, display: 'flex' }}><EmailIcon /></span>
              <span>contact@techverseservices.in</span>
            </a>

            {/* Instagram as a prominent pill button */}
            <a
              href="https://www.instagram.com/techverseservices?igsh=cWt1YTgzbGVpM2o2"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 99,
                background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
                color: '#fff', textDecoration: 'none',
                fontSize: 12, fontWeight: 700,
              }}
            >
              <InstagramIcon />
              @techverseservices
            </a>
          </div>

          {/* Trust Badges */}
          <div style={{ display: 'flex', overflowX: 'auto', gap: 8, paddingBottom: 12, marginBottom: 12, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {TRUST.map(t => (
              <div key={t.label} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 4, background: 'rgba(255,255,255,0.03)', fontSize: 11, color: MUTED, fontWeight: 500 }}>
                <span style={{ fontSize: 12 }}>{t.icon}</span><span>{t.label}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 0 14px' }} />

          {/* Bottom Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              {['Privacy', 'Terms', 'Shipping'].map((lbl) => (
                <button key={lbl} onClick={() => navigate(`/${lbl.toLowerCase()}-policy`)} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 11, fontWeight: 500, cursor: 'pointer', padding: 0 }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Copyright & Zaikron credit */}
          <div style={{ textAlign: 'center', paddingBottom: 16 }}>
            <p style={{ fontSize: 10, color: DIM, margin: '0 0 4px' }}>
              © 2026 TechVerse. All rights reserved.
            </p>
            <p style={{ fontSize: 10, color: DIM, margin: 0 }}>
              Designed & Developed by{' '}
              <a href="https://zaikron.com/" target="_blank" rel="noopener noreferrer" style={{ color: AMBER, fontWeight: 700, textDecoration: 'none' }}>Zaikron</a>
            </p>
          </div>

        </div>
      </footer>
    );
  }

  // ════════════ DESKTOP FOOTER VIEW ════════════
  return (
    <footer style={{
      background: BG,
      borderTop: '3px solid rgba(212,146,42,0.3)',
      fontFamily: "'Inter', sans-serif",
      marginTop: 0,
    }}>

      {/* ── Top section: Brand + Newsletter ── */}
      <div style={{
        borderBottom: `1px solid ${BORDER}`,
        padding: '56px 64px 48px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 64,
      }}>
        {/* Brand block */}
        <div>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${AMBER}, ${AMBER_L})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 16px ${AMBER}40`,
            }}>
              <span style={{ color: '#fff', fontSize: 16, fontWeight: 900, lineHeight: 1 }}>T</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: TEXT, letterSpacing: '-0.05em' }}>
              Tech<span style={{ color: AMBER }}>Verse</span>
            </span>
          </div>

          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.75, maxWidth: 320, margin: '0 0 24px' }}>
            Your one-stop destination for premium tech products and expert repair services — built for quality and reliability.
          </p>

          {/* Contact info rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            <a href="tel:+918805147490" style={{ color: MUTED, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
              onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
            >
              <span style={{ color: AMBER, display: 'flex', flexShrink: 0 }}><PhoneIcon /></span>
              +91 8805147490
            </a>
            <a href="mailto:contact@techverseservices.in" style={{ color: MUTED, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
              onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
            >
              <span style={{ color: AMBER, display: 'flex', flexShrink: 0 }}><EmailIcon /></span>
              contact@techverseservices.in
            </a>
          </div>

          {/* Instagram pill button — clearly visible */}
          <a
            href="https://www.instagram.com/techverseservices?igsh=cWt1YTgzbGVpM2o2"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 99,
              background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
              color: '#fff', textDecoration: 'none',
              fontSize: 13, fontWeight: 700,
              marginBottom: 28,
              boxShadow: '0 4px 14px rgba(253,29,29,0.3)',
              transition: 'transform 0.2s, opacity 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.04)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'; }}
          >
            <InstagramIcon />
            @techverseservices
          </a>

          {/* Trust badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TRUST.map(t => (
              <div key={t.label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8,
                background: SURFACE, border: `1px solid ${BORDER}`,
                fontSize: 11, color: MUTED, fontWeight: 500,
              }}>
                <span>{t.icon}</span><span>{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.14em', color: AMBER, margin: '0 0 10px',
          }}>
            Newsletter
          </p>
          <h3 style={{
            fontSize: 22, fontWeight: 800, color: TEXT,
            letterSpacing: '-0.04em', margin: '0 0 8px', lineHeight: 1.2,
          }}>
            Stay Ahead of the Tech Curve
          </h3>
          <p style={{ fontSize: 13, color: MUTED, margin: '0 0 20px', lineHeight: 1.65 }}>
            Exclusive deals, new arrivals and repair tips — no spam, ever.
          </p>

          {subDone ? (
            <div style={{
              padding: '14px 18px', borderRadius: 10,
              border: '1px solid rgba(74,222,128,0.25)',
              background: 'rgba(74,222,128,0.08)',
              color: '#4ade80', fontSize: 13, fontWeight: 600,
            }}>
              ✓ You're subscribed! Thanks for joining.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="email" placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && subscribe()}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.07)',
                  border: `1px solid ${focused ? AMBER + '70' : BORDER}`,
                  color: TEXT, fontSize: 13, outline: 'none',
                  fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s',
                }}
              />
              <button onClick={subscribe} style={{
                padding: '12px 20px', borderRadius: 10,
                background: `linear-gradient(135deg, ${AMBER}, ${AMBER_L})`,
                border: 'none', color: '#fff',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap',
                boxShadow: `0 4px 14px ${AMBER}40`,
                transition: 'opacity 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Subscribe →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Nav grid ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '32px 48px', padding: '48px 64px',
        borderBottom: `1px solid ${BORDER}`,
      }}>
        {NAV.map(section => (
          <div key={section.heading}>
            <p style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.12em', color: AMBER, margin: '0 0 14px',
            }}>
              {section.heading}
            </p>
            <div>{section.items.map(({ label, path }) => navLink(label, path))}</div>
          </div>
        ))}
      </div>

      {/* ── Bottom bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap',
        gap: 16, padding: '20px 64px',
      }}>
        {/* Copyright + Zaikron link */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ fontSize: 12, color: DIM, margin: 0 }}>
            © 2026 TechVerse. All rights reserved.
          </p>
          <p style={{ fontSize: 11, color: DIM, margin: 0 }}>
            Designed & Developed by{' '}
            <a
              href="https://zaikron.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: AMBER, fontWeight: 700, textDecoration: 'none' }}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline')}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none')}
            >
              Zaikron
            </a>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Privacy',  path: '/privacy-policy' },
            { label: 'Terms',    path: '/terms-conditions' },
            { label: 'Shipping', path: '/shipping-policy' },
          ].map(({ label, path }) => (
            <button key={label} onClick={() => navigate(path)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: DIM, fontFamily: "'Inter', sans-serif",
              padding: 0, transition: 'color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = MUTED)}
              onMouseLeave={e => (e.currentTarget.style.color = DIM)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;

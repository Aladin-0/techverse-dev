import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link as RouterLink, useLocation, useSearchParams } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { useCartStore } from '../stores/cartStore';

import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { Badge, Tooltip } from '@mui/material';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Design tokens ────────────────────────────────────────────────────────────
const ACCENT       = '#1C2B4A';
const AMBER        = '#D4922A';
const TEXT         = '#1A1814';
const MUTED        = '#8A8279';

const NAV_LINKS = [
  { label: 'Home',            to: '/' },
  { label: 'Store',           to: '/store' },
  { label: 'Services',        to: '/services' },
  { label: 'Orders',          to: '/my-orders' },
  { label: 'History',         to: '/service-history' },
];

export const NavBar = () => {
  const navigate        = useNavigate();
  const location        = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useUserStore();
  const { openCart, closeCart, getTotalItems } = useCartStore();
  const totalItems      = getTotalItems();
  const [scrolled, setScrolled]     = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile]     = useState(window.innerWidth < 1024);
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');
  const searchInputRef  = useRef<HTMLInputElement>(null);
  const navRef          = useRef<HTMLDivElement>(null);

  useEffect(() => { closeCart(); }, [location.pathname, closeCart]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    setSearchValue(searchParams.get('q') || '');
    if (searchParams.get('q')) setSearchOpen(true);
  }, [searchParams]);

  const handleSearchToggle = () => {
    if (searchOpen) {
      if (!searchValue) setSearchOpen(false);
    } else {
      setSearchOpen(true);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    if (location.pathname === '/store') {
      const p = new URLSearchParams(searchParams);
      val ? p.set('q', val) : p.delete('q');
      setSearchParams(p);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue) { setSearchOpen(false); return; }
    setSearchOpen(false);
    if (location.pathname !== '/store') {
      navigate(`/store?q=${encodeURIComponent(searchValue)}`);
    } else {
      const p = new URLSearchParams(searchParams);
      p.set('q', searchValue);
      setSearchParams(p);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchOpen && navRef.current && !navRef.current.contains(e.target as Node))
        setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchOpen]);

  // Completely hide global navbar on Mobile PDP to match Flipkart behavior
  // (PDP has its own literal substitute header)
  if (isMobile && location.pathname.startsWith('/product/')) return null;

  return (
    <nav style={{
      position: 'fixed', top: 0, width: '100%', zIndex: 1000,
      padding: isMobile ? '0' : (scrolled ? '12px 32px' : '20px 32px'),
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div
        ref={navRef}
        style={isMobile ? {
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fff',
          padding: '12px 16px',
          borderBottom: '1px solid #E0E0E0',
          boxShadow: scrolled ? '0 2px 4px rgba(0,0,0,0.04)' : 'none',
        } : {
          maxWidth: 1320, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: scrolled ? 'rgba(250,249,245,0.88)' : 'rgba(250,249,245,0.6)',
          backdropFilter: 'blur(24px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: 60,
          padding: '10px 10px 10px 32px',
          position: 'relative',
          boxShadow: scrolled
            ? '0 4px 32px rgba(28,43,74,0.06), 0 1px 3px rgba(28,43,74,0.04)'
            : '0 2px 16px rgba(28,43,74,0.03)',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Logo */}
        <RouterLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: isMobile ? 28 : 34, height: isMobile ? 28 : 34, borderRadius: isMobile ? 6 : 10, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: isMobile ? 14 : 16, fontWeight: 800, letterSpacing: '-0.05em' }}>T</span>
          </div>
          <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, letterSpacing: '-0.04em', color: TEXT, lineHeight: 1 }}>
            Tech<span style={{ color: ACCENT, fontWeight: 800 }}>Verse</span>
          </span>
        </RouterLink>

        {/* Nav links — hidden on mobile via inline style so it beats specificity of inline display:flex */}
        <div
          className="max-lg:!hidden"
          style={{ display: isMobile ? 'none' : 'flex', gap: 2, alignItems: 'center' }}
        >
          {NAV_LINKS.map(({ label, to }) => {
            const isActive = to === '/' ? location.pathname === '/' : (location.pathname === to || location.pathname.startsWith(to + '/'));
            return (
              <RouterLink
                key={label}
                to={to}
                style={{
                  color: isActive ? TEXT : MUTED,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  padding: '10px 18px',
                  borderRadius: 24,
                  background: isActive ? 'rgba(28,43,74,0.06)' : 'transparent',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = TEXT;
                    e.currentTarget.style.background = 'rgba(28,43,74,0.04)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = MUTED;
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {label}
              </RouterLink>
            );
          })}
        </div>

        {/* Mobile Right Actions: Cart, Profile, Hamburger — visible ONLY on mobile */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Auth/Profile */}
            {isAuthenticated ? (
               <button onClick={() => navigate('/profile')} style={{ background: 'transparent', border: 'none', color: TEXT, padding: 0, cursor: 'pointer', display: 'flex' }}>
                 <PersonIcon sx={{ fontSize: 24, color: '#333' }} />
               </button>
            ) : (
               <button onClick={() => navigate('/login')} style={{ background: 'transparent', border: 'none', color: ACCENT, padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>
                 Login
               </button>
            )}

            {/* Cart */}
            <button onClick={openCart} style={{ background: 'transparent', border: 'none', color: TEXT, padding: 0, cursor: 'pointer', display: 'flex' }}>
               <Badge badgeContent={totalItems} sx={{ '& .MuiBadge-badge': { background: '#D4922A', color: '#fff', fontSize: 10, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 8 } }}>
                 <ShoppingCartIcon sx={{ fontSize: 21, color: '#333' }} />
               </Badge>
            </button>
            
            {/* Hamburger Menu (Animated Premium Icon) */}
            <button
               onClick={() => setMobileMenuOpen(true)}
               style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', marginLeft: 4, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}
            >
              <div style={{ width: 20, height: 14, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <motion.span animate={mobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} style={{ display: 'block', width: '100%', height: 2, background: '#333', borderRadius: 2 }} />
                <motion.span animate={mobileMenuOpen ? { opacity: 0, x: 10 } : { opacity: 1, x: 0 }} transition={{ duration: 0.2 }} style={{ display: 'block', width: '100%', height: 2, background: '#333', borderRadius: 2 }} />
                <motion.span animate={mobileMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} style={{ display: 'block', width: '100%', height: 2, background: '#333', borderRadius: 2 }} />
              </div>
            </button>
          </div>
        )}

        {/* Desktop Right actions — hidden on mobile */}
        <div className="max-lg:!hidden" style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>

          {/* Search */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: 'flex', alignItems: 'center',
              background: searchOpen ? 'rgba(28,43,74,0.05)' : 'transparent',
              borderRadius: 24,
              border: searchOpen ? '1px solid rgba(28,43,74,0.1)' : '1px solid transparent',
              padding: searchOpen ? '0 14px' : '0',
              width: searchOpen ? '260px' : '42px',
              height: 42,
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={handleSearchToggle}
              style={{ background: 'transparent', border: 'none', color: MUTED, cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'color .2s' }}
              onMouseEnter={e => e.currentTarget.style.color = TEXT}
              onMouseLeave={e => e.currentTarget.style.color = MUTED}
            >
              <SearchIcon sx={{ fontSize: 19 }} />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products..."
              value={searchValue}
              onChange={handleSearchChange}
              style={{
                width: searchOpen ? '100%' : '0px',
                background: 'transparent', border: 'none', outline: 'none',
                color: TEXT, padding: searchOpen ? '8px 6px' : '0',
                fontSize: 14, fontWeight: 500,
                opacity: searchOpen ? 1 : 0,
                transition: 'all 0.3s ease',
                pointerEvents: searchOpen ? 'auto' : 'none',
              }}
            />
            {searchOpen && searchValue && (
              <button
                type="button"
                onClick={() => { setSearchValue(''); if (location.pathname === '/store') setSearchParams({}); }}
                style={{ background: 'transparent', border: 'none', color: MUTED, cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </button>
            )}
          </form>

          {/* Cart */}
          <button
            onClick={openCart}
            style={{
              background: 'transparent', border: 'none', color: MUTED, cursor: 'pointer',
              padding: '8px 10px', borderRadius: 22, display: 'flex', alignItems: 'center',
              opacity: searchOpen ? 0.5 : 1, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = TEXT; e.currentTarget.style.background = 'rgba(28,43,74,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.background = 'transparent'; }}
          >
            <Badge
              badgeContent={totalItems}
              sx={{ '& .MuiBadge-badge': { background: AMBER, color: '#fff', fontSize: 9, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 8 } }}
            >
              <ShoppingCartIcon sx={{ fontSize: 20 }} />
            </Badge>
          </button>

          {/* Auth button */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => navigate('/profile')}
                style={{
                  background: 'rgba(28,43,74,0.06)',
                  color: TEXT,
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: 26,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  opacity: searchOpen ? 0.4 : 1,
                  transition: 'all 0.25s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(28,43,74,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(28,43,74,0.06)'; }}
              >
                {user?.name?.split(' ')[0] || 'Account'}
              </button>
              <Tooltip title="Logout">
                <button
                  onClick={() => useUserStore.getState().logout()}
                  style={{
                    background: 'transparent',
                    color: MUTED,
                    border: 'none',
                    padding: '8px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    opacity: searchOpen ? 0.4 : 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.background = 'transparent'; }}
                >
                  <LogoutIcon sx={{ fontSize: 20 }} />
                </button>
              </Tooltip>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{
                background: ACCENT,
                color: '#fff',
                border: 'none',
                padding: '10px 26px',
                borderRadius: 26,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                opacity: searchOpen ? 0.4 : 1,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 2px 8px rgba(28,43,74,0.2)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#243660'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(28,43,74,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(28,43,74,0.2)'; }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer (Premium Side Navigation) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1999 }}
            />
            {/* Slide-in drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, width: '85%', maxWidth: 320,
                background: '#fff', zIndex: 2000, display: 'flex', flexDirection: 'column',
                boxShadow: '4px 0 24px rgba(0,0,0,0.1)', fontFamily: "'Inter', sans-serif"
              }}
            >
              {/* Header Profile / Logo Block */}
              <div style={{ background: '#F8F9FA', padding: '32px 24px 24px', borderBottom: '1px solid #EAEAEA' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isAuthenticated ? 24 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>T</span>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: TEXT, letterSpacing: '-0.04em' }}>TechVerse</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: MUTED, padding: 4 }}>
                    <X size={24} />
                  </button>
                </div>
                
                {isAuthenticated && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(28,43,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT }}>
                      <PersonIcon sx={{ fontSize: 24 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{user?.name || 'My Account'}</span>
                      <span style={{ fontSize: 12, color: MUTED }}>{user?.email || 'View Profile'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <div style={{ flex: 1, padding: '16px 24px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                {NAV_LINKS.map(({ label, to }) => (
                  <RouterLink
                    key={label}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      textDecoration: 'none', color: TEXT, padding: '16px 0', borderBottom: '1px solid #F0F0F0',
                      fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em'
                    }}
                  >
                    {label}
                    <span style={{ color: '#ccc', fontSize: 18 }}>›</span>
                  </RouterLink>
                ))}
              </div>

              {/* Bottom Actions */}
              <div style={{ padding: 24, borderTop: '1px solid #EAEAEA', background: '#FAFAFA' }}>
                {isAuthenticated ? (
                  <button
                    onClick={() => { useUserStore.getState().logout(); setMobileMenuOpen(false); }}
                    style={{ width: '100%', padding: '12px', borderRadius: 8, background: '#fff', border: '1px solid #E0E0E0', color: '#DC2626', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <LogoutIcon sx={{ fontSize: 18 }} /> Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                    style={{ width: '100%', padding: '14px', borderRadius: 10, background: ACCENT, border: 'none', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 12px rgba(28,43,74,0.2)' }}
                  >
                    Sign In or Join
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

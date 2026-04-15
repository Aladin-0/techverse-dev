/// <reference types="vite/client" />
import { useState, useEffect, type ReactNode } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BarChart3, Users, Package, Image, Handshake,
  ShoppingCart, Wrench, Tags, ExternalLink, Settings, ChevronDown,
  Menu, X, Bell, Search, LogOut, Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || '/';
const API_BASE = import.meta.env.VITE_API_BASE || '';

/* ── GLOBAL STYLES (injected once) ──────────────────────────────────── */
const G_CSS_ID = 'aurora-global-css';
function ensureGlobalCSS() {
  if (document.getElementById(G_CSS_ID)) return;
  const s = document.createElement('style');
  s.id = G_CSS_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { font-family: 'Inter', -apple-system, sans-serif; }
    html { zoom: 1.25; }

    @keyframes auroraDrift {
      0%   { transform: translate(0, 0) scale(1); opacity: 0.4; }
      50%  { transform: translate(40px, -30px) scale(1.15); opacity: 0.6; }
      100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
    }
    @keyframes auroraDrift2 {
      0%   { transform: translate(0, 0) scale(1); opacity: 0.3; }
      50%  { transform: translate(-30px, 50px) scale(1.1); opacity: 0.5; }
      100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes breathe {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50%      { opacity: 1; transform: scale(1.2); }
    }
    @keyframes gradientFlow {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .aurora-scroll::-webkit-scrollbar { width: 3px; }
    .aurora-scroll::-webkit-scrollbar-track { background: transparent; }
    .aurora-scroll::-webkit-scrollbar-thumb { background: rgba(139,92,255,0.2); border-radius: 99px; }
    .aurora-scroll::-webkit-scrollbar-thumb:hover { background: rgba(139,92,255,0.4); }

    .glass-surface {
      background: rgba(15, 15, 25, 0.6) !important;
      backdrop-filter: blur(40px) saturate(1.8);
      -webkit-backdrop-filter: blur(40px) saturate(1.8);
      border: 1px solid rgba(255,255,255,0.04);
    }
  `;
  document.head.appendChild(s);
}

/* ── Types ─────────────────────────────────────────────────────────── */
interface NavItem { label: string; icon: LucideIcon; path: string; external?: boolean; badgeKey?: string; }
interface NavSection { title: string; items: NavItem[]; }
interface BadgeCounts { [key: string]: number | undefined; }
interface LayoutProps { pageTitle?: string; actions?: ReactNode; }

const navSections: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { label: 'Analytics', icon: BarChart3, path: '/analytics' },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { label: 'Users', icon: Users, path: '/users', badgeKey: 'users' },
      { label: 'Products', icon: Package, path: '/products', badgeKey: 'products' },
      { label: 'Banners', icon: Image, path: '/banners' },
      { label: 'Affiliates', icon: Handshake, path: '/affiliates', badgeKey: 'affiliates' },
      { label: 'Orders', icon: ShoppingCart, path: '/orders', badgeKey: 'orders' },
      { label: 'Services', icon: Wrench, path: '/services', badgeKey: 'services' },
      { label: 'Categories', icon: Tags, path: '/categories' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Settings', icon: Settings, path: '/settings' },
      { label: 'Website', icon: ExternalLink, path: FRONTEND_URL, external: true },
    ],
  },
];

function isActive(cur: string, path: string) {
  if (path === '/') return cur === '/';
  return cur.startsWith(path);
}

/* ── Sidebar NavLink ───────────────────────────────────────────────── */
function NavLink({ item, active, badge }: { item: NavItem; active: boolean; badge?: number }) {
  const Icon = item.icon;
  const inner = (
    <motion.div
      whileHover={{ x: active ? 0 : 5, background: active ? undefined : 'rgba(255,255,255,0.03)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '11px 16px', borderRadius: 16, cursor: 'pointer',
        position: 'relative', overflow: 'hidden',
        background: active ? 'linear-gradient(135deg, rgba(139,92,255,0.14), rgba(56,189,248,0.07))' : 'transparent',
      }}
    >
      {active && (
        <motion.div layoutId="sidebar-active-pill"
          style={{
            position: 'absolute', left: 0, top: 6, bottom: 6, width: 3, borderRadius: 99,
            background: 'linear-gradient(180deg, #8b5cff, #38bdf8)',
            boxShadow: '0 0 16px rgba(139,92,255,0.6)',
          }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      <Icon size={18} style={{ color: active ? '#c4b5fd' : '#6b7280', transition: 'color 0.2s', flexShrink: 0 }} />
      <span style={{
        flex: 1, fontSize: 13, fontWeight: active ? 600 : 500,
        color: active ? '#f0eaff' : '#9ca3af', letterSpacing: '0.01em',
      }}>
        {item.label}
      </span>
      {badge !== undefined && badge > 0 && (
        <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
          style={{
            fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
            background: 'linear-gradient(135deg, rgba(139,92,255,0.25), rgba(56,189,248,0.15))',
            color: '#c4b5fd',
          }}>
          {badge}
        </motion.span>
      )}
      {item.external && <ExternalLink size={12} style={{ color: '#4b5563', flexShrink: 0 }} />}
    </motion.div>
  );

  if (item.external) return <a href={item.path} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{inner}</a>;
  return <Link to={item.path} style={{ textDecoration: 'none' }}>{inner}</Link>;
}

/* ── Main Layout ───────────────────────────────────────────────────── */
export default function Layout({ pageTitle, actions }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [badges, setBadges] = useState<BadgeCounts>({});
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => { ensureGlobalCSS(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/admin-panel/api/stats/`, { credentials: 'include' });
        if (res.ok) setBadges(await res.json());
      } catch { /* optional */ }
    })();
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!userMenuOpen) return;
    const close = () => setUserMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [userMenuOpen]);

  const derivedTitle = pageTitle || navSections.flatMap(s => s.items)
    .find(item => !item.external && isActive(location.pathname, item.path))?.label || 'Dashboard';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0b14',
      color: '#9ca3af',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── AURORA MESH BG — Floating gradient orbs ──────────────── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '10%', left: '20%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,255,0.08) 0%, transparent 70%)',
          animation: 'auroraDrift 18s ease-in-out infinite',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', top: '60%', right: '15%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)',
          animation: 'auroraDrift2 22s ease-in-out infinite',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '40%',
          width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.04) 0%, transparent 70%)',
          animation: 'auroraDrift 25s ease-in-out infinite 5s',
          filter: 'blur(60px)',
        }} />
      </div>

      {/* ── Mobile overlay ──────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 270, zIndex: 50,
          display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(180deg, rgba(12,12,22,0.95) 0%, rgba(8,8,16,0.98) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.04)',
          transform: sidebarOpen ? 'translateX(0)' : undefined,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand */}
        <div style={{ padding: '24px 20px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <motion.div
              animate={{ boxShadow: ['0 0 20px rgba(139,92,255,0.3)', '0 0 35px rgba(56,189,248,0.4)', '0 0 20px rgba(139,92,255,0.3)'] }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{
                width: 42, height: 42, borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #8b5cff, #38bdf8)',
                backgroundSize: '200% 200%', animation: 'gradientFlow 6s ease infinite',
                fontWeight: 900, fontSize: 14, color: '#fff', letterSpacing: '0.05em',
              }}
            >
              <Sparkles size={20} />
            </motion.div>
            <div>
              <div style={{
                fontSize: 16, fontWeight: 900, letterSpacing: '0.1em',
                background: 'linear-gradient(135deg, #c4b5fd, #7dd3fc)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                TECHVERSE
              </div>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#4b5563', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Commerce Panel
              </div>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden"
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="aurora-scroll" style={{ flex: 1, overflowY: 'auto', padding: '4px 10px' }}>
          {navSections.map(section => (
            <div key={section.title} style={{ marginBottom: 22 }}>
              <div style={{
                padding: '0 16px', marginBottom: 8,
                fontSize: 9, fontWeight: 800, letterSpacing: '0.18em',
                color: '#374151', textTransform: 'uppercase',
              }}>
                {section.title}
              </div>
              {section.items.map(item => {
                const active = !item.external && isActive(location.pathname, item.path);
                return <NavLink key={item.label} item={item} active={active} badge={item.badgeKey ? badges[item.badgeKey] : undefined} />;
              })}
            </div>
          ))}
        </nav>

        {/* User card */}
        <div style={{ padding: '12px 14px 18px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', borderRadius: 18,
            background: 'rgba(139,92,255,0.06)',
            border: '1px solid rgba(139,92,255,0.08)',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #8b5cff, #38bdf8)',
              fontWeight: 800, fontSize: 13, color: '#fff', flexShrink: 0,
            }}>
              A
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>Admin</div>
              <div style={{ fontSize: 10, color: '#4b5563' }}>Administrator</div>
            </div>
            <a href="/admin-panel/logout/"
              style={{ color: '#4b5563', padding: 4, borderRadius: 8, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}
              title="Logout">
              <LogOut size={15} />
            </a>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <div style={{ marginLeft: 270, position: 'relative', zIndex: 1 }} className="lg:ml-[270px] ml-0">

        {/* Topbar — Frosted glass */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 32px',
          background: 'rgba(10,11,20,0.6)',
          backdropFilter: 'blur(24px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
          borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 6 }}>
              <Menu size={22} />
            </button>
            <div>
              <h1 style={{
                fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #e5e7eb, #c4b5fd)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {derivedTitle}
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Search */}
            <motion.div
              animate={{ width: searchFocused ? 260 : 180 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{ position: 'relative', display: 'none' }}
              className="sm:flex"
            >
              <Search size={14} style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: searchFocused ? '#8b5cff' : '#4b5563', transition: 'color 0.2s',
              }} />
              <input
                placeholder="Search…"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={{
                  width: '100%', padding: '9px 14px 9px 36px', borderRadius: 14,
                  border: 'none',
                  background: searchFocused ? 'rgba(139,92,255,0.06)' : 'rgba(255,255,255,0.03)',
                  color: '#e5e7eb', fontSize: 12, fontWeight: 500, outline: 'none',
                  boxShadow: searchFocused ? '0 0 0 1px rgba(139,92,255,0.25), 0 0 20px rgba(139,92,255,0.08)' : 'none',
                  transition: 'all 0.3s',
                }}
              />
            </motion.div>

            {actions && <div className="hidden sm:flex" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{actions}</div>}

            {/* Bell */}
            <button style={{
              position: 'relative', background: 'none', border: 'none', color: '#9ca3af',
              cursor: 'pointer', padding: 8, borderRadius: 12, transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Bell size={18} />
              <span style={{
                position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 99,
                background: 'linear-gradient(135deg, #8b5cff, #38bdf8)',
                animation: 'breathe 2.5s ease-in-out infinite',
              }} />
            </button>

            {/* User menu */}
            <div style={{ position: 'relative' }}>
              <button onClick={e => { e.stopPropagation(); setUserMenuOpen(p => !p); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 10px', borderRadius: 14, border: 'none',
                  background: userMenuOpen ? 'rgba(255,255,255,0.04)' : 'transparent',
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => { if (!userMenuOpen) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, #8b5cff, #38bdf8)',
                  fontWeight: 800, fontSize: 13, color: '#fff',
                }}>A</div>
                <div className="hidden sm:block" style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb' }}>Admin</div>
                  <div style={{ fontSize: 10, color: '#4b5563' }}>Administrator</div>
                </div>
                <ChevronDown size={14} className="hidden sm:block"
                  style={{ color: '#4b5563', transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : undefined }} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 200,
                      borderRadius: 18, padding: 6,
                      background: 'rgba(15,15,25,0.95)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
                    }}
                  >
                    <Link to="/settings"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, fontSize: 12, fontWeight: 500, color: '#9ca3af', textDecoration: 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <Settings size={15} /> Settings
                    </Link>
                    <a href="/admin-panel/logout/"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, fontSize: 12, fontWeight: 500, color: '#ef4444', textDecoration: 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <LogOut size={15} /> Logout
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding: '28px 32px 48px', position: 'relative', zIndex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Download,
  Search,
  X,
  Edit,
  BarChart3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  AlertTriangle,
  Star,
  Clock,
  CheckCircle2,
  Activity,
  Shield,
  Zap,
} from 'lucide-react';
import { adminApi } from '@/services/api';

/* ── Design Tokens ──────────────────────────────────────────────────── */
const C = {
  bg: '#0a0b14',
  surface: 'rgba(15, 17, 30, 0.7)',
  elevated: 'rgba(20, 22, 38, 0.8)',
  high: 'rgba(30, 32, 50, 0.9)',
  violet: '#8b5cff',
  violetDim: '#6d28d9',
  cyan: '#38bdf8',
  text: '#f0f0f5',
  muted: '#a3a3b5',
  faint: '#4b4b66',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#ff5a5a',
};

/* ── Types ──────────────────────────────────────────────────────────── */
interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string | null;
  avatar?: string | null;
}

interface TechnicianStats {
  total_orders: number;
  service_requests: number;
  avg_rating: number;
  completion_rate: number;
  response_time: string;
}

interface Pagination {
  page: number;
  total_pages: number;
  total_count: number;
  has_next: boolean;
  has_previous: boolean;
}

/* ── Helpers ────────────────────────────────────────────────────────── */
function timeAgo(dateStr: string): string {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', { timeZone: import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true, year: 'numeric', month: 'short', day: 'numeric' });
}

function avatarInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
}

/* ── Role colors ────────────────────────────────────────────────────── */
const roleColors: Record<string, { bg: string; fg: string; glow: string }> = {
  ADMIN:      { bg: 'rgba(255,90,90,0.12)',   fg: '#ff5a5a',  glow: '#ff5a5a' },
  TECHNICIAN: { bg: 'rgba(96,165,250,0.12)',  fg: '#60a5fa',  glow: '#3b82f6' },
  CUSTOMER:   { bg: 'rgba(74,222,128,0.12)',  fg: '#4ade80',  glow: '#22c55e' },
  AMC:        { bg: 'rgba(251,191,36,0.12)',  fg: '#fbbf24',  glow: '#d97706' },
  AFFILIATE:  { bg: 'rgba(139,92,255,0.12)', fg: '#8b5cff',  glow: '#7c5cbf' },
};

/* ── Avatar gradient per role ──────────────────────────────────────── */
const avatarGradients: Record<string, string> = {
  ADMIN:      'linear-gradient(135deg, #ff5a5a, #ff8a8a)',
  TECHNICIAN: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
  CUSTOMER:   'linear-gradient(135deg, #22c55e, #4ade80)',
  AMC:        'linear-gradient(135deg, #d97706, #fbbf24)',
  AFFILIATE:  'linear-gradient(135deg, #7c5cbf, #8b5cff)',
};

/* ── Component ──────────────────────────────────────────────────────── */
export const pageTitle = 'Users';

export default function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, total_pages: 1, total_count: 0, has_next: false, has_previous: false,
  });

  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchFocused, setSearchFocused] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [statsTarget, setStatsTarget] = useState<User | null>(null);
  const [techStats, setTechStats] = useState<TechnicianStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  /* ── Fetch ──────────────────────────────────────────────────────── */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (roleFilter) params.role = roleFilter;
      if (searchQuery) params.search = searchQuery;
      const currentPage = parseInt(searchParams.get('page') || '1', 10);
      params.page = String(currentPage);

      const res = await adminApi.getUsers(params as never);
      const data = res.data;

      setUsers(data.users ?? data.results ?? []);
      setPagination({
        page: data.page ?? currentPage,
        total_pages: data.total_pages ?? data.num_pages ?? 1,
        total_count: data.total_count ?? data.count ?? 0,
        has_next: data.has_next ?? false,
        has_previous: data.has_previous ?? false,
      });
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, searchQuery, searchParams]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (roleFilter) params.role = roleFilter;
    if (searchQuery) params.search = searchQuery;
    const page = searchParams.get('page');
    if (page && page !== '1') params.page = page;
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, searchQuery]);

  /* ── Actions ────────────────────────────────────────────────────── */
  const goToPage = (page: number) => {
    setSearchParams((prev) => { prev.set('page', String(page)); return prev; });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.size === users.length ? new Set() : new Set(users.map(u => u.id)));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteTarget.id); return n; });
      fetchUsers();
    } catch { /* silent */ }
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      try { await adminApi.deleteUser(id); } catch { /* skip */ }
    }
    setSelectedIds(new Set());
    fetchUsers();
  };

  const openStats = async (user: User) => {
    setStatsTarget(user);
    setStatsLoading(true);
    try {
      const res = await adminApi.getUsers({ search: user.email } as never);
      const data = res.data;
      const found = (data.users ?? data.results ?? []).find((u: User) => u.id === user.id);
      setTechStats({
        total_orders: found?.total_orders ?? 0,
        service_requests: found?.service_requests ?? 0,
        avg_rating: found?.avg_rating ?? 0,
        completion_rate: found?.completion_rate ?? 0,
        response_time: found?.response_time ?? 'N/A',
      });
    } catch {
      setTechStats({ total_orders: 0, service_requests: 0, avg_rating: 0, completion_rate: 0, response_time: 'N/A' });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined'];
    const rows = users.map(u => [u.name, u.email, u.phone || '', u.role, u.is_active ? 'Active' : 'Inactive', formatDate(u.date_joined)]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Role distribution stats ────────────────────────────────────── */
  const roleCounts: Record<string, number> = {};
  users.forEach(u => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; });
  const totalActive = users.filter(u => u.is_active).length;

  const roles = ['ADMIN', 'TECHNICIAN', 'CUSTOMER', 'AMC', 'AFFILIATE'];

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header Row ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/users/create" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 14,
                background: 'linear-gradient(135deg, #8b5cff, #38bdf8)',
                color: '#000', fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer',
              }}
            >
              <UserPlus size={15} /> Add User
            </motion.button>
          </Link>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleExport}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 14,
              background: C.surface, color: C.muted,
              fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
            }}
          >
            <Download size={14} /> Export
          </motion.button>

          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleBulkDelete}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 16px', borderRadius: 14,
                  background: 'rgba(255,90,90,0.12)', color: C.error,
                  fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                }}
              >
                <Trash2 size={14} /> Delete ({selectedIds.size})
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: C.faint, fontSize: 11, fontWeight: 600 }}>
            {pagination.total_count} users
          </span>
        </div>
      </div>

      {/* ── Role Filter Chips ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <motion.div
          animate={{ width: searchFocused ? 280 : 200 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{ position: 'relative' }}
        >
          <Search
            size={14}
            style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: searchFocused ? C.violet : C.faint, transition: 'color 0.2s',
            }}
          />
          <input
            placeholder="Search users…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              width: '100%', padding: '9px 14px 9px 34px', borderRadius: 14,
              background: searchFocused ? C.elevated : C.surface,
              color: C.text, fontSize: 12, fontWeight: 500,
              border: 'none', outline: 'none',
              boxShadow: searchFocused ? '0 0 0 1px rgba(139,92,255,0.3)' : 'none',
              transition: 'all 0.3s',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: C.faint, cursor: 'pointer', padding: 2,
              }}
            >
              <X size={12} />
            </button>
          )}
        </motion.div>

        {/* Role pills */}
        <button
          onClick={() => setRoleFilter('')}
          style={{
            padding: '7px 14px', borderRadius: 12,
            background: !roleFilter ? 'rgba(139,92,255,0.12)' : C.surface,
            color: !roleFilter ? C.violet : C.muted,
            fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          All
        </button>
        {roles.map(role => {
          const rc = roleColors[role] ?? { bg: C.surface, fg: C.muted, glow: C.faint };
          const active = roleFilter === role;
          return (
            <button
              key={role}
              onClick={() => setRoleFilter(active ? '' : role)}
              style={{
                padding: '7px 14px', borderRadius: 12,
                background: active ? rc.bg : C.surface,
                color: active ? rc.fg : C.faint,
                fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}
            >
              {role.toLowerCase()}
              {roleCounts[role] ? ` (${roleCounts[role]})` : ''}
            </button>
          );
        })}
      </div>

      {/* ── User Table ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{ background: C.surface, borderRadius: 24, overflow: 'hidden' }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '14px 20px', textAlign: 'left', width: 44 }}>
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedIds.size === users.length}
                    onChange={toggleSelectAll}
                    style={{ accentColor: C.violet, cursor: 'pointer' }}
                  />
                </th>
                {['User', 'Role', 'Status', 'Joined', 'Last Active', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '14px 16px', textAlign: 'left',
                    fontSize: 10, fontWeight: 700, color: C.faint,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '60px 0', textAlign: 'center' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: 28, height: 28, borderRadius: 99, margin: '0 auto',
                      border: `3px solid ${C.elevated}`, borderTopColor: C.violet,
                    }}
                  />
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '60px 0', textAlign: 'center' }}>
                  <Users size={40} style={{ color: C.faint, marginBottom: 8 }} />
                  <p style={{ color: C.muted, fontSize: 13 }}>No users found</p>
                </td></tr>
              ) : (
                users.map((user, i) => {
                  const rc = roleColors[user.role] ?? { bg: C.surface, fg: C.muted, glow: C.faint };
                  const ag = avatarGradients[user.role] ?? 'linear-gradient(135deg, #555, #777)';
                  const selected = selectedIds.has(user.id);

                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.3 }}
                      style={{
                        borderTop: `1px solid ${selected ? 'rgba(139,92,255,0.15)' : 'rgba(255,255,255,0.03)'}`,
                        background: selected ? 'rgba(139,92,255,0.04)' : 'transparent',
                        transition: 'background 0.2s',
                        cursor: 'default',
                      }}
                      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '12px 20px' }}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelect(user.id)}
                          style={{ accentColor: C.violet, cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* Avatar with role-gradient ring */}
                          <div style={{ position: 'relative' }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: 11,
                              overflow: 'hidden', flexShrink: 0,
                              boxShadow: user.is_active ? `0 0 0 2px ${rc.glow}33` : 'none',
                            }}>
                              {user.avatar ? (
                                <img src={adminApi.getImageUrl(user.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{
                                  width: '100%', height: '100%',
                                  background: ag,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#000', fontSize: 13, fontWeight: 800,
                                }}>
                                  {avatarInitials(user.name)}
                                </div>
                              )}
                            </div>
                            {/* Online dot */}
                            {user.is_active && (
                              <div style={{
                                position: 'absolute', bottom: -1, right: -1,
                                width: 10, height: 10, borderRadius: 99,
                                background: C.success, border: `2px solid ${C.surface}`,
                              }} />
                            )}
                          </div>
                          <div>
                            <p style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{user.name}</p>
                            <p style={{ color: C.faint, fontSize: 11 }}>{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: rc.bg, color: rc.fg,
                          padding: '4px 12px', borderRadius: 99,
                          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          {user.role === 'ADMIN' && <Shield size={10} />}
                          {user.role === 'TECHNICIAN' && <Zap size={10} />}
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: user.is_active ? 'rgba(74,222,128,0.1)' : 'rgba(255,90,90,0.1)',
                          color: user.is_active ? C.success : C.error,
                          padding: '4px 10px', borderRadius: 99,
                          fontSize: 10, fontWeight: 700,
                        }}>
                          <span style={{
                            width: 5, height: 5, borderRadius: 99,
                            background: user.is_active ? C.success : C.error,
                            animation: user.is_active ? 'aethericPulse 2.5s infinite' : 'none',
                          }} />
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>
                        {formatDate(user.date_joined)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, color: C.faint }}>
                          {user.last_login ? timeAgo(user.last_login) : 'Never'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Link to={`/users/${user.id}/edit`} style={{ textDecoration: 'none' }}>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              style={{
                                padding: 7, borderRadius: 10, background: 'transparent',
                                color: C.muted, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,92,255,0.08)'; e.currentTarget.style.color = C.violet; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}
                              title="Edit"
                            >
                              <Edit size={14} />
                            </motion.button>
                          </Link>
                          {user.role === 'TECHNICIAN' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openStats(user)}
                              style={{
                                padding: 7, borderRadius: 10, background: 'transparent',
                                color: C.muted, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(96,165,250,0.08)'; e.currentTarget.style.color = '#60a5fa'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}
                              title="Stats"
                            >
                              <BarChart3 size={14} />
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setDeleteTarget(user)}
                            style={{
                              padding: 7, borderRadius: 10, background: 'transparent',
                              color: C.faint, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,90,90,0.08)'; e.currentTarget.style.color = C.error; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.faint; }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 22px',
            borderTop: '1px solid rgba(255,255,255,0.03)',
          }}>
            <span style={{ fontSize: 11, color: C.faint }}>
              Page {pagination.page} of {pagination.total_pages} · {pagination.total_count} users
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={!pagination.has_previous}
                style={{
                  padding: '6px 10px', borderRadius: 10,
                  background: pagination.has_previous ? C.elevated : 'transparent',
                  color: pagination.has_previous ? C.muted : C.faint,
                  border: 'none', cursor: pagination.has_previous ? 'pointer' : 'not-allowed',
                  opacity: pagination.has_previous ? 1 : 0.4,
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                }}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={!pagination.has_next}
                style={{
                  padding: '6px 10px', borderRadius: 10,
                  background: pagination.has_next ? C.elevated : 'transparent',
                  color: pagination.has_next ? C.muted : C.faint,
                  border: 'none', cursor: pagination.has_next ? 'pointer' : 'not-allowed',
                  opacity: pagination.has_next ? 1 : 0.4,
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Delete Confirmation Modal ──────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20,
            }}
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: C.elevated, borderRadius: 24,
                padding: 28, width: '100%', maxWidth: 400,
                boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: 'rgba(255,90,90,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.error,
                }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Delete User</h3>
                  <p style={{ color: C.faint, fontSize: 11, margin: 0 }}>This action cannot be undone</p>
                </div>
              </div>

              <p style={{ color: C.muted, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                Are you sure you want to delete <strong style={{ color: C.text }}>{deleteTarget.name}</strong>?
                All associated data will be permanently removed.
              </p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDeleteTarget(null)}
                  style={{
                    padding: '9px 18px', borderRadius: 12,
                    background: C.high, color: C.muted,
                    fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '9px 18px', borderRadius: 12,
                    background: 'rgba(255,90,90,0.15)', color: C.error,
                    fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                  }}
                >
                  Delete User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Technician Stats Modal ─────────────────────────────── */}
      <AnimatePresence>
        {statsTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20,
            }}
            onClick={() => { setStatsTarget(null); setTechStats(null); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: C.elevated, borderRadius: 24,
                padding: 28, width: '100%', maxWidth: 460,
                boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: avatarGradients[statsTarget.role] ?? 'linear-gradient(135deg, #555, #777)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#000', fontWeight: 800, fontSize: 15,
                  }}>
                    {avatarInitials(statsTarget.name)}
                  </div>
                  <div>
                    <h3 style={{ color: C.text, fontSize: 15, fontWeight: 700, margin: 0 }}>{statsTarget.name}</h3>
                    <p style={{ color: C.faint, fontSize: 11, margin: 0 }}>{statsTarget.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setStatsTarget(null); setTechStats(null); }}
                  style={{ background: 'none', border: 'none', color: C.faint, cursor: 'pointer', padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>

              {statsLoading ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: 28, height: 28, borderRadius: 99, margin: '0 auto',
                      border: `3px solid ${C.high}`, borderTopColor: C.violet,
                    }}
                  />
                </div>
              ) : techStats && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Total Orders', value: techStats.total_orders, icon: <Activity size={14} />, color: C.cyan },
                    { label: 'Service Requests', value: techStats.service_requests, icon: <CheckCircle2 size={14} />, color: C.violet },
                    { label: 'Avg Rating', value: techStats.avg_rating.toFixed(1), icon: <Star size={14} />, color: C.warning },
                    { label: 'Completion Rate', value: `${techStats.completion_rate}%`, icon: <Zap size={14} />, color: C.success },
                    { label: 'Response Time', value: techStats.response_time, icon: <Clock size={14} />, color: '#60a5fa' },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        padding: '14px 16px', borderRadius: 16,
                        background: C.high,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: s.color }}>
                        {s.icon}
                        <span style={{ fontSize: 10, fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {s.label}
                        </span>
                      </div>
                      <p style={{ color: C.text, fontSize: 18, fontWeight: 800, margin: 0 }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

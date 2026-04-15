import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Search,
  X,
  Eye,
  UserCheck,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  AlertTriangle,
  Clock,
  UserX,
  Loader2,
  CheckCircle2,
  Package,
  MapPin,
  Phone,
  Mail,
  IndianRupee,
  Truck,
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
interface OrderItem { product_name: string; quantity: number; price: string; total: string; }

interface Order {
  id: number;
  status: string;
  order_date: string;
  delivered_at?: string | null;
  delivery_duration?: string | null;
  total_amount: string | number;
  item_count?: number;
  transaction_id?: string | null;
  payment_date?: string | null;
  payment_status?: string | null;
  customer: { id?: number; name: string; email: string; phone: string | null; avatar?: string | null; };
  technician: { id: number; name: string; phone?: string | null; avatar?: string | null; } | null;
  items: OrderItem[] | { product_name: string; quantity: number }[];
  affiliate_code?: string | null;
  affiliate_name?: string | null;
}

interface OrderDetail {
  id: number;
  status: string;
  total_amount: string;
  order_date: string;
  delivered_at?: string | null;
  delivery_duration?: string | null;
  transaction_id?: string | null;
  payment_date?: string | null;
  payment_status?: string | null;
  customer: { name: string; email: string; phone: string };
  technician: string | null;
  shipping_address: string;
  items: OrderItem[];
  affiliate_code?: string | null;
  affiliate_name?: string | null;
}

interface Technician { id: number; name: string; email?: string; avatar?: string | null; }
interface StatusChoice { value: string; label: string; }
interface Pagination { page: number; total_pages: number; total_count: number; has_next: boolean; has_previous: boolean; }

/* ── Helpers ────────────────────────────────────────────────────────── */
function formatDate(dateStr: string): string {
  try { return new Date(dateStr).toLocaleString('en-IN', { timeZone: import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }); } catch { return dateStr; }
}
function formatPrice(price: string | number): string { return Number(price).toLocaleString('en-IN'); }
function avatarInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
}

const statusStyle: Record<string, { bg: string; fg: string; glow: string }> = {
  PENDING:    { bg: 'rgba(251,191,36,0.12)',  fg: '#fbbf24', glow: '#d97706' },
  PROCESSING: { bg: 'rgba(96,165,250,0.12)', fg: '#60a5fa', glow: '#3b82f6' },
  SHIPPED:    { bg: 'rgba(139,92,255,0.12)', fg: '#8b5cff', glow: '#7c5cbf' },
  DELIVERED:  { bg: 'rgba(74,222,128,0.12)',  fg: '#4ade80', glow: '#22c55e' },
  COMPLETED:  { bg: 'rgba(74,222,128,0.12)',  fg: '#4ade80', glow: '#22c55e' },
  CANCELLED:  { bg: 'rgba(255,90,90,0.12)',   fg: '#ff5a5a', glow: '#dc2626' },
};

function StatusBadge({ status }: { status: string }) {
  const s = statusStyle[status] ?? { bg: 'rgba(255,255,255,0.07)', fg: C.muted, glow: C.faint };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.fg,
      padding: '4px 10px', borderRadius: 99,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
      textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: 99, background: s.fg,
        animation: status === 'PROCESSING' || status === 'PENDING' ? 'aethericPulse 2s infinite' : 'none',
      }} />
      {status.replace(/_/g, ' ')}
    </span>
  );
}

/* ── Component ──────────────────────────────────────────────────────── */
export const pageTitle = 'Orders';

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [statusChoices, setStatusChoices] = useState<StatusChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, total_pages: 1, total_count: 0, has_next: false, has_previous: false,
  });

  const [stats, setStats] = useState({ pending: 0, unassigned: 0, processing: 0, completed: 0 });

  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [techFilter, setTechFilter] = useState(searchParams.get('technician') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showUnpaid, setShowUnpaid] = useState(false);

  const [detailsModal, setDetailsModal] = useState<OrderDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [assignModal, setAssignModal] = useState<Order | null>(null);
  const [assignTechId, setAssignTechId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [statusModal, setStatusModal] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);

  /* ── Fetch ──────────────────────────────────────────────────────── */
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (techFilter) params.technician = techFilter;
      if (searchQuery) params.search = searchQuery;
      params.payment = showUnpaid ? 'UNPAID' : 'SUCCESS';
      const currentPage = parseInt(searchParams.get('page') || '1', 10);
      params.page = String(currentPage);

      const res = await adminApi.getOrders(params as never);
      const data = res.data;

      setOrders(data.orders ?? data.results ?? []);
      setTechnicians(data.technicians ?? []);

      const choices = data.status_choices ?? data.statuses ?? [];
      if (Array.isArray(choices) && choices.length > 0) {
        if (typeof choices[0] === 'string') {
          setStatusChoices(choices.map((s: string) => ({ value: s, label: s })));
        } else if (Array.isArray(choices[0])) {
          setStatusChoices(choices.map((c: [string, string]) => ({ value: c[0], label: c[1] })));
        } else {
          setStatusChoices(choices);
        }
      } else {
        setStatusChoices([
          { value: 'PENDING', label: 'Pending' },
          { value: 'PROCESSING', label: 'Processing' },
          { value: 'SHIPPED', label: 'Shipped' },
          { value: 'DELIVERED', label: 'Delivered' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ]);
      }

      setStats({
        pending: data.pending_count ?? 0,
        unassigned: data.unassigned_count ?? 0,
        processing: data.processing_count ?? 0,
        completed: data.completed_count ?? 0,
      });

      setPagination({
        page: data.page ?? currentPage,
        total_pages: data.total_pages ?? data.num_pages ?? 1,
        total_count: data.total_count ?? data.count ?? 0,
        has_next: data.has_next ?? false,
        has_previous: data.has_previous ?? false,
      });
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, techFilter, searchQuery, searchParams, showUnpaid]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    if (techFilter) params.technician = techFilter;
    if (searchQuery) params.search = searchQuery;
    const page = searchParams.get('page');
    if (page && page !== '1') params.page = page;
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, techFilter, searchQuery]);

  const goToPage = (page: number) => {
    setSearchParams(prev => { prev.set('page', String(page)); return prev; });
  };

  /* ── Actions ────────────────────────────────────────────────────── */
  const openDetails = async (order: Order) => {
    setDetailsLoading(true); setDetailsModal(null);
    try {
      const res = await adminApi.getOrderDetails(order.id);
      if (res.data.success) setDetailsModal(res.data.order);
    } catch { /* silent */ } finally { setDetailsLoading(false); }
  };

  const openAssign = (order: Order) => {
    setAssignModal(order);
    setAssignTechId(order.technician ? String(order.technician.id) : '');
  };

  const handleAssign = async () => {
    if (!assignModal || !assignTechId) return;
    setAssignLoading(true);
    try { await adminApi.assignTechnician(assignModal.id, Number(assignTechId)); setAssignModal(null); fetchOrders(); }
    catch { /* silent */ } finally { setAssignLoading(false); }
  };

  const openStatus = (order: Order) => { setStatusModal(order); setNewStatus(order.status); };

  const handleStatusUpdate = async () => {
    if (!statusModal || !newStatus) return;
    setStatusLoading(true);
    try { await adminApi.updateOrderStatus(statusModal.id, newStatus); setStatusModal(null); fetchOrders(); }
    catch { /* silent */ } finally { setStatusLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await adminApi.deleteOrder(deleteTarget.id); setDeleteTarget(null); fetchOrders(); } catch { /* silent */ }
  };

  const handleExport = () => {
    const headers = ['Order ID', 'Customer', 'Status', 'Total', 'Technician', 'Date'];
    const rows = orders.map(o => [`#${o.id}`, o.customer.name, o.status, formatPrice(o.total_amount), o.technician?.name || 'Unassigned', formatDate(o.order_date)]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'orders_export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Shared modal shell ─────────────────────────────────────────── */
  function ModalShell({ children, onClose, title, width = 440 }: { children: React.ReactNode; onClose: () => void; title: string; width?: number }) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: C.elevated, borderRadius: 24,
            padding: 28, width: '100%', maxWidth: width,
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            maxHeight: '85vh', overflowY: 'auto',
          }}
          className="aetheric-scrollbar"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.faint, cursor: 'pointer', padding: 4 }}>
              <X size={18} />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    );
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Status Stat Cards ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Pending', value: stats.pending, icon: <Clock size={16} />, color: C.warning },
          { label: 'Unassigned', value: stats.unassigned, icon: <UserX size={16} />, color: C.error },
          { label: 'Processing', value: stats.processing, icon: <Loader2 size={16} />, color: '#60a5fa' },
          { label: 'Completed', value: stats.completed, icon: <CheckCircle2 size={16} />, color: C.success },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            style={{
              background: C.surface, borderRadius: 24, padding: '18px 20px',
              position: 'relative', overflow: 'hidden', cursor: 'default',
            }}
          >
            <div style={{
              position: 'absolute', top: -20, right: -20,
              width: 80, height: 80,
              background: `radial-gradient(circle, ${stat.color}12 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: C.faint, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {stat.label}
              </span>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: stat.color + '15',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color,
              }}>
                {stat.icon}
              </div>
            </div>
            <p style={{ color: C.text, fontSize: 28, fontWeight: 800, lineHeight: 1, margin: 0 }}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Search */}
          <motion.div
            animate={{ width: searchFocused ? 260 : 190 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{ position: 'relative' }}
          >
            <Search size={14} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: searchFocused ? C.violet : C.faint, transition: 'color 0.2s',
            }} />
            <input
              placeholder="Search orders…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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
          </motion.div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 14px', borderRadius: 14,
              background: C.surface, color: C.muted,
              fontSize: 12, fontWeight: 500, border: 'none', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">All Statuses</option>
            {statusChoices.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Technician filter */}
          <select
            value={techFilter}
            onChange={e => setTechFilter(e.target.value)}
            style={{
              padding: '9px 14px', borderRadius: 14,
              background: C.surface, color: C.muted,
              fontSize: 12, fontWeight: 500, border: 'none', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">All Technicians</option>
            {technicians.map(t => (
              <option key={t.id} value={String(t.id)}>{t.name}</option>
            ))}
          </select>

          {/* Pending toggle */}
          <button
            onClick={() => setShowUnpaid(p => !p)}
            style={{
              padding: '9px 14px', borderRadius: 14,
              background: showUnpaid ? 'rgba(251,191,36,0.15)' : C.surface,
              border: showUnpaid ? '1px solid rgba(251,191,36,0.4)' : 'none',
              color: showUnpaid ? '#fbbf24' : C.muted,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {showUnpaid ? '⚠ Unpaid / Cancelled' : 'Show Unpaid/Pending'}
          </button>
        </div>

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
          <Download size={14} /> Export CSV
        </motion.button>
      </div>

      {/* ── Orders Table ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ background: C.surface, borderRadius: 24, overflow: 'hidden' }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Order', 'Customer', 'Items', 'Total', 'TXN', 'Status', 'Technician', 'Date', 'Actions'].map(h => (
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
                <tr><td colSpan={8} style={{ padding: '60px 0', textAlign: 'center' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 28, height: 28, borderRadius: 99, margin: '0 auto', border: `3px solid ${C.elevated}`, borderTopColor: C.violet }}
                  />
                </td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '60px 0', textAlign: 'center' }}>
                  <ShoppingCart size={40} style={{ color: C.faint, marginBottom: 8 }} />
                  <p style={{ color: C.muted, fontSize: 13 }}>No orders found</p>
                </td></tr>
              ) : (
                orders.map((order, i) => {
                  const ss = statusStyle[order.status] ?? { bg: C.surface, fg: C.muted, glow: C.faint };
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.3 }}
                      style={{
                        borderTop: '1px solid rgba(255,255,255,0.03)',
                        transition: 'background 0.2s', cursor: 'default',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 8,
                          background: ss.bg, color: ss.fg,
                          fontSize: 12, fontWeight: 800,
                        }}>
                          #{order.id}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 9,
                            background: 'linear-gradient(135deg, #6d28d940, #0ea5e930)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: C.text, fontSize: 11, fontWeight: 800, flexShrink: 0,
                          }}>
                            {avatarInitials(order.customer.name)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ color: C.text, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                              {order.customer.name}
                            </p>
                            <p style={{ color: C.faint, fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                              {order.customer.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: C.muted, fontSize: 12 }}>
                          {order.item_count ?? (Array.isArray(order.items) ? order.items.length : 0)} items
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: C.text, fontSize: 14, fontWeight: 800 }}>
                          <span style={{ color: C.cyan, fontSize: 11 }}>₹</span>
                          {formatPrice(order.total_amount)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {order.transaction_id && order.payment_status === 'SUCCESS' ? (
                          <code style={{
                            fontSize: 9, background: 'rgba(56,189,248,0.08)',
                            border: '1px solid rgba(56,189,248,0.15)',
                            borderRadius: 6, padding: '3px 7px',
                            color: C.cyan, fontWeight: 700, letterSpacing: '0.03em',
                            maxWidth: 120, display: 'block', overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {order.transaction_id}
                          </code>
                        ) : order.transaction_id && order.payment_status === 'PENDING' ? (
                          <span style={{ color: C.warning, fontSize: 10, fontWeight: 600 }}>PENDING</span>
                        ) : order.transaction_id && order.payment_status === 'FAILED' ? (
                          <span style={{ color: C.error, fontSize: 10, fontWeight: 600, opacity: 0.8 }}>FAILED</span>
                        ) : (
                          <span style={{ color: C.faint, fontSize: 10, fontStyle: 'italic' }}>Unpaid</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge status={order.status} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {order.technician ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: 7,
                              background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#000', fontSize: 9, fontWeight: 800, flexShrink: 0,
                            }}>
                              {avatarInitials(order.technician.name)}
                            </div>
                            <span style={{ color: C.muted, fontSize: 11, fontWeight: 500 }}>
                              {order.technician.name}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 600, color: C.error, opacity: 0.7 }}>
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 11, color: C.muted }}>
                        <p style={{ margin: 0 }}>{formatDate(order.order_date)}</p>
                        {order.delivered_at && (
                          <p style={{ margin: '2px 0 0', fontSize: 10, color: '#4ade80' }}>
                            ✓ {formatDate(order.delivered_at)}
                            {order.delivery_duration && (
                              <span style={{ color: C.faint }}> · {order.delivery_duration}</span>
                            )}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <button
                            onClick={() => openDetails(order)}
                            title="View"
                            style={{ padding: 6, borderRadius: 8, background: 'transparent', color: C.muted, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,255,0.08)'; e.currentTarget.style.color = C.violet; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}
                          ><Eye size={13} /></button>
                          <button
                            onClick={() => openAssign(order)}
                            title="Assign Technician"
                            style={{ padding: 6, borderRadius: 8, background: 'transparent', color: C.muted, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.08)'; e.currentTarget.style.color = '#60a5fa'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}
                          ><UserCheck size={13} /></button>
                          <button
                            onClick={() => openStatus(order)}
                            title="Update Status"
                            style={{ padding: 6, borderRadius: 8, background: 'transparent', color: C.muted, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.08)'; e.currentTarget.style.color = C.success; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}
                          ><RefreshCw size={13} /></button>
                          <button
                            onClick={() => setDeleteTarget(order)}
                            title="Delete"
                            style={{ padding: 6, borderRadius: 8, background: 'transparent', color: C.faint, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,90,90,0.08)'; e.currentTarget.style.color = C.error; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.faint; }}
                          ><Trash2 size={13} /></button>
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
            padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.03)',
          }}>
            <span style={{ fontSize: 11, color: C.faint }}>
              Page {pagination.page} of {pagination.total_pages} · {pagination.total_count} orders
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
              ><ChevronLeft size={14} /> Prev</button>
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
              >Next <ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Order Details Modal ──────────────────────────────── */}
      <AnimatePresence>
        {(detailsModal || detailsLoading) && (
          <ModalShell onClose={() => { setDetailsModal(null); setDetailsLoading(false); }} title={detailsModal ? `Order #${detailsModal.id}` : 'Loading...'} width={540}>
            {detailsLoading ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 28, height: 28, borderRadius: 99, margin: '0 auto', border: `3px solid ${C.high}`, borderTopColor: C.violet }}
                />
              </div>
            ) : detailsModal && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Status + Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <StatusBadge status={detailsModal.status} />
                  <span style={{ color: C.faint, fontSize: 11 }}>{formatDate(detailsModal.order_date)}</span>
                  <span style={{ color: C.text, fontSize: 16, fontWeight: 800, marginLeft: 'auto' }}>
                    ₹{formatPrice(detailsModal.total_amount)}
                  </span>
                </div>

                {/* Customer */}
                <div style={{ background: C.high, borderRadius: 16, padding: '14px 16px' }}>
                  <p style={{ color: C.faint, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Customer</p>
                  <p style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{detailsModal.customer.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Mail size={11} style={{ color: C.faint }} />
                    <span style={{ color: C.muted, fontSize: 11 }}>{detailsModal.customer.email}</span>
                  </div>
                  {detailsModal.customer.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Phone size={11} style={{ color: C.faint }} />
                      <span style={{ color: C.muted, fontSize: 11 }}>{detailsModal.customer.phone}</span>
                    </div>
                  )}
                </div>

                {/* Shipping */}
                {detailsModal.shipping_address && (
                  <div style={{ background: C.high, borderRadius: 16, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <MapPin size={12} style={{ color: C.violet }} />
                      <p style={{ color: C.faint, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Shipping Address</p>
                    </div>
                    <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.5 }}>{detailsModal.shipping_address}</p>
                  </div>
                )}

                {/* Payment Info */}
                <div style={{ background: C.high, borderRadius: 16, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <IndianRupee size={12} style={{ color: detailsModal.transaction_id && detailsModal.payment_status === 'SUCCESS' ? C.success : C.warning }} />
                      <p style={{ color: C.faint, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Payment Details</p>
                    </div>
                    {detailsModal.transaction_id && detailsModal.payment_status === 'SUCCESS' ? (
                      <div>
                        <p style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                          Transaction ID: <span style={{ color: C.cyan, fontFamily: 'monospace' }}>{detailsModal.transaction_id}</span>
                        </p>
                        {detailsModal.payment_date && (
                          <p style={{ color: C.faint, fontSize: 11 }}>Paid on: {formatDate(detailsModal.payment_date)}</p>
                        )}
                      </div>
                    ) : detailsModal.transaction_id && detailsModal.payment_status === 'PENDING' ? (
                      <p style={{ color: C.warning, fontSize: 12, fontWeight: 600 }}>Payment Pending (TXN: {detailsModal.transaction_id})</p>
                    ) : detailsModal.transaction_id && detailsModal.payment_status === 'FAILED' ? (
                      <p style={{ color: C.error, fontSize: 12, fontWeight: 600 }}>Payment Failed (TXN: {detailsModal.transaction_id})</p>
                    ) : (
                      <p style={{ color: C.error, fontSize: 12, fontWeight: 600 }}>Unpaid / Checkout Abandoned</p>
                    )}
                </div>

                {/* Items */}
                <div>
                  <p style={{ color: C.faint, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Items</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(detailsModal.items ?? []).map((item, idx) => (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 12, background: C.high,
                      }}>
                        <div>
                          <p style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{item.product_name}</p>
                          <p style={{ color: C.faint, fontSize: 10 }}>Qty: {item.quantity} × ₹{formatPrice(item.price)}</p>
                        </div>
                        <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>₹{formatPrice(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technician + Affiliate */}
                {detailsModal.technician && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Truck size={13} style={{ color: C.cyan }} />
                    <span style={{ color: C.muted, fontSize: 12 }}>Technician: <strong style={{ color: C.text }}>{detailsModal.technician}</strong></span>
                  </div>
                )}
                {detailsModal.affiliate_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: C.faint, fontSize: 11 }}>
                      Affiliate: {detailsModal.affiliate_name} ({detailsModal.affiliate_code})
                    </span>
                  </div>
                )}
              </div>
            )}
          </ModalShell>
        )}
      </AnimatePresence>

      {/* ── Assign Technician Modal ──────────────────────────── */}
      <AnimatePresence>
        {assignModal && (
          <ModalShell onClose={() => setAssignModal(null)} title={`Assign Tech — Order #${assignModal.id}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ color: C.muted, fontSize: 12 }}>Select a technician to assign to this order.</p>
              <select
                value={assignTechId}
                onChange={e => setAssignTechId(e.target.value)}
                style={{
                  padding: '10px 14px', borderRadius: 14,
                  background: C.high, color: C.text,
                  fontSize: 12, border: 'none', outline: 'none',
                }}
              >
                <option value="">-- Select Technician --</option>
                {technicians.map(t => (
                  <option key={t.id} value={String(t.id)}>{t.name}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setAssignModal(null)} style={{ padding: '9px 18px', borderRadius: 12, background: C.high, color: C.muted, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button
                  onClick={handleAssign}
                  disabled={!assignTechId || assignLoading}
                  style={{
                    padding: '9px 18px', borderRadius: 12,
                    background: 'linear-gradient(135deg, #8b5cff, #38bdf8)',
                    color: '#000', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                    opacity: !assignTechId ? 0.5 : 1,
                  }}
                >
                  {assignLoading ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* ── Update Status Modal ──────────────────────────────── */}
      <AnimatePresence>
        {statusModal && (
          <ModalShell onClose={() => setStatusModal(null)} title={`Update Status — Order #${statusModal.id}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: C.faint, fontSize: 11 }}>Current:</span>
                <StatusBadge status={statusModal.status} />
              </div>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                style={{
                  padding: '10px 14px', borderRadius: 14,
                  background: C.high, color: C.text,
                  fontSize: 12, border: 'none', outline: 'none',
                }}
              >
                {statusChoices.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setStatusModal(null)} style={{ padding: '9px 18px', borderRadius: 12, background: C.high, color: C.muted, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={statusLoading}
                  style={{
                    padding: '9px 18px', borderRadius: 12,
                    background: 'linear-gradient(135deg, #8b5cff, #38bdf8)',
                    color: '#000', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                  }}
                >
                  {statusLoading ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation ──────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <ModalShell onClose={() => setDeleteTarget(null)} title="Delete Order">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,90,90,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.error }}>
                <AlertTriangle size={22} />
              </div>
              <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Delete order <strong style={{ color: C.text }}>#{deleteTarget.id}</strong> from <strong style={{ color: C.text }}>{deleteTarget.customer.name}</strong>?
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '9px 18px', borderRadius: 12, background: C.high, color: C.muted, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ padding: '9px 18px', borderRadius: 12, background: 'rgba(255,90,90,0.15)', color: C.error, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Delete</button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}

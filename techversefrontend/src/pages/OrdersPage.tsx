// src/pages/OrdersPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { useSnackbar } from 'notistack';
import { RatingModal } from '../components/RatingModal';
import apiClient, { getImageUrl } from '../api';

// ── Design Tokens ─────────────────────────────────────────────────────
const NAVY   = '#1C2B4A';
const AMBER  = '#E09020';
const BG     = '#F8F7F4';
const WHITE  = '#FFFFFF';
const MUTED  = '#6B7280';
const BORDER = 'rgba(28,43,74,0.1)';

// ── Types ─────────────────────────────────────────────────────────────
interface Order {
  id: number;
  order_date: string;
  delivered_at?: string | null;
  delivery_duration?: string | null;
  status: string;
  total_amount: string;
  transaction_id?: string | null;
  payment_amount?: string | null;
  payment_date?: string | null;
  technician_name?: string | null;
  technician_phone?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address_details?: {
    street_address: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
  items: Array<{
    id: number;
    product_name: string;
    product_slug?: string;
    product_image?: string;
    quantity: number;
    price: string;
  }>;
  can_rate: boolean;
}

const isPaid = (o: Order) =>
  !!o.transaction_id || ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status.toUpperCase());

const PLACEHOLDER = 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=400&q=70';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

// ── Status config ─────────────────────────────────────────────────────
const statusCfg = (order: Order) => {
  const s = order.status.toUpperCase();
  const paid = isPaid(order);
  if (!paid || s === 'CANCELLED')
    return { label: 'Payment Cancelled', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444' };
  if (s === 'DELIVERED')
    return { label: 'Delivered', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', dot: '#10B981' };
  if (s === 'SHIPPED')
    return { label: 'Out for Delivery', color: AMBER, bg: '#FFFBEB', border: '#FDE68A', dot: AMBER };
  if (s === 'PROCESSING')
    return { label: 'Payment Confirmed', color: NAVY, bg: '#EFF6FF', border: '#BFDBFE', dot: NAVY };
  return { label: 'Processing', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', dot: '#9CA3AF' };
};

// ── Component ──────────────────────────────────────────────────────────
export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const { enqueueSnackbar } = useSnackbar();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ACTIVE');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [ratingModal, setRatingModal]   = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => { fetchOrders(); }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get('/api/orders/');
      setOrders(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch { enqueueSnackbar('Failed to load orders', { variant: 'error' }); }
    finally { setLoading(false); }
  };

  const toggleExpand = (id: number) => setExpanded(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const cancelOrder = async (id: number) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await apiClient.patch(`/api/orders/${id}/`, { status: 'CANCELLED' });
      enqueueSnackbar('Order cancelled successfully', { variant: 'success' });
      fetchOrders();
    } catch { enqueueSnackbar('Failed to cancel', { variant: 'error' }); }
  };

  const paid = orders.filter(isPaid);
  const unpaid = orders.filter(o => !isPaid(o));

  const filteredOrders = (() => {
    if (filter === 'ACTIVE')    return paid.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status.toUpperCase()));
    if (filter === 'DELIVERED') return paid.filter(o => o.status.toUpperCase() === 'DELIVERED');
    if (filter === 'CANCELLED') return unpaid;
    return paid; // ALL
  })();

  if (!isAuthenticated) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
      <p style={{ color: MUTED }}>Please log in to view your orders.</p>
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${BORDER}`, borderTopColor: NAVY, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ color: MUTED, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Loading orders…</span>
    </div>
  );

  // Removed here

  const FILTERS = [
    { key: 'ACTIVE',    label: 'Active',    count: paid.filter(o => !['DELIVERED','CANCELLED'].includes(o.status.toUpperCase())).length },
    { key: 'ALL',       label: 'All Paid',  count: paid.length },
    { key: 'DELIVERED', label: 'Delivered', count: paid.filter(o => o.status.toUpperCase() === 'DELIVERED').length },
    { key: 'CANCELLED', label: `Cancelled`, count: unpaid.length },
  ];

  // ════════════ MOBILE VIEW ════════════
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter', sans-serif", color: '#111827' }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          .filter-tab { transition: all 0.18s; cursor: pointer; }
          .filter-tab:hover { background: rgba(28,43,74,0.06) !important; }
          .filter-scroll-wrap { position: relative; margin-bottom: 20px; margin-right: -16px; }
          .filter-scroll { display: flex; overflow-x: auto; gap: 6px; padding: 0 0 10px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
          .filter-scroll::-webkit-scrollbar { display: none; }
          .filter-scroll-wrap::after { content: ''; position: absolute; right: 0; top: 0; bottom: 10px; width: 40px; background: linear-gradient(to right, transparent, #FAF9F5); pointer-events: none; }
        `}</style>
        
        <main style={{ width: '100%', padding: '80px 16px 80px' }}>
          
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-1px', color: NAVY, margin: '0 0 4px' }}>Order History</h1>
            <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Purchases, payments and delivery.</p>
          </div>

          {/* Stats Grid (Mobile 2 col) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            {[
              { label: 'Total Orders', value: paid.length },
              { label: 'Active', value: paid.filter(o => !['DELIVERED','CANCELLED'].includes(o.status.toUpperCase())).length },
            ].map(s => (
              <div key={s.label} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px', borderLeft: `3px solid ${NAVY}` }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>{s.label}</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: NAVY, margin: 0, letterSpacing: '-0.5px' }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filter tabs (Horizontal Scroll) */}
          <div className="filter-scroll-wrap">
            <div className="filter-scroll">
              {FILTERS.map(f => (
                <button
                  key={f.key} className="filter-tab" onClick={() => setFilter(f.key)}
                  style={{
                    padding: '7px 16px', borderRadius: 20, flexShrink: 0, scrollSnapAlign: 'start',
                    border: `1px solid ${filter === f.key ? NAVY : BORDER}`,
                    background: filter === f.key ? NAVY : WHITE,
                    color: filter === f.key ? '#fff' : MUTED,
                    fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.label}
                  {f.count > 0 && (
                    <span style={{ background: filter === f.key ? 'rgba(255,255,255,0.25)' : 'rgba(28,43,74,0.08)', color: filter === f.key ? '#fff' : NAVY, borderRadius: 99, padding: '0 6px', fontSize: 10, fontWeight: 800 }}>{f.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredOrders.length === 0 ? (
              <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ color: MUTED, fontSize: 13, marginBottom: 16 }}>No orders found.</p>
                <button onClick={() => navigate('/store')} style={{ padding: '8px 20px', background: NAVY, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12 }}>Browse Store</button>
              </div>
            ) : filteredOrders.map(order => {
              const cfg = statusCfg(order);
              const isPd = isPaid(order);
              const isOpen = expanded.has(order.id);
              const firstImg = getImageUrl(order.items?.[0]?.product_image) || PLACEHOLDER;

              return (
                <div key={order.id} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                       <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${BORDER}`, overflow: 'hidden', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={firstImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10%' }} onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                          </div>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 800, color: NAVY, display: 'block', marginBottom: 2 }}>Order #{order.id}</span>
                            <span style={{ fontSize: 11, color: MUTED }}>{fmtDate(order.order_date)}</span>
                          </div>
                       </div>
                       <span style={{ padding: '2px 8px', borderRadius: 999, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                         {cfg.label}
                       </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <p style={{ fontSize: 18, fontWeight: 900, color: '#111827', margin: 0 }}>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</p>
                      
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => toggleExpand(order.id)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#FAFAFA', color: '#111827', fontSize: 11, fontWeight: 600 }}>
                          {isOpen ? '▲ Hide' : '▼ Details'}
                        </button>
                        {!isPd && order.status === 'PENDING' && (
                          <button onClick={() => cancelOrder(order.id)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 11, fontWeight: 600 }}>Cancel</button>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Expanded Mobile Detail */}
                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${BORDER}`, background: '#FAFAFA', padding: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px' }}>
                          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: MUTED, margin: '0 0 4px' }}>🛒 Order Placed</p>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', margin: 0 }}>{fmtDateTime(order.order_date)}</p>
                        </div>
                        {order.delivered_at && (
                          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '12px' }}>
                            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#059669', margin: '0 0 4px' }}>📦 Delivered</p>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#059669', margin: 0 }}>{fmtDateTime(order.delivered_at)}</p>
                          </div>
                        )}
                        {order.transaction_id && (
                          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px' }}>
                            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: NAVY, margin: '0 0 4px' }}>💳 Transaction ID</p>
                            <p style={{ fontSize: 12, fontWeight: 700, color: NAVY, margin: 0 }}>{order.transaction_id}</p>
                          </div>
                        )}
                        {order.shipping_address_details && (
                          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px' }}>
                            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: MUTED, margin: '0 0 4px' }}>📍 Delivery Address</p>
                            <p style={{ fontSize: 11, color: '#111827', margin: 0 }}>{order.shipping_address_details.street_address}, {order.shipping_address_details.city}</p>
                          </div>
                        )}
                      </div>

                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: MUTED, margin: '0 0 8px' }}>Items</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {order.items.map(item => (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px', gap: 10 }}>
                             <div style={{ width: 32, height: 32, borderRadius: 6, background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                               <img src={getImageUrl(item.product_image) || PLACEHOLDER} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                             </div>
                             <div style={{ flex: 1 }}>
                               <span style={{ fontSize: 12, fontWeight: 600, color: NAVY, display: 'block' }}>{item.product_name}</span>
                               <span style={{ fontSize: 11, color: MUTED }}>Qty {item.quantity} × ₹{parseFloat(item.price).toLocaleString('en-IN')}</span>
                             </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
        
        <RatingModal open={ratingModal} onClose={() => { setRatingModal(false); setSelectedOrder(null); }} order={selectedOrder?.technician_name ? { id: selectedOrder.id, technician_name: selectedOrder.technician_name, technician_phone: selectedOrder.technician_phone ?? undefined } : undefined} onRatingSubmitted={() => { fetchOrders(); enqueueSnackbar('Rating submitted!', { variant: 'success' }); }} />
      </div>
    );
  }

  // ════════════ DESKTOP VIEW ════════════
  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter', sans-serif", color: '#111827' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .order-card { transition: box-shadow 0.2s; }
        .order-card:hover { box-shadow: 0 4px 24px rgba(28,43,74,0.1); }
        .filter-tab { transition: all 0.18s; }
        .filter-tab:hover { background: rgba(28,43,74,0.06) !important; }
      `}</style>

      <main style={{ width: '100%', padding: '120px 48px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1.5px', color: NAVY, margin: '0 0 6px' }}>
            Order History
          </h1>
          <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>
            View your purchases, payment details and delivery status.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total Orders',    value: paid.length },
            { label: 'Active',          value: paid.filter(o => !['DELIVERED','CANCELLED'].includes(o.status.toUpperCase())).length },
            { label: 'Total Spent',     value: `₹${paid.reduce((s, o) => s + parseFloat(o.total_amount || '0'), 0).toLocaleString('en-IN')}` },
          ].map(s => (
            <div key={s.label} style={{
              background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: '16px 20px', borderLeft: `4px solid ${NAVY}`,
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>{s.label}</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: NAVY, margin: 0, letterSpacing: '-1px' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              className="filter-tab"
              onClick={() => setFilter(f.key)}
              style={{
                padding: '7px 16px', borderRadius: 8,
                border: `1px solid ${filter === f.key ? NAVY : BORDER}`,
                background: filter === f.key ? NAVY : 'transparent',
                color: filter === f.key ? '#fff' : MUTED,
                fontWeight: 600, fontSize: 12, cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {f.label}
              {f.count > 0 && (
                <span style={{
                  background: filter === f.key ? 'rgba(255,255,255,0.25)' : 'rgba(28,43,74,0.08)',
                  color: filter === f.key ? '#fff' : NAVY,
                  borderRadius: 99, padding: '0 6px', fontSize: 10, fontWeight: 800,
                }}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredOrders.length === 0 ? (
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '56px 32px', textAlign: 'center' }}>
              <p style={{ color: MUTED, fontSize: 14, marginBottom: 20 }}>No orders in this category.</p>
              <button onClick={() => navigate('/store')} style={{
                padding: '10px 24px', background: NAVY, color: '#fff',
                border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13,
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}>Browse Store</button>
            </div>
          ) : filteredOrders.map(order => {
            const cfg = statusCfg(order);
            const paid = isPaid(order);
            const isOpen = expanded.has(order.id);
            const firstImg = getImageUrl(order.items?.[0]?.product_image) || PLACEHOLDER;

            return (
              <div key={order.id} className="order-card" style={{
                background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16,
                overflow: 'hidden', boxShadow: '0 1px 6px rgba(28,43,74,0.05)',
              }}>
                {/* ── Card header ── */}
                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>

                  {/* Thumbnail */}
                  <div style={{
                    width: 64, height: 64, borderRadius: 12, border: `1px solid ${BORDER}`,
                    overflow: 'hidden', flexShrink: 0, background: '#F9FAFB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <img
                      src={firstImg} alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8%' }}
                      onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                    />
                  </div>

                  {/* Order meta */}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: NAVY, letterSpacing: '-0.5px' }}>
                        Order #{order.id}
                      </span>
                      {/* Status badge */}
                      <span style={{
                        padding: '3px 10px', borderRadius: 999,
                        background: cfg.bg, border: `1px solid ${cfg.border}`,
                        color: cfg.color, fontSize: 10, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />
                        {cfg.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
                      Placed: {fmtDate(order.order_date)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                    
                    {/* Delivery summary inline so it's visible without expanding */}
                    {order.delivered_at && (
                      <p style={{ fontSize: 11, color: '#059669', margin: '4px 0 0', fontWeight: 600 }}>
                        ✓ Delivered {fmtDate(order.delivered_at)} 
                        {order.delivery_duration && ` (in ${order.delivery_duration})`}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>
                      ₹{parseFloat(order.total_amount).toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => toggleExpand(order.id)}
                      style={{
                        padding: '8px 16px', borderRadius: 8,
                        border: `1px solid ${BORDER}`, background: 'transparent',
                        color: '#111827', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {isOpen ? '▲ Hide' : '▼ Details'}
                    </button>
                    {!paid && order.status === 'PENDING' && (
                      <button onClick={() => cancelOrder(order.id)} style={{
                        padding: '8px 14px', borderRadius: 8, border: '1px solid #FECACA',
                        background: '#FEF2F2', color: '#DC2626',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                      }}>Cancel</button>
                    )}
                    {order.can_rate && (
                      <button onClick={() => { setSelectedOrder(order); setRatingModal(true); }} style={{
                        padding: '8px 14px', borderRadius: 8, border: '1px solid #FDE68A',
                        background: '#FFFBEB', color: AMBER,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                      }}>Rate</button>
                    )}
                  </div>
                </div>

                {/* ── Expanded detail panel ── */}
                {isOpen && (
                  <div style={{ borderTop: `1px solid ${BORDER}`, background: '#FAFAFA', padding: '0' }}>

                    {/* ── Timeline strip ── */}
                    <div style={{ padding: '20px 24px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>

                      {/* Order placed */}
                      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 16px' }}>
                        <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: MUTED, margin: '0 0 6px' }}>
                          🛒 Order Placed
                        </p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 2px', lineHeight: 1.3 }}>
                          {fmtDateTime(order.order_date)}
                        </p>
                      </div>

                      {/* Payment */}
                      {paid && (
                        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 16px' }}>
                          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: MUTED, margin: '0 0 6px' }}>
                            💳 Payment
                          </p>
                          {order.transaction_id ? (
                            <>
                              <p style={{ fontSize: 12, fontWeight: 700, color: '#059669', margin: '0 0 3px' }}>Paid ✓</p>
                              <code style={{
                                fontSize: 10, background: 'rgba(5,150,105,0.07)',
                                border: '1px solid rgba(5,150,105,0.15)',
                                borderRadius: 5, padding: '2px 7px', color: '#059669',
                                fontWeight: 700, display: 'block', wordBreak: 'break-all',
                              }}>{order.transaction_id}</code>
                              {order.payment_date && (
                                <p style={{ fontSize: 10, color: MUTED, margin: '4px 0 0' }}>{fmtDateTime(order.payment_date)}</p>
                              )}
                            </>
                          ) : (
                            <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>Confirmed</p>
                          )}
                        </div>
                      )}

                      {/* Delivery */}
                      {order.delivered_at ? (
                        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '14px 16px' }}>
                          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#059669', margin: '0 0 6px' }}>
                            📦 Delivered
                          </p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#059669', margin: '0 0 2px', lineHeight: 1.3 }}>
                            {fmtDateTime(order.delivered_at)}
                          </p>
                          {order.delivery_duration && (
                            <p style={{ fontSize: 10, color: '#059669', margin: '3px 0 0', fontWeight: 600 }}>
                              ⏱ Fulfilled in {order.delivery_duration}
                            </p>
                          )}
                        </div>
                      ) : paid && (
                        <div style={{ background: WHITE, border: `1px dashed ${BORDER}`, borderRadius: 10, padding: '14px 16px' }}>
                          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: MUTED, margin: '0 0 4px' }}>
                            📦 Delivery
                          </p>
                          <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>
                            {order.status === 'SHIPPED' ? 'Out for delivery' : 'Being prepared…'}
                          </p>
                        </div>
                      )}

                      {/* Technician */}
                      {order.technician_name && (
                        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 16px' }}>
                          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: MUTED, margin: '0 0 6px' }}>
                            🚚 Delivered By
                          </p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>
                            {order.technician_name}
                          </p>
                          {order.technician_phone && (
                            <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{order.technician_phone}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── Delivery address ── */}
                    {order.shipping_address_details && (
                      <div style={{ padding: '14px 24px 0' }}>
                        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 16px' }}>
                          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: MUTED, margin: '0 0 4px' }}>
                            📍 Delivery Address
                          </p>
                          <p style={{ fontSize: 13, color: '#111827', margin: 0, lineHeight: 1.6 }}>
                            {order.shipping_address_details.street_address}, {order.shipping_address_details.city},{' '}
                            {order.shipping_address_details.state} — {order.shipping_address_details.pincode}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── Items list ── */}
                    <div style={{ padding: '14px 24px 20px' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: MUTED, margin: '0 0 10px' }}>
                        Items
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {order.items.map(item => (
                          <div key={item.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10,
                            padding: '12px 16px', gap: 12,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: 8, overflow: 'hidden',
                                background: '#F9FAFB', border: `1px solid ${BORDER}`, flexShrink: 0,
                              }}>
                                <img src={getImageUrl(item.product_image) || PLACEHOLDER} alt=""
                                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                                />
                              </div>
                              {item.product_slug ? (
                                <Link to={`/product/${item.product_slug}`} style={{ textDecoration: 'none' }}>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{item.product_name}</span>
                                </Link>
                              ) : (
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.product_name}</span>
                              )}
                            </div>
                            <span style={{ fontSize: 12, color: MUTED, whiteSpace: 'nowrap', flexShrink: 0 }}>
                              Qty {item.quantity} × ₹{parseFloat(item.price).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <RatingModal
        open={ratingModal}
        onClose={() => { setRatingModal(false); setSelectedOrder(null); }}
        order={selectedOrder?.technician_name ? {
          id: selectedOrder.id,
          technician_name: selectedOrder.technician_name,
          technician_phone: selectedOrder.technician_phone ?? undefined,
        } : undefined}
        onRatingSubmitted={() => { fetchOrders(); enqueueSnackbar('Rating submitted!', { variant: 'success' }); }}
      />
    </div>
  );
};
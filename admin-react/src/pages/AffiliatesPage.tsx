import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Handshake,
  Eye,
  MousePointerClick,
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
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
interface Affiliate {
  id: number;
  name: string;
  code: string;
  commission_rate: number;
  total_clicks: number;
  total_sales: number;
  revenue_generated: number;
  is_active: boolean;
  created_at: string;
}

interface AffiliatesResponse {
  affiliates: Affiliate[];
  total_pages: number;
  current_page: number;
  total_count: number;
}

/* ── Component ──────────────────────────────────────────────────────── */
export const pageTitle = 'Affiliates';

export default function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    adminApi.getAffiliates()
      .then(res => {
        const data: AffiliatesResponse = res.data;
        setAffiliates(data.affiliates ?? data as unknown as Affiliate[]);
        setTotalPages(data.total_pages ?? 1);
        setCurrentPage(data.current_page ?? 1);
        setTotalCount(data.total_count ?? (data.affiliates ?? []).length);
      })
      .catch(() => setAffiliates([]))
      .finally(() => setLoading(false));
  }, [currentPage]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-IN', { timeZone: import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true, day: '2-digit', month: 'short', year: 'numeric' });
  };

  /* Aggregated stats */
  const totalClicks = affiliates.reduce((s, a) => s + (a.total_clicks ?? 0), 0);
  const totalSales = affiliates.reduce((s, a) => s + (a.total_sales ?? 0), 0);
  const totalRevenue = affiliates.reduce((s, a) => s + (a.revenue_generated ?? 0), 0);
  const activeCount = affiliates.filter(a => a.is_active).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 36, height: 36, borderRadius: 99, border: `3px solid ${C.elevated}`, borderTopColor: C.violet }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total Clicks', value: totalClicks.toLocaleString('en-IN'), icon: <MousePointerClick size={16} />, color: C.cyan },
          { label: 'Total Sales', value: totalSales.toLocaleString('en-IN'), icon: <ShoppingBag size={16} />, color: C.violet },
          { label: 'Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: <IndianRupee size={16} />, color: C.success },
          { label: 'Active', value: `${activeCount}/${affiliates.length}`, icon: <TrendingUp size={16} />, color: C.warning },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            style={{ background: C.surface, backdropFilter: 'blur(20px) saturate(1.5)', WebkitBackdropFilter: 'blur(20px) saturate(1.5)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 24, padding: '18px 20px', position: 'relative', overflow: 'hidden', cursor: 'default' }}
          >
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: `radial-gradient(circle, ${s.color}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: C.faint, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                {s.icon}
              </div>
            </div>
            <p style={{ color: C.text, fontSize: 22, fontWeight: 800, lineHeight: 1, margin: 0 }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: C.faint, fontSize: 11, fontWeight: 600 }}>{totalCount} affiliates</span>
        <Link to="/affiliates/create" style={{ textDecoration: 'none' }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 14,
              background: 'linear-gradient(135deg, #8b5cff, #38bdf8)',
              color: '#000', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Create Affiliate
          </motion.button>
        </Link>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ background: C.surface, backdropFilter: 'blur(20px) saturate(1.5)', WebkitBackdropFilter: 'blur(20px) saturate(1.5)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 24, overflow: 'hidden' }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Affiliate', 'Code', 'Commission', 'Clicks', 'Sales', 'Revenue', 'Status', 'Created', ''].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {affiliates.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '60px 0', textAlign: 'center' }}>
                  <Handshake size={40} style={{ color: C.faint, marginBottom: 8 }} />
                  <p style={{ color: C.muted, fontSize: 13 }}>No affiliates found</p>
                </td></tr>
              ) : (
                affiliates.map((aff, i) => (
                  <motion.tr
                    key={aff.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    style={{ borderTop: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{aff.name}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(139,92,255,0.08)', color: C.violet, fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
                        {aff.code}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: C.cyan, fontSize: 13, fontWeight: 700 }}>{aff.commission_rate}%</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{(aff.total_clicks ?? 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{(aff.total_sales ?? 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>
                        <span style={{ color: C.success, fontSize: 11 }}>₹</span>
                        {(aff.revenue_generated ?? 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: aff.is_active ? 'rgba(74,222,128,0.1)' : 'rgba(255,90,90,0.1)',
                        color: aff.is_active ? C.success : C.error,
                        padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: 99, background: aff.is_active ? C.success : C.error }} />
                        {aff.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: C.muted }}>{formatDate(aff.created_at)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <Link to={`/affiliates/${aff.id}`} style={{ textDecoration: 'none' }}>
                        <button
                          title="View"
                          style={{ padding: 6, borderRadius: 8, background: 'transparent', color: C.muted, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,255,0.08)'; e.currentTarget.style.color = C.violet; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}
                        ><Eye size={14} /></button>
                      </Link>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ fontSize: 11, color: C.faint }}>Page {currentPage} of {totalPages}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
                style={{ padding: '6px 10px', borderRadius: 10, background: currentPage > 1 ? C.elevated : 'transparent', color: currentPage > 1 ? C.muted : C.faint, border: 'none', cursor: currentPage > 1 ? 'pointer' : 'not-allowed', opacity: currentPage > 1 ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}
              ><ChevronLeft size={14} /> Prev</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                style={{ padding: '6px 10px', borderRadius: 10, background: currentPage < totalPages ? C.elevated : 'transparent', color: currentPage < totalPages ? C.muted : C.faint, border: 'none', cursor: currentPage < totalPages ? 'pointer' : 'not-allowed', opacity: currentPage < totalPages ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}
              >Next <ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

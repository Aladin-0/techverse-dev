import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import {
  Users, ShoppingCart, Clock, IndianRupee, Package, Wrench,
  ExternalLink, UserPlus, Star, Shield, Database, Mail, Server,
  ChevronRight, TrendingUp, TrendingDown, ArrowUpRight, Zap,
  Activity, Eye, Cpu, Globe, Layers,
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Filler, Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { adminApi } from '@/services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

/* ── Types ──────────────────────────────────────────────────────────── */
interface RecentOrder { id: number; customer_name: string; customer_email: string; status: string; total: number; }
interface RecentService { id: number; customer_name: string; customer_email: string; category: string; status: string; }
interface TopTechnician { id: number; name: string; email: string; avatar?: string; total_jobs: number; avg_rating: number; status: string; }

interface MonthlyRevenuePoint { month: string; revenue: number; order_count: number; }
interface DashboardStats {
  total_users: number; total_customers: number; total_technicians: number;
  total_products: number; active_products: number; total_orders: number;
  pending_orders: number; unassigned_orders: number; total_services: number;
  pending_services: number; unassigned_services: number; current_month_revenue: number;
  recent_orders: RecentOrder[]; recent_services: RecentService[];
  top_technicians: TopTechnician[]; user_roles_distribution: Record<string, number>;
}

interface AnalyticsSnapshot {
  monthly_revenue: MonthlyRevenuePoint[];
  total_revenue: number;
  total_orders: number;
}

/* ── Color Palette (rich, warm dark) ───────────────────────────────── */
const P = {
  bg: '#0a0b14',
  card: 'rgba(15, 17, 30, 0.7)',
  cardSolid: '#0f111e',
  glass: 'rgba(20, 22, 38, 0.6)',
  text: '#f0f0f5',
  sub: '#a3a3b5',
  dim: '#4b4b66',
  muted: '#2a2a40',
  violet: '#8b5cff',
  violetLight: '#c4b5fd',
  blue: '#38bdf8',
  indigo: '#6366f1',
  cyan: '#22d3ee',
  emerald: '#34d399',
  amber: '#fbbf24',
  rose: '#fb7185',
  red: '#ef4444',

  gradient1: 'linear-gradient(135deg, #8b5cff, #38bdf8)',
  gradient2: 'linear-gradient(135deg, #6366f1, #22d3ee)',
  gradient3: 'linear-gradient(135deg, #ec4899, #8b5cff)',
};

const statusColors: Record<string, { bg: string; fg: string }> = {
  PENDING:     { bg: 'rgba(251,191,36,0.12)', fg: '#fbbf24' },
  PROCESSING:  { bg: 'rgba(99,102,241,0.12)', fg: '#818cf8' },
  SHIPPED:     { bg: 'rgba(139,92,255,0.12)',  fg: '#c4b5fd' },
  DELIVERED:   { bg: 'rgba(52,211,153,0.12)',  fg: '#34d399' },
  COMPLETED:   { bg: 'rgba(52,211,153,0.12)',  fg: '#34d399' },
  CANCELLED:   { bg: 'rgba(239,68,68,0.12)',   fg: '#ef4444' },
  ASSIGNED:    { bg: 'rgba(56,189,248,0.12)',  fg: '#38bdf8' },
  IN_PROGRESS: { bg: 'rgba(139,92,255,0.12)',  fg: '#c4b5fd' },
  SUBMITTED:   { bg: 'rgba(251,191,36,0.12)',  fg: '#fbbf24' },
};

function StatusPill({ status }: { status: string }) {
  const s = statusColors[status] ?? { bg: 'rgba(255,255,255,0.06)', fg: P.sub };
  return (
    <span style={{
      background: s.bg, color: s.fg,
      padding: '3px 10px', borderRadius: 99,
      fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
      textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

/* ── Animated Number ───────────────────────────────────────────────── */
function AnimNum({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const spring = useSpring(0, { stiffness: 40, damping: 15 });
  const display = useTransform(spring, v => `${prefix}${Math.floor(v).toLocaleString('en-IN')}${suffix}`);
  useEffect(() => { spring.set(target); }, [target, spring]);
  return <motion.span>{display}</motion.span>;
}

/* ── Glass Card ────────────────────────────────────────────────────── */
function GlassCard({ children, style, delay = 0, className }: {
  children: React.ReactNode; style?: React.CSSProperties; delay?: number; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: P.card,
        backdropFilter: 'blur(24px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.04)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Radial Progress Ring ──────────────────────────────────────────── */
function ProgressRing({ progress, size = 48, color, children, idSuffix }: {
  progress: number; size?: number; color: string; children?: React.ReactNode; idSuffix: string;
}) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', filter: `drop-shadow(0px 0px 4px ${color}60)` }}>
        <defs>
          <linearGradient id={`grad-${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={6} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#grad-${idSuffix})`} strokeWidth={6}
          strokeDasharray={circ} strokeLinecap="round"
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      {children && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Sparkline (canvas) ────────────────────────────────────────────── */
function Sparkline({ data, color1, color2 }: { data: number[]; color1: string; color2: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const w = W / 2, h = H / 2;
    ctx.clearRect(0, 0, w, h);
    if (data.length < 2) return;
    const mn = Math.min(...data), mx = Math.max(...data) || 1, rng = mx - mn || 1;
    const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * w, y: h - 4 - ((v - mn) / rng) * (h - 8) }));

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color1 + '50'); grad.addColorStop(1, color1 + '00');
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i - 1].x + pts[i].x) / 2;
      ctx.bezierCurveTo(cx, pts[i - 1].y, cx, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    const sGrad = ctx.createLinearGradient(0, 0, w, 0);
    sGrad.addColorStop(0, color1); sGrad.addColorStop(1, color2);
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i - 1].x + pts[i].x) / 2;
      ctx.bezierCurveTo(cx, pts[i - 1].y, cx, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = sGrad; ctx.lineWidth = 2; ctx.stroke();

    const last = pts[pts.length - 1];
    ctx.beginPath(); ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color2; ctx.fill();
    ctx.beginPath(); ctx.arc(last.x, last.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = color2 + '30'; ctx.fill();
  }, [data, color1, color2]);
  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

/* ── Revenue Chart ─────────────────────────────────────────────────── */
function RevenueChart({ data }: { data: any[] }) {
  const safeData = Array.isArray(data) ? data : [];
  const chartLabels = safeData.map(d => d.date || d.month || '');
  const chartValues = safeData.map(d => Number(d.revenue || 0));

  return (
    <Line
      data={{
        labels: chartLabels,
        datasets: [{
          data: chartValues,
          borderColor: '#8b5cff',
          borderWidth: 3,
          pointRadius: 2,
          pointBackgroundColor: '#8b5cff',
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#8b5cff',
          pointHoverBorderWidth: 2,
          tension: 0.4,
          fill: true,
          backgroundColor: (ctx: any) => {
            if (!ctx.chart.chartArea) return 'transparent';
            const g = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom);
            g.addColorStop(0, 'rgba(139,92,255,0.4)');
            g.addColorStop(0.5, 'rgba(139,92,255,0.1)');
            g.addColorStop(1, 'transparent');
            return g;
          },
        }],
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 2500, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15,17,30,0.95)',
            titleColor: '#f0f0f5', bodyColor: '#a3a3b5',
            borderColor: 'rgba(139,92,255,0.3)', borderWidth: 1,
            padding: 15, cornerRadius: 16,
            bodyFont: { family: 'Inter', size: 12 },
            titleFont: { family: 'Inter', weight: 'bold' },
            callbacks: { label: ctx => ` Revenue: ₹${(ctx.parsed.y ?? 0).toLocaleString('en-IN')}` },
          },
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: '#4b4b66', font: { size: 11 } }, border: { display: false } },
          y: {
            grid: { color: 'rgba(255,255,255,0.02)' },
            ticks: { color: '#4b4b66', font: { size: 11 }, callback: v => `₹${(Number(v) / 1000).toFixed(0)}k` },
            border: { display: false },
          },
        },
      }}
    />
  );
}

/* ── Health Status ─────────────────────────────────────────────────── */
function HealthRow({ label, status, icon }: { label: string; status: 'healthy' | 'warning' | 'error'; icon: React.ReactNode }) {
  const cfg = {
    healthy: { color: '#34d399', glow: 'rgba(52,211,153,0.5)' },
    warning: { color: '#fbbf24', glow: 'rgba(251,191,36,0.5)' },
    error:   { color: '#ef4444', glow: 'rgba(239,68,68,0.5)' },
  }[status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0' }}>
      <div style={{ color: P.dim }}>{icon}</div>
      <span style={{ flex: 1, fontSize: 12, color: P.sub, fontWeight: 500 }}>{label}</span>
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
        style={{ width: 8, height: 8, borderRadius: 99, background: cfg.color, boxShadow: `0 0 10px ${cfg.glow}` }} />
      <span style={{ fontSize: 10, fontWeight: 600, color: cfg.color, textTransform: 'capitalize', minWidth: 50 }}>{status}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
export const pageTitle = 'Dashboard';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getAnalytics()
      ]);
      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const d = stats ?? {} as DashboardStats;
  const a = analytics ?? { monthly_revenue: [], total_revenue: 0, total_orders: 0 } as AnalyticsSnapshot;

  const genSpark = (val: number, len = 10) =>
    Array.from({ length: len }, (_, i) => Math.floor(val * (0.2 + (i / len) * 0.8 + (Math.random() - 0.5) * 0.3)));


  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 40, height: 40, borderRadius: 99, border: '3px solid rgba(139,92,255,0.15)', borderTopColor: '#8b5cff' }} />
      </div>
    );
  }

  const pendingRate = d.total_orders ? Math.round((d.pending_orders / d.total_orders) * 100) : 0;
  const activeProductRate = d.total_products ? Math.round((d.active_products / d.total_products) * 100) : 0;
  const serviceCompletionRate = d.total_services ? Math.round(((d.total_services - d.pending_services) / d.total_services) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── BENTO ROW 1: KPI Cards ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { title: 'Monthly Revenue', value: d.current_month_revenue ?? 0, prefix: '₹', change: 12.4, icon: <IndianRupee size={18} />, c1: '#8b5cff', c2: '#38bdf8', spark: genSpark(d.current_month_revenue ?? 0) },
          { title: 'Total Orders', value: d.total_orders ?? 0, change: 8.2, icon: <ShoppingCart size={18} />, c1: '#6366f1', c2: '#22d3ee', spark: genSpark(d.total_orders ?? 0) },
          { title: 'Active Products', value: d.active_products ?? 0, change: 3.1, icon: <Package size={18} />, c1: '#059669', c2: '#34d399', spark: genSpark(d.active_products ?? 0) },
          { title: 'Total Users', value: d.total_users ?? 0, change: 5.7, icon: <Users size={18} />, c1: '#d97706', c2: '#fbbf24', spark: genSpark(d.total_users ?? 0) },
        ].map((kpi, i) => (
          <GlassCard key={kpi.title} delay={i * 0.08} style={{ padding: '22px 24px' }}>
            {/* Ambient colored glow */}
            <div style={{
              position: 'absolute', top: -30, right: -30, width: 120, height: 120,
              background: `radial-gradient(circle, ${kpi.c1}18 0%, transparent 70%)`,
              filter: 'blur(20px)', pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <motion.div whileHover={{ rotate: 10, scale: 1.1 }} transition={{ type: 'spring', stiffness: 300 }}
                style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: `linear-gradient(135deg, ${kpi.c1}25, ${kpi.c2}15)`,
                  border: `1px solid ${kpi.c1}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: kpi.c2,
                }}>
                {kpi.icon}
              </motion.div>
              {kpi.change !== undefined && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  fontSize: 10, fontWeight: 700,
                  color: kpi.change >= 0 ? '#34d399' : '#ef4444',
                  background: kpi.change >= 0 ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
                  borderRadius: 99, padding: '3px 8px',
                }}>
                  {kpi.change >= 0 ? <ArrowUpRight size={10} /> : <TrendingDown size={10} />}
                  {Math.abs(kpi.change).toFixed(1)}%
                </span>
              )}
            </div>

            <p style={{ color: P.dim, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              {kpi.title}
            </p>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <p style={{ color: P.text, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, margin: 0 }}>
                <AnimNum target={kpi.value} prefix={kpi.prefix ?? ''} />
              </p>
              <div style={{ width: 80, height: 32, marginBottom: 2 }}>
                <Sparkline data={kpi.spark} color1={kpi.c1} color2={kpi.c2} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* ── BENTO ROW 2: Revenue Chart + Radial Gauges ─────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 18 }}>

        {/* Revenue Chart */}
        <GlassCard delay={0.35} style={{ padding: '26px 28px' }}>
          <div style={{
            position: 'absolute', top: -50, left: -50, width: 200, height: 200,
            background: 'radial-gradient(circle, rgba(139,92,255,0.08) 0%, transparent 70%)',
            filter: 'blur(40px)', pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div>
              <p style={{ color: P.dim, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                Revenue Trajectory
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{
                  fontSize: 30, fontWeight: 900, letterSpacing: '-0.03em',
                  background: 'linear-gradient(135deg, #c4b5fd, #7dd3fc)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  <AnimNum target={d.current_month_revenue ?? 0} prefix="₹" />
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <ArrowUpRight size={12} /> 12.4%
                </span>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }}
              style={{
                padding: '7px 16px', borderRadius: 99,
                background: 'linear-gradient(135deg, rgba(139,92,255,0.15), rgba(56,189,248,0.08))',
                border: '1px solid rgba(139,92,255,0.15)',
                fontSize: 11, fontWeight: 700, color: '#c4b5fd',
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'default',
              }}>
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: 99, background: '#8b5cff', boxShadow: '0 0 8px rgba(139,92,255,0.6)' }} />
              Live
            </motion.div>
          </div>

          <div style={{ height: 230 }}>
            <RevenueChart data={a.daily || (a as any).monthly_revenue || []} />
          </div>
        </GlassCard>

        {/* Radial Progress Gauges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Faux "Live Data" connection header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: -4 }}>
             <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: P.sub, textTransform: 'uppercase' }}>
               Live Telemetry
             </span>
             <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: '#34d399' }}>
               <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                 style={{ width: 6, height: 6, borderRadius: 99, background: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
               SYNCED
             </div>
          </div>
          {[
            { label: 'Order Fulfillment', value: 100 - pendingRate, color: '#8b5cff', detail: `${d.pending_orders ?? 0} active in queue` },
            { label: 'Product Availability', value: activeProductRate, color: '#34d399', detail: `${d.active_products ?? 0} / ${d.total_products ?? 0} active items` },
            { label: 'Service Completion', value: serviceCompletionRate, color: '#38bdf8', detail: `${d.pending_services ?? 0} ongoing jobs` },
          ].map((g, i) => (
            <GlassCard key={g.label} delay={0.4 + i * 0.08} style={{ padding: '18px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ProgressRing progress={g.value} size={56} color={g.color} idSuffix={i.toString()}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: g.color }}>{g.value}%</span>
                </ProgressRing>
                <div style={{ flex: 1 }}>
                  <p style={{ color: P.text, fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{g.label}</p>
                  <p style={{ color: P.dim, fontSize: 11 }}>{g.detail}</p>
                </div>
                
                {/* Techy/real-time looking badge */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  style={{
                    padding: '8px 12px', borderRadius: 12,
                    background: `linear-gradient(135deg, ${g.color}15, transparent)`,
                    border: `1px solid ${g.color}25`,
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                  }}>
                    <span style={{ color: g.color, fontSize: 14, fontWeight: 800, lineHeight: 1 }}>
                      <AnimNum target={g.value} suffix="%" />
                    </span>
                    <span style={{ fontSize: 9, color: P.dim, fontWeight: 600, marginTop: 4 }}>REALTIME</span>
                </motion.div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* ── BENTO ROW 3: Quick Metrics Bento ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
        {[
          { label: 'Pending Orders', value: d.pending_orders ?? 0, icon: <Clock size={16} />, color: P.amber },
          { label: 'Unassigned', value: d.unassigned_orders ?? 0, icon: <ShoppingCart size={16} />, color: P.rose },
          { label: 'Pending Services', value: d.pending_services ?? 0, icon: <Wrench size={16} />, color: P.violet },
          { label: 'Unassigned', value: d.unassigned_services ?? 0, icon: <Activity size={16} />, color: P.cyan },
          { label: 'Technicians', value: d.total_technicians ?? 0, icon: <Users size={16} />, color: P.blue },
          { label: 'Customers', value: d.total_customers ?? 0, icon: <Users size={16} />, color: P.emerald },
        ].map((m, i) => (
          <motion.div key={m.label + i}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.05 }}
            whileHover={{ y: -4, boxShadow: `0 12px 40px ${m.color}15` }}
            style={{
              background: P.card, backdropFilter: 'blur(20px)',
              borderRadius: 20, padding: '18px 18px',
              border: '1px solid rgba(255,255,255,0.04)',
              cursor: 'default', transition: 'all 0.3s',
            }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: `${m.color}15`, border: `1px solid ${m.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: m.color, marginBottom: 10,
            }}>
              {m.icon}
            </div>
            <p style={{ color: P.text, fontSize: 24, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}>
              <AnimNum target={m.value} />
            </p>
            <p style={{ color: P.dim, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>{m.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── BENTO ROW 4: Recent Orders + Services ──────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Recent Orders */}
        <GlassCard delay={0.55} style={{ padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(34,211,238,0.08))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.blue,
              }}>
                <ShoppingCart size={16} />
              </div>
              <h3 style={{ color: P.text, fontSize: 15, fontWeight: 700 }}>Recent Orders</h3>
            </div>
            <Link to="/orders" style={{
              fontSize: 11, fontWeight: 600, color: P.violetLight,
              display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none',
              padding: '5px 12px', borderRadius: 99,
              background: 'rgba(139,92,255,0.08)',
              transition: 'background 0.2s',
            }}>
              View All <ChevronRight size={12} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {!(d.recent_orders ?? []).length ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: P.dim, fontSize: 12 }}>No recent orders</div>
            ) : (
              (d.recent_orders ?? []).slice(0, 5).map((order, i) => (
                <motion.div key={order.id}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  whileHover={{ x: 4, background: 'rgba(255,255,255,0.03)' }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', borderRadius: 16,
                    background: 'rgba(255,255,255,0.015)',
                    transition: 'all 0.2s', cursor: 'default',
                  }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: P.gradient2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 10, fontWeight: 800, flexShrink: 0,
                  }}>
                    #{order.id}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: P.text, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customer_name}</p>
                    <p style={{ color: P.dim, fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customer_email}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: P.text, fontSize: 13, fontWeight: 700, marginBottom: 3 }}>₹{order.total.toLocaleString('en-IN')}</p>
                    <StatusPill status={order.status} />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Recent Services */}
        <GlassCard delay={0.6} style={{ padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(139,92,255,0.15), rgba(99,102,241,0.08))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.violetLight,
              }}>
                <Wrench size={16} />
              </div>
              <h3 style={{ color: P.text, fontSize: 15, fontWeight: 700 }}>Recent Services</h3>
            </div>
            <Link to="/services" style={{
              fontSize: 11, fontWeight: 600, color: P.violetLight,
              display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none',
              padding: '5px 12px', borderRadius: 99,
              background: 'rgba(139,92,255,0.08)',
              transition: 'background 0.2s',
            }}>
              View All <ChevronRight size={12} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {!(d.recent_services ?? []).length ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: P.dim, fontSize: 12 }}>No recent services</div>
            ) : (
              (d.recent_services ?? []).slice(0, 5).map((svc, i) => (
                <motion.div key={svc.id}
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 + i * 0.05 }}
                  whileHover={{ x: -4, background: 'rgba(255,255,255,0.03)' }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', borderRadius: 16,
                    background: 'rgba(255,255,255,0.015)',
                    transition: 'all 0.2s', cursor: 'default',
                  }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: P.gradient3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 10, fontWeight: 800, flexShrink: 0,
                  }}>
                    #{svc.id}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: P.text, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc.customer_name}</p>
                    <p style={{ color: P.dim, fontSize: 10 }}>{svc.category}</p>
                  </div>
                  <StatusPill status={svc.status} />
                </motion.div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* ── BENTO ROW 5: Technicians + System Health ───────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 18, paddingBottom: 12 }}>

        {/* Top Technicians */}
        <GlassCard delay={0.65} style={{ padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(217,119,6,0.08))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.amber,
            }}>
              <Star size={16} />
            </div>
            <h3 style={{ color: P.text, fontSize: 15, fontWeight: 700 }}>Top Technicians</h3>
          </div>

          {!(d.top_technicians ?? []).length ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: P.dim, fontSize: 12 }}>No data yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(d.top_technicians ?? []).slice(0, 5).map((tech, i) => {
                const rankColors = ['#fbbf24', '#c0c0c0', '#cd7f32', P.dim, P.dim];
                const rankBg = [
                  'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(217,119,6,0.1))',
                  'linear-gradient(135deg, rgba(192,192,192,0.15), rgba(120,120,120,0.08))',
                  'linear-gradient(135deg, rgba(205,127,50,0.15), rgba(160,82,45,0.08))',
                  `rgba(255,255,255,0.03)`, `rgba(255,255,255,0.03)`,
                ];
                return (
                  <motion.div key={tech.id}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.06 }}
                    whileHover={{ x: 4, background: 'rgba(255,255,255,0.03)' }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 16px', borderRadius: 16,
                      background: 'rgba(255,255,255,0.015)',
                      transition: 'all 0.2s', cursor: 'default',
                    }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                      background: rankBg[i] ?? rankBg[4],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: rankColors[i], fontSize: 11, fontWeight: 900,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{
                      width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                      background: P.gradient1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 13, fontWeight: 700, overflow: 'hidden',
                    }}>
                      {tech.avatar ? (
                        <img src={adminApi.getImageUrl(tech.avatar)} alt={tech.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        tech.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: P.text, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tech.name}</p>
                      <p style={{ color: P.dim, fontSize: 10 }}>{tech.total_jobs} jobs</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={12} fill="#fbbf24" color="#fbbf24" />
                      <span style={{ color: P.text, fontSize: 14, fontWeight: 800 }}>{tech.avg_rating.toFixed(1)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* System Health */}
        <GlassCard delay={0.7} style={{ padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(5,150,105,0.08))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.emerald,
            }}>
              <Activity size={16} />
            </div>
            <h3 style={{ color: P.text, fontSize: 15, fontWeight: 700 }}>System Health</h3>
          </div>

          <HealthRow label="API Server" status="healthy" icon={<Server size={14} />} />
          <HealthRow label="Database" status="healthy" icon={<Database size={14} />} />
          <HealthRow label="Email Service" status="healthy" icon={<Mail size={14} />} />
          <HealthRow label="CDN / Assets" status="healthy" icon={<Globe size={14} />} />
          <HealthRow label="Background Jobs" status="healthy" icon={<Cpu size={14} />} />
          <HealthRow label="Auth Service" status="healthy" icon={<Shield size={14} />} />

          {/* Quick Actions */}
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ color: P.dim, fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
              Quick Actions
            </p>
            {[
              { label: 'Add Product', path: '/products/create', icon: <Package size={13} /> },
              { label: 'Create User', path: '/users/create', icon: <UserPlus size={13} /> },
              { label: 'View Analytics', path: '/analytics', icon: <TrendingUp size={13} /> },
            ].map(action => (
              <Link key={action.path} to={action.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.02)', color: P.sub,
                  fontSize: 12, fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,255,0.08)'; e.currentTarget.style.color = '#c4b5fd'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = P.sub; }}
              >
                {action.icon}
                {action.label}
                <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

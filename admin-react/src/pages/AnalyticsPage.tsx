import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import {
  IndianRupee,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Users,
  Printer,
  RefreshCw,
  Filter,
  Package,
  ArrowUpRight,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Activity,
  Zap,
  MapPin,
  BarChart2,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { adminApi } from '@/services/api';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Filler, Tooltip, Legend,
);

// ── Types ──────────────────────────────────────────────────────────────

interface MonthlyRevenue  { month: string; revenue: number; }
interface DailyMetric     { date: string; count: number; }
interface TopProduct      { id: number; name: string; image?: string; quantity_sold: number; revenue: number; }
interface OrderStatusItem { status: string; count: number; percentage: number; }
interface CityData        { city: string; state: string; count: number; }
interface ActivityItem    { id: number; type: 'order'|'user'|'service'|'product'; title: string; description: string; time: string; }

interface AnalyticsData {
  total_revenue: number; revenue_growth: number;
  total_orders: number; orders_growth: number;
  avg_order_value: number; avg_order_growth: number;
  total_customers: number; customers_growth: number;
  monthly_revenue: MonthlyRevenue[];
  daily_orders: DailyMetric[];
  daily_services: DailyMetric[];
  top_products: TopProduct[];
  order_status_distribution: OrderStatusItem[];
  top_cities: CityData[];
  recent_activities: ActivityItem[];
}

// ── Design tokens ──────────────────────────────────────────────────────
const C = {
  bg: '#0a0b14',
  surface: '#0f111e',
  elevated: '#141624',
  high: '#1c1f30',
  violet: '#8b5cff',
  violetDim: '#6d28d9',
  cyan: '#38bdf8',
  cyanDim: '#40b8d4',
  text: '#f0f0f5',
  muted: '#a3a3b5',
  faint: '#4b4b66',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#ef4444',
};

const statusCfg: Record<string, {color: string; icon: React.ReactNode}> = {
  PENDING:    { color: '#fbbf24', icon: <Clock size={12} /> },
  PROCESSING: { color: '#60a5fa', icon: <Activity size={12} /> },
  SHIPPED:    { color: '#8b5cff', icon: <Truck size={12} /> },
  DELIVERED:  { color: '#4ade80', icon: <CheckCircle size={12} /> },
  CANCELLED:  { color: '#ff5a5a', icon: <XCircle size={12} /> },
};

const activityIconMap: Record<string, React.ReactNode> = {
  order:   <ShoppingCart size={15} />,
  user:    <Users size={15} />,
  service: <Activity size={15} />,
  product: <Package size={15} />,
};

// ── Animated Number ────────────────────────────────────────────────────
function AnimatedNum({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const spring = useSpring(0, { stiffness: 55, damping: 18 });
  const display = useTransform(spring, (v) => `${prefix}${Math.floor(v).toLocaleString('en-IN')}${suffix}`);
  useEffect(() => { spring.set(target); }, [target, spring]);
  return <motion.span>{display}</motion.span>;
}

// ── KPI Card ───────────────────────────────────────────────────────────
interface KpiProps {
  title: string; value: string; growth: number;
  icon: React.ReactNode; accent: string; accentGlow: string; index: number;
}

function KpiCard({ title, value, growth, icon, accent, accentGlow, index }: KpiProps) {
  const [hov, setHov] = useState(false);
  const isUp = growth >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      style={{
        background: hov
          ? `radial-gradient(ellipse at top left, ${accentGlow}18 0%, ${C.surface} 70%)`
          : C.surface,
        borderRadius: 22, padding: '20px 22px',
        transition: 'background 0.4s', cursor: 'default',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 100, height: 100,
        background: `radial-gradient(circle, ${accentGlow}20 0%, transparent 70%)`,
        transform: 'translate(25%, -25%)', pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: accentGlow + '22',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent,
        }}>
          {icon}
        </div>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
          color: isUp ? C.success : C.error,
          background: isUp ? 'rgba(74,222,128,0.1)' : 'rgba(255,90,90,0.1)',
          borderRadius: 99, padding: '3px 9px',
        }}>
          {isUp ? <ArrowUpRight size={11} /> : <TrendingDown size={11} />}
          {Math.abs(growth).toFixed(1)}%
        </span>
      </div>

      <p style={{ color: C.muted, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
        {title}
      </p>
      <p style={{ color: C.text, fontSize: 24, fontWeight: 800, letterSpacing: '-0.01em' }}>{value}</p>
    </motion.div>
  );
}

interface MonthlyRevenue  { month: string; revenue: number; order_count: number; }

// ── Hero Trajectory Chart ──────────────────────────────────────────────
function TrajectoryChart({ data }: { data: MonthlyRevenue[] }) {
  const displayData = data;

  const labels = displayData.map(d => d.month);
  const values = displayData.map(d => d.revenue);
  const orders = displayData.map(d => d.order_count);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Revenue',
        data: values,
        borderColor: C.violet,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: C.violet,
        tension: 0.45,
        fill: true,
        backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea: { top: number; bottom: number } } }) => {
          if (!ctx.chart.chartArea) return 'transparent';
          const gradient = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom);
          gradient.addColorStop(0, 'rgba(139,92,255,0.30)');
          gradient.addColorStop(0.5, 'rgba(139,92,255,0.10)');
          gradient.addColorStop(1, 'rgba(139,92,255,0)');
          return gradient;
        },
      },
      {
        label: 'Orders',
        data: orders,
        borderColor: C.cyan,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.45,
        yAxisID: 'y1',
        fill: true,
        backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea: { top: number; bottom: number } } }) => {
          if (!ctx.chart.chartArea) return 'transparent';
          const gradient = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom);
          gradient.addColorStop(0, 'rgba(140,231,255,0.15)');
          gradient.addColorStop(1, 'rgba(140,231,255,0)');
          return gradient;
        },
        borderDash: [4, 4],
      },
    ],
  };

  const options: import('chart.js').ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 2000, easing: 'easeInOutQuart' },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: C.elevated,
        titleColor: C.text,
        bodyColor: C.muted,
        borderColor: 'rgba(139,92,255,0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          label: (ctx) => `  ₹${(ctx.parsed.y ?? 0).toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: C.faint, font: { size: 11, family: 'Inter' } },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: {
          color: C.faint,
          font: { size: 11, family: 'Inter' },
          callback: (v) => `₹${Number(v).toLocaleString('en-IN')}`,
        },
        border: { display: false },
      },
      y1: {
        position: 'right',
        grid: { display: false },
        ticks: {
          color: C.cyan,
          font: { size: 11, family: 'Inter' },
        },
        border: { display: false },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}

// ── Orders Bar Chart ───────────────────────────────────────────────────
function OrdersBarChart({ data }: { data: DailyMetric[] }) {
  const last30 = data.slice(-30);
  const labels = last30.map(d => d.date.slice(5));
  const values = last30.map(d => d.count);

  const chartData = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: (ctx: { dataIndex: number }) => {
        const ratio = ctx.dataIndex / (labels.length - 1);
        return `rgba(${Math.round(172 - ratio * 50)},138,255,0.7)`;
      },
      borderRadius: 6,
      borderSkipped: false,
      hoverBackgroundColor: C.violet,
    }],
  };

  const options: import('chart.js').ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1800, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: C.elevated,
        titleColor: C.text,
        bodyColor: C.muted,
        borderColor: 'rgba(139,92,255,0.2)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: C.faint, font: { size: 10 }, maxRotation: 0, maxTicksLimit: 8 }, border: { display: false } },
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: C.faint, font: { size: 11 } }, border: { display: false } },
    },
  };

  return <Bar data={chartData} options={options} />;
}

// ── Services Area Chart ────────────────────────────────────────────────
function ServicesChart({ data }: { data: DailyMetric[] }) {
  const last30 = data.slice(-30);
  const labels = last30.map(d => d.date.slice(5));
  const values = last30.map(d => d.count);

  const chartData = {
    labels,
    datasets: [{
      data: values,
      borderColor: C.cyan,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.5,
      fill: true,
      backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea: { top: number; bottom: number } } }) => {
        if (!ctx.chart.chartArea) return 'transparent';
        const g = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom);
        g.addColorStop(0, 'rgba(140,231,255,0.25)');
        g.addColorStop(1, 'rgba(140,231,255,0)');
        return g;
      },
    }],
  };

  const options: import('chart.js').ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1800, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: C.elevated,
        titleColor: C.text,
        bodyColor: C.muted,
        borderColor: 'rgba(140,231,255,0.2)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: C.faint, font: { size: 10 }, maxTicksLimit: 8 }, border: { display: false } },
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: C.faint, font: { size: 11 } }, border: { display: false } },
    },
  };

  return <Line data={chartData} options={options} />;
}

// ── Donut Chart ────────────────────────────────────────────────────────
function StatusDonut({ data }: { data: OrderStatusItem[] }) {
  const colorMap: Record<string, string> = {
    PENDING: '#fbbf24', PROCESSING: '#60a5fa', SHIPPED: '#8b5cff',
    DELIVERED: '#4ade80', CANCELLED: '#ff5a5a',
  };

  const chartData = {
    labels: data.map(d => d.status),
    datasets: [{
      data: data.map(d => d.count),
      backgroundColor: data.map(d => colorMap[d.status] || C.faint),
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const options: import('chart.js').ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1500 },
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: C.elevated,
        titleColor: C.text,
        bodyColor: C.muted,
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
      },
    },
  };

  return (
    <div style={{ position: 'relative', height: 180 }}>
      <Doughnut data={chartData} options={options} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <p style={{ color: C.text, fontSize: 22, fontWeight: 800, lineHeight: 1 }}>
          {data.reduce((a, d) => a + d.count, 0)}
        </p>
        <p style={{ color: C.faint, fontSize: 11, marginTop: 2 }}>Total</p>
      </div>
    </div>
  );
}

// ── Date range options ─────────────────────────────────────────────────
const DATE_RANGES = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Last Year'];

// ── Main Analytics ─────────────────────────────────────────────────────
export const pageTitle = 'Analytics';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('Last 30 Days');
  const [dropOpen, setDropOpen] = useState(false);
  const [anim, setAnim] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const rangeMap: Record<string, number> = {
      'Last 7 Days': 7,
      'Last 30 Days': 30,
      'Last 90 Days': 90,
      'Last Year': 365,
    };
    const days = rangeMap[range] || 30;

    adminApi.getAnalytics(days)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => { load(); }, [load]);


  const doRefresh = () => {
    setAnim(true);
    load();
    setTimeout(() => setAnim(false), 700);
  };

  const d = data ?? ({} as AnalyticsData);

  const kpis: Omit<KpiProps, 'index'>[] = [
    {
      title: 'Total Revenue',
      value: `₹${(d.total_revenue ?? 0).toLocaleString('en-IN')}`,
      growth: d.revenue_growth ?? 13.5,
      icon: <IndianRupee size={17} />,
      accent: C.violet,
      accentGlow: '#7c5cbf',
    },
    {
      title: 'Total Orders',
      value: (d.total_orders ?? 0).toLocaleString('en-IN'),
      growth: d.orders_growth ?? 8.4,
      icon: <ShoppingCart size={17} />,
      accent: '#4ade80',
      accentGlow: '#22c55e',
    },
    {
      title: 'Avg Order Value',
      value: `₹${(d.avg_order_value ?? 0).toLocaleString('en-IN')}`,
      growth: d.avg_order_growth ?? 2.1,
      icon: <TrendingUp size={17} />,
      accent: C.cyan,
      accentGlow: '#40b8d4',
    },
    {
      title: 'Total Customers',
      value: (d.total_customers ?? 0).toLocaleString('en-IN'),
      growth: d.customers_growth ?? 5.0,
      icon: <Users size={17} />,
      accent: '#f59e0b',
      accentGlow: '#d97706',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: C.surface, borderRadius: 18, padding: '12px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDropOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: C.elevated, color: C.muted,
                border: 'none', borderRadius: 12, padding: '8px 14px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Filter size={13} /> {range}
            </button>
            {dropOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                style={{
                  position: 'absolute', top: '110%', left: 0, zIndex: 50,
                  background: C.elevated, borderRadius: 14, padding: 6,
                  minWidth: 160, boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {DATE_RANGES.map(r => (
                  <button
                    key={r}
                    onClick={() => { setRange(r); setDropOpen(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '8px 14px', borderRadius: 10, cursor: 'pointer', border: 'none',
                      fontWeight: r === range ? 700 : 500, fontSize: 12,
                      color: r === range ? C.violet : C.muted,
                      background: r === range ? 'rgba(139,92,255,0.12)' : 'transparent',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.92 }}
            style={{
              background: 'linear-gradient(135deg, #8b5cff, #38bdf8)',
              color: '#000', border: 'none', borderRadius: 12,
              padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Zap size={12} /> Apply Filter
          </motion.button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: C.elevated, color: C.muted, border: 'none',
              borderRadius: 12, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Printer size={13} /> Print
          </button>
          <motion.button
            animate={{ rotate: anim ? 360 : 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            onClick={doRefresh}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: C.elevated, color: C.muted, border: 'none',
              borderRadius: 12, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} /> Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.title} {...kpi} index={i} />
        ))}
      </div>

      {/* Hero Trajectory Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{ background: C.surface, borderRadius: 24, padding: '24px 26px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 3 }}>
              Financial Trajectory
            </h2>
            <p style={{ color: C.faint, fontSize: 12 }}>Revenue &amp; Profit momentum over time</p>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 3, borderRadius: 99, background: C.violet }} />
              <span style={{ color: C.faint, fontSize: 11 }}>Revenue</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 3, borderRadius: 99, background: C.cyan, opacity: 0.7 }} />
              <span style={{ color: C.faint, fontSize: 11 }}>Orders</span>
            </div>
          </div>
        </div>
        <div style={{ height: 260 }}>
          {loading
            ? <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.faint }}>Loading chart…</div>
            : <TrajectoryChart data={d.monthly_revenue ?? []} />
          }
        </div>
      </motion.div>

      {/* Orders Trend + Services Trend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{ background: C.surface, borderRadius: 24, padding: '22px 24px' }}
        >
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Orders Trend</h2>
            <p style={{ color: C.faint, fontSize: 11 }}>Last 30 days • Daily order volume</p>
          </div>
          <div style={{ height: 180 }}>
            {loading ? null : <OrdersBarChart data={d.daily_orders ?? []} />}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.5 }}
          style={{ background: C.surface, borderRadius: 24, padding: '22px 24px' }}
        >
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Service Requests</h2>
            <p style={{ color: C.faint, fontSize: 11 }}>Last 30 days • Daily service flow</p>
          </div>
          <div style={{ height: 180 }}>
            {loading ? null : <ServicesChart data={d.daily_services ?? []} />}
          </div>
        </motion.div>
      </div>

      {/* Top Products + Order Status Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          style={{ background: C.surface, borderRadius: 24, padding: '22px 24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700 }}>Top Products</h2>
            <span style={{ color: C.violet, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <BarChart2 size={12} /> By Revenue
            </span>
          </div>

          {(d.top_products ?? []).length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120, color: C.faint }}>
              <Package size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p style={{ fontSize: 12 }}>No product data available</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(d.top_products ?? []).map((prod, pi) => {
                const maxRev = Math.max(...(d.top_products ?? []).map(p => p.revenue));
                const pct = (prod.revenue / maxRev) * 100;
                return (
                  <motion.div
                    key={prod.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + pi * 0.07 }}
                    whileHover={{ x: 4 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: C.elevated, borderRadius: 14, padding: '12px 16px',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `linear-gradient(135deg, rgba(139,92,255,${0.3 - pi * 0.05}), rgba(140,231,255,${0.2 - pi * 0.03}))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: C.violet, fontWeight: 800, fontSize: 14, flexShrink: 0,
                    }}>
                      {pi + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prod.name}
                      </p>
                      <div style={{ height: 4, borderRadius: 99, background: C.high, overflow: 'hidden' }}>
                        <motion.div
                          style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${C.violetDim}, ${C.violet})` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.7 + pi * 0.07, duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ color: C.violet, fontSize: 13, fontWeight: 700 }}>₹{prod.revenue.toLocaleString('en-IN')}</p>
                      <p style={{ color: C.faint, fontSize: 11 }}>{prod.quantity_sold} sold</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Order Status Donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          style={{ background: C.surface, borderRadius: 24, padding: '22px 24px' }}
        >
          <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Order Status</h2>

          {(d.order_status_distribution ?? []).length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: C.faint }}>
              <ShoppingCart size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p style={{ fontSize: 12 }}>No order data</p>
            </div>
          ) : (
            <>
              <StatusDonut data={d.order_status_distribution ?? []} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                {(d.order_status_distribution ?? []).map((item) => {
                  const cfg = statusCfg[item.status] ?? { color: C.faint, icon: null };
                  return (
                    <div key={item.status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: cfg.color }}>
                        {cfg.icon}
                        <span style={{ color: C.muted, fontSize: 12 }}>{item.status}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{item.count}</span>
                        <span style={{ color: C.faint, fontSize: 11 }}>{item.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Top Cities + Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingBottom: 8 }}>

        {/* Top Cities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          style={{ background: C.surface, borderRadius: 24, padding: '22px 24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <MapPin size={15} color={C.cyan} />
            <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700 }}>Top Cities</h2>
          </div>

          {(d.top_cities ?? []).length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 100, color: C.faint }}>
              <MapPin size={28} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p style={{ fontSize: 12 }}>No city data available</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(d.top_cities ?? []).map((city, ci) => {
                const maxCount = Math.max(...(d.top_cities ?? []).map(c => c.count));
                const pct = (city.count / maxCount) * 100;
                return (
                  <motion.div
                    key={ci}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + ci * 0.06 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ color: C.muted, fontSize: 12, fontWeight: 500 }}>
                        {city.city}, {city.state}
                      </span>
                      <span style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{city.count}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 99, background: C.elevated, overflow: 'hidden' }}>
                      <motion.div
                        style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${C.cyanDim}, ${C.cyan})` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.75 + ci * 0.06, duration: 0.9, ease: 'easeOut' }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          style={{ background: C.surface, borderRadius: 24, padding: '22px 24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Activity size={15} color={C.violet} />
            <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700 }}>Recent Activity</h2>
          </div>

          {(d.recent_activities ?? []).length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 100, color: C.faint }}>
              <Activity size={28} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p style={{ fontSize: 12 }}>No recent activity</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(d.recent_activities ?? []).map((act, ai) => {
                const typeColors: Record<string, string> = {
                  order: '#60a5fa', user: '#4ade80', service: C.violet, product: C.warning,
                };
                const color = typeColors[act.type] || C.violet;
                return (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.75 + ai * 0.05 }}
                    style={{
                      display: 'flex', gap: 12, padding: '10px 12px',
                      borderRadius: 12, background: C.elevated,
                    }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                      background: color + '20',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color,
                    }}>
                      {activityIconMap[act.type]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: C.text, fontSize: 12, fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {act.title}
                      </p>
                      <p style={{ color: C.faint, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {act.description}
                      </p>
                    </div>
                    <span style={{ color: C.faint, fontSize: 10, flexShrink: 0, paddingTop: 2, whiteSpace: 'nowrap' }}>
                      {act.time}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

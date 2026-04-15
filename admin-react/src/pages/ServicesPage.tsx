import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  UserX,
  Settings,
  CheckCircle,
  Search,
  X,
  Eye,
  UserPlus,
  RefreshCw,
  Wrench,
  MapPin,
  Calendar,
  FileText,
  User,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
} from 'lucide-react';
import { adminApi } from '@/services/api';
import { useToast } from '@/components/ui/Toast';

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

  gradient: 'linear-gradient(135deg, #8b5cff, #38bdf8)',
};

const sColors: Record<string, { bg: string; fg: string }> = {
  SUBMITTED:   { bg: 'rgba(251,191,36,0.12)',  fg: '#fbbf24' },
  CONFIRMED:   { bg: 'rgba(96,165,250,0.12)',  fg: '#60a5fa' },
  ASSIGNED:    { bg: 'rgba(139,92,255,0.12)', fg: '#8b5cff' },
  IN_PROGRESS: { bg: 'rgba(96,165,250,0.12)',  fg: '#60a5fa' },
  COMPLETED:   { bg: 'rgba(74,222,128,0.12)',  fg: '#4ade80' },
  CANCELLED:   { bg: 'rgba(255,90,90,0.12)',   fg: '#ff5a5a' },
};

const aColors: Record<string, { bg: string; fg: string }> = {
  PENDING:  { bg: 'rgba(251,191,36,0.12)', fg: '#fbbf24' },
  APPROVED: { bg: 'rgba(74,222,128,0.12)', fg: '#4ade80' },
  DECLINED: { bg: 'rgba(255,90,90,0.12)',  fg: '#ff5a5a' },
};

/* ── Types ──────────────────────────────────────────────────────────── */
interface ServiceLocation { street_address: string; city: string; state: string; pincode: string; }
interface ServiceIssue { description: string; price: string; }
interface JobSheet { id: number; approval_status: string; }

interface ServiceItem {
  id: number;
  customer?: { name: string; email: string; phone: string };
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_avatar?: string;
  service_category?: { name: string };
  category_name?: string;
  issue?: { description: string; price: string };
  issue_description?: string;
  issue_price?: string;
  custom_description: string;
  status: string;
  technician?: { name: string } | null;
  technician_id?: number | null;
  technician_name?: string | null;
  technician_avatar?: string;
  job_sheet: JobSheet | null;
  location: ServiceLocation | null;
  request_date: string;
  transaction_id: string | null;
  payment_date: string | null;
  payment_status?: string | null;
}

interface ServiceDetail {
  id: number;
  customer: { name: string; email: string; phone: string };
  service_category: { name: string };
  issue: ServiceIssue | null;
  custom_description: string;
  service_location: ServiceLocation;
  request_date: string;
  status: string;
  technician: { name: string } | null;
  transaction_id?: string | null;
  payment_date?: string | null;
  payment_status?: string | null;
  total_amount?: string | null;
}

interface Technician { id: number; name: string; }
interface ServiceCategory { id: number; name: string; }

interface ServicesData {
  services: ServiceItem[];
  technicians: Technician[];
  service_categories: ServiceCategory[];
  status_choices: [string, string][];
  submitted_count: number;
  unassigned_count: number;
  in_progress_count: number;
  completed_count: number;
  total_pages: number;
  current_page: number;
}

/* ── Helpers ────────────────────────────────────────────────────────── */
function formatDate(dateStr: string): string {
  try { return new Date(dateStr).toLocaleString('en-IN', { timeZone: import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }); } catch { return dateStr; }
}

function avatarInitials(name?: string) {
  if (!name) return '??';
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
}

function StatusBadge({ status }: { status: string }) {
  const s = sColors[status] ?? { bg: 'rgba(255,255,255,0.07)', fg: C.muted };
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
        animation: (status === 'IN_PROGRESS' || status === 'SUBMITTED') ? 'aethericPulse 2s infinite' : 'none',
      }} />
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function ApprovalBadge({ status }: { status: string }) {
  const s = aColors[status] ?? { bg: 'rgba(255,255,255,0.07)', fg: C.muted };
  return (
    <span style={{
      background: s.bg, color: s.fg,
      padding: '3px 8px', borderRadius: 99,
      fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
    }}>
      {status}
    </span>
  );
}

/* ── Modal Shell ───────────────────────────────────────────────────── */
function ModalShell({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
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
          padding: 28, width: '100%', maxWidth: 480,
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

/* ── Component ──────────────────────────────────────────────────────── */
export const pageTitle = 'Services';

export default function ServicesPage() {
  const toast = useToast();

  const [data, setData] = useState<ServicesData | null>(null);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showUnpaid, setShowUnpaid] = useState(false);

  const [detailModal, setDetailModal] = useState<{ open: boolean; service: ServiceDetail | null; loading: boolean }>({ open: false, service: null, loading: false });
  const [assignModal, setAssignModal] = useState<{ open: boolean; serviceId: number; customerName: string }>({ open: false, serviceId: 0, customerName: '' });
  const [statusModal, setStatusModal] = useState<{ open: boolean; serviceId: number; currentStatus: string }>({ open: false, serviceId: 0, currentStatus: '' });
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ── Fetch ──────────────────────────────────────────────────────── */
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (search) params.search = search;
      params.payment = showUnpaid ? 'UNPAID' : 'SUCCESS';
      const res = await adminApi.getServices(params as never);
      setData(res.data);
    } catch {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, technicianFilter, search, page, showUnpaid, toast]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  /* ── Handlers ──────────────────────────────────────────────────── */
  const handleViewDetail = async (serviceId: number) => {
    setDetailModal({ open: true, service: null, loading: true });
    try {
      const res = await adminApi.getServiceDetail(serviceId);
      setDetailModal({ open: true, service: res.data.success ? res.data.service : res.data, loading: false });
    } catch {
      toast.error('Failed to load service details');
      setDetailModal({ open: false, service: null, loading: false });
    }
  };

  const handleOpenAssign = (serviceId: number, customerName: string) => {
    setSelectedTechnician('');
    setAssignModal({ open: true, serviceId, customerName });
  };

  const handleAssign = async () => {
    if (!selectedTechnician) return;
    setSubmitting(true);
    try {
      await adminApi.assignServiceTechnician(assignModal.serviceId, Number(selectedTechnician));
      toast.success('Technician assigned successfully');
      setAssignModal({ open: false, serviceId: 0, customerName: '' });
      fetchServices();
    } catch { toast.error('Failed to assign technician'); }
    finally { setSubmitting(false); }
  };

  const handleOpenStatusUpdate = (serviceId: number, currentStatus: string) => {
    setSelectedStatus('');
    setStatusModal({ open: true, serviceId, currentStatus });
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus) return;
    setSubmitting(true);
    try {
      await adminApi.updateServiceStatus(statusModal.serviceId, selectedStatus);
      toast.success('Status updated successfully');
      setStatusModal({ open: false, serviceId: 0, currentStatus: '' });
      fetchServices();
    } catch { toast.error('Failed to update status'); }
    finally { setSubmitting(false); }
  };

  /* ── Data ───────────────────────────────────────────────────────── */
  const services = data?.services ?? [];
  const technicians = data?.technicians ?? [];
  const categories = data?.service_categories ?? [];
  const statusChoices = data?.status_choices ?? [
    ['SUBMITTED', 'Submitted'], ['CONFIRMED', 'Confirmed'], ['ASSIGNED', 'Assigned'],
    ['IN_PROGRESS', 'In Progress'], ['COMPLETED', 'Completed'], ['CANCELLED', 'Cancelled'],
  ];

  if (loading && !data) {
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

      {/* ── Stat Cards ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Submitted', value: data?.submitted_count ?? 0, icon: <ClipboardList size={16} />, color: C.warning },
          { label: 'Unassigned', value: data?.unassigned_count ?? 0, icon: <UserX size={16} />, color: C.error },
          { label: 'In Progress', value: data?.in_progress_count ?? 0, icon: <Settings size={16} />, color: '#60a5fa' },
          { label: 'Completed', value: data?.completed_count ?? 0, icon: <CheckCircle size={16} />, color: C.success },
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
              position: 'absolute', top: -20, right: -20, width: 80, height: 80,
              background: `radial-gradient(circle, ${stat.color}12 0%, transparent 70%)`, pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: C.faint, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {stat.label}
              </span>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: stat.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <p style={{ color: C.text, fontSize: 28, fontWeight: 800, lineHeight: 1, margin: 0 }}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <motion.div
          animate={{ width: searchFocused ? 280 : 200 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{ position: 'relative' }}
        >
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: searchFocused ? C.violet : C.faint, transition: 'color 0.2s' }} />
          <input
            placeholder="Search services…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              width: '100%', padding: '9px 14px 9px 34px', borderRadius: 14,
              background: searchFocused ? C.elevated : C.surface, color: C.text, fontSize: 12, fontWeight: 500,
              border: 'none', outline: 'none',
              boxShadow: searchFocused ? '0 0 0 1px rgba(139,92,255,0.3)' : 'none', transition: 'all 0.3s',
            }}
          />
        </motion.div>

        {[
          { value: statusFilter, set: (v: string) => { setStatusFilter(v); setPage(1); }, opts: statusChoices.map(([val, label]) => ({ value: val, label })), placeholder: 'Status' },
          { value: categoryFilter, set: (v: string) => { setCategoryFilter(v); setPage(1); }, opts: categories.map(c => ({ value: String(c.id), label: c.name })), placeholder: 'Category' },
          { value: technicianFilter, set: (v: string) => { setTechnicianFilter(v); setPage(1); }, opts: [{ value: 'unassigned', label: 'Unassigned' }, ...technicians.map(t => ({ value: String(t.id), label: t.name }))], placeholder: 'Technician' },
        ].map(filter => (
          <select
            key={filter.placeholder}
            value={filter.value}
            onChange={e => filter.set(e.target.value)}
            style={{
              padding: '9px 14px', borderRadius: 14,
              background: C.surface, color: filter.value ? C.text : C.muted,
              fontSize: 12, fontWeight: 500, border: 'none', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">All {filter.placeholder}s</option>
            {filter.opts.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ))}

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginLeft: 'auto' }}>
          <input
            type="checkbox"
            checked={showUnpaid}
            onChange={e => { setShowUnpaid(e.target.checked); setPage(1); }}
            style={{ width: 14, height: 14, accentColor: C.violet, cursor: 'pointer' }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>Show Unpaid/Pending</span>
        </label>
      </div>

      {/* ── Services Table ─────────────────────────────────────── */}
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
                {['ID', 'Customer', 'Category / Issue', 'Status', 'Technician', 'Job Sheet', 'Payment TXN', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '60px 0', textAlign: 'center' }}>
                  <Wrench size={40} style={{ color: C.faint, marginBottom: 8 }} />
                  <p style={{ color: C.muted, fontSize: 13 }}>No service requests found</p>
                </td></tr>
              ) : (
                services.map((svc, i) => (
                  <motion.tr
                    key={svc.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    style={{ borderTop: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: 8, background: 'rgba(139,92,255,0.08)', color: C.violet, fontSize: 11, fontWeight: 800 }}>
                        #{svc.id}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 9,
                          background: 'linear-gradient(135deg, #6d28d940, #0ea5e930)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: C.text, fontSize: 10, fontWeight: 800, flexShrink: 0,
                        }}>
                          {avatarInitials(svc.customer_name || svc.customer?.name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ color: C.text, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
                            {svc.customer_name || svc.customer?.name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{svc.category_name || svc.service_category?.name || 'General'}</span>
                        <p style={{ fontSize: 10, color: C.faint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150, marginTop: 1 }}>
                          {svc.issue_description || svc.issue?.description || svc.custom_description || '-'}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <StatusBadge status={svc.status} />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {(svc.technician_name || svc.technician?.name) ? (
                        <span style={{ fontSize: 11, color: C.muted }}>{svc.technician_name || svc.technician?.name}</span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 600, color: C.error, opacity: 0.7 }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {svc.job_sheet ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FileText size={11} style={{ color: C.faint }} />
                          <ApprovalBadge status={svc.job_sheet.approval_status} />
                        </div>
                      ) : (
                        <span style={{ fontSize: 10, color: C.faint }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {svc.transaction_id && svc.payment_status === 'SUCCESS' ? (
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: C.success, letterSpacing: '0.04em' }}>{svc.transaction_id}</span>
                          <p style={{ fontSize: 9, color: C.faint, margin: '2px 0 0 0' }}>{formatDate(svc.payment_date || '')}</p>
                        </div>
                      ) : svc.transaction_id && svc.payment_status === 'PENDING' ? (
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: C.warning, letterSpacing: '0.04em' }}>PENDING</span>
                          <p style={{ fontSize: 9, color: C.faint, margin: '2px 0 0 0' }}>{svc.transaction_id}</p>
                        </div>
                      ) : svc.transaction_id && svc.payment_status === 'FAILED' ? (
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: C.error, opacity: 0.8, letterSpacing: '0.04em' }}>FAILED</span>
                          <p style={{ fontSize: 9, color: C.faint, margin: '2px 0 0 0' }}>{svc.transaction_id}</p>
                        </div>
                      ) : (
                        <span style={{ fontSize: 10, color: C.error, opacity: 0.7 }}>Unpaid</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: C.muted }}>
                      {formatDate(svc.request_date)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <button onClick={() => handleViewDetail(svc.id)} title="View Details"
                          style={{ padding: 6, borderRadius: 8, background: 'transparent', color: C.muted, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,255,0.08)'; e.currentTarget.style.color = C.violet; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}
                        ><Eye size={13} /></button>
                        <button onClick={() => handleOpenAssign(svc.id, svc.customer_name || svc.customer?.name || 'Customer')} title="Assign"
                          style={{ padding: 6, borderRadius: 8, background: 'transparent', color: C.muted, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.08)'; e.currentTarget.style.color = '#60a5fa'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}
                        ><UserPlus size={13} /></button>
                        <button onClick={() => handleOpenStatusUpdate(svc.id, svc.status)} title="Update Status"
                          style={{ padding: 6, borderRadius: 8, background: 'transparent', color: C.muted, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.08)'; e.currentTarget.style.color = C.success; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}
                        ><RefreshCw size={13} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(data?.total_pages ?? 1) > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.03)',
          }}>
            <span style={{ fontSize: 11, color: C.faint }}>
              Page {data?.current_page ?? 1} of {data?.total_pages ?? 1}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ padding: '6px 10px', borderRadius: 10, background: page > 1 ? C.elevated : 'transparent', color: page > 1 ? C.muted : C.faint, border: 'none', cursor: page > 1 ? 'pointer' : 'not-allowed', opacity: page > 1 ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}
              ><ChevronLeft size={14} /> Prev</button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= (data?.total_pages ?? 1)}
                style={{ padding: '6px 10px', borderRadius: 10, background: page < (data?.total_pages ?? 1) ? C.elevated : 'transparent', color: page < (data?.total_pages ?? 1) ? C.muted : C.faint, border: 'none', cursor: page < (data?.total_pages ?? 1) ? 'pointer' : 'not-allowed', opacity: page < (data?.total_pages ?? 1) ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}
              >Next <ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Detail Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {detailModal.open && (
          <ModalShell onClose={() => setDetailModal({ open: false, service: null, loading: false })} title={detailModal.service ? `Service #${detailModal.service.id}` : 'Loading...'}>
            {detailModal.loading ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 28, height: 28, borderRadius: 99, margin: '0 auto', border: `3px solid ${C.high}`, borderTopColor: C.violet }} />
              </div>
            ) : detailModal.service && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <StatusBadge status={detailModal.service.status} />
                  <span style={{ color: C.faint, fontSize: 11 }}>{formatDate(detailModal.service.request_date)}</span>
                </div>

                {/* Customer */}
                <div style={{ background: C.high, borderRadius: 16, padding: '14px 16px' }}>
                  <p style={{ color: C.faint, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Customer</p>
                  <p style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{detailModal.service.customer.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Mail size={11} style={{ color: C.faint }} />
                    <span style={{ color: C.muted, fontSize: 11 }}>{detailModal.service.customer.email}</span>
                  </div>
                  {detailModal.service.customer.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Phone size={11} style={{ color: C.faint }} />
                      <span style={{ color: C.muted, fontSize: 11 }}>{detailModal.service.customer.phone}</span>
                    </div>
                  )}
                </div>

                {/* Category & Issue */}
                <div style={{ background: C.high, borderRadius: 16, padding: '14px 16px' }}>
                  <p style={{ color: C.faint, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Service Details</p>
                  <p style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{detailModal.service.service_category.name}</p>
                  {detailModal.service.issue && (
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: C.muted, fontSize: 12 }}>{detailModal.service.issue.description}</span>
                      <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>₹{Number(detailModal.service.issue.price).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {detailModal.service.custom_description && (
                    <p style={{ color: C.muted, fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>{detailModal.service.custom_description}</p>
                  )}
                </div>

                {/* Location */}
                {detailModal.service.service_location && (
                  <div style={{ background: C.high, borderRadius: 16, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <MapPin size={12} style={{ color: C.violet }} />
                      <p style={{ color: C.faint, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Location</p>
                    </div>
                    <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.5 }}>
                      {detailModal.service.service_location.street_address}, {detailModal.service.service_location.city}, {detailModal.service.service_location.state} - {detailModal.service.service_location.pincode}
                    </p>
                  </div>
                )}

                {/* Payment Info */}
                <div style={{ background: C.high, borderRadius: 16, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <IndianRupee size={12} style={{ color: detailModal.service.transaction_id && detailModal.service.payment_status === 'SUCCESS' ? C.success : C.warning }} />
                      <p style={{ color: C.faint, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Payment Details</p>
                    </div>
                    {detailModal.service.transaction_id && detailModal.service.payment_status === 'SUCCESS' ? (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <p style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>
                            Transaction ID: <span style={{ color: C.cyan, fontFamily: 'monospace' }}>{detailModal.service.transaction_id}</span>
                          </p>
                          <span style={{ color: C.success, fontSize: 13, fontWeight: 700 }}>₹{Number(detailModal.service.total_amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        {detailModal.service.payment_date && (
                          <p style={{ color: C.faint, fontSize: 11 }}>Paid on: {formatDate(detailModal.service.payment_date)}</p>
                        )}
                      </div>
                    ) : detailModal.service.transaction_id && detailModal.service.payment_status === 'PENDING' ? (
                      <p style={{ color: C.warning, fontSize: 12, fontWeight: 600 }}>Payment Pending (TXN: {detailModal.service.transaction_id})</p>
                    ) : detailModal.service.transaction_id && detailModal.service.payment_status === 'FAILED' ? (
                      <p style={{ color: C.error, fontSize: 12, fontWeight: 600 }}>Payment Failed (TXN: {detailModal.service.transaction_id})</p>
                    ) : (
                      <p style={{ color: C.error, fontSize: 12, fontWeight: 600 }}>Unpaid / Checkout Abandoned</p>
                    )}
                </div>

                {/* Technician */}
                {detailModal.service.technician && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User size={13} style={{ color: C.cyan }} />
                    <span style={{ color: C.muted, fontSize: 12 }}>Technician: <strong style={{ color: C.text }}>{detailModal.service.technician.name}</strong></span>
                  </div>
                )}
              </div>
            )}
          </ModalShell>
        )}
      </AnimatePresence>

      {/* ── Assign Technician Modal ──────────────────────────── */}
      <AnimatePresence>
        {assignModal.open && (
          <ModalShell onClose={() => setAssignModal({ open: false, serviceId: 0, customerName: '' })} title={`Assign Tech — ${assignModal.customerName}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <select
                value={selectedTechnician}
                onChange={e => setSelectedTechnician(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 14, background: C.high, color: C.text, fontSize: 12, border: 'none', outline: 'none' }}
              >
                <option value="">-- Select Technician --</option>
                {technicians.map(t => (
                  <option key={t.id} value={String(t.id)}>{t.name}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setAssignModal({ open: false, serviceId: 0, customerName: '' })} style={{ padding: '9px 18px', borderRadius: 12, background: C.high, color: C.muted, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleAssign} disabled={!selectedTechnician || submitting}
                  style={{ padding: '9px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #8b5cff, #38bdf8)', color: '#000', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: !selectedTechnician ? 0.5 : 1 }}
                >{submitting ? 'Assigning...' : 'Assign'}</button>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* ── Update Status Modal ──────────────────────────────── */}
      <AnimatePresence>
        {statusModal.open && (
          <ModalShell onClose={() => setStatusModal({ open: false, serviceId: 0, currentStatus: '' })} title={`Update Status — Service #${statusModal.serviceId}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: C.faint, fontSize: 11 }}>Current:</span>
                <StatusBadge status={statusModal.currentStatus} />
              </div>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 14, background: C.high, color: C.text, fontSize: 12, border: 'none', outline: 'none' }}
              >
                <option value="">-- Select New Status --</option>
                {statusChoices.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setStatusModal({ open: false, serviceId: 0, currentStatus: '' })} style={{ padding: '9px 18px', borderRadius: 12, background: C.high, color: C.muted, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleUpdateStatus} disabled={!selectedStatus || submitting}
                  style={{ padding: '9px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #8b5cff, #38bdf8)', color: '#000', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: !selectedStatus ? 0.5 : 1 }}
                >{submitting ? 'Updating...' : 'Update'}</button>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}

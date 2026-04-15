import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Search,
  Eye,
  ExternalLink,
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
  cyan: '#38bdf8',
  text: '#f0f0f5',
  muted: '#a3a3b5',
  faint: '#4b4b66',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#ff5a5a',
};

const approvalStyle: Record<string, { bg: string; fg: string }> = {
  PENDING:  { bg: 'rgba(251,191,36,0.12)', fg: '#fbbf24' },
  APPROVED: { bg: 'rgba(74,222,128,0.12)', fg: '#4ade80' },
  DECLINED: { bg: 'rgba(255,90,90,0.12)', fg: '#ff5a5a' },
};

/* ── Types ──────────────────────────────────────────────────────────── */
interface JobSheet {
  id: number;
  service_request_id: number;
  technician_name: string;
  technician_avatar?: string;
  customer_name: string;
  problem_description: string;
  estimated_cost: number;
  approval_status: string;
  created_at: string;
}
interface JobSheetsResponse { job_sheets: JobSheet[]; total_pages: number; current_page: number; total_count: number; }

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-IN', { timeZone: import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true, day: '2-digit', month: 'short', year: 'numeric' });
}

function avatarInitials(name: string) {
  return name?.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') ?? 'T';
}

/* ── Component ──────────────────────────────────────────────────────── */
export const pageTitle = 'Job Sheets';

export default function JobSheetsPage() {
  const [jobSheets, setJobSheets] = useState<JobSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const fetchJobSheets = useCallback(() => {
    setLoading(true);
    adminApi.getJobSheets()
      .then(res => {
        const data: JobSheetsResponse = res.data;
        let sheets = data.job_sheets ?? (Array.isArray(data) ? data : []);
        if (statusFilter) sheets = sheets.filter(s => s.approval_status === statusFilter);
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          sheets = sheets.filter(s =>
            s.customer_name?.toLowerCase().includes(q) || s.technician_name?.toLowerCase().includes(q) ||
            s.problem_description?.toLowerCase().includes(q) || String(s.id).includes(q)
          );
        }
        setJobSheets(sheets);
        setTotalPages(data.total_pages ?? 1);
        setCurrentPage(data.current_page ?? 1);
        setTotalCount(sheets.length);
      })
      .catch(() => setJobSheets([]))
      .finally(() => setLoading(false));
  }, [statusFilter, searchQuery]);

  useEffect(() => { fetchJobSheets(); }, [fetchJobSheets, currentPage]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 36, height: 36, borderRadius: 99, border: `3px solid ${C.elevated}`, borderTopColor: C.violet }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.div
          animate={{ width: searchFocused ? 280 : 200 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{ position: 'relative' }}
        >
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: searchFocused ? C.violet : C.faint, transition: 'color 0.2s' }} />
          <input
            placeholder="Search job sheets…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
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

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 14, background: C.surface, color: statusFilter ? C.text : C.muted, fontSize: 12, fontWeight: 500, border: 'none', outline: 'none', cursor: 'pointer' }}>
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="DECLINED">Declined</option>
        </select>

        <span style={{ marginLeft: 'auto', color: C.faint, fontSize: 11 }}>{totalCount} sheets</span>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        style={{ background: C.surface, borderRadius: 24, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['ID', 'Service', 'Technician', 'Customer', 'Diagnosis', 'Est. Cost', 'Approval', 'Created', ''].map(h => (
                  <th key={h} style={{ padding: '14px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobSheets.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '60px 0', textAlign: 'center' }}>
                  <ClipboardList size={40} style={{ color: C.faint, marginBottom: 8 }} />
                  <p style={{ color: C.muted, fontSize: 13 }}>No job sheets found</p>
                </td></tr>
              ) : (
                jobSheets.map((sheet, i) => {
                  const as = approvalStyle[sheet.approval_status] ?? { bg: 'rgba(255,255,255,0.05)', fg: C.muted };
                  return (
                    <motion.tr key={sheet.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      style={{ borderTop: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', cursor: 'default' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 8, background: 'rgba(139,92,255,0.08)', color: C.violet, fontSize: 11, fontWeight: 800 }}>#{sheet.id}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <Link to={`/services/${sheet.service_request_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: C.cyan, fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                          #{sheet.service_request_id} <ExternalLink size={10} />
                        </Link>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #6d28d940, #0ea5e930)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text, fontSize: 9, fontWeight: 800, flexShrink: 0 }}>
                            {avatarInitials(sheet.technician_name)}
                          </div>
                          <span style={{ color: C.text, fontSize: 12 }}>{sheet.technician_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: C.muted }}>{sheet.customer_name}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, color: C.muted, display: 'block', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sheet.problem_description}>
                          {sheet.problem_description}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>
                          <span style={{ color: C.cyan, fontSize: 11 }}>₹</span>{(sheet.estimated_cost ?? 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: as.bg, color: as.fg,
                          padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                          textTransform: 'uppercase',
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: 99, background: as.fg }} />
                          {sheet.approval_status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 11, color: C.muted }}>{formatDate(sheet.created_at)}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <Link to={`/job-sheets/${sheet.id}`} style={{ textDecoration: 'none' }}>
                          <button title="View"
                            style={{ padding: 6, borderRadius: 8, background: 'transparent', color: C.muted, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,255,0.08)'; e.currentTarget.style.color = C.violet; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}>
                            <Eye size={14} />
                          </button>
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ fontSize: 11, color: C.faint }}>Page {currentPage} of {totalPages}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
                style={{ padding: '6px 10px', borderRadius: 10, background: currentPage > 1 ? C.elevated : 'transparent', color: currentPage > 1 ? C.muted : C.faint, border: 'none', cursor: currentPage > 1 ? 'pointer' : 'not-allowed', opacity: currentPage > 1 ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
                <ChevronLeft size={14} /> Prev
              </button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                style={{ padding: '6px 10px', borderRadius: 10, background: currentPage < totalPages ? C.elevated : 'transparent', color: currentPage < totalPages ? C.muted : C.faint, border: 'none', cursor: currentPage < totalPages ? 'pointer' : 'not-allowed', opacity: currentPage < totalPages ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

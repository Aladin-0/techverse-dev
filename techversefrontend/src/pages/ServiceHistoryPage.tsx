// src/pages/ServiceHistoryPage.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { CircularProgress } from '@mui/material';
import dayjs from 'dayjs';
import apiClient from '../api';
import { RatingModal } from '../components/RatingModal';
import { JobSheetView } from '../components/JobSheetView';
import type { JobSheet } from '../stores/jobSheetStore';

// Material Icons
import DescriptionIcon from '@mui/icons-material/Description';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';

// ── Design tokens ───────────────────────────────────────────────────────────
const BG      = '#FAF9F5';
const TEXT     = '#1A1814';
const MUTED    = '#8A8279';
const ACCENT   = '#1C2B4A';
const GOLD     = '#D4922A';
const CARD_BG  = 'rgba(255,255,255,0.96)';
const CARD_BORDER = 'rgba(28,43,74,0.10)';
const EASE     = 'cubic-bezier(0.4, 0, 0.2, 1)';

type Address = {
  street_address: string;
  city: string;
  state: string;
  pincode: string;
};

type ServiceRequestHistory = {
  id: number;
  service_category_name: string;
  issue_description: string | null;
  issue_price: string | null;
  custom_description: string | null;
  service_location: Address | null;
  request_date: string;
  status: string;
  technician_name: string | null;
  can_rate: boolean;
  payment_status: 'PENDING' | 'SUCCESS' | 'FAILED' | null;
  transaction_id: string | null;
  payment_date: string | null;
};

const statusConfig = (status: string, payment_status: string | null) => {
  if (status === 'SUBMITTED' && payment_status === 'FAILED') {
    return { bg: 'rgba(239,68,68,0.08)', color: '#DC2626', dot: '#DC2626', label: 'Cancelled', accent: '#DC2626' };
  }
  switch (status) {
    case 'SUBMITTED':
    case 'CONFIRMED':
      return { bg: 'rgba(59,130,246,0.08)', color: '#2563EB', dot: '#2563EB', label: 'Queued', accent: '#2563EB' };
    case 'ASSIGNED':
      return { bg: 'rgba(245,158,11,0.10)', color: '#B45309', dot: '#F59E0B', label: 'Assigned', accent: '#F59E0B' };
    case 'IN_PROGRESS':
      return { bg: 'rgba(212,146,42,0.10)', color: '#B8791E', dot: '#D4922A', label: 'In Progress', accent: '#D4922A' };
    case 'COMPLETED':
      return { bg: 'rgba(34,197,94,0.08)', color: '#15803D', dot: '#22C55E', label: 'Completed', accent: '#22C55E' };
    case 'CANCELLED':
      return { bg: 'rgba(239,68,68,0.08)', color: '#DC2626', dot: '#DC2626', label: 'Cancelled', accent: '#DC2626' };
    default:
      return { bg: 'rgba(138,130,121,0.08)', color: MUTED, dot: MUTED, label: status, accent: MUTED };
  }
};

const getStatusIcon = (label: string) => {
  switch (label) {
    case 'Queued':
    case 'Assigned':
      return <PendingIcon sx={{ fontSize: 20 }} />;
    case 'In Progress':
      return <BuildIcon sx={{ fontSize: 20 }} />;
    case 'Completed':
      return <CheckCircleIcon sx={{ fontSize: 20 }} />;
    case 'Cancelled':
      return <CancelIcon sx={{ fontSize: 20 }} />;
    default:
      return <HistoryIcon sx={{ fontSize: 20 }} />;
  }
};

export const ServiceHistoryPage: React.FC = () => {
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [requests, setRequests] = useState<ServiceRequestHistory[]>([]);
  const [filter, setFilter]     = useState<string>('All');

  const [ratingOpen, setRatingOpen]               = useState(false);
  const [selectedRequest, setSelectedRequest]     = useState<ServiceRequestHistory | null>(null);
  const [jobSheets, setJobSheets]                 = useState<JobSheet[]>([]);
  const [selectedJobSheet, setSelectedJobSheet]   = useState<JobSheet | null>(null);
  const [jobSheetViewOpen, setJobSheetViewOpen]   = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [servicesRes, jobSheetsRes] = await Promise.all([
          apiClient.get('/api/requests/history/'),
          apiClient.get('/api/job-sheets/')
        ]);
        if (!mounted) return;
        setRequests(Array.isArray(servicesRes.data) ? servicesRes.data : (servicesRes.data?.results || []));
        setJobSheets(Array.isArray(jobSheetsRes.data) ? jobSheetsRes.data : (jobSheetsRes.data?.results || []));
      } catch (e: any) {
        setError(e?.response?.data?.detail || e?.message || 'Failed to load service history');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const getJobSheetForService = (id: number) => jobSheets.find(js => js.service_request_id === id);

  const handleRatingSubmitted = () => {
    setRatingOpen(false);
    setSelectedRequest(null);
  };

  const handleJobSheetUpdate = async () => {
    try {
      const res = await apiClient.get('/api/job-sheets/');
      setJobSheets(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch {}
  };

  const filterTabs = ['All', 'Queued', 'In Progress', 'Completed', 'Cancelled'];

  const filtered = useMemo(() => {
    if (filter === 'All') return requests;
    return requests.filter(r => {
      const s = statusConfig(r.status, r.payment_status).label;
      if (filter === 'Queued') return s === 'Queued' || s === 'Assigned';
      return s === filter;
    });
  }, [requests, filter]);

  // ── Stats computation ──
  const stats = useMemo(() => {
    const completed = requests.filter(r => statusConfig(r.status, r.payment_status).label === 'Completed').length;
    const active = requests.filter(r => ['Queued', 'Assigned', 'In Progress'].includes(statusConfig(r.status, r.payment_status).label)).length;
    const totalSpent = requests.reduce((sum, r) => sum + (r.issue_price ? parseFloat(r.issue_price) : 0), 0);
    return { total: requests.length, completed, active, totalSpent };
  }, [requests]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16, fontFamily: "'Inter', sans-serif" }}>
        <CircularProgress sx={{ color: ACCENT }} size={32} />
        <span style={{ color: MUTED, fontWeight: 500, fontSize: 13 }}>
          Loading service history...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 20, padding: '40px 48px', textAlign: 'center', maxWidth: 480 }}>
          <p style={{ color: '#DC2626', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Something went wrong</p>
          <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  // ════════════ MOBILE VIEW ════════════
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter', sans-serif", color: TEXT }}>
        <div style={{ width: '100%', padding: '80px 16px 60px' }}>
          
          {/* MOBILE HERO */}
          <section style={{ marginBottom: 24, borderRadius: 16, overflow: 'hidden', background: `linear-gradient(135deg, ${ACCENT} 0%, #2a3f6a 100%)`, padding: '24px 20px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(212,146,42,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HistoryIcon sx={{ fontSize: 14, color: GOLD }} />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Service Dashboard</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 6px', color: '#fff', textTransform: 'uppercase' }}>
              Service <span style={{ color: GOLD, fontStyle: 'italic' }}>History</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 500, margin: 0 }}>
              Track all your service requests.
            </p>
          </section>

          {/* STATS GRID (Mobile 2 col) */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
            {[
              { icon: <TrendingUpIcon sx={{ fontSize: 16, color: ACCENT }} />, label: 'Requests', value: stats.total, accent: ACCENT, bg: 'rgba(28,43,74,0.06)' },
              { icon: <BuildIcon sx={{ fontSize: 16, color: GOLD }} />, label: 'Active', value: stats.active, accent: GOLD, bg: 'rgba(212,146,42,0.08)' },
              { icon: <AssignmentTurnedInIcon sx={{ fontSize: 16, color: '#22C55E' }} />, label: 'Done', value: stats.completed, accent: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
              { icon: <CurrencyRupeeIcon sx={{ fontSize: 16, color: '#8B5CF6' }} />, label: 'Spent', value: `₹${stats.totalSpent.toLocaleString()}`, accent: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
            ].map((stat, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16, padding: '16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${stat.accent}, transparent)` }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                   <div style={{ width: 28, height: 28, borderRadius: 8, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {stat.icon}
                   </div>
                   <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{stat.label}</p>
                </div>
                <p style={{ fontSize: 20, fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.5px' }}>{stat.value}</p>
              </div>
            ))}
          </section>

          {/* FILTER TABS */}
          <style>{`
            .svc-filter-scroll-wrap { position: relative; margin-bottom: 24px; margin-right: -16px; }
            .svc-filter-scroll { display: flex; overflow-x: auto; gap: 8px; padding: 0 0 8px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
            .svc-filter-scroll::-webkit-scrollbar { display: none; }
            .svc-filter-scroll-wrap::after { content: ''; position: absolute; right: 0; top: 0; bottom: 8px; width: 40px; background: linear-gradient(to right, transparent, #FAF9F5); pointer-events: none; }
          `}</style>
          <div className="svc-filter-scroll-wrap">
            <div className="svc-filter-scroll">
              {filterTabs.map(tab => {
                const active = filter === tab;
                const count = tab === 'All' ? requests.length :
                  requests.filter(r => {
                    const s = statusConfig(r.status, r.payment_status).label;
                    if (tab === 'Queued') return s === 'Queued' || s === 'Assigned';
                    return s === tab;
                  }).length;
                return (
                  <button
                    key={tab} onClick={() => setFilter(tab)}
                    style={{
                      padding: '8px 16px', borderRadius: 20, flexShrink: 0, scrollSnapAlign: 'start',
                      border: `1px solid ${active ? ACCENT : '#E0E0E0'}`,
                      background: active ? ACCENT : '#fff', color: active ? '#fff' : MUTED,
                      fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                      whiteSpace: 'nowrap', cursor: 'pointer',
                    }}
                  >
                    {tab}
                    {count > 0 && <span style={{ padding: '0 6px', borderRadius: 8, fontSize: 10, fontWeight: 700, background: active ? 'rgba(255,255,255,0.2)' : 'rgba(28,43,74,0.06)' }}>{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TIMELINE CARDS */}
          {filtered.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', border: '1px dashed #D1D5DB', borderRadius: 20 }}>
               <HistoryIcon sx={{ fontSize: 28, color: MUTED, marginBottom: 8 }} />
               <p style={{ color: TEXT, fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>No Records</p>
               <p style={{ color: MUTED, fontWeight: 500, fontSize: 13, margin: 0 }}>No requests found for this filter.</p>
             </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filtered.map((req) => {
                const address = req.service_location ? `${req.service_location.street_address}, ${req.service_location.city}` : 'Address not provided';
                const s = statusConfig(req.status, req.payment_status);
                const jobSheet = getJobSheetForService(req.id);
                return (
                  <div key={req.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT, margin: 0 }}>{req.service_category_name}</h3>
                            <span style={{ fontSize: 9, fontWeight: 700, color: MUTED, background: 'rgba(28,43,74,0.05)', padding: '2px 6px', borderRadius: 4 }}>#{req.id}</span>
                          </div>
                          <span style={{ padding: '3px 8px', borderRadius: 999, background: s.bg, color: s.color, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', display: 'inline-block' }}>{s.label}</span>
                        </div>
                        {req.issue_price && (
                           <div style={{ padding: '4px 8px', background: 'rgba(28,43,74,0.04)', borderRadius: 8 }}>
                             <span style={{ fontSize: 15, fontWeight: 900, color: TEXT }}>₹{req.issue_price}</span>
                           </div>
                        )}
                      </div>

                      <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{req.issue_description || req.custom_description || 'General maintenance.'}</p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#F9FAFB', padding: '10px', borderRadius: 8 }}>
                        {req.technician_name && (
                           <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                             <PersonIcon sx={{ fontSize: 14, color: ACCENT }} /> <span style={{ fontSize: 11, color: TEXT, fontWeight: 600 }}>{req.technician_name}</span>
                           </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <LocationOnIcon sx={{ fontSize: 14, color: MUTED }} /> <span style={{ fontSize: 11, color: MUTED }}>{address}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CalendarTodayIcon sx={{ fontSize: 14, color: MUTED }} /> <span style={{ fontSize: 11, color: MUTED }}>{dayjs(req.request_date).format('MMM D, YYYY')}</span>
                        </div>
                        {req.transaction_id && (
                           <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, paddingTop: 4, borderTop: '1px solid #E5E7EB' }}>
                             <CheckCircleIcon sx={{ fontSize: 14, color: '#10B981' }} /> <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>TXN: {req.transaction_id}</span>
                           </div>
                        )}
                      </div>

                      {(jobSheet || req.can_rate) && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          {jobSheet && (
                            <button onClick={() => { setSelectedJobSheet(jobSheet); setJobSheetViewOpen(true); }} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: ACCENT, fontSize: 12, fontWeight: 600 }}>
                              Inspection Log
                            </button>
                          )}
                          {req.can_rate && (
                            <button onClick={() => { setSelectedRequest(req); setRatingOpen(true); }} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700 }}>
                              Rate
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* FOOTER INFO (Mobile stacked) */}
          {requests.length > 0 && (
             <section style={{ marginTop: 40, borderTop: '1px solid #E5E7EB', paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
               {[
                 { icon: <CheckCircleIcon sx={{ fontSize: 20, color: ACCENT }} />, title: 'Quality Assured', desc: 'Rigorous checks.' },
                 { icon: <StarIcon sx={{ fontSize: 20, color: GOLD }} />, title: 'Rate & Review', desc: 'Help us improve.' },
               ].map(item => (
                 <div key={item.title} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '16px', background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(28,43,74,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.icon}
                    </div>
                    <div>
                      <h5 style={{ color: TEXT, fontWeight: 800, fontSize: 13, margin: '0 0 2px', textTransform: 'uppercase' }}>{item.title}</h5>
                      <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{item.desc}</p>
                    </div>
                 </div>
               ))}
             </section>
          )}

        </div>

        <RatingModal open={ratingOpen} onClose={() => setRatingOpen(false)} onRatingSubmitted={handleRatingSubmitted} serviceRequest={selectedRequest ? { id: selectedRequest.id, technician: selectedRequest.technician_name ? { name: selectedRequest.technician_name } : undefined } : undefined} />
        <JobSheetView open={jobSheetViewOpen} onClose={() => { setJobSheetViewOpen(false); setSelectedJobSheet(null); }} jobSheet={selectedJobSheet} onUpdate={handleJobSheetUpdate} />
      </div>
    );
  }

  // ════════════ DESKTOP VIEW ════════════
  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(circle at 15% 50%, rgba(20, 30, 50, 0.04), transparent 35%),
        radial-gradient(circle at 85% 30%, rgba(212, 146, 42, 0.06), transparent 35%),
        ${BG}
      `,
      fontFamily: "'Inter', sans-serif", color: TEXT, position: 'relative', overflow: 'hidden'
    }}>
      {/* Background Decorative Blobs */}
      <div style={{
        position: 'absolute', top: '5%', right: '-8%', width: '500px', height: '500px',
        borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212, 146, 42, 0.12) 0%, rgba(255, 255, 255, 0) 100%)',
        filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', left: '-12%', width: '600px', height: '600px',
        borderRadius: '50%', background: 'linear-gradient(135deg, rgba(28, 43, 74, 0.08) 0%, rgba(255, 255, 255, 0) 100%)',
        filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', top: '60%', right: '20%', width: '300px', height: '300px',
        borderRadius: '50%', background: 'linear-gradient(135deg, rgba(28, 43, 74, 0.05) 0%, rgba(255, 255, 255, 0) 100%)',
        filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', padding: '120px 48px 80px', position: 'relative', zIndex: 1 }}>

        {/* ═══════════════════════════════════════════════════════════════════
            HERO HEADER SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={{ marginBottom: 48 }}>
          <div style={{
            background: `linear-gradient(135deg, ${ACCENT} 0%, #2a3f6a 50%, #1a2540 100%)`,
            borderRadius: 28, padding: '56px 56px 48px', position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative circles inside hero */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(212,146,42,0.15)', filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', bottom: -60, left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', filter: 'blur(50px)' }} />
            <div style={{ position: 'absolute', top: 20, right: 60, width: 120, height: 120, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'absolute', bottom: 30, right: 200, width: 60, height: 60, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(212,146,42,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HistoryIcon sx={{ fontSize: 20, color: '#D4922A' }} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Service Dashboard</span>
              </div>

              <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 12px', color: '#fff', textTransform: 'uppercase' }}>
                Service <span style={{ color: GOLD, fontStyle: 'italic' }}>History</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, fontWeight: 500, margin: 0, maxWidth: 500 }}>
                Track, manage, and review all your service requests in one place. Your complete service journey at a glance.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            STATS CARDS SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 48 }}>
          {[
            { icon: <TrendingUpIcon sx={{ fontSize: 22, color: ACCENT }} />, label: 'Total Requests', value: stats.total, accent: ACCENT, bg: 'rgba(28,43,74,0.06)' },
            { icon: <BuildIcon sx={{ fontSize: 22, color: GOLD }} />, label: 'Active Now', value: stats.active, accent: GOLD, bg: 'rgba(212,146,42,0.08)' },
            { icon: <AssignmentTurnedInIcon sx={{ fontSize: 22, color: '#22C55E' }} />, label: 'Completed', value: stats.completed, accent: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
            { icon: <CurrencyRupeeIcon sx={{ fontSize: 22, color: '#8B5CF6' }} />, label: 'Total Spent', value: `₹${stats.totalSpent.toLocaleString()}`, accent: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.85)', borderRadius: 22, padding: '28px 28px',
                transition: `all 0.35s ${EASE}`, cursor: 'default', position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(28,43,74,0.08)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              {/* Subtle gradient accent at top */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${stat.accent}, transparent)`, borderRadius: '22px 22px 0 0' }} />
              <div style={{ width: 44, height: 44, borderRadius: 14, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                {stat.icon}
              </div>
              <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>{stat.label}</p>
              <p style={{ fontSize: 28, fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.03em' }}>{stat.value}</p>
            </div>
          ))}
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            FILTER TABS SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32,
          padding: '20px 28px', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)',
          borderRadius: 20, border: '1px solid rgba(255,255,255,0.7)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginRight: 8 }}>Filter</span>
            <div style={{ width: 1, height: 20, background: 'rgba(28,43,74,0.1)', marginRight: 8 }} />
            {filterTabs.map(tab => {
              const active = filter === tab;
              const count = tab === 'All' ? requests.length :
                requests.filter(r => {
                  const s = statusConfig(r.status, r.payment_status).label;
                  if (tab === 'Queued') return s === 'Queued' || s === 'Assigned';
                  return s === tab;
                }).length;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 12,
                    border: `1px solid ${active ? ACCENT : 'transparent'}`,
                    background: active ? ACCENT : 'transparent',
                    color: active ? '#fff' : MUTED,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: `all 0.3s ${EASE}`,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                  onMouseEnter={e => {
                    if (!active) { e.currentTarget.style.background = 'rgba(28,43,74,0.05)'; e.currentTarget.style.color = TEXT; }
                  }}
                  onMouseLeave={e => {
                    if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = MUTED; }
                  }}
                >
                  {tab}
                  <span style={{
                    padding: '2px 7px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                    background: active ? 'rgba(255,255,255,0.2)' : 'rgba(28,43,74,0.06)',
                    color: active ? 'rgba(255,255,255,0.9)' : MUTED,
                  }}>{count}</span>
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>
            Showing {filtered.length} of {requests.length}
          </span>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            EMPTY STATE
        ═══════════════════════════════════════════════════════════════════ */}
        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '80px 40px',
            background: 'rgba(255, 255, 255, 0.55)', backdropFilter: 'blur(16px)',
            border: '1px dashed rgba(28,43,74,0.15)', borderRadius: 28,
          }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(28,43,74,0.05)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <HistoryIcon sx={{ fontSize: 28, color: MUTED }} />
            </div>
            <p style={{ color: TEXT, fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>No Records Found</p>
            <p style={{ color: MUTED, fontWeight: 500, fontSize: 14, margin: 0 }}>
              {filter === 'All' ? "You haven't made any service requests yet." : `No ${filter.toLowerCase()} service requests.`}
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TIMELINE SERVICE CARDS
        ═══════════════════════════════════════════════════════════════════ */}
        <div style={{ position: 'relative' }}>
          {/* Timeline vertical line */}
          {filtered.length > 0 && (
            <div style={{
              position: 'absolute', left: 24, top: 0, bottom: 0, width: 2,
              background: 'linear-gradient(to bottom, rgba(28,43,74,0.12) 0%, rgba(28,43,74,0.04) 100%)',
              zIndex: 0,
            }} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {filtered.map((req, index) => {
              const address  = req.service_location
                ? `${req.service_location.street_address}, ${req.service_location.city}`
                : 'Address not provided';
              const s        = statusConfig(req.status, req.payment_status);
              const jobSheet = getJobSheetForService(req.id);

              return (
                <div key={req.id} style={{ display: 'flex', gap: 0, position: 'relative' }}>

                  {/* Timeline dot */}
                  <div style={{
                    flexShrink: 0, width: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 28, position: 'relative', zIndex: 2
                  }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 14, background: s.bg,
                      border: `2px solid ${s.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: s.color, boxShadow: `0 0 16px ${s.accent}22`,
                    }}>
                      {getStatusIcon(s.label)}
                    </div>
                  </div>

                  {/* Main Card */}
                  <div
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.65)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.85)',
                      borderRadius: 24,
                      padding: 0,
                      transition: `all 0.35s ${EASE}`,
                      position: 'relative',
                      overflow: 'hidden',
                      marginLeft: 16,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(28,43,74,0.18)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 48px rgba(28,43,74,0.07)';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255, 255, 255, 0.85)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Accent stripe at left edge */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                      background: `linear-gradient(to bottom, ${s.accent}, ${s.accent}88)`,
                      borderRadius: '24px 0 0 24px',
                    }} />

                    {/* Card inner content */}
                    <div style={{ padding: '28px 32px 28px 36px' }}>
                      {/* Top row: Title + Status + Price */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <h3 style={{ fontSize: 20, fontWeight: 800, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>
                              {req.service_category_name}
                            </h3>
                            <span style={{ fontSize: 10, fontWeight: 700, color: MUTED, background: 'rgba(28,43,74,0.05)', padding: '3px 8px', borderRadius: 6 }}>
                              #{req.id}
                            </span>
                          </div>
                          {/* Description */}
                          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7, margin: '0 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 600 }}>
                            {req.issue_description || req.custom_description || 'General maintenance requested.'}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                          {/* Status badge */}
                          <span style={{
                            padding: '7px 16px', borderRadius: 12, background: s.bg, color: s.color,
                            fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
                            border: `1px solid ${s.accent}20`,
                          }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0, boxShadow: `0 0 6px ${s.dot}44` }} />
                            {s.label}
                          </span>
                          {req.issue_price && (
                            <div style={{
                              padding: '7px 16px', borderRadius: 12, background: 'rgba(28,43,74,0.04)',
                              border: '1px solid rgba(28,43,74,0.08)',
                            }}>
                              <span style={{ fontSize: 18, fontWeight: 900, color: TEXT, letterSpacing: '-0.02em' }}>₹{req.issue_price}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Meta info row with glass pills */}
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: (jobSheet || req.can_rate) ? 0 : 0 }}>
                        {req.technician_name && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                            background: 'rgba(28,43,74,0.04)', borderRadius: 10,
                          }}>
                            <PersonIcon sx={{ fontSize: 15, color: ACCENT }} />
                            <span style={{ fontSize: 12, color: TEXT, fontWeight: 600 }}>{req.technician_name}</span>
                          </div>
                        )}
                        {!req.technician_name && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                            background: 'rgba(245,158,11,0.06)', borderRadius: 10,
                          }}>
                            <PendingIcon sx={{ fontSize: 15, color: '#B45309' }} />
                            <span style={{ fontSize: 12, color: '#B45309', fontWeight: 600 }}>Awaiting Assignment</span>
                          </div>
                        )}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                          background: 'rgba(28,43,74,0.04)', borderRadius: 10,
                        }}>
                          <LocationOnIcon sx={{ fontSize: 15, color: MUTED }} />
                          <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>{address}</span>
                        </div>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                          background: 'rgba(28,43,74,0.04)', borderRadius: 10,
                        }}>
                          <CalendarTodayIcon sx={{ fontSize: 14, color: MUTED }} />
                          <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>{dayjs(req.request_date).format('MMM D, YYYY')}</span>
                        </div>
                        {req.transaction_id && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                            background: 'rgba(34,197,94,0.08)', borderRadius: 10,
                            border: '1px solid rgba(34,197,94,0.15)',
                          }}>
                            <CheckCircleIcon sx={{ fontSize: 14, color: '#15803D' }} />
                            <span style={{ fontSize: 12, color: '#15803D', fontWeight: 700 }}>
                              TXN: {req.transaction_id}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons row */}
                    {(jobSheet || req.can_rate) && (
                      <div style={{
                        display: 'flex', gap: 10, padding: '16px 32px 20px 36px',
                        borderTop: '1px solid rgba(28,43,74,0.05)', justifyContent: 'flex-end',
                        background: 'rgba(28,43,74,0.015)',
                      }}>
                        {jobSheet && (
                          <button
                            onClick={() => { setSelectedJobSheet(jobSheet); setJobSheetViewOpen(true); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '10px 22px', borderRadius: 12,
                              border: `1px solid rgba(28,43,74,0.15)`,
                              background: 'rgba(255,255,255,0.6)',
                              color: ACCENT, fontSize: 13, fontWeight: 600,
                              cursor: 'pointer', transition: `all 0.3s ${EASE}`,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(28,43,74,0.06)'; e.currentTarget.style.borderColor = ACCENT; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(28,43,74,0.15)'; }}
                          >
                            <DescriptionIcon sx={{ fontSize: 16 }} />
                            Inspection Log
                            {jobSheet.approval_status === 'PENDING' && (
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 8px #F59E0B' }} />
                            )}
                          </button>
                        )}

                        {req.can_rate && (
                          <button
                            onClick={() => { setSelectedRequest(req); setRatingOpen(true); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '10px 22px', borderRadius: 12,
                              border: 'none',
                              background: `linear-gradient(135deg, ${ACCENT}, #2a3f6a)`,
                              color: '#fff', fontSize: 13, fontWeight: 700,
                              cursor: 'pointer', transition: `all 0.3s ${EASE}`,
                              boxShadow: `0 4px 16px ${ACCENT}33`,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = `0 6px 24px ${ACCENT}44`; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 4px 16px ${ACCENT}33`; }}
                          >
                            <StarIcon sx={{ fontSize: 16 }} />
                            Rate Service
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            FOOTER INFO SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        {requests.length > 0 && (
          <section style={{ marginTop: 64, padding: '40px 0', borderTop: '1px solid rgba(28,43,74,0.08)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48 }}>
              {[
                { icon: <CheckCircleIcon sx={{ fontSize: 28, color: ACCENT }} />, title: 'Quality Assured', desc: 'Every service undergoes rigorous quality checks before completion.' },
                { icon: <StarIcon sx={{ fontSize: 28, color: GOLD }} />, title: 'Rate & Review', desc: 'Help us improve by rating your completed service experiences.' },
                { icon: <DescriptionIcon sx={{ fontSize: 28, color: ACCENT }} />, title: 'Detailed Logs', desc: 'Access full inspection logs and job sheets for transparency.' },
              ].map(item => (
                <div key={item.title} style={{
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                  padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.4)',
                  backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.6)',
                  transition: `all 0.3s ${EASE}`,
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.6)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.4)'; }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(28,43,74,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <h5 style={{ color: TEXT, fontWeight: 800, fontSize: 14, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{item.title}</h5>
                    <p style={{ color: MUTED, fontSize: 12, margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      <RatingModal
        open={ratingOpen}
        onClose={() => setRatingOpen(false)}
        onRatingSubmitted={handleRatingSubmitted}
        serviceRequest={
          selectedRequest
            ? { id: selectedRequest.id, technician: selectedRequest.technician_name ? { name: selectedRequest.technician_name } : undefined }
            : undefined
        }
      />

      <JobSheetView
        open={jobSheetViewOpen}
        onClose={() => { setJobSheetViewOpen(false); setSelectedJobSheet(null); }}
        jobSheet={selectedJobSheet}
        onUpdate={handleJobSheetUpdate}
      />
    </div>
  );
};

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Wrench,
  ChevronDown,
} from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/components/ui/Toast';

// ── Design tokens ──────────────────────────────────────────────────────

const colors = {
  bg: '#0a0b14',
  surface: 'rgba(15, 17, 30, 0.7)',
  elevated: 'rgba(20, 22, 38, 0.8)',
  border: 'rgba(255,255,255,0.04)',
  primary: '#8b5cff',
  secondary: '#8b5cff',
  text: '#f0f0f5',
  muted: '#a3a3b5',
  faint: '#4b4b66',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#ff5a5a',
};

// ── Types ──────────────────────────────────────────────────────────────

interface Technician {
  id: number;
  name: string;
}

interface ServiceData {
  id: number;
  customer_name: string;
  customer_email: string;
  category_name: string;
  issue_description: string;
  status: string;
  technician_id: number | null;
  technician_name: string | null;
  technicians: Technician[];
  status_choices: [string, string][];
}

// ── Animations ─────────────────────────────────────────────────────────

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ── Main Component ─────────────────────────────────────────────────────

export const pageTitle = 'Edit Service';

export default function EditServicePage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<ServiceData | null>(null);

  // Form fields
  const [status, setStatus] = useState('');
  const [technicianId, setTechnicianId] = useState('');

  // ── Fetch data ────────────────────────────────────────────────────

  const fetchService = useCallback(async () => {
    if (!serviceId) return;
    setLoading(true);
    try {
      const res = await api.get(`/services/${serviceId}/edit/`);
      const svc: ServiceData = res.data;
      setData(svc);
      setStatus(svc.status);
      setTechnicianId(svc.technician_id?.toString() || '');
    } catch (err) {
      console.error('Failed to load service', err);
      toast.error('Failed to load service data');
    } finally {
      setLoading(false);
    }
  }, [serviceId, toast]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  // ── Submit ────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (status) formData.append('status', status);
      if (technicianId) formData.append('technician_id', technicianId);

      await api.post(`/services/${serviceId}/edit/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Service request updated successfully');
      navigate('/services');
    } catch {
      toast.error('Failed to update service request');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-3">
        <Wrench size={48} style={{ color: colors.faint }} />
        <p className="text-sm" style={{ color: colors.muted }}>
          Service not found
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/services')}
          className="text-sm font-medium"
          style={{ color: colors.secondary }}
        >
          Back to Services
        </motion.button>
      </div>
    );
  }

  const statusChoices = data.status_choices ?? [
    ['SUBMITTED', 'Submitted'],
    ['CONFIRMED', 'Confirmed'],
    ['ASSIGNED', 'Assigned'],
    ['IN_PROGRESS', 'In Progress'],
    ['COMPLETED', 'Completed'],
    ['CANCELLED', 'Cancelled'],
  ];

  const technicians = data.technicians ?? [];

  // ── Render ────────────────────────────────────────────────────────

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <motion.button
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/services')}
        className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
        style={{ color: colors.secondary }}
      >
        <ArrowLeft size={18} />
        Back to Services
      </motion.button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(124,58,237,0.12)' }}
        >
          <Wrench size={20} style={{ color: colors.secondary }} />
        </div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: colors.text }}>
            Edit Service Request #{data.id}
          </h1>
          <p className="text-sm" style={{ color: colors.muted }}>
            {data.customer_name} &mdash; {data.category_name}
          </p>
        </div>
      </div>

      {/* Service Info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="rounded-2xl p-5"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: colors.faint }}>
          Service Information
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span style={{ color: colors.muted }}>Customer:</span>{' '}
            <span className="font-medium" style={{ color: colors.text }}>
              {data.customer_name}
            </span>
          </div>
          <div>
            <span style={{ color: colors.muted }}>Email:</span>{' '}
            <span className="font-medium" style={{ color: colors.text }}>
              {data.customer_email}
            </span>
          </div>
          <div>
            <span style={{ color: colors.muted }}>Category:</span>{' '}
            <span className="font-medium" style={{ color: colors.text }}>
              {data.category_name}
            </span>
          </div>
          <div>
            <span style={{ color: colors.muted }}>Issue:</span>{' '}
            <span className="font-medium" style={{ color: colors.text }}>
              {data.issue_description || 'Custom Request'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Edit Form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="rounded-2xl p-6 space-y-5"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
            Status
          </label>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-lg border outline-none cursor-pointer transition-colors focus:border-[rgba(139,92,255,0.3)] appearance-none"
              style={{ background: colors.elevated, borderColor: colors.border, color: colors.text }}
            >
              {statusChoices.map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: colors.faint }}
            />
          </div>
        </div>

        {/* Technician */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
            Assign Technician
          </label>
          <div className="relative">
            <select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-lg border outline-none cursor-pointer transition-colors focus:border-[rgba(139,92,255,0.3)] appearance-none"
              style={{ background: colors.elevated, borderColor: colors.border, color: colors.text }}
            >
              <option value="">Unassigned</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: colors.faint }}
            />
          </div>
        </div>
      </motion.div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/services')}
          className="px-5 py-2.5 text-sm font-medium rounded-lg transition-colors hover:bg-white/5"
          style={{ color: colors.muted, border: `1px solid ${colors.border}` }}
        >
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: colors.primary }}
        >
          <Save size={16} />
          {submitting ? 'Saving...' : 'Save Changes'}
        </motion.button>
      </div>
    </motion.div>
  );
}

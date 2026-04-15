import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Trash2,
  Wrench,
  User,
  Mail,
  Phone,
  FileText,
  IndianRupee,
  Clock,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { adminApi } from '@/services/api';
import StatusBadge from '@/components/ui/StatusBadge';

// ── Types ──────────────────────────────────────────────────────────────

interface Material {
  id: number;
  item_description: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  date_used: string;
}

interface JobSheetDetail {
  id: number;
  service_request_id: number;
  service_category: string;
  customer_name: string;
  customer_contact: string;
  customer_email: string;
  service_address: string;
  technician_name: string;
  technician_email: string;
  technician_phone: string;
  technician_avatar?: string;
  equipment_type: string;
  serial_number: string;
  equipment_brand: string;
  equipment_model: string;
  problem_description: string;
  work_performed: string;
  date_of_service: string;
  start_time: string;
  finish_time: string;
  total_time_taken: string;
  approval_status: string;
  approved_at: string | null;
  declined_reason: string | null;
  materials: Material[];
  material_cost: number;
  labor_cost: number;
  total_estimated_cost: number;
  customer_notes: string | null;
  created_at: string;
}

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

// ── Animation variants ─────────────────────────────────────────────────

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ── Helper ─────────────────────────────────────────────────────────────

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Mail }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      {Icon && (
        <div className="mt-0.5">
          <Icon size={15} style={{ color: colors.faint }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: colors.faint }}>
          {label}
        </p>
        <p className="text-sm" style={{ color: colors.text }}>
          {value || '-'}
        </p>
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────

export const pageTitle = 'Job Sheet Detail';

export default function JobSheetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [sheet, setSheet] = useState<JobSheetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    adminApi
      .getJobSheetDetail(Number(id))
      .then((res) => setSheet(res.data))
      .catch((err) => console.error('Failed to load job sheet', err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!sheet) return;
    setDeleting(true);
    try {
      await adminApi.deleteJobSheet(sheet.id);
      navigate('/job-sheets');
    } catch {
      console.error('Failed to delete job sheet');
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-IN', { timeZone: import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

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

  if (!sheet) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle size={48} style={{ color: colors.faint }} />
        <p className="text-lg" style={{ color: colors.muted }}>
          Job sheet not found
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/job-sheets')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
          style={{ color: colors.secondary }}
        >
          Back to Job Sheets
        </motion.button>
      </div>
    );
  }

  const materials = sheet.materials ?? [];
  const materialCost = sheet.material_cost ?? materials.reduce((sum, m) => sum + (m.total_cost ?? 0), 0);
  const laborCost = sheet.labor_cost ?? 0;
  const totalEstimatedCost = sheet.total_estimated_cost ?? materialCost + laborCost;

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/job-sheets')}
            className="p-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: colors.muted }}
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold" style={{ color: colors.text }}>
              Job Sheet #{sheet.id}
            </h1>
            <StatusBadge status={sheet.approval_status} />
          </div>
        </div>

        {/* Delete Button */}
        {deleteConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: colors.error }}>
              Are you sure?
            </span>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ background: colors.error }}
            >
              <Trash2 size={14} />
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setDeleteConfirm(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-white/5"
              style={{ borderColor: colors.border, color: colors.muted }}
            >
              Cancel
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-red-500/10"
            style={{ borderColor: 'rgba(239,68,68,0.2)', color: colors.error }}
          >
            <Trash2 size={14} />
            Delete
          </motion.button>
        )}
      </div>

      {/* Two Column Layout */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Service Info */}
        <motion.div
          variants={itemVariant}
          className="rounded-2xl p-6"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Wrench size={18} style={{ color: colors.secondary }} />
            <h2 className="text-base font-semibold" style={{ color: colors.text }}>
              Service Information
            </h2>
          </div>
          <div className="space-y-1">
            <InfoRow label="Service ID" value={`#${sheet.service_request_id}`} icon={FileText} />
            <div className="h-px" style={{ background: colors.border }} />
            <InfoRow label="Category" value={sheet.service_category} icon={Wrench} />
            <div className="h-px" style={{ background: colors.border }} />
            <InfoRow label="Customer Name" value={sheet.customer_name} icon={User} />
            <div className="h-px" style={{ background: colors.border }} />
            <InfoRow label="Customer Email" value={sheet.customer_email} icon={Mail} />
            <div className="h-px" style={{ background: colors.border }} />
            <InfoRow label="Customer Phone" value={sheet.customer_contact} icon={Phone} />
            <div className="h-px" style={{ background: colors.border }} />
            <InfoRow label="Service Date" value={formatDate(sheet.date_of_service)} icon={Calendar} />
            <div className="h-px" style={{ background: colors.border }} />
            <InfoRow
              label="Time"
              value={`${sheet.start_time ?? '-'} - ${sheet.finish_time ?? '-'} (${sheet.total_time_taken ?? '-'})`}
              icon={Clock}
            />
          </div>
        </motion.div>

        {/* Technician Info */}
        <motion.div
          variants={itemVariant}
          className="rounded-2xl p-6"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <div className="flex items-center gap-2 mb-5">
            <User size={18} style={{ color: colors.secondary }} />
            <h2 className="text-base font-semibold" style={{ color: colors.text }}>
              Technician Information
            </h2>
          </div>
          <div className="flex items-center gap-4 mb-5 p-4 rounded-lg" style={{ background: colors.elevated }}>
            {sheet.technician_avatar ? (
              <img
                src={sheet.technician_avatar}
                alt={sheet.technician_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'rgba(124,58,237,0.2)', color: colors.secondary }}
              >
                {sheet.technician_name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() ?? 'T'}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold" style={{ color: colors.text }}>
                {sheet.technician_name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: colors.muted }}>
                Service Technician
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <InfoRow label="Name" value={sheet.technician_name} icon={User} />
            <div className="h-px" style={{ background: colors.border }} />
            <InfoRow label="Email" value={sheet.technician_email} icon={Mail} />
            <div className="h-px" style={{ background: colors.border }} />
            <InfoRow label="Phone" value={sheet.technician_phone} icon={Phone} />
          </div>

          {/* Equipment Info */}
          <div
            className="mt-5 pt-5 border-t space-y-1"
            style={{ borderColor: colors.border }}
          >
            <h3 className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
              Equipment Details
            </h3>
            <InfoRow label="Equipment Type" value={sheet.equipment_type} />
            <div className="h-px" style={{ background: colors.border }} />
            <InfoRow label="Brand / Model" value={`${sheet.equipment_brand || '-'} ${sheet.equipment_model || ''}`} />
            <div className="h-px" style={{ background: colors.border }} />
            <InfoRow label="Serial Number" value={sheet.serial_number} />
          </div>
        </motion.div>
      </motion.div>

      {/* Diagnosis Section */}
      <motion.div
        variants={itemVariant}
        initial="hidden"
        animate="visible"
        className="rounded-2xl p-6"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        <h2 className="text-base font-semibold mb-4" style={{ color: colors.text }}>
          Diagnosis & Work Performed
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: colors.faint }}>
              Problem Description
            </p>
            <div
              className="rounded-lg p-4 text-sm leading-relaxed"
              style={{ background: colors.elevated, color: colors.muted }}
            >
              {sheet.problem_description || 'No description provided'}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: colors.faint }}>
              Work Performed
            </p>
            <div
              className="rounded-lg p-4 text-sm leading-relaxed"
              style={{ background: colors.elevated, color: colors.muted }}
            >
              {sheet.work_performed || 'No details provided'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Materials Table */}
      <motion.div
        variants={itemVariant}
        initial="hidden"
        animate="visible"
        className="rounded-2xl overflow-hidden"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        <div
          className="px-6 py-4 border-b"
          style={{ borderColor: colors.border }}
        >
          <h2 className="text-base font-semibold" style={{ color: colors.text }}>
            Materials Used
          </h2>
        </div>
        {materials.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm" style={{ color: colors.muted }}>
              No materials recorded
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: colors.border }}>
                  {['Material Name', 'Quantity', 'Unit Price (₹)', 'Total (₹)'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: colors.faint }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materials.map((mat, i) => (
                  <motion.tr
                    key={mat.id ?? i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                    className="border-b transition-colors hover:bg-white/[0.02]"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <td className="px-6 py-3">
                      <span className="text-sm" style={{ color: colors.text }}>
                        {mat.item_description}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm" style={{ color: colors.muted }}>
                        {mat.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm" style={{ color: colors.muted }}>
                        ₹{(mat.unit_cost ?? 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm font-medium" style={{ color: colors.text }}>
                        ₹{(mat.total_cost ?? 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Cost Summary */}
      <motion.div
        variants={itemVariant}
        initial="hidden"
        animate="visible"
        className="rounded-2xl p-6"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        <div className="flex items-center gap-2 mb-5">
          <IndianRupee size={18} style={{ color: colors.secondary }} />
          <h2 className="text-base font-semibold" style={{ color: colors.text }}>
            Cost Summary
          </h2>
        </div>
        <div className="space-y-3 max-w-md">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: colors.muted }}>
              Material Cost
            </span>
            <span className="text-sm font-medium" style={{ color: colors.text }}>
              ₹{materialCost.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: colors.muted }}>
              Labor Cost
            </span>
            <span className="text-sm font-medium" style={{ color: colors.text }}>
              ₹{laborCost.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="h-px" style={{ background: colors.border }} />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: colors.text }}>
              Total Estimated Cost
            </span>
            <span className="text-lg font-bold" style={{ color: colors.secondary }}>
              ₹{totalEstimatedCost.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Approval Status */}
      <motion.div
        variants={itemVariant}
        initial="hidden"
        animate="visible"
        className="rounded-2xl p-6"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        <h2 className="text-base font-semibold mb-4" style={{ color: colors.text }}>
          Approval Status
        </h2>
        <div className="flex items-center gap-3 mb-3">
          <StatusBadge status={sheet.approval_status} />
          {sheet.approved_at && (
            <span className="text-xs" style={{ color: colors.muted }}>
              on {formatDate(sheet.approved_at)}
            </span>
          )}
        </div>
        {sheet.declined_reason && (
          <div
            className="rounded-lg p-4 mt-3"
            style={{ background: 'rgba(239,68,68,0.08)' }}
          >
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: colors.error }}>
              Decline Reason
            </p>
            <p className="text-sm" style={{ color: colors.muted }}>
              {sheet.declined_reason}
            </p>
          </div>
        )}
      </motion.div>

      {/* Customer Notes */}
      {sheet.customer_notes && (
        <motion.div
          variants={itemVariant}
          initial="hidden"
          animate="visible"
          className="rounded-2xl p-6"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: colors.text }}>
            Customer Notes
          </h2>
          <div
            className="rounded-lg p-4 text-sm leading-relaxed"
            style={{ background: colors.elevated, color: colors.muted }}
          >
            {sheet.customer_notes}
          </div>
        </motion.div>
      )}

      {/* Back Button */}
      <motion.div
        variants={itemVariant}
        initial="hidden"
        animate="visible"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/job-sheets')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-white/5"
          style={{ borderColor: colors.border, color: colors.muted }}
        >
          <ArrowLeft size={16} />
          Back to Job Sheets
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

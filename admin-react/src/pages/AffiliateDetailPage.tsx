import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MousePointerClick,
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  Save,
  Copy,
  Check,
} from 'lucide-react';
import { adminApi } from '@/services/api';
import StatusBadge from '@/components/ui/StatusBadge';

// ── Types ──────────────────────────────────────────────────────────────

interface AffiliateDetail {
  id: number;
  name: string;
  code: string;
  commission_rate: number;
  email: string;
  phone: string;
  is_active: boolean;
  total_clicks: number;
  total_sales: number;
  commission_earned: number;
  conversion_rate: number;
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

// ── Component ──────────────────────────────────────────────────────────

export const pageTitle = 'Affiliate Detail';

export default function AffiliateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [affiliate, setAffiliate] = useState<AffiliateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editable fields
  const [commissionRate, setCommissionRate] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    adminApi
      .getAffiliateDetail(Number(id))
      .then((res) => {
        const data: AffiliateDetail = res.data;
        setAffiliate(data);
        setCommissionRate(String(data.commission_rate));
        setIsActive(data.is_active);
      })
      .catch((err) => console.error('Failed to load affiliate', err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopyCode = useCallback(() => {
    if (!affiliate) return;
    navigator.clipboard.writeText(affiliate.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [affiliate]);

  const handleSave = async () => {
    if (!affiliate) return;

    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setSaveMessage({ type: 'error', text: 'Commission rate must be between 0 and 100' });
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      await adminApi.updateAffiliate(affiliate.id, {
        commission_rate: rate,
        is_active: isActive,
      });
      setAffiliate((prev) =>
        prev ? { ...prev, commission_rate: rate, is_active: isActive } : prev,
      );
      setSaveMessage({ type: 'success', text: 'Changes saved successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to save changes' });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
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

  if (!affiliate) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-lg" style={{ color: colors.muted }}>
          Affiliate not found
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/affiliates')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
          style={{ color: colors.secondary }}
        >
          Back to Affiliates
        </motion.button>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Clicks',
      value: (affiliate.total_clicks ?? 0).toLocaleString('en-IN'),
      icon: MousePointerClick,
      iconBg: 'rgba(59,130,246,0.15)',
      iconColor: '#3b82f6',
    },
    {
      label: 'Total Sales',
      value: (affiliate.total_sales ?? 0).toLocaleString('en-IN'),
      icon: ShoppingCart,
      iconBg: 'rgba(34,197,94,0.15)',
      iconColor: colors.success,
    },
    {
      label: 'Commission Earned',
      value: `₹${(affiliate.commission_earned ?? 0).toLocaleString('en-IN')}`,
      icon: IndianRupee,
      iconBg: 'rgba(124,58,237,0.15)',
      iconColor: colors.primary,
    },
    {
      label: 'Conversion Rate',
      value: `${(affiliate.conversion_rate ?? 0).toFixed(1)}%`,
      icon: TrendingUp,
      iconBg: 'rgba(245,158,11,0.15)',
      iconColor: colors.warning,
    },
  ];

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/affiliates')}
            className="p-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: colors.muted }}
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold" style={{ color: colors.text }}>
              {affiliate.name}
            </h1>
            <StatusBadge
              status={affiliate.is_active ? 'Active' : 'Inactive'}
              variant={affiliate.is_active ? 'completed' : 'cancelled'}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              variants={itemVariant}
              whileHover={{
                y: -4,
                boxShadow: '0 16px 32px rgba(0,0,0,0.3)',
                borderColor: 'rgba(255,255,255,0.12)',
              }}
              className="rounded-2xl p-5 cursor-default"
              style={{ background: colors.surface, borderColor: colors.border }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: card.iconBg }}
                >
                  <Icon size={20} style={{ color: card.iconColor }} />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1" style={{ color: colors.text }}>
                {card.value}
              </div>
              <div className="text-sm" style={{ color: colors.muted }}>
                {card.label}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Info + Edit Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Affiliate Info */}
        <motion.div
          variants={itemVariant}
          initial="hidden"
          animate="visible"
          className="rounded-2xl p-6"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <h2 className="text-base font-semibold mb-5" style={{ color: colors.text }}>
            Affiliate Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: colors.muted }}>
                Code
              </span>
              <div className="flex items-center gap-2">
                <code
                  className="text-sm px-2.5 py-1 rounded"
                  style={{ background: colors.elevated, color: colors.secondary }}
                >
                  {affiliate.code}
                </code>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopyCode}
                  className="p-1 rounded transition-colors hover:bg-white/5"
                  style={{ color: copied ? colors.success : colors.muted }}
                  title="Copy code"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </motion.button>
              </div>
            </div>
            <div
              className="h-px w-full"
              style={{ background: colors.border }}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: colors.muted }}>
                Commission Rate
              </span>
              <span className="text-sm font-medium" style={{ color: colors.text }}>
                {affiliate.commission_rate}%
              </span>
            </div>
            <div
              className="h-px w-full"
              style={{ background: colors.border }}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: colors.muted }}>
                Email
              </span>
              <span className="text-sm" style={{ color: colors.text }}>
                {affiliate.email || '-'}
              </span>
            </div>
            <div
              className="h-px w-full"
              style={{ background: colors.border }}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: colors.muted }}>
                Phone
              </span>
              <span className="text-sm" style={{ color: colors.text }}>
                {affiliate.phone || '-'}
              </span>
            </div>
            <div
              className="h-px w-full"
              style={{ background: colors.border }}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: colors.muted }}>
                Created Date
              </span>
              <span className="text-sm" style={{ color: colors.text }}>
                {formatDate(affiliate.created_at)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Edit Section */}
        <motion.div
          variants={itemVariant}
          initial="hidden"
          animate="visible"
          className="rounded-2xl p-6"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <h2 className="text-base font-semibold mb-5" style={{ color: colors.text }}>
            Edit Affiliate
          </h2>

          {saveMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg px-4 py-3 text-sm mb-5"
              style={{
                background:
                  saveMessage.type === 'success'
                    ? 'rgba(34,197,94,0.12)'
                    : 'rgba(239,68,68,0.12)',
                color: saveMessage.type === 'success' ? colors.success : colors.error,
              }}
            >
              {saveMessage.text}
            </motion.div>
          )}

          <div className="space-y-5">
            {/* Commission Rate */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: colors.text }}
              >
                Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:border-[rgba(139,92,255,0.3)] placeholder:text-[#444444]"
                style={{
                  background: colors.elevated,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />
            </div>

            {/* Is Active Toggle */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: colors.text }}
              >
                Status
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive(!isActive)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{
                    background: isActive ? colors.primary : colors.elevated,
                    border: `1px solid ${isActive ? colors.primary : colors.border}`,
                  }}
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
                    style={{
                      transform: isActive ? 'translateX(22px)' : 'translateX(4px)',
                    }}
                  />
                </button>
                <span className="text-sm" style={{ color: colors.text }}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Save */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 mt-4"
              style={{ background: colors.primary }}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, X, RefreshCw, Search, User, Shield } from 'lucide-react';
import { adminApi } from '@/services/api';

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

// ── Validation ─────────────────────────────────────────────────────────

interface FormData {
  user_id: string;
  code: string;
  commission_rate: string;
  is_active: boolean;
}

interface FormErrors {
  user_id?: string;
  code?: string;
  commission_rate?: string;
}

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.user_id) {
    errors.user_id = 'Please select a user to promote';
  }

  if (!data.code.trim()) {
    errors.code = 'Affiliate code is required';
  } else if (!/^[a-zA-Z0-9_-]+$/.test(data.code)) {
    errors.code = 'Code can only contain letters, numbers, hyphens, and underscores';
  }

  const rate = parseFloat(data.commission_rate);
  if (!data.commission_rate.trim()) {
    errors.commission_rate = 'Commission rate is required';
  } else if (isNaN(rate) || rate < 0 || rate > 100) {
    errors.commission_rate = 'Must be between 0 and 100';
  }

  return errors;
}

function generateCode(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = Math.random().toString(36).substring(2, 6);
  return base ? `${base}-${suffix}` : suffix;
}

// ── Component ──────────────────────────────────────────────────────────

export const pageTitle = 'Create Affiliate';

export default function CreateAffiliatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');

  const [form, setForm] = useState<FormData>({
    user_id: '',
    code: '',
    commission_rate: '10.00',
    is_active: true,
  });

  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const updateField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
      setServerError('');
    },
    [],
  );

  const handleUserSearch = async (val: string) => {
    setUserSearch(val);
    if (!val || val.length < 2) {
      setUsers([]);
      return;
    }

    setSearching(true);
    try {
      const res = await adminApi.getUsers({ search: val });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setSearching(false);
    }
  };

  const selectUser = (u: any) => {
    setSelectedUser(u);
    updateField('user_id', String(u.id));
    setUserSearch('');
    setUsers([]);
    if (!form.code) {
      const suggested = generateCode(u.name);
      updateField('code', suggested);
    }
  };

  const handleAutoGenerate = useCallback(() => {
    if (selectedUser) {
      const code = generateCode(selectedUser.name);
      updateField('code', code);
    }
  }, [selectedUser, updateField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setServerError('');

    try {
      const formData = new FormData();
      formData.append('user_id', form.user_id);
      formData.append('code', form.code.trim());
      formData.append('commission_rate', form.commission_rate);
      formData.append('is_active', form.is_active ? 'true' : 'false');

      await adminApi.createAffiliate(formData);
      navigate('/affiliates');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setServerError(
          axiosErr.response?.data?.error ?? 'Failed to create affiliate. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    background: colors.elevated,
    borderColor: colors.border,
    color: colors.text,
  };

  const inputClass =
    'w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:border-[rgba(139,92,255,0.3)] placeholder:text-[#444444]';

  const labelClass = 'block text-sm font-medium mb-2';

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
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
        <div>
          <h1 className="text-xl font-semibold" style={{ color: colors.text }}>
            Add Creator (Affiliate)
          </h1>
          <p className="text-sm mt-0.5" style={{ color: colors.muted }}>
            Search a registered user to promote them to partner
          </p>
        </div>
      </div>

      <motion.form
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        onSubmit={handleSubmit}
        className="rounded-2xl p-6 space-y-6"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg px-4 py-3 text-sm"
            style={{ background: 'rgba(239,68,68,0.12)', color: colors.error }}
          >
            {serverError}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div variants={itemVariant} className="relative z-20">
            <label className={labelClass} style={{ color: colors.text }}>
              Select User <span style={{ color: colors.error }}>*</span>
            </label>
            
            {selectedUser ? (
              <div 
                className="flex items-center justify-between p-3 rounded-lg border bg-white/5" 
                style={{ borderColor: colors.primary }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold" style={{ background: colors.primary, color: 'white' }}>
                    {selectedUser.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: colors.text }}>{selectedUser.name}</div>
                    <div className="text-xs" style={{ color: colors.muted }}>{selectedUser.email}</div>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    setSelectedUser(null);
                    updateField('user_id', '');
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/5"
                  style={{ color: colors.error }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.muted }}>
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder="Type name or email to search..."
                  className={`${inputClass} pl-10`}
                  style={{
                    ...inputStyle,
                    borderColor: errors.user_id ? colors.error : colors.border,
                  }}
                />
                
                {users.length > 0 && (
                  <div 
                    className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl p-2 z-50 max-h-60 overflow-y-auto"
                    style={{ background: colors.elevated, borderColor: colors.border }}
                  >
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => selectUser(u)}
                        className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <User size={14} style={{ color: colors.muted }} />
                          <div>
                            <div className="text-sm font-medium" style={{ color: colors.text }}>{u.name}</div>
                            <div className="text-[11px]" style={{ color: colors.muted }}>{u.email || u.phone}</div>
                          </div>
                        </div>
                        <div className="text-[10px] px-2 py-0.5 rounded-full border opacity-50 capitalize" style={{ borderColor: colors.border }}>
                          {u.role.toLowerCase()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <RefreshCw size={14} className="animate-spin" style={{ color: colors.primary }} />
                  </div>
                )}
              </div>
            )}
            
            {errors.user_id && (
              <p className="mt-1 text-xs" style={{ color: colors.error }}>
                {errors.user_id}
              </p>
            )}
            {!selectedUser && !userSearch && (
              <div className="mt-3 p-3 rounded-lg text-[11px] leading-relaxed flex gap-2" style={{ background: 'rgba(124,58,237,0.05)', color: colors.muted }}>
                <Shield size={12} className="shrink-0 mt-0.5" style={{ color: colors.primary }} />
                <span>Choose any existing registered user to make them an affiliate creator.</span>
              </div>
            )}
          </motion.div>

          {/* Commission Rate */}
          <motion.div variants={itemVariant} className="relative z-10">
            <label className={labelClass} style={{ color: colors.text }}>
              Commission Rate (%) <span style={{ color: colors.error }}>*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.commission_rate}
              onChange={(e) => updateField('commission_rate', e.target.value)}
              placeholder="10.00"
              className={inputClass}
              style={{
                ...inputStyle,
                borderColor: errors.commission_rate ? colors.error : colors.border,
              }}
            />
            {errors.commission_rate && (
              <p className="mt-1 text-xs" style={{ color: colors.error }}>
                {errors.commission_rate}
              </p>
            )}
          </motion.div>

          {/* Code */}
          <motion.div variants={itemVariant} className="relative z-10">
            <label className={labelClass} style={{ color: colors.text }}>
              Affiliate Code <span style={{ color: colors.error }}>*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.code}
                onChange={(e) => updateField('code', e.target.value)}
                placeholder="e.g. partner-2024"
                className={`${inputClass} flex-1`}
                style={{
                  ...inputStyle,
                  borderColor: errors.code ? colors.error : colors.border,
                }}
              />
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={!selectedUser}
                onClick={handleAutoGenerate}
                className="flex items-center gap-1.5 px-3 rounded-lg border text-xs font-medium shrink-0 transition-colors hover:bg-white/5 disabled:opacity-30"
                style={{ borderColor: colors.border, color: colors.secondary }}
                title="Auto-generate code"
              >
                <RefreshCw size={14} />
                Generate
              </motion.button>
            </div>
            {errors.code && (
              <p className="mt-1 text-xs" style={{ color: colors.error }}>
                {errors.code}
              </p>
            )}
          </motion.div>

          <motion.div variants={itemVariant} className="flex items-center gap-3 self-end pb-1 relative z-10">
            <button
              type="button"
              role="switch"
              aria-checked={form.is_active}
              onClick={() => updateField('is_active', !form.is_active)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={{
                background: form.is_active ? colors.primary : colors.elevated,
                border: `1px solid ${form.is_active ? colors.primary : colors.border}`,
              }}
            >
              <span
                className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
                style={{
                  transform: form.is_active ? 'translateX(22px)' : 'translateX(4px)',
                }}
              />
            </button>
            <span className="text-sm font-medium" style={{ color: colors.text }}>
              {form.is_active ? 'Active' : 'Inactive'}
            </span>
          </motion.div>
        </div>

        <motion.div
          variants={itemVariant}
          className="flex items-center gap-3 pt-4 border-t"
          style={{ borderColor: colors.border }}
        >
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: colors.primary }}
          >
            <Save size={16} />
            {submitting ? 'Creating...' : 'Create Affiliate'}
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/affiliates')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-white/5"
            style={{ borderColor: colors.border, color: colors.muted }}
          >
            <X size={16} />
            Cancel
          </motion.button>
        </motion.div>
      </motion.form>
    </motion.div>
  );
}

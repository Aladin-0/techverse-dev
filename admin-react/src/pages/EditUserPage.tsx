import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, User, Mail, Phone, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminApi } from '@/services/api';

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ServiceCategory {
  id: number;
  name: string;
}

/* ------------------------------------------------------------------ */
/*  Animations                                                         */
/* ------------------------------------------------------------------ */
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: 20 },
};

const fieldVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

/* ------------------------------------------------------------------ */
/*  Toggle                                                             */
/* ------------------------------------------------------------------ */
function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full px-4 py-3 rounded-2xl transition-colors"
      style={{
        background: colors.surface,
        borderColor: value ? colors.primary : colors.border,
      }}
    >
      <span className="text-sm font-medium" style={{ color: colors.text }}>
        {label}
      </span>
      {value ? (
        <ToggleRight size={24} style={{ color: colors.primary }} />
      ) : (
        <ToggleLeft size={24} style={{ color: colors.faint }} />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function EditUserPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'CUSTOMER',
    is_active: true,
    email_notifications: true,
    sms_notifications: true,
    is_superuser: false,
    free_service_categories: [] as number[],
    new_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [userRes, catRes] = await Promise.all([
          adminApi.getUsers({ search: '' } as never),
          adminApi.getCategories(),
        ]);

        const users = userRes.data.users ?? userRes.data.results ?? [];
        const user = users.find((u: { id: number }) => u.id === Number(id));
        if (user) {
          setForm({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role || 'CUSTOMER',
            is_active: user.is_active ?? true,
            email_notifications: user.email_notifications ?? true,
            sms_notifications: user.sms_notifications ?? true,
            is_superuser: user.is_superuser ?? false,
            free_service_categories: user.free_service_categories ?? [],
            new_password: '',
          });
        }

        setServiceCategories(catRes.data.service_categories ?? []);
      } catch {
        setErrors({ load: 'Failed to load user data' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Invalid email format';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const toggleCategory = (catId: number) => {
    setForm((prev) => ({
      ...prev,
      free_service_categories: prev.free_service_categories.includes(catId)
        ? prev.free_service_categories.filter((c) => c !== catId)
        : [...prev.free_service_categories, catId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('role', form.role);
      fd.append('is_active', form.is_active ? 'on' : '');
      fd.append('email_notifications', form.email_notifications ? 'on' : '');
      fd.append('sms_notifications', form.sms_notifications ? 'on' : '');
      form.free_service_categories.forEach((catId) =>
        fd.append('free_service_categories', String(catId)),
      );
      if (form.new_password) {
        fd.append('new_password', form.new_password);
      }
      await adminApi.updateUser(Number(id), fd);
      navigate('/users');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to update user';
      setErrors({ submit: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors focus:border-[rgba(139,92,255,0.3)]';
  const inputStyle = {
    background: colors.surface,
    borderColor: colors.border,
    color: colors.text,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: colors.faint, borderTopColor: colors.primary }}
        />
      </div>
    );
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/users')}
        className="flex items-center gap-2 mb-6 text-sm font-medium"
        style={{ color: colors.muted }}
      >
        <ArrowLeft size={18} />
        Back to Users
      </motion.button>

      <form onSubmit={handleSubmit}>
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="max-w-2xl rounded-2xl border p-6 lg:p-8"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <h2 className="text-xl font-semibold mb-6" style={{ color: colors.text }}>
            Edit User
          </h2>

          {errors.submit && (
            <div
              className="mb-6 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', color: colors.error }}
            >
              {errors.submit}
            </div>
          )}

          {errors.load && (
            <div
              className="mb-6 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', color: colors.error }}
            >
              {errors.load}
            </div>
          )}

          <div className="space-y-5">
            {/* Name */}
            <motion.div variants={fieldVariants}>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: colors.muted }}>
                <User size={14} /> Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={inputClass}
                style={{
                  ...inputStyle,
                  borderColor: errors.name ? colors.error : colors.border,
                }}
              />
              {errors.name && (
                <p className="text-xs mt-1" style={{ color: colors.error }}>{errors.name}</p>
              )}
            </motion.div>

            {/* Email */}
            <motion.div variants={fieldVariants}>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: colors.muted }}>
                <Mail size={14} /> Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={inputClass}
                style={{
                  ...inputStyle,
                  borderColor: errors.email ? colors.error : colors.border,
                }}
              />
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: colors.error }}>{errors.email}</p>
              )}
            </motion.div>

            {/* Phone */}
            <motion.div variants={fieldVariants}>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: colors.muted }}>
                <Phone size={14} /> Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </motion.div>

            {/* Reset Password */}
            <motion.div variants={fieldVariants} className="pt-4 mt-4 border-t" style={{ borderColor: colors.border }}>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: colors.warning }}>
                <Shield size={14} /> Reset Password
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.new_password}
                    onChange={(e) => handleChange('new_password', e.target.value)}
                    placeholder="Enter new password to reset"
                    className={inputClass}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    style={{ color: colors.muted }}
                  >
                    {showPassword ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                </div>
              </div>
              <div className="mt-3 p-3 rounded-xl text-[11px] leading-relaxed" style={{ background: 'rgba(245,158,11,0.05)', color: colors.muted }}>
                <div className="flex gap-2">
                  <Shield size={12} className="shrink-0 mt-0.5" style={{ color: colors.warning }} />
                  <span>
                    <strong>Security Notice:</strong> Passwords are encrypted (hashed) and cannot be viewed. Setting a new password will overwrite the old one. Leave blank to keep current password.
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Role */}
            <motion.div variants={fieldVariants}>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: colors.muted }}>
                <Shield size={14} /> Role
              </label>
              <select
                value={form.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className={inputClass}
                style={inputStyle}
              >
                <option value="CUSTOMER">Customer</option>
                <option value="TECHNICIAN">Technician</option>
                <option value="AMC">AMC</option>
                <option value="ADMIN">Admin</option>
              </select>
            </motion.div>

            {/* Toggles */}
            <motion.div variants={fieldVariants} className="space-y-3">
              <Toggle
                label="Is Active"
                value={form.is_active}
                onChange={(v) => handleChange('is_active', v)}
              />
              <Toggle
                label="Email Notifications"
                value={form.email_notifications}
                onChange={(v) => handleChange('email_notifications', v)}
              />
              <Toggle
                label="SMS Notifications"
                value={form.sms_notifications}
                onChange={(v) => handleChange('sms_notifications', v)}
              />
            </motion.div>

            {/* AMC Free Service Categories */}
            {form.role === 'AMC' && serviceCategories.length > 0 && (
              <motion.div variants={fieldVariants} initial="initial" animate="animate">
                <label className="text-sm font-medium mb-3 block" style={{ color: colors.muted }}>
                  Free Service Categories
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {serviceCategories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl cursor-pointer transition-colors"
                      style={{
                        borderColor: form.free_service_categories.includes(cat.id)
                          ? colors.primary
                          : colors.border,
                        background: form.free_service_categories.includes(cat.id)
                          ? 'rgba(124,58,237,0.08)'
                          : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.free_service_categories.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        className="rounded accent-[#8b5cff]"
                      />
                      <span className="text-sm" style={{ color: colors.text }}>
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6" style={{ borderTop: `1px solid ${colors.border}` }}>
            {form.is_superuser && (
              <span className="text-xs mr-auto" style={{ color: colors.warning }}>
                Superuser accounts cannot be deleted
              </span>
            )}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/users')}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: colors.border, color: colors.muted }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: colors.primary }}
            >
              {submitting ? (
                <div
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                />
              ) : (
                <Save size={16} />
              )}
              {submitting ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </div>
        </motion.div>
      </form>
    </motion.div>
  );
}

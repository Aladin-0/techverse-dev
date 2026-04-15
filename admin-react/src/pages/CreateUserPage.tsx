import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, User, Mail, Phone, Lock, Shield } from 'lucide-react';
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
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function CreateUserPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'CUSTOMER',
    free_service_categories: [] as number[],
  });

  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await adminApi.getCategories();
        const data = res.data;
        setServiceCategories(data.service_categories ?? []);
      } catch {
        /* silent */
      }
    }
    fetchCategories();
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Invalid email format';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const toggleCategory = (id: number) => {
    setForm((prev) => ({
      ...prev,
      free_service_categories: prev.free_service_categories.includes(id)
        ? prev.free_service_categories.filter((c) => c !== id)
        : [...prev.free_service_categories, id],
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
      fd.append('password1', form.password);
      fd.append('password2', form.confirmPassword);
      fd.append('role', form.role);
      form.free_service_categories.forEach((id) =>
        fd.append('free_service_categories', String(id)),
      );
      await adminApi.createUser(fd);
      navigate('/users');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to create user';
      setErrors({ submit: msg });
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  const inputClass =
    'w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors focus:border-[rgba(139,92,255,0.3)]';
  const inputStyle = {
    background: colors.surface,
    borderColor: colors.border,
    color: colors.text,
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {/* Back button */}
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
            Create New User
          </h2>

          {errors.submit && (
            <div
              className="mb-6 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', color: colors.error }}
            >
              {errors.submit}
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
                placeholder="Full name"
                className={inputClass}
                style={{
                  ...inputStyle,
                  borderColor: errors.name ? colors.error : colors.border,
                }}
              />
              {errors.name && (
                <p className="text-xs mt-1" style={{ color: colors.error }}>
                  {errors.name}
                </p>
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
                placeholder="email@example.com"
                className={inputClass}
                style={{
                  ...inputStyle,
                  borderColor: errors.email ? colors.error : colors.border,
                }}
              />
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: colors.error }}>
                  {errors.email}
                </p>
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
                placeholder="+91 XXXXX XXXXX"
                className={inputClass}
                style={{
                  ...inputStyle,
                  borderColor: errors.phone ? colors.error : colors.border,
                }}
              />
              {errors.phone && (
                <p className="text-xs mt-1" style={{ color: colors.error }}>
                  {errors.phone}
                </p>
              )}
            </motion.div>

            {/* Password */}
            <motion.div variants={fieldVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: colors.muted }}>
                  <Lock size={14} /> Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Min 8 characters"
                  className={inputClass}
                  style={{
                    ...inputStyle,
                    borderColor: errors.password ? colors.error : colors.border,
                  }}
                />
                {errors.password && (
                  <p className="text-xs mt-1" style={{ color: colors.error }}>
                    {errors.password}
                  </p>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: colors.muted }}>
                  <Lock size={14} /> Confirm Password
                </label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Re-enter password"
                  className={inputClass}
                  style={{
                    ...inputStyle,
                    borderColor: errors.confirmPassword ? colors.error : colors.border,
                  }}
                />
                {errors.confirmPassword && (
                  <p className="text-xs mt-1" style={{ color: colors.error }}>
                    {errors.confirmPassword}
                  </p>
                )}
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

            {/* AMC Free Service Categories */}
            {form.role === 'AMC' && serviceCategories.length > 0 && (
              <motion.div
                variants={fieldVariants}
                initial="initial"
                animate="animate"
              >
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
              {submitting ? 'Creating...' : 'Create User'}
            </motion.button>
          </div>
        </motion.div>
      </form>
    </motion.div>
  );
}

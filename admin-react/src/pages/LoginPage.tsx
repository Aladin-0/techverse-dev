import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { adminApi } from '@/services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get CSRF token first
      await adminApi.getCsrf().catch(() => {});

      const res = await adminApi.login(email, password);
      if (res.data?.success) {
        navigate('/', { replace: true });
      } else {
        setError(res.data?.error || 'Invalid credentials. Please try again.');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.15) 0%, #080808 60%)',
      }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative"
      >
        {/* Card */}
        <div
          className="rounded-2xl border p-8 shadow-2xl"
          style={{
            background: 'rgba(15,15,24,0.92)',
            borderColor: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #8b5cff, #8b5cff)' }}
            >
              <Shield size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#ffffff' }}>
              TECHVERSE
            </h1>
            <p className="text-sm mt-1" style={{ color: '#9b9b9b' }}>
              Admin Panel — Staff access only
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg px-4 py-3 mb-5 text-sm"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#ff5a5a',
              }}
            >
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="block text-sm font-medium"
                style={{ color: '#c4c3d0' }}
              >
                Email address
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@techverse.in"
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#ffffff',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#8b5cff')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium"
                style={{ color: '#c4c3d0' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg px-4 py-2.5 pr-10 text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#ffffff',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#8b5cff')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 transition-opacity hover:opacity-80"
                  style={{ color: '#9b9b9b' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-all mt-2"
              style={{
                background: loading
                  ? 'rgba(124,58,237,0.5)'
                  : 'linear-gradient(135deg, #8b5cff, #9d6af5)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs mt-6" style={{ color: '#444444' }}>
            This panel is restricted to TechVerse staff members only.
          </p>
        </div>

        {/* Glow */}
        <div
          className="absolute -inset-1 rounded-3xl -z-10 opacity-20 blur-2xl"
          style={{ background: 'linear-gradient(135deg, #8b5cff, #8b5cff)' }}
        />
      </motion.div>
    </div>
  );
}

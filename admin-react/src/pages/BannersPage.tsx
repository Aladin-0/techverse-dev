import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Edit,
  Trash2,
  Upload,
  X,
  AlertTriangle,
} from 'lucide-react';
import { adminApi } from '@/services/api';

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
};

/* ── Types ──────────────────────────────────────────────────────────── */
interface Banner { id: number; image: string; button_text: string; product: number | null; product_name?: string; external_link: string; order: number; is_active: boolean; }
interface Product { id: number; name: string; }
interface BannersResponse { banners: Banner[]; products: Product[]; }
interface BannerFormData { image: File | null; button_text: string; product: string; external_link: string; order: string; is_active: boolean; }

const emptyForm: BannerFormData = { image: null, button_text: '', product: '', external_link: '', order: '0', is_active: true };

/* ── Modal Shell ───────────────────────────────────────────────────── */
function ModalShell({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{ background: C.elevated, borderRadius: 24, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' }}
        className="aetheric-scrollbar"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.faint, cursor: 'pointer', padding: 4 }}><X size={18} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ── Input style ───────────────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 14,
  background: C.high, color: C.text, fontSize: 12, fontWeight: 500,
  border: 'none', outline: 'none',
};

/* ── Component ──────────────────────────────────────────────────────── */
export const pageTitle = 'Store Banners';

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const [form, setForm] = useState<BannerFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchBanners = useCallback(() => {
    setLoading(true);
    adminApi.getBanners()
      .then(res => { const data: BannersResponse = res.data; setBanners(data.banners ?? (Array.isArray(data) ? data : [])); setProducts(data.products ?? []); })
      .catch(() => setBanners([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const updateField = <K extends keyof BannerFormData>(key: K, value: BannerFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setFormError('');
  };

  const openCreateModal = () => { setForm(emptyForm); setFormError(''); setCreateOpen(true); };
  const openEditModal = (banner: Banner) => {
    setEditBanner(banner);
    setForm({ image: null, button_text: banner.button_text, product: banner.product ? String(banner.product) : '', external_link: banner.external_link, order: String(banner.order), is_active: banner.is_active });
    setFormError('');
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image) { setFormError('Banner image is required'); return; }
    setSubmitting(true); setFormError('');
    try {
      const fd = new FormData();
      fd.append('action', 'create'); fd.append('image', form.image);
      fd.append('button_text', form.button_text); fd.append('product', form.product);
      fd.append('external_link', form.external_link); fd.append('order', form.order);
      fd.append('is_active', form.is_active ? 'on' : '');
      await adminApi.createBanner(fd);
      setCreateOpen(false); fetchBanners();
    } catch { setFormError('Failed to create banner.'); } finally { setSubmitting(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBanner) return;
    setSubmitting(true); setFormError('');
    try {
      const fd = new FormData();
      fd.append('action', 'edit'); fd.append('banner_id', String(editBanner.id));
      if (form.image) fd.append('image', form.image);
      fd.append('button_text', form.button_text); fd.append('product', form.product);
      fd.append('external_link', form.external_link); fd.append('order', form.order);
      fd.append('is_active', form.is_active ? 'on' : '');
      await adminApi.editBanner(fd);
      setEditOpen(false); setEditBanner(null); fetchBanners();
    } catch { setFormError('Failed to update banner.'); } finally { setSubmitting(false); }
  };

  const handleDelete = async (bannerId: number) => {
    try { await adminApi.deleteBanner(bannerId); setDeleteConfirm(null); fetchBanners(); } catch { /* silent */ }
  };

  const totalBanners = banners.length;
  const activeBanners = banners.filter(b => b.is_active).length;
  const withProductLink = banners.filter(b => b.product).length;

  /* ── Form Fields ───────────────────────────────────────────────── */
  function renderFormFields(isEdit: boolean) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {formError && (
          <div style={{ background: 'rgba(255,90,90,0.1)', color: C.error, padding: '10px 14px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{formError}</div>
        )}

        {/* Image Upload */}
        <div>
          <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
            Banner Image {!isEdit && <span style={{ color: C.error }}>*</span>}
          </label>
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: 120, borderRadius: 16, border: `2px dashed ${C.faint}`,
            background: C.high, cursor: 'pointer', transition: 'border-color 0.2s',
          }}>
            <Upload size={22} style={{ color: C.faint }} />
            <span style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>
              {form.image ? form.image.name : isEdit ? 'Upload new image (optional)' : 'Click to upload'}
            </span>
            <span style={{ color: C.faint, fontSize: 10, marginTop: 2 }}>1400 × 400 recommended</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => updateField('image', e.target.files?.[0] ?? null)} />
          </label>
        </div>

        <div>
          <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Button Text</label>
          <input type="text" value={form.button_text} onChange={e => updateField('button_text', e.target.value)} placeholder="e.g. Shop Now" style={inputStyle} />
        </div>

        <div>
          <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Link to Product</label>
          <select value={form.product} onChange={e => updateField('product', e.target.value)} style={inputStyle}>
            <option value="">-- None --</option>
            {products.map(p => (<option key={p.id} value={String(p.id)}>{p.name}</option>))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>External Link</label>
          <input type="url" value={form.external_link} onChange={e => updateField('external_link', e.target.value)} placeholder="https://example.com" style={inputStyle} />
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Display Order</label>
            <input type="number" min="0" value={form.order} onChange={e => updateField('order', e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2, gap: 8 }}>
            <input type="checkbox" checked={form.is_active} onChange={e => updateField('is_active', e.target.checked)} style={{ accentColor: C.violet }} />
            <span style={{ color: C.muted, fontSize: 12 }}>Active</span>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
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

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'Total Banners', value: totalBanners, icon: <ImageIcon size={16} />, color: '#60a5fa' },
          { label: 'Active', value: activeBanners, icon: <Eye size={16} />, color: C.success },
          { label: 'With Product Link', value: withProductLink, icon: <LinkIcon size={16} />, color: C.warning },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ background: C.surface, backdropFilter: 'blur(20px) saturate(1.5)', WebkitBackdropFilter: 'blur(20px) saturate(1.5)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 24, padding: '18px 20px', position: 'relative', overflow: 'hidden', cursor: 'default' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: `radial-gradient(circle, ${s.color}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: C.faint, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
            </div>
            <p style={{ color: C.text, fontSize: 28, fontWeight: 800, lineHeight: 1, margin: 0 }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ color: C.muted, fontSize: 12 }}>Hero banners displayed on the store page</p>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openCreateModal}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 14, background: 'linear-gradient(135deg, #8b5cff, #38bdf8)', color: '#000', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          <Plus size={15} /> Add Banner
        </motion.button>
      </div>

      {/* ── Banner Grid ────────────────────────────────────────── */}
      {banners.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', background: C.surface, backdropFilter: 'blur(20px) saturate(1.5)', WebkitBackdropFilter: 'blur(20px) saturate(1.5)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 24 }}>
          <ImageIcon size={48} style={{ color: C.faint }} />
          <p style={{ color: C.muted, fontSize: 14, marginTop: 12 }}>No banners yet</p>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openCreateModal}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 14, background: 'linear-gradient(135deg, #8b5cff, #38bdf8)', color: '#000', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: 16 }}>
            <Plus size={15} /> Add Banner
          </motion.button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
          {banners.map((banner, i) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              style={{ background: C.surface, backdropFilter: 'blur(20px) saturate(1.5)', WebkitBackdropFilter: 'blur(20px) saturate(1.5)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 24, overflow: 'hidden', cursor: 'default' }}
            >
              {/* Image */}
              <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                <img src={adminApi.getImageUrl(banner.image)} alt={`Banner #${banner.order}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 10, left: 10 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: banner.is_active ? 'rgba(74,222,128,0.2)' : 'rgba(255,90,90,0.2)',
                    color: banner.is_active ? C.success : C.error,
                    padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                    backdropFilter: 'blur(8px)',
                  }}>
                    {banner.is_active ? <><Eye size={11} /> Active</> : <><EyeOff size={11} /> Hidden</>}
                  </span>
                </div>
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  <span style={{ background: 'rgba(139,92,255,0.25)', color: C.violet, padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, backdropFilter: 'blur(8px)' }}>
                    #{banner.order}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '14px 16px' }}>
                {banner.button_text && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ color: C.faint, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>CTA</span>
                    <span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{banner.button_text}</span>
                  </div>
                )}
                {banner.product_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <LinkIcon size={11} style={{ color: C.faint }} />
                    <span style={{ color: C.muted, fontSize: 11 }}>Product: {banner.product_name}</span>
                  </div>
                )}
                {banner.external_link && !banner.product && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <LinkIcon size={11} style={{ color: C.faint }} />
                    <span style={{ color: C.muted, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>{banner.external_link}</span>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <button onClick={() => openEditModal(banner)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 10, background: 'rgba(139,92,255,0.08)', color: C.violet, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    <Edit size={12} /> Edit
                  </button>
                  {deleteConfirm === banner.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                      <span style={{ color: C.error, fontSize: 11 }}>Delete?</span>
                      <button onClick={() => handleDelete(banner.id)} style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(255,90,90,0.15)', color: C.error, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Yes</button>
                      <button onClick={() => setDeleteConfirm(null)} style={{ padding: '6px 12px', borderRadius: 10, background: C.high, color: C.muted, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}>No</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(banner.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 10, background: 'rgba(255,90,90,0.06)', color: C.faint, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', marginLeft: 'auto', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = C.error; e.currentTarget.style.background = 'rgba(255,90,90,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = C.faint; e.currentTarget.style.background = 'rgba(255,90,90,0.06)'; }}
                    ><Trash2 size={12} /> Delete</button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Create Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {createOpen && (
          <ModalShell onClose={() => setCreateOpen(false)} title="Create Banner">
            <form onSubmit={handleCreate}>
              {renderFormFields(false)}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" onClick={() => setCreateOpen(false)} style={{ padding: '9px 18px', borderRadius: 12, background: C.high, color: C.muted, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '9px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #8b5cff, #38bdf8)', color: '#000', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: submitting ? 0.5 : 1 }}>
                  {submitting ? 'Creating...' : 'Create Banner'}
                </button>
              </div>
            </form>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* ── Edit Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {editOpen && (
          <ModalShell onClose={() => { setEditOpen(false); setEditBanner(null); }} title="Edit Banner">
            <form onSubmit={handleEdit}>
              {editBanner?.image && (
                <div style={{ marginBottom: 16, borderRadius: 14, overflow: 'hidden' }}>
                  <img src={adminApi.getImageUrl(editBanner.image)} alt="Current" style={{ width: '100%', height: 100, objectFit: 'cover' }} />
                  <p style={{ color: C.faint, fontSize: 10, marginTop: 6 }}>Upload new to replace</p>
                </div>
              )}
              {renderFormFields(true)}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" onClick={() => { setEditOpen(false); setEditBanner(null); }} style={{ padding: '9px 18px', borderRadius: 12, background: C.high, color: C.muted, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '9px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #8b5cff, #38bdf8)', color: '#000', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: submitting ? 0.5 : 1 }}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}

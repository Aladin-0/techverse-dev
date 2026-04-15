import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tags,
  Plus,
  Edit3,
  Trash2,
  Package,
  Wrench,
  X,
  FolderOpen,
  IndianRupee,
  AlertTriangle,
} from 'lucide-react';
import { adminApi } from '@/services/api';
import { useToast } from '@/components/ui/Toast';

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

  gradient: 'linear-gradient(135deg, #8b5cff, #38bdf8)',
};

/* ── Types ──────────────────────────────────────────────────────────── */
interface ProductCategory { id: number; name: string; slug: string; product_count: number; created_at: string; }
interface IssueRow { id?: string; description: string; price: string; }
interface ServiceCategoryItem { id: number; name: string; custom_request_price: number; issues_count: number; service_count: number; issues: IssueRow[]; }
interface CategoriesData { categories: ProductCategory[]; service_categories: ServiceCategoryItem[]; }

/* ── Helpers ────────────────────────────────────────────────────────── */
function slugify(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
}

function formatDate(dateStr: string): string {
  try { return new Date(dateStr).toLocaleString('en-IN', { timeZone: import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true, day: 'numeric', month: 'short', year: 'numeric' }); } catch { return dateStr || 'N/A'; }
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 14,
  background: C.high, color: C.text, fontSize: 12, fontWeight: 500,
  border: 'none', outline: 'none',
};

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
        style={{ background: C.elevated, borderRadius: 24, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', maxHeight: '85vh', overflowY: 'auto' }}
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

/* ── Component ──────────────────────────────────────────────────────── */
export const pageTitle = 'Categories';

export default function CategoriesPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState<CategoriesData | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'product' | 'service'>('product');
  const [editingCategory, setEditingCategory] = useState<ProductCategory | ServiceCategoryItem | null>(null);

  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [customRequestPrice, setCustomRequestPrice] = useState('500');
  const [issues, setIssues] = useState<IssueRow[]>([{ description: '', price: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try { const res = await adminApi.getCategories(); setData(res.data); }
    catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  /* ── Modal handlers ─────────────────────────────────────────────── */
  const openCreateModal = (type: 'product' | 'service') => {
    setEditingCategory(null); setModalType(type);
    setCategoryName(''); setCategorySlug(''); setCustomRequestPrice('500');
    setIssues([{ description: '', price: '' }]); setFormError(''); setModalOpen(true);
  };

  const openEditProductModal = (cat: ProductCategory) => {
    setEditingCategory(cat); setModalType('product');
    setCategoryName(cat.name); setCategorySlug(cat.slug); setFormError(''); setModalOpen(true);
  };

  const openEditServiceModal = (cat: ServiceCategoryItem) => {
    setEditingCategory(cat); setModalType('service');
    setCategoryName(cat.name); setCustomRequestPrice(cat.custom_request_price.toString());
    setIssues(cat.issues?.length > 0 ? cat.issues : [{ description: '', price: '' }]);
    setFormError(''); setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setCategoryName(val);
    if (modalType === 'product' && !editingCategory) setCategorySlug(slugify(val));
  };

  const addIssueRow = () => setIssues(prev => [...prev, { description: '', price: '' }]);
  const removeIssueRow = (idx: number) => setIssues(prev => prev.filter((_, i) => i !== idx));
  const updateIssueRow = (idx: number, field: 'description' | 'price', value: string) => {
    setIssues(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!categoryName.trim()) { setFormError('Category name is required'); return; }
    if (modalType === 'service') {
      const valid = issues.filter(i => i.description.trim());
      if (valid.length === 0) { setFormError('At least one issue is required'); return; }
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('type', modalType); fd.append('name', categoryName.trim());
      if (modalType === 'product') { fd.append('slug', categorySlug.trim() || slugify(categoryName)); }
      else {
        fd.append('custom_request_price', customRequestPrice || '500');
        issues.forEach(issue => {
          if (issue.description.trim()) { fd.append('issue_descriptions[]', issue.description.trim()); fd.append('issue_prices[]', issue.price || '0'); }
        });
      }
      if (editingCategory) { await adminApi.editCategory(editingCategory.id, fd); toast.success(`"${categoryName}" updated`); }
      else { await adminApi.createCategory(fd); toast.success(`"${categoryName}" created`); }
      setModalOpen(false); fetchCategories();
    } catch { toast.error('Failed to save category'); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number, type: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await adminApi.deleteCategory(id, type); toast.success(`"${name}" deleted`); fetchCategories(); }
    catch { toast.error('Failed to delete'); }
  };

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 36, height: 36, borderRadius: 99, border: `3px solid ${C.elevated}`, borderTopColor: C.violet }}
        />
      </div>
    );
  }

  const productCategories = data?.categories ?? [];
  const serviceCategories = data?.service_categories ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Product Categories ──────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ background: C.surface, backdropFilter: 'blur(20px) saturate(1.5)', WebkitBackdropFilter: 'blur(20px) saturate(1.5)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 24, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(139,92,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.violet }}>
              <Package size={15} />
            </div>
            <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: 0 }}>Product Categories</h3>
            <span style={{ background: 'rgba(139,92,255,0.08)', color: C.violet, padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>{productCategories.length}</span>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => openCreateModal('product')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: 'linear-gradient(135deg, #8b5cff, #38bdf8)', color: '#000', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            <Plus size={13} /> Add
          </motion.button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Category', 'Slug', 'Products', 'Created', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {productCategories.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '50px 0', textAlign: 'center' }}>
                  <FolderOpen size={36} style={{ color: C.faint, marginBottom: 8 }} />
                  <p style={{ color: C.muted, fontSize: 12 }}>No product categories</p>
                </td></tr>
              ) : (
                productCategories.map((cat, i) => (
                  <motion.tr key={cat.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    style={{ borderTop: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(139,92,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.violet, flexShrink: 0 }}>
                          <Package size={14} />
                        </div>
                        <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{cat.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 6, background: C.elevated, color: C.muted, fontSize: 11, fontFamily: 'monospace' }}>{cat.slug}</span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{cat.product_count}</span>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 11, color: C.muted }}>{formatDate(cat.created_at)}</td>
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => openEditProductModal(cat)} title="Edit"
                          style={{ padding: 6, borderRadius: 8, background: 'transparent', color: C.muted, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,255,0.08)'; e.currentTarget.style.color = C.violet; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}
                        ><Edit3 size={13} /></button>
                        <button onClick={() => handleDelete(cat.id, 'product', cat.name)} title="Delete"
                          style={{ padding: 6, borderRadius: 8, background: 'transparent', color: C.faint, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,90,90,0.08)'; e.currentTarget.style.color = C.error; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.faint; }}
                        ><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Service Categories ──────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ background: C.surface, backdropFilter: 'blur(20px) saturate(1.5)', WebkitBackdropFilter: 'blur(20px) saturate(1.5)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 24, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(140,231,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan }}>
              <Wrench size={15} />
            </div>
            <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: 0 }}>Service Categories</h3>
            <span style={{ background: 'rgba(140,231,255,0.08)', color: C.cyan, padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>{serviceCategories.length}</span>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => openCreateModal('service')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: 'linear-gradient(135deg, #38bdf8, #8b5cff)', color: '#000', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            <Plus size={13} /> Add
          </motion.button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Category', 'Issues', 'Services', 'Custom Price', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {serviceCategories.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '50px 0', textAlign: 'center' }}>
                  <FolderOpen size={36} style={{ color: C.faint, marginBottom: 8 }} />
                  <p style={{ color: C.muted, fontSize: 12 }}>No service categories</p>
                </td></tr>
              ) : (
                serviceCategories.map((cat, i) => (
                  <motion.tr key={cat.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    style={{ borderTop: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(140,231,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan, flexShrink: 0 }}>
                          <Wrench size={14} />
                        </div>
                        <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{cat.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ color: C.muted, fontSize: 12 }}>{cat.issues_count}</span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{cat.service_count}</span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ color: C.cyan, fontSize: 13, fontWeight: 700 }}>₹{Number(cat.custom_request_price).toLocaleString('en-IN')}</span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => openEditServiceModal(cat)} title="Edit"
                          style={{ padding: 6, borderRadius: 8, background: 'transparent', color: C.muted, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(140,231,255,0.08)'; e.currentTarget.style.color = C.cyan; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}
                        ><Edit3 size={13} /></button>
                        <button onClick={() => handleDelete(cat.id, 'service', cat.name)} title="Delete"
                          style={{ padding: 6, borderRadius: 8, background: 'transparent', color: C.faint, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,90,90,0.08)'; e.currentTarget.style.color = C.error; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.faint; }}
                        ><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Create/Edit Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <ModalShell onClose={() => setModalOpen(false)} title={editingCategory ? `Edit ${modalType === 'product' ? 'Product' : 'Service'} Category` : `Create ${modalType === 'product' ? 'Product' : 'Service'} Category`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {formError && (
                <div style={{ background: 'rgba(255,90,90,0.1)', color: C.error, padding: '10px 14px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{formError}</div>
              )}

              <div>
                <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Category Name <span style={{ color: C.error }}>*</span></label>
                <input type="text" value={categoryName} onChange={e => handleNameChange(e.target.value)} placeholder="Category name" style={inputStyle} />
              </div>

              {modalType === 'product' && (
                <div>
                  <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Slug</label>
                  <input type="text" value={categorySlug} onChange={e => setCategorySlug(e.target.value)} placeholder="auto-generated" style={inputStyle} />
                </div>
              )}

              {modalType === 'service' && (
                <>
                  <div>
                    <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Custom Request Price</label>
                    <input type="number" value={customRequestPrice} onChange={e => setCustomRequestPrice(e.target.value)} style={inputStyle} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label style={{ color: C.muted, fontSize: 11, fontWeight: 600 }}>Service Issues <span style={{ color: C.error }}>*</span></label>
                      <button onClick={addIssueRow} type="button"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(139,92,255,0.08)', color: C.violet, fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                        <Plus size={10} /> Add Issue
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {issues.map((issue, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="text" placeholder="Issue description" value={issue.description} onChange={e => updateIssueRow(idx, 'description', e.target.value)}
                            style={{ ...inputStyle, flex: 2 }} />
                          <input type="number" placeholder="Price" value={issue.price} onChange={e => updateIssueRow(idx, 'price', e.target.value)}
                            style={{ ...inputStyle, flex: 1 }} />
                          {issues.length > 1 && (
                            <button onClick={() => removeIssueRow(idx)} type="button"
                              style={{ padding: 6, borderRadius: 8, background: 'rgba(255,90,90,0.08)', color: C.error, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => setModalOpen(false)} style={{ padding: '9px 18px', borderRadius: 12, background: C.high, color: C.muted, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSubmit} disabled={submitting}
                  style={{ padding: '9px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #8b5cff, #38bdf8)', color: '#000', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: submitting ? 0.5 : 1 }}>
                  {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}

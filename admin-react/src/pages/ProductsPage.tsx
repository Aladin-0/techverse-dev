import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Download,
  Search,
  X,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  Star,
  Eye,
  EyeOff,
  IndianRupee,
  TrendingUp,
  Layers,
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
interface Product {
  id: number;
  name: string;
  slug: string;
  brand: string;
  category: { id: number; name: string } | string;
  category_name?: string;
  price: string | number;
  image: string | null;
  image_url?: string;
  is_active: boolean;
  is_featured: boolean;
  is_amazon_affiliate: boolean;
  created_at: string;
}

interface Category { id: number; name: string; }

interface Pagination {
  page: number;
  total_pages: number;
  total_count: number;
  has_next: boolean;
  has_previous: boolean;
}

/* ── Helpers ────────────────────────────────────────────────────────── */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', { timeZone: import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true, year: 'numeric', month: 'short', day: 'numeric' });
}

function formatPrice(price: string | number): string {
  return Number(price).toLocaleString('en-IN');
}

function getCategoryName(product: Product): string {
  if (product.category_name) return product.category_name;
  if (typeof product.category === 'object' && product.category?.name) return product.category.name;
  if (typeof product.category === 'string') return product.category;
  return 'N/A';
}



/* ── Component ──────────────────────────────────────────────────────── */
export const pageTitle = 'Products';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, total_pages: 1, total_count: 0, has_next: false, has_previous: false,
  });

  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [searchFocused, setSearchFocused] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const currentPage = parseInt(searchParams.get('page') || '1', 10);
      params.page = String(currentPage);

      const res = await adminApi.getProducts(params as never);
      const data = res.data;

      setProducts(data.products ?? data.results ?? []);
      setCategories(data.categories ?? []);
      setPagination({
        page: data.page ?? currentPage,
        total_pages: data.total_pages ?? data.num_pages ?? 1,
        total_count: data.total_count ?? data.count ?? 0,
        has_next: data.has_next ?? false,
        has_previous: data.has_previous ?? false,
      });
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, searchQuery, searchParams]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (categoryFilter) params.category = categoryFilter;
    if (statusFilter) params.status = statusFilter;
    if (searchQuery) params.search = searchQuery;
    const page = searchParams.get('page');
    if (page && page !== '1') params.page = page;
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, statusFilter, searchQuery]);

  const goToPage = (page: number) => {
    setSearchParams(prev => { prev.set('page', String(page)); return prev; });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await adminApi.deleteProduct(deleteTarget.id); setDeleteTarget(null); fetchProducts(); } catch { /* silent */ }
  };

  const handleExport = () => {
    const headers = ['Name', 'Brand', 'Category', 'Price', 'Status', 'Created'];
    const rows = products.map(p => [p.name, p.brand, getCategoryName(p), formatPrice(p.price), p.is_active ? 'Active' : 'Inactive', formatDate(p.created_at)]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'products_export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Aggregates ─────────────────────────────────────────────────── */
  const totalActive = products.filter(p => p.is_active).length;
  const totalFeatured = products.filter(p => p.is_featured).length;


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Quick Stats Row ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total Products', value: pagination.total_count, icon: <Package size={16} />, color: C.violet },
          { label: 'Active', value: totalActive, icon: <Eye size={16} />, color: C.success },
          { label: 'Featured', value: totalFeatured, icon: <Star size={16} />, color: C.warning },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{
              background: C.surface,
              borderRadius: 24,
              padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: stat.color + '15',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: stat.color,
            }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ color: C.text, fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{stat.value}</p>
              <p style={{ color: C.faint, fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', marginTop: 2 }}>
                {stat.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Actions + Filters ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/products/create" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 14,
                background: 'linear-gradient(135deg, #8b5cff, #38bdf8)',
                color: '#000', fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer',
              }}
            >
              <Plus size={15} /> Add Product
            </motion.button>
          </Link>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleExport}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 14,
              background: C.surface, color: C.muted,
              fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
            }}
          >
            <Download size={14} /> Export
          </motion.button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Search */}
          <motion.div
            animate={{ width: searchFocused ? 260 : 190 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{ position: 'relative' }}
          >
            <Search size={14} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: searchFocused ? C.violet : C.faint, transition: 'color 0.2s',
            }} />
            <input
              placeholder="Search products…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                width: '100%', padding: '9px 14px 9px 34px', borderRadius: 14,
                background: searchFocused ? C.elevated : C.surface,
                color: C.text, fontSize: 12, fontWeight: 500,
                border: 'none', outline: 'none',
                boxShadow: searchFocused ? '0 0 0 1px rgba(139,92,255,0.3)' : 'none',
                transition: 'all 0.3s',
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: C.faint, cursor: 'pointer', padding: 2,
              }}><X size={12} /></button>
            )}
          </motion.div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{
              padding: '9px 14px', borderRadius: 14,
              background: C.surface, color: C.muted,
              fontSize: 12, fontWeight: 500, border: 'none', outline: 'none',
              cursor: 'pointer', appearance: 'none' as const,
              WebkitAppearance: 'none' as const,
            }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 14px', borderRadius: 14,
              background: C.surface, color: C.muted,
              fontSize: 12, fontWeight: 500, border: 'none', outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* ── Product Table ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ background: C.surface, borderRadius: 24, overflow: 'hidden' }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Product', 'Category', 'Price', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '14px 18px', textAlign: 'left',
                    fontSize: 10, fontWeight: 700, color: C.faint,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '60px 0', textAlign: 'center' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 28, height: 28, borderRadius: 99, margin: '0 auto', border: `3px solid ${C.elevated}`, borderTopColor: C.violet }}
                  />
                </td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '60px 0', textAlign: 'center' }}>
                  <Package size={40} style={{ color: C.faint, marginBottom: 8 }} />
                  <p style={{ color: C.muted, fontSize: 13 }}>No products found</p>
                </td></tr>
              ) : (
                products.map((product, i) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    style={{
                      borderTop: '1px solid rgba(255,255,255,0.03)',
                      transition: 'background 0.2s', cursor: 'default',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Product image */}
                        <div style={{
                          width: 44, height: 44, borderRadius: 12, overflow: 'hidden',
                          background: C.elevated, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {product.image || product.image_url ? (
                            <img src={adminApi.getImageUrl(product.image || product.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Package size={18} style={{ color: C.faint }} />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <p style={{ color: C.text, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                              {product.name}
                            </p>
                            {product.is_featured && (
                              <Star size={12} fill={C.warning} color={C.warning} style={{ flexShrink: 0 }} />
                            )}
                          </div>
                          <p style={{ color: C.faint, fontSize: 10 }}>{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 8,
                        background: 'rgba(139,92,255,0.08)',
                        color: C.violet, fontSize: 10, fontWeight: 600,
                      }}>
                        {getCategoryName(product)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ color: C.text, fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em' }}>
                        <span style={{ color: C.cyan, fontSize: 11, fontWeight: 600 }}>₹</span>
                        {formatPrice(product.price)}
                      </span>
                    </td>

                    <td style={{ padding: '12px 18px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: product.is_active ? 'rgba(74,222,128,0.1)' : 'rgba(255,90,90,0.1)',
                        color: product.is_active ? C.success : C.error,
                        padding: '4px 10px', borderRadius: 99,
                        fontSize: 10, fontWeight: 700,
                      }}>
                        {product.is_active ? <Eye size={10} /> : <EyeOff size={10} />}
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 12, color: C.muted }}>
                      {formatDate(product.created_at)}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Link to={`/products/${product.id}/edit`} style={{ textDecoration: 'none' }}>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                              padding: 7, borderRadius: 10, background: 'transparent',
                              color: C.muted, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,255,0.08)'; e.currentTarget.style.color = C.violet; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </motion.button>
                        </Link>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDeleteTarget(product)}
                          style={{
                            padding: 7, borderRadius: 10, background: 'transparent',
                            color: C.faint, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,90,90,0.08)'; e.currentTarget.style.color = C.error; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.faint; }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 22px',
            borderTop: '1px solid rgba(255,255,255,0.03)',
          }}>
            <span style={{ fontSize: 11, color: C.faint }}>
              Page {pagination.page} of {pagination.total_pages} · {pagination.total_count} products
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={!pagination.has_previous}
                style={{
                  padding: '6px 10px', borderRadius: 10,
                  background: pagination.has_previous ? C.elevated : 'transparent',
                  color: pagination.has_previous ? C.muted : C.faint,
                  border: 'none', cursor: pagination.has_previous ? 'pointer' : 'not-allowed',
                  opacity: pagination.has_previous ? 1 : 0.4,
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                }}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={!pagination.has_next}
                style={{
                  padding: '6px 10px', borderRadius: 10,
                  background: pagination.has_next ? C.elevated : 'transparent',
                  color: pagination.has_next ? C.muted : C.faint,
                  border: 'none', cursor: pagination.has_next ? 'pointer' : 'not-allowed',
                  opacity: pagination.has_next ? 1 : 0.4,
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Delete Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: C.elevated, borderRadius: 24,
                padding: 28, width: '100%', maxWidth: 400,
                boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: 'rgba(255,90,90,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.error,
                }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Delete Product</h3>
                  <p style={{ color: C.faint, fontSize: 11, margin: 0 }}>This action cannot be undone</p>
                </div>
              </div>
              <p style={{ color: C.muted, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                Are you sure you want to delete <strong style={{ color: C.text }}>{deleteTarget.name}</strong>?
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDeleteTarget(null)}
                  style={{ padding: '9px 18px', borderRadius: 12, background: C.high, color: C.muted, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >Cancel</button>
                <button
                  onClick={handleDelete}
                  style={{ padding: '9px 18px', borderRadius: 12, background: 'rgba(255,90,90,0.15)', color: C.error, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >Delete Product</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

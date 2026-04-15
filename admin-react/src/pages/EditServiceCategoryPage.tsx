import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  X,
  Save,
  Wrench,
  Info,
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

interface ExistingIssue {
  id: number;
  description: string;
  price: string;
}

interface NewIssue {
  description: string;
  price: string;
}

interface CategoryData {
  id: number;
  name: string;
  custom_request_price: string;
  issues: ExistingIssue[];
}

// ── Animations ─────────────────────────────────────────────────────────

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ── Main Component ─────────────────────────────────────────────────────

export const pageTitle = 'Edit Service Category';

export default function EditServiceCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [categoryName, setCategoryName] = useState('');
  const [customRequestPrice, setCustomRequestPrice] = useState('500');
  const [existingIssues, setExistingIssues] = useState<ExistingIssue[]>([]);
  const [newIssues, setNewIssues] = useState<NewIssue[]>([]);
  const [removedIssueIds, setRemovedIssueIds] = useState<number[]>([]);

  // ── Fetch data ────────────────────────────────────────────────────

  const fetchCategory = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    try {
      // Fetch the edit page which contains the category data
      const res = await api.get(`/categories/${categoryId}/edit/`, {
        params: { type: 'service' },
      });
      const data: CategoryData = res.data;
      setCategoryName(data.name);
      setCustomRequestPrice(data.custom_request_price?.toString() || '500');
      setExistingIssues(
        (data.issues || []).map((i) => ({
          id: i.id,
          description: i.description,
          price: i.price?.toString() || '0',
        }))
      );
    } catch (err) {
      console.error('Failed to load category', err);
      toast.error('Failed to load category data');
    } finally {
      setLoading(false);
    }
  }, [categoryId, toast]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  // ── Handlers ──────────────────────────────────────────────────────

  const updateExistingIssue = (idx: number, field: 'description' | 'price', value: string) => {
    setExistingIssues((prev) =>
      prev.map((issue, i) => (i === idx ? { ...issue, [field]: value } : issue))
    );
  };

  const removeExistingIssue = (idx: number) => {
    const issue = existingIssues[idx];
    setRemovedIssueIds((prev) => [...prev, issue.id]);
    setExistingIssues((prev) => prev.filter((_, i) => i !== idx));
  };

  const addNewIssue = () => {
    setNewIssues((prev) => [...prev, { description: '', price: '' }]);
  };

  const updateNewIssue = (idx: number, field: 'description' | 'price', value: string) => {
    setNewIssues((prev) =>
      prev.map((issue, i) => (i === idx ? { ...issue, [field]: value } : issue))
    );
  };

  const removeNewIssue = (idx: number) => {
    setNewIssues((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', 'service');
      formData.append('name', categoryName.trim());
      formData.append('custom_request_price', customRequestPrice || '500');

      // Existing issues that are kept
      existingIssues.forEach((issue) => {
        formData.append('existing_issue_ids[]', issue.id.toString());
        formData.append('existing_issue_descriptions[]', issue.description);
        formData.append('existing_issue_prices[]', issue.price || '0');
      });

      // New issues
      newIssues.forEach((issue) => {
        if (issue.description.trim()) {
          formData.append('new_issue_descriptions[]', issue.description.trim());
          formData.append('new_issue_prices[]', issue.price || '0');
        }
      });

      await api.post(`/categories/${categoryId}/edit/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Category updated successfully');
      navigate('/categories');
    } catch {
      toast.error('Failed to update category');
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

  // ── Render ────────────────────────────────────────────────────────

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <motion.button
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/categories')}
        className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
        style={{ color: colors.secondary }}
      >
        <ArrowLeft size={18} />
        Back to Categories
      </motion.button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(34,197,94,0.12)' }}
        >
          <Wrench size={20} style={{ color: colors.success }} />
        </div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: colors.text }}>
            Edit Service Category
          </h1>
          <p className="text-sm" style={{ color: colors.muted }}>
            Update category details and manage service issues
          </p>
        </div>
      </div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="rounded-2xl p-6 space-y-6"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        {/* Category Name */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
            Category Name
          </label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Enter category name"
            className="w-full px-4 py-3 text-sm rounded-lg border outline-none transition-colors focus:border-[rgba(139,92,255,0.3)]"
            style={{ background: colors.elevated, borderColor: colors.border, color: colors.text }}
          />
        </div>

        {/* Custom Request Default Price */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
            Custom Request Default Price
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: colors.faint }}>
              {'\u20B9'}
            </span>
            <input
              type="number"
              value={customRequestPrice}
              onChange={(e) => setCustomRequestPrice(e.target.value)}
              placeholder="500"
              min="0"
              step="0.01"
              className="w-full pl-8 pr-4 py-3 text-sm rounded-lg border outline-none transition-colors focus:border-[rgba(139,92,255,0.3)]"
              style={{ background: colors.elevated, borderColor: colors.border, color: colors.text }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t" style={{ borderColor: colors.border }} />

        {/* Existing Issues */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: colors.text }}>
              Service Issues ({existingIssues.length + newIssues.length})
            </h3>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={addNewIssue}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
              style={{ background: 'rgba(124,58,237,0.1)', color: colors.secondary }}
            >
              <Plus size={14} />
              Add Issue
            </motion.button>
          </div>

          <div className="space-y-3">
            {/* Existing issues */}
            <AnimatePresence>
              {existingIssues.map((issue, idx) => (
                <motion.div
                  key={`existing-${issue.id}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center shrink-0 text-[10px] font-bold"
                    style={{ background: colors.elevated, color: colors.faint }}
                  >
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    value={issue.description}
                    onChange={(e) => updateExistingIssue(idx, 'description', e.target.value)}
                    placeholder="Issue description"
                    className="flex-1 px-3 py-2.5 text-sm rounded-lg border outline-none transition-colors focus:border-[rgba(139,92,255,0.3)]"
                    style={{ background: colors.elevated, borderColor: colors.border, color: colors.text }}
                  />
                  <div className="relative w-28">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: colors.faint }}>
                      {'\u20B9'}
                    </span>
                    <input
                      type="number"
                      value={issue.price}
                      onChange={(e) => updateExistingIssue(idx, 'price', e.target.value)}
                      placeholder="Price"
                      min="0"
                      step="0.01"
                      className="w-full pl-7 pr-3 py-2.5 text-sm rounded-lg border outline-none transition-colors focus:border-[rgba(139,92,255,0.3)]"
                      style={{ background: colors.elevated, borderColor: colors.border, color: colors.text }}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => removeExistingIssue(idx)}
                    className="p-2 rounded-lg transition-colors hover:bg-white/5 shrink-0"
                    style={{ color: colors.error }}
                    title="Remove issue"
                  >
                    <X size={16} />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* New issues */}
            <AnimatePresence>
              {newIssues.map((issue, idx) => (
                <motion.div
                  key={`new-${idx}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center shrink-0 text-[10px] font-bold"
                    style={{ background: 'rgba(34,197,94,0.1)', color: colors.success }}
                  >
                    +
                  </div>
                  <input
                    type="text"
                    value={issue.description}
                    onChange={(e) => updateNewIssue(idx, 'description', e.target.value)}
                    placeholder="New issue description"
                    className="flex-1 px-3 py-2.5 text-sm rounded-lg border outline-none transition-colors focus:border-[rgba(139,92,255,0.3)]"
                    style={{ background: colors.elevated, borderColor: 'rgba(34,197,94,0.2)', color: colors.text }}
                  />
                  <div className="relative w-28">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: colors.faint }}>
                      {'\u20B9'}
                    </span>
                    <input
                      type="number"
                      value={issue.price}
                      onChange={(e) => updateNewIssue(idx, 'price', e.target.value)}
                      placeholder="Price"
                      min="0"
                      step="0.01"
                      className="w-full pl-7 pr-3 py-2.5 text-sm rounded-lg border outline-none transition-colors focus:border-[rgba(139,92,255,0.3)]"
                      style={{ background: colors.elevated, borderColor: 'rgba(34,197,94,0.2)', color: colors.text }}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => removeNewIssue(idx)}
                    className="p-2 rounded-lg transition-colors hover:bg-white/5 shrink-0"
                    style={{ color: colors.error }}
                    title="Remove issue"
                  >
                    <X size={16} />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>

            {existingIssues.length === 0 && newIssues.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: colors.faint }}>
                  No issues yet. Click "Add Issue" to create one.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info box */}
        <div
          className="flex items-start gap-2.5 px-4 py-3 rounded-lg text-xs leading-relaxed"
          style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.15)' }}
        >
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>
            Changes to existing issues will be saved in place. Removed issues will be permanently deleted.
            New issues will be added to this category.
          </span>
        </div>
      </motion.div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/categories')}
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

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Package,
  ImagePlus,
  Plus,
  Trash2,
  Link as LinkIcon,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';
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
interface Category {
  id: number;
  name: string;
}

interface Specification {
  name: string;
  value: string;
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
  animate: { transition: { staggerChildren: 0.05 } },
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
export default function CreateProductPage() {
  const navigate = useNavigate();
  const mainImageRef = useRef<HTMLInputElement>(null);
  const additionalImagesRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isAmazonAffiliate, setIsAmazonAffiliate] = useState(false);

  const [form, setForm] = useState({
    name: '',
    brand: '',
    category: '',
    model_number: '',
    description: '',
    price: '',
    weight: '',
    dimensions: '',
    delivery_time_info: '',
    features: '',
    warranty_period: '1 Year',
    meta_description: '',
    is_active: true,
    is_featured: false,
    amazon_affiliate_link: '',
  });

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([{ name: '', value: '' }]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await adminApi.getCategories();
        const data = res.data;
        setCategories(data.product_categories ?? data.categories ?? []);
      } catch {
        /* silent */
      }
    }
    fetchCategories();
  }, []);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleMainImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 10 - additionalImages.length);
    setAdditionalImages((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdditionalPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(f);
    });
  };

  const removeAdditionalImage = (idx: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== idx));
    setAdditionalPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSpec = () => setSpecifications((prev) => [...prev, { name: '', value: '' }]);

  const removeSpec = (idx: number) =>
    setSpecifications((prev) => prev.filter((_, i) => i !== idx));

  const updateSpec = (idx: number, field: 'name' | 'value', val: string) => {
    setSpecifications((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: val } : s)),
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (isAmazonAffiliate) {
      if (!form.category) errs.category = 'Category is required';
      if (!form.amazon_affiliate_link.trim())
        errs.amazon_affiliate_link = 'Amazon link is required';
    } else {
      if (!form.name.trim()) errs.name = 'Name is required';
      if (!form.category) errs.category = 'Category is required';
      if (!form.description.trim()) errs.description = 'Description is required';
      if (!form.price || Number(form.price) <= 0) errs.price = 'Valid price is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('is_amazon_affiliate', String(isAmazonAffiliate));
      fd.append('category', form.category);
      // ALWAYS append toggles
      fd.append('is_active', String(form.is_active));
      fd.append('is_featured', String(form.is_featured));

      if (isAmazonAffiliate) {
        fd.append('amazon_affiliate_link', form.amazon_affiliate_link);
      } else {
        fd.append('name', form.name);
        fd.append('brand', form.brand);
        fd.append('model_number', form.model_number);
        fd.append('description', form.description);
        fd.append('price', form.price);
        fd.append('weight', form.weight);
        fd.append('dimensions', form.dimensions);
        fd.append('delivery_time_info', form.delivery_time_info);
        fd.append('features', form.features);
        fd.append('warranty_period', form.warranty_period);
        fd.append('meta_description', form.meta_description);

        if (mainImage) fd.append('image', mainImage);
        additionalImages.forEach((file) => fd.append('additional_images', file));

        specifications
          .filter((s) => s.name.trim() && s.value.trim())
          .forEach((s) => {
            fd.append('spec_names[]', s.name);
            fd.append('spec_values[]', s.value);
          });
      }

      await adminApi.createProduct(fd);
      navigate('/products');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to create product';
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

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/products')}
        className="flex items-center gap-2 mb-6 text-sm font-medium"
        style={{ color: colors.muted }}
      >
        <ArrowLeft size={18} />
        Back to Products
      </motion.button>

      <form onSubmit={handleSubmit}>
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="max-w-3xl rounded-2xl border p-6 lg:p-8"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <h2 className="text-xl font-semibold mb-6" style={{ color: colors.text }}>
            Create New Product
          </h2>

          {errors.submit && (
            <div
              className="mb-6 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', color: colors.error }}
            >
              {errors.submit}
            </div>
          )}

          {/* Amazon Affiliate Toggle */}
          <motion.div variants={fieldVariants} className="mb-6">
            <div
              className="flex items-center justify-between px-4 py-3 rounded-2xl"
              style={{
                background: isAmazonAffiliate ? 'rgba(124,58,237,0.06)' : 'transparent',
                borderColor: isAmazonAffiliate ? colors.primary : colors.border,
              }}
            >
              <div className="flex items-center gap-3">
                <LinkIcon size={18} style={{ color: colors.secondary }} />
                <div>
                  <div className="text-sm font-medium" style={{ color: colors.text }}>
                    Amazon Affiliate Product
                  </div>
                  <div className="text-xs" style={{ color: colors.faint }}>
                    Enable for a simplified form with just an Amazon link
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAmazonAffiliate(!isAmazonAffiliate)}
              >
                {isAmazonAffiliate ? (
                  <ToggleRight size={28} style={{ color: colors.primary }} />
                ) : (
                  <ToggleLeft size={28} style={{ color: colors.faint }} />
                )}
              </button>
            </div>
          </motion.div>

          <div className="space-y-5">
            {/* Category (always shown) */}
            <motion.div variants={fieldVariants}>
              <label className="text-sm font-medium mb-2 block" style={{ color: colors.muted }}>
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={inputClass}
                style={{
                  ...inputStyle,
                  borderColor: errors.category ? colors.error : colors.border,
                }}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs mt-1" style={{ color: colors.error }}>{errors.category}</p>
              )}
            </motion.div>

            {isAmazonAffiliate ? (
              /* Amazon affiliate: simplified form */
              <motion.div variants={fieldVariants}>
                <label className="text-sm font-medium mb-2 block" style={{ color: colors.muted }}>
                  Amazon Affiliate Link *
                </label>
                <input
                  type="url"
                  value={form.amazon_affiliate_link}
                  onChange={(e) => handleChange('amazon_affiliate_link', e.target.value)}
                  placeholder="https://www.amazon.in/dp/..."
                  className={inputClass}
                  style={{
                    ...inputStyle,
                    borderColor: errors.amazon_affiliate_link ? colors.error : colors.border,
                  }}
                />
                {errors.amazon_affiliate_link && (
                  <p className="text-xs mt-1" style={{ color: colors.error }}>
                    {errors.amazon_affiliate_link}
                  </p>
                )}
              </motion.div>
            ) : (
              <>
                {/* Name & Brand */}
                <motion.div variants={fieldVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: colors.muted }}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Product name"
                      className={inputClass}
                      style={{
                        ...inputStyle,
                        borderColor: errors.name ? colors.error : colors.border,
                      }}
                    />
                    {errors.name && (
                      <p className="text-xs mt-1" style={{ color: colors.error }}>{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: colors.muted }}>
                      Brand
                    </label>
                    <input
                      type="text"
                      value={form.brand}
                      onChange={(e) => handleChange('brand', e.target.value)}
                      placeholder="Brand name"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                </motion.div>

                {/* Model Number */}
                <motion.div variants={fieldVariants}>
                  <label className="text-sm font-medium mb-2 block" style={{ color: colors.muted }}>
                    Model Number
                  </label>
                  <input
                    type="text"
                    value={form.model_number}
                    onChange={(e) => handleChange('model_number', e.target.value)}
                    placeholder="e.g. XPS-15-9530"
                    className={inputClass}
                    style={inputStyle}
                  />
                </motion.div>

                {/* Description */}
                <motion.div variants={fieldVariants}>
                  <label className="text-sm font-medium mb-2 block" style={{ color: colors.muted }}>
                    Description *
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Product description..."
                    rows={4}
                    className={inputClass}
                    style={{
                      ...inputStyle,
                      borderColor: errors.description ? colors.error : colors.border,
                      resize: 'vertical',
                    }}
                  />
                  {errors.description && (
                    <p className="text-xs mt-1" style={{ color: colors.error }}>
                      {errors.description}
                    </p>
                  )}
                </motion.div>

                <motion.div variants={fieldVariants} className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: colors.muted }}>
                      Price (INR) *
                    </label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => handleChange('price', e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      style={{
                        ...inputStyle,
                        borderColor: errors.price ? colors.error : colors.border,
                      }}
                    />
                    {errors.price && (
                      <p className="text-xs mt-1" style={{ color: colors.error }}>{errors.price}</p>
                    )}
                  </div>
                </motion.div>

                {/* Weight & Dimensions */}
                <motion.div variants={fieldVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: colors.muted }}>
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={form.weight}
                      onChange={(e) => handleChange('weight', e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: colors.muted }}>
                      Dimensions (L x W x H cm)
                    </label>
                    <input
                      type="text"
                      value={form.dimensions}
                      onChange={(e) => handleChange('dimensions', e.target.value)}
                      placeholder="30 x 20 x 10"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                </motion.div>

                {/* Delivery Time Info */}
                <motion.div variants={fieldVariants}>
                  <label className="text-sm font-medium mb-2 block" style={{ color: colors.muted }}>
                    Delivery Time Info
                  </label>
                  <input
                    type="text"
                    value={form.delivery_time_info}
                    onChange={(e) => handleChange('delivery_time_info', e.target.value)}
                    placeholder="Delivered within 2-3 business days"
                    className={inputClass}
                    style={inputStyle}
                  />
                </motion.div>

                {/* Features */}
                <motion.div variants={fieldVariants}>
                  <label className="text-sm font-medium mb-2 block" style={{ color: colors.muted }}>
                    Features (comma-separated)
                  </label>
                  <textarea
                    value={form.features}
                    onChange={(e) => handleChange('features', e.target.value)}
                    placeholder="Feature 1, Feature 2, Feature 3..."
                    rows={3}
                    className={inputClass}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </motion.div>

                {/* Warranty & Meta */}
                <motion.div variants={fieldVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: colors.muted }}>
                      Warranty Period
                    </label>
                    <input
                      type="text"
                      value={form.warranty_period}
                      onChange={(e) => handleChange('warranty_period', e.target.value)}
                      placeholder="1 Year"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: colors.muted }}>
                      Meta Description
                    </label>
                    <input
                      type="text"
                      value={form.meta_description}
                      onChange={(e) => handleChange('meta_description', e.target.value)}
                      placeholder="SEO description (160 chars max)"
                      maxLength={160}
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                </motion.div>


                {/* Main Image */}
                <motion.div variants={fieldVariants}>
                  <label className="text-sm font-medium mb-2 block" style={{ color: colors.muted }}>
                    Main Image
                  </label>
                  <input
                    ref={mainImageRef}
                    type="file"
                    accept="image/*"
                    onChange={handleMainImage}
                    className="hidden"
                  />
                  {mainImagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={mainImagePreview}
                        alt="Preview"
                        className="w-32 h-32 rounded-xl object-cover"
                        style={{ border: `1px solid ${colors.border}` }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setMainImage(null);
                          if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
                          setMainImagePreview(null);
                        }}
                        className="absolute -top-2 -right-2 p-1 rounded-full"
                        style={{ background: colors.error }}
                      >
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => mainImageRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-6 rounded-2xl border-dashed w-full justify-center"
                      style={{ borderColor: colors.faint, color: colors.muted }}
                    >
                      <ImagePlus size={20} />
                      Click to upload main image
                    </motion.button>
                  )}
                </motion.div>

                {/* Additional Images */}
                <motion.div variants={fieldVariants}>
                  <label className="text-sm font-medium mb-2 block" style={{ color: colors.muted }}>
                    Additional Images ({additionalImages.length}/10)
                  </label>
                  <input
                    ref={additionalImagesRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAdditionalImages}
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-3">
                    {additionalPreviews.map((src, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={src}
                          alt={`Additional ${idx + 1}`}
                          className="w-20 h-20 rounded-xl object-cover"
                          style={{ border: `1px solid ${colors.border}` }}
                        />
                        <button
                          type="button"
                          onClick={() => removeAdditionalImage(idx)}
                          className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full"
                          style={{ background: colors.error }}
                        >
                          <X size={10} className="text-white" />
                        </button>
                      </div>
                    ))}
                    {additionalImages.length < 10 && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => additionalImagesRef.current?.click()}
                        className="w-20 h-20 rounded-2xl border-dashed flex items-center justify-center"
                        style={{ borderColor: colors.faint, color: colors.faint }}
                      >
                        <Plus size={20} />
                      </motion.button>
                    )}
                  </div>
                </motion.div>

                {/* Specifications */}
                <motion.div variants={fieldVariants}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium" style={{ color: colors.muted }}>
                      Specifications
                    </label>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={addSpec}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(124,58,237,0.12)', color: colors.secondary }}
                    >
                      <Plus size={14} />
                      Add
                    </motion.button>
                  </div>
                  <div className="space-y-3">
                    {specifications.map((spec, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3"
                      >
                        <input
                          type="text"
                          value={spec.name}
                          onChange={(e) => updateSpec(idx, 'name', e.target.value)}
                          placeholder="Spec name"
                          className="flex-1 px-3 py-2.5 rounded-xl text-sm border outline-none"
                          style={inputStyle}
                        />
                        <input
                          type="text"
                          value={spec.value}
                          onChange={(e) => updateSpec(idx, 'value', e.target.value)}
                          placeholder="Spec value"
                          className="flex-1 px-3 py-2.5 rounded-xl text-sm border outline-none"
                          style={inputStyle}
                        />
                        {specifications.length > 1 && (
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeSpec(idx)}
                            className="p-2 rounded-lg hover:bg-white/5"
                            style={{ color: colors.error }}
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}

            {/* Toggles - ALWAYS VISIBLE */}
            <motion.div variants={fieldVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Toggle
                label="Is Active"
                value={form.is_active}
                onChange={(v) => handleChange('is_active', v)}
              />
              <Toggle
                label="Is Featured"
                value={form.is_featured}
                onChange={(v) => handleChange('is_featured', v)}
              />
            </motion.div>
          </div>

          {/* Actions */}
          <div
            className="flex items-center justify-end gap-3 mt-8 pt-6"
            style={{ borderTop: `1px solid ${colors.border}` }}
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/products')}
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
              {submitting ? 'Creating...' : 'Create Product'}
            </motion.button>
          </div>
        </motion.div>
      </form>
    </motion.div>
  );
}

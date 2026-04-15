// ProductDetailPage.tsx — Full-Width Glass Bento Layout
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShareIcon from '@mui/icons-material/Share';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SecurityIcon from '@mui/icons-material/Security';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import StarIcon from '@mui/icons-material/Star';
import MemoryIcon from '@mui/icons-material/Memory';
import SpeedIcon from '@mui/icons-material/Speed';
import ScaleIcon from '@mui/icons-material/Scale';
import StraightenIcon from '@mui/icons-material/Straighten';

import { useCartStore } from '../stores/cartStore';
import { useComparisonStore } from '../stores/comparisonStore';
import { useProductStore } from '../stores/productStore';
import { useSnackbar } from 'notistack';
import apiClient, { getImageUrl } from '../api';

// ── Match site design tokens exactly ─────────────────────────────────────────
const ACCENT = '#1C2B4A';
const GREEN = '#D4922A';
const BG = '#FAF9F5';
const TEXT = '#1A1814';
const MUTED = '#6B6156';
const GLASS_BG = 'rgba(255,255,255,0.95)';
const GLASS_BORDER = 'rgba(28,43,74,0.15)';

const glass: React.CSSProperties = {
  background: GLASS_BG,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: `1px solid ${GLASS_BORDER}`,
};

interface Product {
  id: number; name: string; slug: string; description: string;
  price: string; image: string;
  brand?: string; model_number?: string; warranty_period?: string;
  category: { name: string };
  additional_images?: Array<{ id: number; image: string }>;
  all_images?: string[];
  dimensions?: string; weight?: string; delivery_time_info?: string;
  features?: string; features_list?: string[];
  specifications_dict?: Record<string, string>;
  is_amazon_affiliate?: boolean; amazon_affiliate_link?: string;
}

const CSS = `
  @keyframes fadeUp     { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp    { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes pulseDot   { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.5)} 50%{box-shadow:0 0 0 6px rgba(16,185,129,0)} }
  @keyframes imgReveal  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes shimmer    { from{left:-100%} to{left:200%} }

  .glass-card {
    background: ${GLASS_BG};
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid ${GLASS_BORDER};
    border-radius: 24px;
    transition: border-color .3s, box-shadow .3s, transform .3s;
  }
  .glass-card-lift:hover {
    border-color: ${ACCENT};
    box-shadow: 0 0 20px rgba(28,43,74,0.18);
    transform: translateY(-4px);
  }

  /* ── Image showcase ── */
  .img-showcase {
    position: relative; overflow: hidden; cursor: zoom-in;
    display: flex; align-items: center; justify-content: center;
    min-height: 420px;
  }
  .img-showcase:hover .show-arrow { opacity: 1; }
  .show-img {
    max-width: 70%; max-height: 380px; object-fit: contain;
    transition: transform .45s cubic-bezier(.25,.46,.45,.94), opacity .16s;
    animation: imgReveal .32s ease;
  }
  .show-img:hover { transform: scale(1.05); }
  .show-img.fading { opacity: 0; transform: scale(.94); }
  .show-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 48px; height: 48px; border-radius: 50%;
    background: rgba(10,10,10,.8); backdrop-filter: blur(10px);
    border: 1px solid rgba(28,43,74,0.15);
    display: flex; align-items: center; justify-content: center;
    color: ${TEXT}; cursor: pointer; opacity: 0; z-index: 5;
    transition: opacity .2s, background .2s, transform .25s;
  }
  .show-arrow:hover { background: rgba(28,43,74,0.15); transform: translateY(-50%) scale(1.1); }
  .show-arrow.l { left: 20px; } .show-arrow.r { right: 20px; }

  /* ── Dot nav ── */
  .dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.15);
    cursor: pointer; transition: all .3s ease; }
  .dot.on { width: 32px; border-radius: 4px; background: ${ACCENT}; }

  /* ── CTA buttons ── */
  .cta-main {
    position: relative; overflow: hidden; width: 100%;
    padding: 18px 0; border: none; border-radius: 12px;
    background: ${ACCENT}; color: #fff;
    font: 900 13px/1 'Inter',sans-serif;
    text-transform: uppercase; letter-spacing: .12em;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    box-shadow: 0 0 20px rgba(28,43,74,0.22);
    transition: transform .2s, box-shadow .2s;
  }
  .cta-main::before {
    content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent);
    animation: shimmer 2.5s 1s ease-in-out infinite;
  }
  .cta-main:hover { transform: scale(1.02); box-shadow: 0 0 30px rgba(28,43,74,0.3); }
  .cta-main:active { transform: scale(.98); }

  .cta-ghost {
    width: 100%; padding: 18px 0; border-radius: 12px;
    background: rgba(28,43,74,.04); color: ${TEXT};
    border: 1px solid rgba(28,43,74,.2);
    font: 900 13px/1 'Inter',sans-serif;
    text-transform: uppercase; letter-spacing: .12em;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: background .2s, border-color .2s;
  }
  .cta-ghost:hover { background: rgba(28,43,74,.08); border-color: rgba(28,43,74,.35); }

  .cta-sm {
    flex: 1; padding: 14px 0; border-radius: 10px;
    background: rgba(28,43,74,.04); color: ${MUTED};
    border: 1px solid rgba(28,43,74,.12);
    font: 800 11px/1 'Inter',sans-serif;
    text-transform: uppercase; letter-spacing: .1em;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    transition: all .2s;
  }
  .cta-sm:hover { background: rgba(28,43,74,0.08); color: ${TEXT}; border-color: rgba(28,43,74,0.25); }

  /* ── Spec row ── */
  .spec-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid rgba(28,43,74,.08);
    transition: background .15s, padding .15s;
  }
  .spec-row:last-child { border-bottom: none; }
  .spec-row:hover { background: rgba(28,43,74,0.04); padding-inline: 12px; border-radius: 8px; }

  /* ── Feature card hover ── */
  .feat-card:hover { border-color: ${ACCENT} !important; box-shadow: 0 0 20px rgba(28,43,74,0.15); transform: translateY(-4px); }

  /* ── Float bar ── */
  .float-bar { animation: slideUp .28s ease; }

  /* ── Section fade ── */
  .section-in { animation: fadeUp .5s ease both; }

  /* ── Responsive ── */
  @media(max-width:960px) {
    .pdp-hero-grid { grid-template-columns: 1fr !important; }
    .pdp-info-grid { grid-template-columns: 1fr !important; }
    .pdp-trust-grid { grid-template-columns: 1fr 1fr !important; }
    .pdp-feat-grid { grid-template-columns: 1fr !important; }
    .pdp-pad { padding-inline: 24px !important; }
    .float-inner { padding: 12px 24px !important; flex-wrap: wrap; gap: 10px; }
  }
  @media(max-width:600px) {
    .pdp-trust-grid { grid-template-columns: 1fr !important; }
    .img-showcase { min-height: 280px; }
  }
`;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

export const ProductDetailPage: React.FC = () => {
  const isMobile            = useIsMobile();
  const { slug }            = useParams<{ slug: string }>();
  const navigate            = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [product, setProduct]           = useState<Product | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [img, setImg]                   = useState(0);
  const [fading, setFading]             = useState(false);
  const [lbOpen, setLbOpen]             = useState(false);
  const [lbIdx, setLbIdx]               = useState(0);
  const [floatBar, setFloatBar]         = useState(false);
  const [descOpen, setDescOpen]         = useState(false);
  const [specsExpanded, setSpecsExpanded] = useState(false);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const [relStart, setRelStart]           = useState(0);

  const ctaRef = useRef<HTMLDivElement>(null);
  const addToCart                          = useCartStore(s => s.addToCart);
  const { addItem: addToCompare, isFull } = useComparisonStore();
  
  const { products, fetchProducts } = useProductStore();

  useEffect(() => {
    if (products.length === 0) fetchProducts();
  }, [products.length, fetchProducts]);

  // Dynamically compute Amazon/Flipkart style Related Products (Pure Logic)
  const relatedProducts = React.useMemo(() => {
    if (!product || !products.length) return [];
    
    // 1. Attempt exact category match first
    let matches = products.filter(p => p.category?.name === product.category?.name && p.id !== product.id);
    
    // 2. Fallback Fill: If we have LESS than 10 related items, pull other products safely
    // so the carousel doesn't look empty or broken.
    if (matches.length < 10) {
      const otherProducts = products.filter(p => p.category?.name !== product.category?.name && p.id !== product.id);
      matches = [...matches, ...otherProducts];
    }
    
    return matches.slice(0, 10); // Guarantee exactly up to 10 products
  }, [product, products]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setRelStart(0); // Reset carousel on navigation
    if (!slug) return;
    (async () => {
      try   { setProduct((await apiClient.get(`/api/products/${slug}/`)).data); }
      catch { setError('not found'); }
      finally { setLoading(false); }
    })();
  }, [slug]);

  useEffect(() => {
    if (!ctaRef.current || !product) return;
    const obs = new IntersectionObserver(([e]) => setFloatBar(!e.isIntersecting), { threshold: 0, rootMargin: '-80px 0px 0px 0px' });
    obs.observe(ctaRef.current);
    return () => obs.disconnect();
  }, [product]);

  const images = product
    ? (product.all_images?.length ? product.all_images : product.image ? [product.image] : [])
    : [];

  // ── SUPER SEO INJECTOR (Google Rich Results & Ranking) ──
  useEffect(() => {
    if (!product) return;

    // 1. Dynamic Meta Title
    const pageTitle = `${product.name} | Buy Online - TechVerse Store`;
    document.title = pageTitle;

    // SEO Helper: Convert Relative images to Absolute via Origin (CRITICAL for Google)
    const getAbsoluteUrl = (path: string) => {
      const url = getImageUrl(path);
      return url.startsWith('/') ? window.location.origin + url : url;
    };

    // Deep SEO: Remove tracking parameters for Canonical URLs (eg. ?ref=amazon)
    const cleanCanonicalUrl = window.location.origin + window.location.pathname;

    // Helper to safely set/update DOM tags
    const setTag = (tagName: string, attrName: string, attrValue: string, contentAttrName: string, content: string) => {
      let tag = document.querySelector(`${tagName}[${attrName}="${attrValue}"]`);
      if (!tag) {
        tag = document.createElement(tagName);
        tag.setAttribute(attrName, attrValue);
        document.head.appendChild(tag);
      }
      tag.setAttribute(contentAttrName, content);
      return tag;
    };

    // 2. Build SEO Tag Graph
    const cleanDesc = product.description.replace(/\n/g, ' ').substring(0, 160) + '...';
    const activeTags = [
      setTag('meta', 'name', 'description', 'content', cleanDesc),
      setTag('meta', 'property', 'og:title', 'content', pageTitle),
      setTag('meta', 'property', 'og:description', 'content', cleanDesc),
      setTag('meta', 'property', 'og:type', 'content', 'product.item'),
      setTag('meta', 'property', 'og:url', 'content', cleanCanonicalUrl),
      setTag('link', 'rel', 'canonical', 'href', cleanCanonicalUrl) // Prevents duplicate content penalties
    ];

    if (images.length > 0) {
      activeTags.push(setTag('meta', 'property', 'og:image', 'content', getAbsoluteUrl(images[0])));
    }

    // 3. Strict Google JSON-LD E-Commerce Verification Layer
    const jsonLd = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": images.map(img => getAbsoluteUrl(img)),
      "description": cleanDesc,
      "sku": product.model_number || `SKU-${product.id}`, // Enforce fallback SKU 
      "mpn": product.model_number || undefined,           // Manufacturer Part Number
      "brand": {
        "@type": "Brand",
        "name": product.brand || product.category?.name || "TechVerse"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": Math.max(24, product.id * 3) // Dynamic trust signal 
      },
      "offers": {
        "@type": "Offer",
        "url": cleanCanonicalUrl,
        "priceCurrency": "INR",
        "price": parseFloat(product.price) || 0,
        "itemCondition": "https://schema.org/NewCondition",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "TechVerse",
          "url": window.location.origin
        }
      }
    };

    let scriptTag = document.getElementById('seo-product-schema') as HTMLScriptElement;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'seo-product-schema';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.innerHTML = JSON.stringify(jsonLd);

    // Cleanup: Remove generic meta so it doesn't bleed back to other routes
    return () => {
      document.title = 'TechVerse | Premium Tech Store';
      scriptTag.remove();
      activeTags.forEach(t => t && t.remove());
    };
  }, [product, images]);

  useEffect(() => {
    if (!lbOpen) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     setLbOpen(false);
      if (e.key === 'ArrowRight') setLbIdx(p => (p + 1) % images.length);
      if (e.key === 'ArrowLeft')  setLbIdx(p => (p - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [lbOpen, images.length]);

  const sw = (i: number) => { setFading(true); setTimeout(() => { setImg(i); setFading(false); }, 150); };
  const fmt = (p: string) => parseFloat(p).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const handleCart  = () => { if (!product) return; addToCart(product, 1); enqueueSnackbar(`${product.name} added to cart!`, { variant: 'success' }); };
  const handleBuy = () => { 
    if (!product) return;
    const isAlreadyInCart = useCartStore.getState().items.some(i => i.product.id === product.id);
    if (!isAlreadyInCart) {
      addToCart(product, 1);
      enqueueSnackbar(`${product.name} added to cart!`, { variant: 'success' });
    }
    navigate('/checkout'); 
  };
  const handleCmp   = () => { if (!product) return; if (isFull()) { enqueueSnackbar('Max 2 items.', { variant: 'warning' }); return; } addToCompare(product as any); enqueueSnackbar('Added to compare!', { variant: 'info' }); };
  const handleShare = () => { navigator.clipboard.writeText(window.location.href); enqueueSnackbar('Link copied!', { variant: 'success' }); };

  if (loading) return <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress sx={{ color: ACCENT }} /></div>;
  if (error || !product) return (
    <div style={{ backgroundColor: BG, minHeight: '100vh', paddingTop: 120 }}>
      <div className="pdp-pad" style={{ padding: '0 64px' }}>
        <button onClick={() => navigate('/store')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: MUTED, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', cursor: 'pointer', marginBottom: 24 }}>
          <ArrowBackIcon fontSize="small" /> Back to Store
        </button>
        <div style={{ ...glass, borderRadius: 16, padding: 40, color: '#ef4444' }}>Product not found or has been removed.</div>
      </div>
    </div>
  );

  const hasSpecs = !!(product.specifications_dict && Object.keys(product.specifications_dict).length);
  const hasFeats = !!(product.features_list?.length || product.features);

  const quickSpecs = [
    { icon: <MemoryIcon sx={{ fontSize: 18, color: ACCENT }} />,      label: 'Brand',      value: product.brand || 'TechVerse' },
    { icon: <SpeedIcon sx={{ fontSize: 18, color: GREEN }} />,     label: 'Model',      value: product.model_number || 'N/A' },
    { icon: <SecurityIcon sx={{ fontSize: 18, color: ACCENT }} />,    label: 'Warranty',   value: product.warranty_period || '1 Year' },
    ...(product.dimensions ? [{ icon: <StraightenIcon sx={{ fontSize: 18, color: GREEN }} />, label: 'Dimensions', value: product.dimensions }] : []),
    ...(product.weight     ? [{ icon: <ScaleIcon sx={{ fontSize: 18, color: ACCENT }} />,        label: 'Weight',     value: product.weight }] : []),
  ];

  return (
    <div style={{ backgroundColor: BG, color: TEXT, fontFamily: "'Inter', sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{CSS}</style>

      {/* Ambient red mesh gradient — matches LandingPage */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'radial-gradient(at 0% 0%, rgba(250,248,245,0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(250,248,245,0.1) 0px, transparent 50%)' }} />

      {/* ────────────────────────────────────────────────────────── */}
      {/*  DESKTOP VIEW                                              */}
      {/* ────────────────────────────────────────────────────────── */}
      {!isMobile && (
        <main style={{ paddingTop: 100, paddingBottom: floatBar ? 90 : 64, position: 'relative', zIndex: 1 }}>

          {/* ═══════════════════ BACK BUTTON ═══════════════════ */}
          <div className="pdp-pad" style={{ padding: '0 64px', marginBottom: 24 }}>
          <button
            onClick={() => navigate('/store')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...glass, borderRadius: 10, padding: '10px 20px', color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', cursor: 'pointer', transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = TEXT; e.currentTarget.style.borderColor = ACCENT; }}
            onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = GLASS_BORDER; }}
          >
            <ArrowBackIcon sx={{ fontSize: 15 }} /> Back to Store
          </button>
        </div>

        {/* ═══════════════════ IMAGE SHOWCASE — 4-up Carousel ═══════════════════ */}
        <section className="pdp-pad section-in" style={{ padding: '0 64px', marginBottom: 24, position: 'relative' }}>

          {/* Carousel wrapper — clip happens here, arrows sit outside */}
          <div style={{ position: 'relative' }}>

            {/* Left Arrow */}
            {images.length > 1 && (
              <button
                onClick={() => sw(Math.max(0, img - 1))}
                style={{
                  position: 'absolute', left: -24, top: '50%', transform: 'translateY(-50%)', zIndex: 20,
                  width: 44, height: 44, borderRadius: '50%', background: 'rgba(10,10,10,0.9)',
                  border: `1px solid rgba(250,248,245,0.5)`, color: '#fff', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(250,248,245,0.25)', transition: 'background .2s',
                  opacity: img === 0 ? 0.35 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(10,10,10,0.9)'; }}
              >
                <ArrowBackIcon sx={{ fontSize: 18 }} />
              </button>
            )}

            {/* Right Arrow */}
            {images.length > 1 && (
              <button
                onClick={() => sw(Math.min(images.length - 1, img + 1))}
                style={{
                  position: 'absolute', right: -24, top: '50%', transform: 'translateY(-50%)', zIndex: 20,
                  width: 44, height: 44, borderRadius: '50%', background: 'rgba(10,10,10,0.9)',
                  border: `1px solid rgba(250,248,245,0.5)`, color: '#fff', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(250,248,245,0.25)', transition: 'background .2s',
                  opacity: img === images.length - 1 ? 0.35 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(10,10,10,0.9)'; }}
              >
                <ArrowForwardIcon sx={{ fontSize: 18 }} />
              </button>
            )}

            {/* Viewport — overflow:hidden clips the track */}
            <div style={{ overflow: 'hidden', borderRadius: 20 }}>

              {/* Sliding track — translates to show the right group of 4 */}
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  transition: 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  transform: `translateX(calc(-${Math.max(0, Math.min(img, images.length - 4))} * (25% + 3px)))`,
                  willChange: 'transform',
                }}
              >
                {images.map((im, i) => {
                  const isSelected = i === img;
                  return (
                    <div
                      key={i}
                      onClick={() => { sw(i); setLbIdx(i); setLbOpen(true); }}
                      style={{
                        flexShrink: 0,
                        width: 'calc(25% - 9px)',
                        height: 320,
                        borderRadius: 16,
                        overflow: 'hidden',
                        border: isSelected ? `2px solid ${ACCENT}` : '2px solid rgba(28,43,74,0.08)',
                        boxShadow: isSelected ? `0 0 20px rgba(28,43,74,0.25)` : '0 2px 12px rgba(0,0,0,0.12)',
                        cursor: 'pointer',
                        transition: 'all .3s ease',
                        position: 'relative',
                        background: 'rgba(0,0,0,0.4)',
                        transform: isSelected ? 'scale(1.025)' : 'scale(1)',
                      }}
                    >
                      <img
                        src={getImageUrl(im)}
                        alt={`${product.name} - ${i + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />

                      {/* Selected overlay */}
                      {isSelected && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,248,245,0.05)', pointerEvents: 'none' }} />
                      )}

                      {/* Image counter */}
                      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.65)', borderRadius: 12, padding: '4px 10px', fontSize: 10, fontWeight: 700, color: isSelected ? '#fff' : '#8A7D6E' }}>
                        {i + 1} / {images.length}
                      </div>

                      {/* Zoom hint on active */}
                      {isSelected && (
                        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.65)', borderRadius: 8, padding: '4px 9px', display: 'flex', alignItems: 'center', gap: 4, color: '#8A7D6E', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                          <ZoomInIcon sx={{ fontSize: 11 }} /> Zoom
                        </div>
                      )}

                      {/* Certified badge on first */}
                      {i === 0 && (
                        <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.65)', borderRadius: 20, padding: '5px 11px', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, animation: 'pulseDot 2s infinite', display: 'inline-block' }} />
                          <span style={{ fontSize: 9, fontWeight: 900, color: GREEN, textTransform: 'uppercase', letterSpacing: '.12em' }}>Certified</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dot indicators below */}
          {images.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
              {images.map((_, i) => (
                <div
                  key={i}
                  onClick={() => sw(i)}
                  style={{
                    width: i === img ? 24 : 7, height: 7, borderRadius: 4,
                    background: i === img ? ACCENT : 'rgba(28,43,74,0.2)',
                    cursor: 'pointer', transition: 'all .3s ease',
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* ═══════════════════ INFO + QUICK SPECS — Grid ═══════════════════ */}
        <section className="pdp-pad section-in" style={{ padding: '0 64px', marginBottom: 24 }}>
          <div className="pdp-info-grid" style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 24 }}>

            {/* LEFT: Product Info Card */}
            <div className="glass-card" style={{ padding: '44px 48px' }}>
              {/* Category */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 999, background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.2)', marginBottom: 20 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN }} />
                <span style={{ fontSize: 10, fontWeight: 900, color: GREEN, textTransform: 'uppercase', letterSpacing: '.12em' }}>{product.category.name}</span>
              </div>

              {/* Name */}
              <h1 style={{ fontSize: 'clamp(20px, 2.5vw, 32px)', fontWeight: 900, color: TEXT, lineHeight: 1.1, letterSpacing: '-0.5px', textTransform: 'uppercase', marginBottom: 12 }}>
                {product.name}
              </h1>

              {/* Stars */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 20 }}>
                {[...Array(5)].map((_, i) => <StarIcon key={i} sx={{ fontSize: 14, color: '#f59e0b' }} />)}
                <span style={{ fontSize: 10, color: MUTED, marginLeft: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Certified Product</span>
              </div>

              {/* Price */}
              <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(28,43,74,.1)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: MUTED }}>₹</span>
                  <span style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 900, color: TEXT, letterSpacing: '-1.5px', lineHeight: 1 }}>{fmt(product.price)}</span>
                </div>
                <span style={{ fontSize: 11, color: '#15803d', fontWeight: 600, marginTop: 6, display: 'block' }}>✓ Inclusive of all taxes · Free delivery</span>
              </div>

              {/* CTAs */}
              <div ref={ctaRef} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {product.is_amazon_affiliate ? (
                  <button className="cta-main" onClick={() => product.amazon_affiliate_link && window.open(product.amazon_affiliate_link, '_blank')}>
                    Buy on Amazon <ArrowForwardIcon sx={{ fontSize: 18 }} />
                  </button>
                ) : (<>
                  <button className="cta-main" onClick={handleCart}>
                    <ShoppingCartIcon sx={{ fontSize: 19 }} /> Add to Cart
                  </button>
                  <button className="cta-ghost" onClick={handleBuy}>
                    <FlashOnIcon sx={{ fontSize: 19 }} /> Buy Now
                  </button>
                </>)}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="cta-sm" onClick={handleCmp}><CompareArrowsIcon sx={{ fontSize: 15 }} /> Compare</button>
                  <button className="cta-sm" onClick={handleShare}><ShareIcon sx={{ fontSize: 15 }} /> Share</button>
                </div>
              </div>
            </div>

            {/* RIGHT: Quick Specs Card */}
            <div className="glass-card" style={{ padding: '44px 40px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <span style={{ width: 4, height: 28, borderRadius: 2, background: ACCENT }} />
                <span style={{ fontSize: 14, fontWeight: 900, color: TEXT, textTransform: 'uppercase', letterSpacing: '.1em' }}>Quick Specs</span>
              </div>

              <div style={{ flex: 1 }}>
                {quickSpecs.map((s, i) => (
                  <div key={i} className="spec-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {s.icon}
                      <span style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Delivery info at bottom */}
              <div style={{ marginTop: 24, padding: '16px 20px', borderRadius: 12, background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.15)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <LocalShippingIcon sx={{ fontSize: 20, color: GREEN }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: GREEN }}>{product.delivery_time_info || 'Free Express Delivery'}</div>
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Across India</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════ DESCRIPTION — Full-Width Glass Card ═══════════════════ */}
        <section className="pdp-pad section-in" style={{ padding: '0 64px', marginBottom: 24 }}>
          <div className="glass-card" style={{ padding: '40px 48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ width: 4, height: 28, borderRadius: 2, background: ACCENT }} />
              <span style={{ fontSize: 14, fontWeight: 900, color: TEXT, textTransform: 'uppercase', letterSpacing: '.1em' }}>About this Product</span>
            </div>
            <p style={{
              fontSize: 15, color: MUTED, lineHeight: 1.85, whiteSpace: 'pre-wrap', margin: 0,
            }}>
              {product.description}
            </p>
          </div>
        </section>

        {/* ═══════════════════ TRUST HIGHLIGHTS — 4 Glass Cards ═══════════════════ */}
        <section className="pdp-pad" style={{ padding: '0 64px', marginBottom: 48 }}>
          <div className="pdp-trust-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { icon: <VerifiedIcon sx={{ fontSize: 28, color: ACCENT }} />,          title: 'Genuine Product',    desc: '100% authentic & verified' },
              { icon: <LocalShippingIcon sx={{ fontSize: 28, color: GREEN }} />,   title: 'Free Delivery',      desc: product.delivery_time_info || 'Express shipping across India' },
              { icon: <SecurityIcon sx={{ fontSize: 28, color: ACCENT }} />,          title: product.warranty_period || '1 Year Warranty', desc: 'Full manufacturer coverage' },
              { icon: <SupportAgentIcon sx={{ fontSize: 28, color: GREEN }} />,    title: 'Expert Support',     desc: '24/7 technical assistance' },
            ].map((t, i) => (
              <div key={i} className="glass-card glass-card-lift" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: i % 2 === 0 ? 'rgba(28,43,74,0.08)' : 'rgba(16,185,129,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t.icon}
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: TEXT, textTransform: 'uppercase', letterSpacing: '-.02em' }}>{t.title}</div>
                <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════ SPECIFICATIONS ═══════════════════ */}
        {hasSpecs && (
          <section className="pdp-pad section-in" style={{ padding: '0 64px', marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <span style={{ width: 48, height: 2, background: ACCENT }} />
              <h2 style={{ fontSize: 22, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-.02em', margin: 0 }}>Technical Specifications</h2>
            </div>
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                {Object.entries(product.specifications_dict!).slice(0, specsExpanded ? undefined : 10).map(([key, val], idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      borderBottom: '1px solid rgba(28,43,74,0.08)',
                      borderRight: idx % 2 === 0 ? '1px solid rgba(28,43,74,0.08)' : 'none',
                      background: idx % 4 < 2 ? 'transparent' : 'rgba(28,43,74,0.02)',
                    }}
                  >
                    <div style={{ width: 180, flexShrink: 0, padding: '14px 20px', borderRight: '1px solid rgba(28,43,74,0.08)', background: 'rgba(28,43,74,0.04)' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: MUTED, textTransform: 'uppercase', letterSpacing: '.07em', lineHeight: 1.4, display: 'block' }}>{key}</span>
                    </div>
                    <div style={{ flex: 1, padding: '14px 20px' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: TEXT, lineHeight: 1.5 }}>{val}</span>
                    </div>
                  </div>
                ))}
              </div>
              {Object.keys(product.specifications_dict!).length > 10 && (
                <button
                  onClick={() => setSpecsExpanded(!specsExpanded)}
                  style={{ width: '100%', padding: '14px', background: 'rgba(28,43,74,0.03)', border: 'none', borderTop: '1px solid rgba(28,43,74,0.08)', color: ACCENT, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(28,43,74,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(28,43,74,0.03)'}
                >
                  {specsExpanded
                    ? `Show Less`
                    : `Show All ${Object.keys(product.specifications_dict!).length} Specifications`}
                  <span style={{ fontSize: 14 }}>{specsExpanded ? '▲' : '▼'}</span>
                </button>
              )}
            </div>
          </section>
        )}

        {/* ═══════════════════ FEATURES ═══════════════════ */}
        {hasFeats && (
          <section className="pdp-pad section-in" style={{ padding: '0 64px', marginBottom: 64 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <span style={{ width: 48, height: 2, background: GREEN }} />
              <h2 style={{ fontSize: 22, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-.02em', margin: 0 }}>Key Features</h2>
            </div>
            {product.features_list?.length ? (
              <div className="glass-card" style={{ padding: '8px 32px', overflow: 'hidden' }}>
                {product.features_list.slice(0, featuresExpanded ? undefined : 6).map((feat, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 16,
                      padding: '16px 0',
                      borderBottom: '1px solid rgba(28,43,74,0.08)',
                    }}
                  >
                    {/* Check icon */}
                    <div style={{ flexShrink: 0, marginTop: 2 }}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <circle cx="9" cy="9" r="8.5" stroke={idx % 3 === 0 ? ACCENT : idx % 3 === 1 ? GREEN : '#6366f1'} strokeOpacity="0.5"/>
                        <path d="M5.5 9L7.8 11.5L12.5 6.5" stroke={idx % 3 === 0 ? ACCENT : idx % 3 === 1 ? GREEN : '#6366f1'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p style={{ fontSize: 14, color: TEXT, lineHeight: 1.7, margin: 0, fontWeight: 400 }}>{feat}</p>
                  </div>
                ))}
                {product.features_list.length > 6 && (
                  <button
                    onClick={() => setFeaturesExpanded(!featuresExpanded)}
                    style={{ width: 'calc(100% + 64px)', margin: '0 -32px -8px -32px', padding: '14px', background: 'rgba(28,43,74,0.03)', border: 'none', borderTop: '1px solid rgba(28,43,74,0.08)', color: ACCENT, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background .2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(28,43,74,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(28,43,74,0.03)'}
                  >
                    {featuresExpanded ? 'Show Less' : `Show All ${product.features_list.length} Features`}
                    <span style={{ fontSize: 14 }}>{featuresExpanded ? '▲' : '▼'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '40px 48px' }}>
                <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.85, whiteSpace: 'pre-wrap', margin: 0, maxWidth: 800 }}>{product.features}</p>
              </div>
            )}
          </section>
        )}
        {/* ═══════════════════ RELATED PRODUCTS (Amazon/Flipkart Style - Carousel) ═══════════════════ */}
        {relatedProducts.length > 0 && (
          <section className="pdp-pad section-in" style={{ padding: '0 64px', marginBottom: 64, marginTop: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ width: 48, height: 2, background: ACCENT }} />
                <h2 style={{ fontSize: 22, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-.02em', margin: 0 }}>Customers Also Bought</h2>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => setRelStart(p => Math.max(0, p - 1))}
                  disabled={relStart === 0}
                  style={{ width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(28,43,74,0.06)', border: '1px solid rgba(28,43,74,0.15)', cursor: relStart === 0 ? 'not-allowed' : 'pointer', opacity: relStart === 0 ? 0.35 : 1, transition: 'all .2s' }}
                  onMouseEnter={e => { if (relStart > 0) { e.currentTarget.style.background = ACCENT; e.currentTarget.style.color = '#fff'; } }} 
                  onMouseLeave={e => { if (relStart > 0) { e.currentTarget.style.background = 'rgba(28,43,74,0.06)'; e.currentTarget.style.color = TEXT; } }}
                >
                  <ArrowBackIcon fontSize="small" sx={{ color: 'inherit' }} />
                </button>
                <button 
                  onClick={() => setRelStart(p => Math.min(p + 1, Math.max(0, relatedProducts.length - 1)))}
                  disabled={relStart >= Math.max(0, relatedProducts.length - 4)}
                  style={{ width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(28,43,74,0.06)', border: '1px solid rgba(28,43,74,0.15)', cursor: relStart >= Math.max(0, relatedProducts.length - 4) ? 'not-allowed' : 'pointer', opacity: relStart >= Math.max(0, relatedProducts.length - 4) ? 0.35 : 1, transition: 'all .2s' }}
                  onMouseEnter={e => { if (relStart < Math.max(0, relatedProducts.length - 1)) { e.currentTarget.style.background = ACCENT; e.currentTarget.style.color = '#fff'; } }} 
                  onMouseLeave={e => { if (relStart < Math.max(0, relatedProducts.length - 1)) { e.currentTarget.style.background = 'rgba(28,43,74,0.06)'; e.currentTarget.style.color = TEXT; } }}
                >
                  <ArrowForwardIcon fontSize="small" sx={{ color: 'inherit' }} />
                </button>
              </div>
            </div>
            
            <div style={{ overflow: 'hidden', padding: '10px 0' }}>
              <div style={{ 
                display: 'flex',
                gap: 24,
                transition: 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                transform: `translateX(calc(-${relStart} * (320px + 24px)))`,
                willChange: 'transform'
              }}>
                {relatedProducts.map(p => (
                  <div key={p.id} onClick={() => { navigate(`/product/${p.slug}`); window.scrollTo(0, 0); }} className="glass-card glass-card-lift" style={{ flexShrink: 0, width: 320, height: '100%', borderRadius: 16, padding: 24, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', aspectRatio: '1/1', marginBottom: 16, borderRadius: 12, overflow: 'hidden', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                      <img src={getImageUrl(p.image)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{p.category?.name}</div>
                    <div style={{ minHeight: 44, display: 'flex', alignItems: 'flex-start' }}>
                      <h4 style={{ margin: 0, color: TEXT, fontWeight: 700, fontSize: 13, lineHeight: 1.5, textTransform: 'uppercase', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', display: '-webkit-box' }}>{p.name}</h4>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 20 }}>
                      <p style={{ margin: 0, color: TEXT, fontWeight: 900, letterSpacing: '-0.5px' }}>₹{fmt(p.price)}</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {p.is_amazon_affiliate ? (
                          <button onClick={(e) => { e.stopPropagation(); if (p.amazon_affiliate_link) window.open(p.amazon_affiliate_link, '_blank'); }} style={{ height: 36, padding: '0 16px', background: ACCENT, borderRadius: 8, color: '#fff', border: 'none', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s' }} onMouseEnter={e => e.currentTarget.style.background = '#243660'} onMouseLeave={e => e.currentTarget.style.background = ACCENT}>
                            Amazon
                          </button>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); addToCart(p as any, 1); enqueueSnackbar('Added to Cart', { variant: 'success' }); }} style={{ height: 36, width: 36, padding: 0, background: 'rgba(28,43,74,0.06)', border: '1px solid rgba(28,43,74,0.15)', borderRadius: 8, color: TEXT, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s' }} onMouseEnter={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(28,43,74,0.06)'; e.currentTarget.style.color = TEXT; }}>
                            <ShoppingCartIcon fontSize="small" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/*  MOBILE VIEW (FLIPKART STYLE)                              */}
      {/* ────────────────────────────────────────────────────────── */}
      {isMobile && (
        <main style={{ paddingBottom: 0, background: '#F1F3F6', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
          
          {/* Mobile Sticky Header */}
          <div style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            <button onClick={() => navigate('/store')} style={{ border: 'none', background: 'none', padding: 0, display: 'flex', color: TEXT, cursor: 'pointer' }}>
              <ArrowBackIcon />
            </button>
            <div style={{ display: 'flex', gap: 16 }}>
              <button onClick={handleShare} style={{ border: 'none', background: 'none', padding: 0, display: 'flex', color: TEXT, cursor: 'pointer' }}>
                <ShareIcon />
              </button>
              <button onClick={() => navigate('/cart')} style={{ border: 'none', background: 'none', padding: 0, display: 'flex', color: TEXT, cursor: 'pointer' }}>
                <ShoppingCartIcon />
              </button>
            </div>
          </div>

          {/* Image Swipe Carousel */}
          <div style={{ background: '#fff', position: 'relative', paddingBottom: 16, marginBottom: 8 }}>
            <div 
              style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', width: '100vw', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} 
              onScroll={(e) => {
                const target = e.target as HTMLElement;
                const index = Math.round(target.scrollLeft / target.offsetWidth);
                if (index !== img) setImg(index);
              }}
            >
              <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
              {images.map((im, i) => (
                <div key={i} onClick={() => { setLbIdx(i); setLbOpen(true); }} style={{ flexShrink: 0, width: '100vw', height: '100vw', scrollSnapAlign: 'start', padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                  <img src={getImageUrl(im)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              ))}
            </div>
            
            {/* Dots */}
            {images.length > 1 && (
               <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
                 {images.map((_, i) => (
                   <div key={i} style={{ width: i === img ? 18 : 6, height: 6, borderRadius: 3, background: i === img ? ACCENT : '#E0E0E0', transition: 'all .2s' }} />
                 ))}
               </div>
            )}
          </div>

          {/* Pricing & Info Header */}
          <div style={{ background: '#fff', padding: '16px', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: '4px 10px', background: 'rgba(28,43,74,0.06)', borderRadius: 4, fontSize: 10, fontWeight: 800, color: ACCENT, textTransform: 'uppercase' }}>
              {product.category?.name}
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 500, margin: 0, lineHeight: 1.4, color: TEXT }}>{product.name}</h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
               <span style={{ padding: '2px 6px', background: GREEN, color: '#fff', borderRadius: 4, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                 <StarIcon sx={{ fontSize: 12 }} /> 4.8
               </span>
               <span style={{ fontSize: 13, color: MUTED }}>Verified Product</span>
            </div>

            <div style={{ marginTop: 8 }}>
               <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: TEXT }}>₹{fmt(product.price)}</span>
               </div>
               <span style={{ fontSize: 12, color: GREEN, fontWeight: 500, marginTop: 4, display: 'block' }}>Inclusive of all taxes</span>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div style={{ background: '#fff', padding: '16px', marginBottom: 8 }}>
             <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', color: TEXT }}>Highlights</h3>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { icon: <MemoryIcon sx={{ fontSize: 20, color: MUTED }}/>, l: 'Brand', v: product.brand || 'TechVerse' },
                  { icon: <SecurityIcon sx={{ fontSize: 20, color: MUTED }}/>, l: 'Warranty', v: product.warranty_period || '1 Year' },
                  ...((product.dimensions ? [{ icon: <StraightenIcon sx={{ fontSize: 20, color: MUTED }}/>, l: 'Dims', v: product.dimensions }] : []) as any),
                  { icon: <LocalShippingIcon sx={{ fontSize: 20, color: MUTED }}/>, l: 'Delivery', v: 'Express' }
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                     <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F1F3F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
                     <div>
                        <div style={{ fontSize: 12, color: MUTED, marginBottom: 2 }}>{s.l}</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: TEXT }}>{s.v}</div>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Accordion Specs */}
          {hasSpecs && (
            <div style={{ background: '#fff', padding: '16px', marginBottom: 8 }}>
               <button onClick={() => setSpecsExpanded(!specsExpanded)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', border: 'none', background: 'none', fontSize: 15, fontWeight: 600, color: TEXT, cursor: 'pointer' }}>
                  Product Details
                  <span style={{ transform: specsExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }}>▼</span>
               </button>
               {specsExpanded && (
                 <div style={{ marginTop: 16 }}>
                    {Object.entries(product.specifications_dict!).map(([k, v], i) => (
                      <div key={i} style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid #F0F0F0' }}>
                         <div style={{ width: '40%', fontSize: 13, color: MUTED, fontWeight: 400, paddingRight: 8 }}>{k}</div>
                         <div style={{ width: '60%', fontSize: 13, color: TEXT, lineHeight: 1.4, fontWeight: 500 }}>{v}</div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          {/* Accordion Description */}
          <div style={{ background: '#fff', padding: '16px', marginBottom: 8 }}>
               <button onClick={() => setDescOpen(!descOpen)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', border: 'none', background: 'none', fontSize: 15, fontWeight: 600, color: TEXT, cursor: 'pointer' }}>
                  Description
                  <span style={{ transform: descOpen ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }}>▼</span>
               </button>
               {descOpen && (
                 <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 14, color: '#333', lineHeight: 1.5, whiteSpace: 'pre-wrap', margin: 0 }}>{product.description}</p>
                 </div>
               )}
          </div>

          {/* Mobile Recommended Products */}
          {relatedProducts.length > 0 && (
            <div style={{ background: '#fff', padding: '16px 0', marginBottom: 8 }}>
               <div style={{ padding: '0 16px', marginBottom: 16 }}>
                 <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: TEXT }}>Similar Products</h2>
               </div>
               <div className="cat-strip" style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 16px 8px 16px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                 {relatedProducts.map((r: any) => (
                   <div key={r.id} onClick={() => navigate(`/product/${r.slug}`)} style={{ width: 130, flexShrink: 0, borderRadius: 8, border: '1px solid #EAEAEA', padding: 8, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                     <div style={{ width: '100%', aspectRatio: '1/1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, marginBottom: 8 }}>
                       <img src={getImageUrl(r.image)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                     </div>
                     <h3 style={{ fontSize: 13, fontWeight: 400, margin: '0 0 6px', color: TEXT, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>{r.name}</h3>
                     <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>₹{fmt(r.price)}</div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* Sticky Bottom Bar */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '10px 16px', borderTop: '1px solid #EAEAEA', display: 'flex', gap: 12, zIndex: 100, boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
             <button onClick={handleCmp} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E0E0E0', borderRadius: 6, background: '#fff', color: MUTED, flexShrink: 0, boxSizing: 'border-box', WebkitAppearance: 'none' }}>
               <CompareArrowsIcon sx={{ fontSize: 18 }} />
             </button>
             {product.is_amazon_affiliate ? (
                <button onClick={() => product.amazon_affiliate_link && window.open(product.amazon_affiliate_link, '_blank')} style={{ flex: 1, border: 'none', background: '#ff9f00', color: '#fff', borderRadius: 6, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', WebkitAppearance: 'none' }}>
                  BUY ON AMAZON
                </button>
             ) : (<>
                <button onClick={handleCart} style={{ flex: 1, border: 'none', background: '#fff', color: TEXT, borderRadius: 6, fontWeight: 600, fontSize: 13, borderTop: '1px solid #E0E0E0', borderBottom: '1px solid #E0E0E0', borderLeft: '1px solid #E0E0E0', borderRight: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxSizing: 'border-box', WebkitAppearance: 'none' }}>
                  ADD TO CART
                </button>
                <button onClick={handleBuy} style={{ flex: 1, border: 'none', background: '#fb641b', color: '#fff', borderRadius: 6, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxSizing: 'border-box', WebkitAppearance: 'none' }}>
                  <FlashOnIcon sx={{ fontSize: 16 }} /> BUY NOW
                </button>
             </>)}
          </div>
        </main>
      )}

      {/* ═══════════════════ LIGHTBOX (MOBILE FLIPKART STYLE) ═══════════════════ */}
      {isMobile && lbOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#fff', display: 'flex', flexDirection: 'column' }}>
           {/* Top Header */}
           <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-start' }}>
               <button onClick={() => setLbOpen(false)} style={{ border: 'none', background: 'none', padding: '8px 0', display: 'flex', color: '#333', cursor: 'pointer', fontSize: 24, lineHeight: 1 }}>
                   ✕
               </button>
           </div>
           
           {/* Slidable Images Container */}
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
               <div 
                  onTouchStart={(e) => {
                     (e.currentTarget as any).startX = e.touches[0].clientX;
                  }}
                  onTouchEnd={(e) => {
                     const startX = (e.currentTarget as any).startX;
                     if (startX == null) return;
                     const diffX = startX - e.changedTouches[0].clientX;
                     if (diffX > 40 && lbIdx < images.length - 1) setLbIdx(lbIdx + 1);
                     if (diffX < -40 && lbIdx > 0) setLbIdx(lbIdx - 1);
                     (e.currentTarget as any).startX = null;
                  }}
                  onMouseDown={(e) => {
                     (e.currentTarget as any).startX = e.clientX;
                  }}
                  onMouseUp={(e) => {
                     const startX = (e.currentTarget as any).startX;
                     if (startX == null) return;
                     const diffX = startX - e.clientX;
                     if (diffX > 40 && lbIdx < images.length - 1) setLbIdx(lbIdx + 1);
                     if (diffX < -40 && lbIdx > 0) setLbIdx(lbIdx - 1);
                     (e.currentTarget as any).startX = null;
                  }}
                  style={{ flex: 1, display: 'flex', width: '100vw', transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)', transform: `translateX(-${lbIdx * 100}vw)`, alignItems: 'center', cursor: images.length > 1 ? 'grab' : 'default' }} 
               >
                  {images.map((im, i) => (
                    <div key={i} style={{ flexShrink: 0, width: '100vw', height: '100%', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                      <img src={getImageUrl(im)} style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', pointerEvents: 'none' }} />
                    </div>
                  ))}
               </div>
               
               {/* Dots Component */}
               {images.length > 1 && (
                 <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
                   {images.map((_, i) => (
                     <div key={i} style={{ width: i === lbIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === lbIdx ? '#888' : '#e0e0e0', transition: 'all .2s' }} />
                   ))}
                 </div>
               )}
           </div>
        </div>
      )}

      {/* ═══════════════════ LIGHTBOX (DESKTOP) ═══════════════════ */}
      {!isMobile && lbOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.97)', backdropFilter: 'blur(18px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setLbOpen(false)}>
          <button onClick={() => setLbOpen(false)} style={{ position: 'absolute', top: 24, right: 24, width: 48, height: 48, ...glass, borderRadius: '50%', color: TEXT, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10000, transition: 'background .2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(250,248,245,.15)')} onMouseLeave={e => (e.currentTarget.style.background = GLASS_BG)}>✕</button>
          {images.length > 1 && <button onClick={e => { e.stopPropagation(); setLbIdx(p => (p - 1 + images.length) % images.length); }} style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', width: 56, height: 56, ...glass, borderRadius: '50%', color: TEXT, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10000, transition: 'all .2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,248,245,.15)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }} onMouseLeave={e => { e.currentTarget.style.background = GLASS_BG; e.currentTarget.style.transform = 'translateY(-50%)'; }}><ArrowBackIcon /></button>}
          <div onClick={e => e.stopPropagation()} style={{ width: '84vw', height: '84vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img key={lbIdx} src={getImageUrl(images[lbIdx])} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 24px 60px rgba(0,0,0,.9))', animation: 'imgReveal .3s ease' }} />
          </div>
          {images.length > 1 && <button onClick={e => { e.stopPropagation(); setLbIdx(p => (p + 1) % images.length); }} style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', width: 56, height: 56, ...glass, borderRadius: '50%', color: TEXT, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10000, transition: 'all .2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,248,245,.15)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }} onMouseLeave={e => { e.currentTarget.style.background = GLASS_BG; e.currentTarget.style.transform = 'translateY(-50%)'; }}><ArrowForwardIcon /></button>}
          <div style={{ position: 'absolute', bottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6 }}>
               {images.map((_, i) => <div key={i} onClick={e => { e.stopPropagation(); setLbIdx(i); }} className={`dot${i === lbIdx ? ' on' : ''}`} />)}
            </div>
            <span style={{ fontSize: 11, color: MUTED, fontWeight: 700 }}>{lbIdx + 1} of {images.length}</span>
          </div>
        </div>
      )}

      {/* ═══════════════════ FLOATING STICKY BAR ═══════════════════ */}
      {floatBar && (
        <div className="float-bar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 998, ...glass, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderBottom: 'none', borderTop: `1px solid ${GLASS_BORDER}` }}>
          <div className="float-inner" style={{ maxWidth: 1440, margin: '0 auto', padding: '14px 64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, overflow: 'hidden' }}>
              <div style={{ width: 48, height: 48, ...glass, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {images[0] && <img src={getImageUrl(images[0])} alt="" style={{ width: '76%', height: '76%', objectFit: 'contain' }} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: TEXT, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>{product.name}</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: TEXT, letterSpacing: '-1px', lineHeight: 1 }}>
                  <span style={{ fontSize: 12, color: MUTED }}>₹</span>{fmt(product.price)}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              {product.is_amazon_affiliate ? (
                <button className="cta-main" onClick={() => product.amazon_affiliate_link && window.open(product.amazon_affiliate_link, '_blank')} style={{ width: 'auto', padding: '12px 28px' }}>Buy on Amazon</button>
              ) : (<>
                <button className="cta-main" onClick={handleCart} style={{ width: 'auto', padding: '12px 28px', gap: 6 }}><ShoppingCartIcon sx={{ fontSize: 17 }} /> Add to Cart</button>
                <button className="cta-ghost" onClick={handleBuy} style={{ width: 'auto', padding: '12px 28px', gap: 6 }}><FlashOnIcon sx={{ fontSize: 17 }} /> Buy Now</button>
              </>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

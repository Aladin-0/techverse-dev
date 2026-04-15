import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProductStore } from '../stores/productStore';
import { useCartStore } from '../stores/cartStore';
import { useUserStore } from '../stores/userStore';
import { useComparisonStore } from '../stores/comparisonStore';
import { CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';
import apiClient from '../api';

import SearchIcon from '@mui/icons-material/Search';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CloseIcon from '@mui/icons-material/Close';

import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

import SwapVertIcon from '@mui/icons-material/SwapVert';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckIcon from '@mui/icons-material/Check';

import MemoryIcon from '@mui/icons-material/Memory';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';
import StorageIcon from '@mui/icons-material/Storage';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddIcon from '@mui/icons-material/Add';

const ACCENT = '#1C2B4A';
const GREEN = '#D4922A';
const BG_DARK = '#FAF9F5';
const TEXT = '#1A1814';
const MUTED = '#6B6156';

// Mobile-specific palette (Flipkart inspired but branded)
const M_BG = '#F1F3F6';
const M_PRICE = '#212121';
const M_DISC = '#388E3C';
const M_MRP = '#878787';

const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('laptop') || n.includes('computer')) return <LaptopMacIcon sx={{ fontSize: 18 }} />;
  if (n.includes('smartphone') || n.includes('phone')) return <SmartphoneIcon sx={{ fontSize: 18 }} />;
  if (n.includes('monitor') || n.includes('display')) return <MonitorIcon sx={{ fontSize: 18 }} />;
  if (n.includes('keyboard') || n.includes('mouse') || n.includes('peripheral')) return <KeyboardIcon sx={{ fontSize: 18 }} />;
  if (n.includes('audio') || n.includes('headphone')) return <HeadphonesIcon sx={{ fontSize: 18 }} />;
  if (n.includes('cpu')) return <MemoryIcon sx={{ fontSize: 18 }} />;
  if (n.includes('gpu')) return <DeveloperBoardIcon sx={{ fontSize: 18 }} />;
  if (n.includes('storage')) return <StorageIcon sx={{ fontSize: 18 }} />;
  return <InventoryIcon sx={{ fontSize: 18 }} />;
};

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http')) {
    if (path.includes(':8000')) return path.substring(path.indexOf('/media'));
    return path;
  }
  if (path.startsWith('/media')) return path;
  return `/media/${path}`;
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}



/* ─────────────────────────────────────────────────────── */
/*  Mobile Product Card — clean real-data only             */
/* ─────────────────────────────────────────────────────── */
function MobileProductCard({ p, onNavigate, onAddCart, onCompare }: {
  p: any;
  onNavigate: () => void;
  onAddCart: (e: React.MouseEvent) => void;
  onCompare: (e: React.MouseEvent) => void;
}) {
  const price = parseFloat(p.price);

  return (
    <div
      onClick={onNavigate}
      style={{
        background: '#fff',
        borderRadius: 0,
        margin: '0 0 1px',
        padding: '16px 14px',
        display: 'flex',
        gap: 12,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Product Image */}
      <div style={{ width: 100, height: 100, flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 4 }}>
        <img
          src={getImageUrl(p.image)}
          alt={p.name}
          style={{ width: '100%', height: 'auto', maxHeight: '100%', objectFit: 'contain' }}
          loading="lazy"
        />
      </div>

      {/* Product Info */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0, boxSizing: 'border-box' }}>
        {/* Name */}
        <p style={{ fontSize: 13.5, color: M_PRICE, fontWeight: 500, lineHeight: 1.45, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', boxSizing: 'border-box' }}>
          {p.name}
        </p>

        {/* Category chip */}
        <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, boxSizing: 'border-box' }}>
          {p.category?.name}
        </span>

        {/* Price */}
        <span style={{ fontSize: 18, fontWeight: 900, color: M_PRICE, letterSpacing: '-0.5px', marginBottom: 12, boxSizing: 'border-box' }}>
          ₹{price.toLocaleString()}
        </span>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 'auto', width: '100%', boxSizing: 'border-box' }}>
          {p.is_amazon_affiliate ? (
            <button
              onClick={(e) => { e.stopPropagation(); if (p.amazon_affiliate_link) window.open(p.amazon_affiliate_link, '_blank'); }}
              style={{ flex: 1, minWidth: 0, padding: '10px 8px', background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 12, border: 'none', borderRadius: 4, textTransform: 'uppercase', cursor: 'pointer', boxSizing: 'border-box', WebkitAppearance: 'none', outline: 'none' }}
            >
              <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Buy on Amazon</span>
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onAddCart(e); }}
              style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 8px', background: '#fff', color: ACCENT, fontWeight: 700, fontSize: 13, border: `1px solid ${ACCENT}`, borderRadius: 4, cursor: 'pointer', boxSizing: 'border-box', WebkitAppearance: 'none', outline: 'none' }}
            >
              <AddShoppingCartIcon sx={{ fontSize: 14, flexShrink: 0 }} /> 
              <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Buy Now</span>
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onCompare(e); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, padding: 0, borderRadius: 4, border: '1px solid #E0E0E0', background: '#fff', color: MUTED, cursor: 'pointer', flexShrink: 0, boxSizing: 'border-box', WebkitAppearance: 'none', outline: 'none' }}
          >
            <CompareArrowsIcon sx={{ fontSize: 16 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  MAIN PAGE                                              */
/* ─────────────────────────────────────────────────────── */
export const StorePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const products = useProductStore(s => s.products);
  const fetchProducts = useProductStore(s => s.fetchProducts);
  const { addToCart, openCart } = useCartStore();
  const { addItem: addToCompare, isFull: isCompareFull } = useComparisonStore();
  const { user, isAuthenticated } = useUserStore();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState('Category');

  // Swipe-to-dismiss refs for filter sheet
  const filterSheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragging = useRef(false);

  const onFilterDragStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragging.current = true;
    if (filterSheetRef.current) filterSheetRef.current.style.transition = 'none';
  };

  const onFilterDragMove = (e: React.TouchEvent) => {
    if (!dragging.current || !filterSheetRef.current) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) filterSheetRef.current.style.transform = `translateY(${delta}px)`;
  };

  const onFilterDragEnd = (e: React.TouchEvent) => {
    if (!dragging.current || !filterSheetRef.current) return;
    dragging.current = false;
    const delta = e.changedTouches[0].clientY - dragStartY.current;
    filterSheetRef.current.style.transition = 'transform 0.3s cubic-bezier(.16,1,.3,1)';
    if (delta > 80) {
      filterSheetRef.current.style.transform = 'translateY(100%)';
      setTimeout(() => setMobileFilterOpen(false), 300);
    } else {
      filterSheetRef.current.style.transform = 'translateY(0)';
    }
  };

  const bannerDragStartX = useRef<number>(0);
  const onBannerDragStart = (e: React.TouchEvent) => {
    bannerDragStartX.current = e.touches[0].clientX;
  };
  const onBannerDragEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - bannerDragStartX.current;
    if (deltaX > 40) goSlide(-1);
    else if (deltaX < -40) goSlide(1);
  };

  interface Banner { id: number; image: string; button_text: string; product_slug: string | null; external_link: string; }
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { apiClient.get('/api/banners/').then(res => setBanners(res.data)).catch(() => { }); }, []);

  const resetSlideTimer = useCallback(() => {
    if (slideTimer.current) clearInterval(slideTimer.current);
    if (banners.length > 1) slideTimer.current = setInterval(() => setCurrentBanner(p => (p + 1) % banners.length), 5000);
  }, [banners.length]);

  useEffect(() => { resetSlideTimer(); return () => { if (slideTimer.current) clearInterval(slideTimer.current); }; }, [resetSlideTimer]);

  const goSlide = (dir: number) => { setCurrentBanner(p => (p + dir + banners.length) % banners.length); resetSlideTimer(); };

  const handleBannerClick = (b: Banner) => {
    if (b.product_slug) navigate(`/product/${b.product_slug}`);
    else if (b.external_link) window.open(b.external_link, '_blank');
  };

  useEffect(() => {
    const affiliateName = localStorage.getItem('techverse_affiliate_name');
    const welcomed = sessionStorage.getItem('techverse_affiliate_welcomed');
    if (affiliateName && !welcomed) {
      enqueueSnackbar(`Creator Recognized: Supporting ${affiliateName}`, { variant: 'info', autoHideDuration: 6000, style: { background: 'rgba(250,248,245,0.9)', color: '#fff', fontWeight: 900, borderRadius: 12, border: '1px solid #fff' } });
      sessionStorage.setItem('techverse_affiliate_welcomed', 'true');
    }
  }, [enqueueSnackbar]);

  const q = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(q);
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [sortOption, setSortOption] = useState<string>('featured');
  const [maxPriceLimit, setMaxPriceLimit] = useState<number>(500000);
  const [currentPriceMax, setCurrentPriceMax] = useState<number>(500000);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});
  const [expandedSpecs, setExpandedSpecs] = useState<Record<string, boolean>>({});

  useEffect(() => { setSearchTerm(searchParams.get('q') || ''); }, [searchParams]);
  useEffect(() => { fetchProducts().finally(() => setLoading(false)); }, [fetchProducts]);
  useEffect(() => { setSelectedCategory(searchParams.get('category') || 'All Products'); }, [searchParams]);

  const categories = ['All Products', ...Array.from(new Set(products.map(p => p.category.name)))];

  const categoryProducts = React.useMemo(() =>
    selectedCategory === 'All Products' ? products : products.filter(p => p.category.name === selectedCategory),
    [products, selectedCategory]
  );

  useEffect(() => {
    if (categoryProducts.length > 0) {
      const h = Math.max(...categoryProducts.map(p => parseFloat(p.price)));
      setMaxPriceLimit(h); setCurrentPriceMax(h);
    } else { setMaxPriceLimit(500000); setCurrentPriceMax(500000); }
    setSelectedSpecs({});
  }, [categoryProducts, selectedCategory]);

  const availableSpecs = React.useMemo(() => {
    const specs: Record<string, Set<string>> = {};
    categoryProducts.forEach(p => {
      const sd = (p as any).specifications_dict;
      if (sd) Object.entries(sd).forEach(([k, v]) => { if (!specs[k]) specs[k] = new Set(); specs[k].add(v as string); });
    });
    const s: Record<string, string[]> = {};
    Object.keys(specs).forEach(k => { s[k] = Array.from(specs[k]).sort(); });
    return s;
  }, [categoryProducts]);

  const toggleSpec = (key: string, value: string) => {
    setSelectedSpecs(prev => {
      const cur = prev[key] || [];
      return { ...prev, [key]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value] };
    });
  };

  const filteredProducts = products.filter(p => {
    const ms = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const mc = selectedCategory === 'All Products' || p.category.name === selectedCategory;
    if (!ms || !mc) return false;
    if (parseFloat(p.price) > currentPriceMax) return false;
    let ok = true;
    Object.entries(selectedSpecs).forEach(([k, sv]) => {
      if (sv.length === 0) return;
      const ps = (p as any).specifications_dict;
      if (!ps || !ps[k] || !sv.includes(ps[k])) ok = false;
    });
    return ok;
  });

  let sortedProducts = [...filteredProducts];
  if (sortOption === 'price_asc') sortedProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  else if (sortOption === 'price_desc') sortedProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  else if (sortOption === 'newest') sortedProducts.sort((a, b) => b.id - a.id);

  const handleCategoryClick = (cat: string) => {
    if (cat === 'All Products') setSearchParams(new URLSearchParams());
    else setSearchParams({ category: cat });
    setMobileFilterOpen(false);
  };

  const handleAddContext = (e: React.MouseEvent, p: any) => { 
    e.stopPropagation(); 
    e.preventDefault();
    addToCart(p, 1); 
    openCart();
  };
  const handleCompare = (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    if (isCompareFull()) { alert("You can only compare up to 2 items at a time."); return; }
    addToCompare(p);
  };

  const featuredProductsList = sortedProducts.filter(p => p.is_featured);
  const featured = featuredProductsList[0] || null;
  const sideTop1 = featuredProductsList[1] || null;
  const sideTop2 = featuredProductsList[2] || null;
  const sideWide = featuredProductsList[3] || null;
  
  const displayedFeaturedIds = [featured?.id, sideTop1?.id, sideTop2?.id, sideWide?.id].filter(Boolean);
  const restProducts = sortedProducts.filter(p => !displayedFeaturedIds.includes(p.id));

  const SORT_OPTIONS = [
    { val: 'featured', label: 'Relevance' },
    { val: 'newest', label: 'Newest First' },
    { val: 'price_asc', label: 'Price — Low to High' },
    { val: 'price_desc', label: 'Price — High to Low' },
  ];

  // Filter panel left-side categories (Flipkart style)
  const filterPanelCategories = [
    { key: 'Category', label: 'Category' },
    { key: 'Price', label: 'Price Range' },
    ...Object.keys(availableSpecs).map(k => ({ key: k, label: k })),
  ];

  const hasActiveFilters = selectedCategory !== 'All Products' || currentPriceMax < maxPriceLimit || Object.values(selectedSpecs).some(v => v.length > 0);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${ACCENT}; border-radius: 10px; }
        .glass-card { background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); border: 1px solid rgba(28,43,74,0.15); transition: all 0.3s ease; }
        .glass-card:hover { border-color: ${ACCENT}; box-shadow: 0 0 20px rgba(28,43,74,0.18); transform: translateY(-4px); }
        .cat-strip::-webkit-scrollbar { display: none; }
        .cat-strip { -ms-overflow-style: none; scrollbar-width: none; }
        .m-sheet {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
          background: #fff; border-radius: 12px 12px 0 0;
          box-shadow: 0 -4px 24px rgba(0,0,0,0.18);
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(.16,1,.3,1);
        }
        .m-sheet.open { transform: translateY(0); }
        .m-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9998; opacity: 0; pointer-events: none; transition: opacity 0.25s; }
        .m-overlay.open { opacity: 1; pointer-events: all; }
        .m-prod-row:active { background: #f5f5f5; }
        button { font-family: 'Inter', sans-serif; cursor: pointer; }
        @media (max-width: 1023px) {
          .glass-card:hover { transform: none; box-shadow: none; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════
           MOBILE LAYOUT
      ══════════════════════════════════════════════════════════ */}
      {isMobile ? (
        <div style={{ minHeight: '100vh', background: M_BG, fontFamily: "'Inter', sans-serif", paddingTop: 60 }}>

          {/* ── UNIFIED STICKY HEADER: Search + Sort/Filter ── */}
          <div style={{ position: 'relative', zIndex: 200, background: '#fff' }}>

            {/* Search row */}
            <div style={{ padding: '10px 12px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#F3F4F6', borderRadius: 12, padding: '9px 14px', gap: 8 }}>
                <SearchIcon sx={{ fontSize: 18, color: '#9E9E9E', flexShrink: 0 }} />
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search products…"
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: M_PRICE, background: 'transparent', fontFamily: "'Inter', sans-serif" }}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} style={{ border: 'none', background: 'none', padding: 0, display: 'flex', color: '#9E9E9E', cursor: 'pointer' }}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </button>
                )}
              </div>
            </div>

            {/* Row 1: Sort + Filter (fixed, not scrollable) */}
            <div style={{ display: 'flex', borderTop: '1px solid #F0F0F0' }}>
              <button
                onClick={() => setMobileSortOpen(true)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px 0', border: 'none', borderRight: '1px solid #EEEEEE', background: '#fff', fontSize: 13, fontWeight: 600, color: M_PRICE, cursor: 'pointer' }}
              >
                <SwapVertIcon sx={{ fontSize: 17, color: ACCENT }} />
                Sort
              </button>
              <button
                onClick={() => setMobileFilterOpen(true)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px 0', border: 'none', background: hasActiveFilters ? 'rgba(28,43,74,0.04)' : '#fff', fontSize: 13, fontWeight: 600, color: hasActiveFilters ? ACCENT : M_PRICE, cursor: 'pointer' }}
              >
                <FilterListIcon sx={{ fontSize: 17, color: hasActiveFilters ? ACCENT : M_PRICE }} />
                Filter
                {hasActiveFilters && <span style={{ marginLeft: 2, background: ACCENT, color: '#fff', borderRadius: '50%', width: 15, height: 15, fontSize: 9, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>!</span>}
              </button>
            </div>

          </div>

          {/* ── RESULT COUNT ── */}
          <div style={{ padding: '8px 16px 6px' }}>
            <span style={{ fontSize: 12, color: M_MRP }}>{filteredProducts.length} results{selectedCategory !== 'All Products' ? ` for "${selectedCategory}"` : ''}{searchTerm ? ` matching "${searchTerm}"` : ''}</span>
          </div>

          {/* ── BANNER ── */}
          {banners.length > 0 ? (
            <div style={{ position: 'relative', height: 160, overflow: 'hidden', marginBottom: 8, borderRadius: 14, margin: '0 12px 8px' }} onTouchStart={onBannerDragStart} onTouchEnd={onBannerDragEnd}>
              <div style={{ display: 'flex', height: '100%', transition: 'transform 0.5s ease', transform: `translateX(-${currentBanner * 100}%)` }}>
                {banners.map(b => (
                  <div key={b.id} style={{ flex: 'none', width: '100%', height: '100%', position: 'relative' }} onClick={() => handleBannerClick(b)}>
                    <img src={getImageUrl(b.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {b.button_text && (
                      <div style={{ position: 'absolute', bottom: 14, left: 16 }}>
                        <span style={{ padding: '7px 18px', background: '#fff', color: ACCENT, fontWeight: 900, borderRadius: 4, fontSize: 12, textTransform: 'uppercase', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>{b.button_text}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {banners.length > 1 && (
                <div style={{ position: 'absolute', bottom: 8, right: 12, display: 'flex', gap: 4, zIndex: 10 }}>
                  {banners.map((_, i) => (
                    <div key={i} onClick={() => setCurrentBanner(i)} style={{ width: i === currentBanner ? 16 : 6, height: 6, borderRadius: 3, background: i === currentBanner ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all 0.3s', cursor: 'pointer' }} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ height: 130, background: `linear-gradient(135deg, ${ACCENT} 0%, #243660 100%)`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px', margin: '0 12px 8px', borderRadius: 14, overflow: 'hidden' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Premium Tech Store</span>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '4px 0', lineHeight: 1.1 }}>Define Your <span style={{ color: GREEN, fontStyle: 'italic' }}>Setup</span></h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: 0 }}>Genuine products · Expert support</p>
            </div>
          )}

          {/* ── LOADING ── */}
          {loading && <div style={{ textAlign: 'center', padding: 60 }}><CircularProgress sx={{ color: ACCENT }} /></div>}

          {/* ── PRODUCT LIST (Flipkart style) ── */}
          {!loading && sortedProducts.length > 0 && (
            <div style={{ background: M_BG }}>
              {sortedProducts.map((p, idx) => (
                <MobileProductCard
                  key={p.id}
                  p={p}
                  onNavigate={() => navigate(`/product/${p.slug}`)}
                  onAddCart={(e) => handleAddContext(e, p as any)}
                  onCompare={(e) => handleCompare(e, p as any)}
                />
              ))}
            </div>
          )}

          {/* ── EMPTY STATE ── */}
          {!loading && filteredProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: M_PRICE, marginBottom: 6 }}>No Results Found</p>
              <p style={{ fontSize: 13, color: M_MRP, marginBottom: 20 }}>Try adjusting your filters or search.</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('All Products'); setSearchParams({}); setSelectedSpecs({}); }}
                style={{ padding: '12px 28px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                Clear All Filters
              </button>
            </div>
          )}

          <div style={{ height: 80 }} />

          {/* ════════════════════════════════════════
               OVERLAY (shared for sort + filter)
          ════════════════════════════════════════ */}
          <div
            className={`m-overlay ${(mobileFilterOpen || mobileSortOpen) ? 'open' : ''}`}
            onClick={() => { setMobileFilterOpen(false); setMobileSortOpen(false); }}
          />

          {/* ════════════════════════════════════════
               SORT BOTTOM SHEET
          ════════════════════════════════════════ */}
          <div className={`m-sheet ${mobileSortOpen ? 'open' : ''}`} style={{ maxHeight: '55vh' }}>
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: M_PRICE }}>Sort By</span>
              <button onClick={() => setMobileSortOpen(false)} style={{ background: 'none', border: 'none', color: '#9E9E9E', display: 'flex', padding: 4 }}><CloseIcon sx={{ fontSize: 20 }} /></button>
            </div>
            <div style={{ padding: '8px 0' }}>
              {SORT_OPTIONS.map(opt => {
                const active = sortOption === opt.val;
                return (
                  <div
                    key={opt.val}
                    onClick={() => { setSortOption(opt.val); setMobileSortOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', cursor: 'pointer', background: active ? 'rgba(28,43,74,0.04)' : '#fff', borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent' }}
                  >
                    <span style={{ fontSize: 14, fontWeight: active ? 700 : 400, color: active ? ACCENT : M_PRICE }}>{opt.label}</span>
                    {active && <CheckIcon sx={{ fontSize: 18, color: ACCENT }} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ════════════════════════════════════════
               FILTER BOTTOM SHEET (2-panel Flipkart)
          ════════════════════════════════════════ */}
          <div
            ref={filterSheetRef}
            className={`m-sheet ${mobileFilterOpen ? 'open' : ''}`}
            style={{ maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* ── Drag handle strip ── */}
            <div
              onTouchStart={onFilterDragStart}
              onTouchMove={onFilterDragMove}
              onTouchEnd={onFilterDragEnd}
              style={{ padding: '10px 20px 0', flexShrink: 0, touchAction: 'none', cursor: 'grab', userSelect: 'none' }}
            >
              <div style={{ width: 40, height: 4, borderRadius: 2, background: '#DEDEDE', margin: '0 auto 12px' }} />
            </div>
            {/* Header */}
            <div style={{ padding: '0 20px 12px', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: M_PRICE }}>Filters</span>
              <button
                onClick={() => { setSelectedCategory('All Products'); setSearchParams({}); setSelectedSpecs({}); setCurrentPriceMax(maxPriceLimit); }}
                style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: ACCENT, cursor: 'pointer', padding: '4px 8px' }}
              >
                CLEAR ALL
              </button>
            </div>

            {/* Two-panel body */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* LEFT: filter category list */}
              <div style={{ width: 120, flexShrink: 0, borderRight: '1px solid #EEEEEE', overflowY: 'auto', background: '#FAFAFA' }}>
                {filterPanelCategories.map(fc => {
                  const active = activeFilterCategory === fc.key;
                  // Count active filters in this section
                  let badge = 0;
                  if (fc.key === 'Category' && selectedCategory !== 'All Products') badge = 1;
                  if (fc.key === 'Price' && currentPriceMax < maxPriceLimit) badge = 1;
                  if (availableSpecs[fc.key]) badge = (selectedSpecs[fc.key] || []).length;

                  return (
                    <div
                      key={fc.key}
                      onClick={() => setActiveFilterCategory(fc.key)}
                      style={{ padding: '14px 12px', cursor: 'pointer', background: active ? '#fff' : 'transparent', borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? ACCENT : '#555', lineHeight: 1.3 }}>{fc.label}</span>
                      {badge > 0 && (
                        <span style={{ background: ACCENT, color: '#fff', borderRadius: '50%', width: 14, height: 14, fontSize: 9, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{badge}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* RIGHT: filter options */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                {activeFilterCategory === 'Category' && (
                  <div>
                    {categories.map(cat => {
                      const checked = selectedCategory === cat;
                      return (
                        <div key={cat} onClick={() => { handleCategoryClick(cat); }} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12, cursor: 'pointer' }}>
                          <div style={{ width: 18, height: 18, border: `2px solid ${checked ? ACCENT : '#BDBDBD'}`, borderRadius: 3, background: checked ? ACCENT : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                            {checked && <CheckIcon sx={{ fontSize: 12, color: '#fff' }} />}
                          </div>
                          <span style={{ fontSize: 13, color: M_PRICE, fontWeight: checked ? 600 : 400 }}>{cat}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeFilterCategory === 'Price' && (
                  <div style={{ padding: '16px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <span style={{ fontSize: 12, color: M_MRP }}>₹0</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: ACCENT }}>₹{currentPriceMax.toLocaleString()}</span>
                      <span style={{ fontSize: 12, color: M_MRP }}>₹{maxPriceLimit.toLocaleString()}</span>
                    </div>
                    <input
                      type="range" min="0" max={maxPriceLimit} step="500" value={currentPriceMax}
                      onChange={(e) => setCurrentPriceMax(Number(e.target.value))}
                      style={{ width: '100%', accentColor: ACCENT, cursor: 'pointer', height: 4 }}
                    />
                    <p style={{ fontSize: 12, color: M_MRP, marginTop: 12 }}>Max price: ₹{currentPriceMax.toLocaleString()}</p>

                    {/* Quick price range chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                      {[10000, 25000, 50000, 100000, 200000].filter(v => v <= maxPriceLimit).map(v => {
                        const active = currentPriceMax === v;
                        return (
                          <button key={v} onClick={() => setCurrentPriceMax(v)} style={{ padding: '5px 12px', borderRadius: 999, border: `1.5px solid ${active ? ACCENT : '#E0E0E0'}`, background: active ? 'rgba(28,43,74,0.06)' : '#fff', color: active ? ACCENT : M_PRICE, fontSize: 12, fontWeight: active ? 700 : 400, cursor: 'pointer' }}>
                            Under ₹{(v / 1000).toFixed(0)}K
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {availableSpecs[activeFilterCategory] && (
                  <div>
                    {availableSpecs[activeFilterCategory].map(val => {
                      const checked = (selectedSpecs[activeFilterCategory] || []).includes(val);
                      return (
                        <div key={val} onClick={() => toggleSpec(activeFilterCategory, val)} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12, cursor: 'pointer' }}>
                          <div style={{ width: 18, height: 18, border: `2px solid ${checked ? ACCENT : '#BDBDBD'}`, borderRadius: 3, background: checked ? ACCENT : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                            {checked && <CheckIcon sx={{ fontSize: 12, color: '#fff' }} />}
                          </div>
                          <span style={{ fontSize: 13, color: M_PRICE, fontWeight: checked ? 600 : 400 }}>{val}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Apply button */}
            <div style={{ padding: '12px 16px 20px', borderTop: '1px solid #EEEEEE', background: '#fff', flexShrink: 0 }}>
              <button
                onClick={() => setMobileFilterOpen(false)}
                style={{ width: '100%', padding: '14px', background: ACCENT, color: '#fff', fontWeight: 900, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                Apply · {filteredProducts.length} Results
              </button>
            </div>
          </div>
        </div>

      ) : (
        /* ══════════════════════════════════════════════════════════
             DESKTOP LAYOUT — UNCHANGED
        ══════════════════════════════════════════════════════════ */
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: BG_DARK, color: TEXT, fontFamily: "'Inter', sans-serif", paddingTop: '80px' }}>

          {/* ─── SIDEBAR ─── */}
          <aside style={{ width: 260, flexShrink: 0, borderRight: '1px solid rgba(28,43,74,0.12)', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', zIndex: 50, position: 'sticky', top: '80px', height: 'calc(100vh - 80px)', borderTopRightRadius: 24, borderBottomRightRadius: 0 }}>
            <div style={{ padding: '20px 24px 16px' }}>
              <span style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', color: TEXT, letterSpacing: '-1px' }}>Store<span style={{ color: ACCENT }}>Hub</span></span>
              <p style={{ fontSize: 10, color: MUTED, fontWeight: 600, margin: '2px 0 0', letterSpacing: '0.04em' }}>{filteredProducts.length} products</p>
            </div>

            <nav style={{ flex: 1, padding: '0', overflowY: 'auto' }}>
              {/* Categories */}
              <div style={{ marginBottom: 8 }}>
                <p style={{ padding: '0 20px', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Categories</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
                  {categories.map(cat => {
                    const isActive = selectedCategory === cat;
                    return (
                      <div key={cat} onClick={() => { if (cat === 'All Products') setSearchParams(new URLSearchParams()); else setSearchParams({ category: cat }); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, color: isActive ? ACCENT : MUTED, background: isActive ? 'rgba(28,43,74,0.06)' : 'transparent', cursor: 'pointer', transition: 'all .18s ease', borderLeft: isActive ? `3px solid ${ACCENT}` : '3px solid transparent' }} onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.background = 'rgba(28,43,74,0.04)'; (e.currentTarget as HTMLDivElement).style.color = ACCENT; } }} onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.color = MUTED; } }}>
                        <span style={{ color: isActive ? ACCENT : MUTED, display: 'flex', transition: 'color .18s' }}>{getCategoryIcon(cat)}</span>
                        <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
                        {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, flexShrink: 0 }} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sort + Price + Specs */}
              <div style={{ borderTop: '1px solid rgba(28,43,74,0.08)', marginTop: 16, paddingTop: 20, paddingBottom: 20 }}>
                <p style={{ padding: '0 20px', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>Refine</p>
                <div style={{ padding: '0 12px', marginBottom: 24 }}>
                  <p style={{ fontSize: 11, color: TEXT, marginBottom: 10, fontWeight: 700, padding: '0 8px' }}>Sort By</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {SORT_OPTIONS.map(opt => {
                      const active = sortOption === opt.val;
                      return (
                        <button key={opt.val} onClick={() => setSortOption(opt.val)} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: `1px solid ${active ? 'rgba(28,43,74,0.20)' : 'transparent'}`, background: active ? 'rgba(28,43,74,0.06)' : 'transparent', color: active ? ACCENT : MUTED, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all .15s', fontFamily: "'Inter', sans-serif" }}>{opt.label}</button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ padding: '0 20px', marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <p style={{ fontSize: 11, color: TEXT, margin: 0, fontWeight: 700 }}>Max Price</p>
                    <span style={{ fontSize: 12, color: GREEN, fontWeight: 800, background: 'rgba(212,146,42,0.1)', padding: '2px 8px', borderRadius: 4 }}>₹{currentPriceMax.toLocaleString()}</span>
                  </div>
                  <input type="range" min="0" max={maxPriceLimit} step="500" value={currentPriceMax} onChange={(e) => setCurrentPriceMax(Number(e.target.value))} style={{ width: '100%', accentColor: ACCENT, cursor: 'pointer' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: MUTED }}>₹0</span>
                    <span style={{ fontSize: 10, color: MUTED }}>₹{maxPriceLimit.toLocaleString()}</span>
                  </div>
                </div>
                {Object.entries(availableSpecs).length > 0 && (
                  <div style={{ padding: '0 12px' }}>
                    {Object.entries(availableSpecs).map(([key, values]) => (
                      <div key={key} style={{ marginBottom: 12 }}>
                        <div onClick={() => { setExpandedSpecs(prev => ({ ...prev, [key]: !prev[key] })); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '8px 8px', borderRadius: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>{key}</span>
                          <span style={{ fontSize: 12, color: MUTED, transition: 'transform 0.2s', display: 'inline-block', transform: expandedSpecs[key] ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                        </div>
                        {expandedSpecs[key] && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 8px 4px' }}>
                            {values.map(val => {
                              const checked = (selectedSpecs[key] || []).includes(val);
                              return (
                                <button key={val} onClick={() => toggleSpec(key, val)} style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${checked ? ACCENT : 'rgba(28,43,74,0.15)'}`, background: checked ? ACCENT : 'transparent', color: checked ? '#fff' : MUTED, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', fontFamily: "'Inter', sans-serif" }}>{val}</button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ padding: '8px 16px 24px' }}>
                <div style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(28,43,74,0.04)', border: '1px solid rgba(28,43,74,0.10)' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>Need a Service?</p>
                  <p style={{ fontSize: 11, color: MUTED, margin: '0 0 14px', lineHeight: 1.5 }}>Expert repair & installation at your doorstep.</p>
                  <button onClick={() => navigate('/services')} style={{ width: '100%', padding: '9px', background: ACCENT, color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Book Service</button>
                </div>
              </div>
            </nav>

            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(28,43,74,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: isAuthenticated ? 'pointer' : 'default' }} onClick={() => isAuthenticated && navigate('/profile')}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(28,43,74,0.07)', border: '1px solid rgba(28,43,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {isAuthenticated ? <span style={{ color: ACCENT, fontWeight: 900, fontSize: 14 }}>{user?.name?.charAt(0)}</span> : <span style={{ color: MUTED, fontSize: 10, fontWeight: 900 }}>GU</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{isAuthenticated ? user?.name : 'Guest User'}</span>
                  <span style={{ fontSize: 10, color: isAuthenticated ? '#15803d' : MUTED, fontWeight: 600 }}>{isAuthenticated ? 'Member' : 'Login to Continue'}</span>
                </div>
              </div>
            </div>
          </aside>

          <main style={{ flex: 1, background: `radial-gradient(ellipse at top right, rgba(250,248,245,0.1), ${BG_DARK}, ${BG_DARK})` }}>
            <div style={{ padding: '40px' }}>
              {banners.length > 0 ? (
                <section style={{ position: 'relative', height: 400, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(28,43,74,0.12)', marginBottom: 40 }} onTouchStart={onBannerDragStart} onTouchEnd={onBannerDragEnd}>
                  <div style={{ display: 'flex', height: '100%', transition: 'transform 0.5s ease', transform: `translateX(-${currentBanner * 100}%)` }}>
                    {banners.map(b => (
                      <div key={b.id} style={{ flex: 'none', width: '100%', height: '100%', position: 'relative' }}>
                        <img src={getImageUrl(b.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {b.button_text && (
                          <div style={{ position: 'absolute', bottom: 40, left: 64, zIndex: 20 }}>
                            <button onClick={(e) => { e.stopPropagation(); handleBannerClick(b); }} style={{ padding: '12px 32px', background: '#fff', color: ACCENT, fontWeight: 900, borderRadius: 8, border: 'none', textTransform: 'uppercase', letterSpacing: '-0.05em', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', cursor: 'pointer', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>{b.button_text}</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {banners.length > 1 && (
                    <>
                      <div style={{ position: 'absolute', bottom: 20, right: 24, display: 'flex', gap: 8, zIndex: 10 }}>
                        {banners.map((_, i) => (
                          <div key={i} onClick={() => setCurrentBanner(i)} style={{ width: i === currentBanner ? 24 : 8, height: 8, borderRadius: 4, background: i === currentBanner ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all 0.3s', cursor: 'pointer' }} />
                        ))}
                      </div>
                    </>
                  )}
                </section>
              ) : (
                <section style={{ position: 'relative', height: 400, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(28,43,74,0.12)', marginBottom: 40 }}>
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, ${BG_DARK}, rgba(10,10,10,0.4), transparent)`, zIndex: 10 }} />
                  <img src="/stitch-hero.jpg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'relative', zIndex: 20, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 64, maxWidth: 700 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, background: 'rgba(57,255,20,0.2)', border: '1px solid rgba(57,255,20,0.3)', width: 'fit-content', marginBottom: 24 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN, display: 'block' }} />
                      <span style={{ fontSize: 10, fontWeight: 900, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.1em' }}>New Arrival: High-Performance Rigs</span>
                    </div>
                    <h1 style={{ fontSize: 64, fontWeight: 900, color: '#fff', lineHeight: 0.9, textTransform: 'uppercase', marginBottom: 24 }}>Define Your <br /><span style={{ color: '#D4922A', fontStyle: 'italic' }}>Setup</span></h1>
                    <p style={{ color: MUTED, fontSize: 16, fontWeight: 500, marginBottom: 32, maxWidth: 440 }}>The next evolution of performance hardware is here. Precision engineered for the world's most demanding creators.</p>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <button onClick={() => window.scrollTo(0, document.body.scrollHeight)} style={{ padding: '12px 32px', background: '#fff', color: ACCENT, fontWeight: 900, borderRadius: 8, border: 'none', textTransform: 'uppercase', letterSpacing: '-0.05em', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', cursor: 'pointer' }}>Shop Now</button>
                      <button onClick={() => navigate('/services')} style={{ padding: '12px 32px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 900, borderRadius: 8, backdropFilter: 'blur(8px)', textTransform: 'uppercase', letterSpacing: '-0.05em' }}>Custom Build</button>
                    </div>
                  </div>
                </section>
              )}

              {loading && <div style={{ textAlign: 'center', padding: 100 }}><CircularProgress sx={{ color: ACCENT }} /></div>}

              {!loading && featured && (
                <section style={{ marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: TEXT, textTransform: 'uppercase', letterSpacing: '-0.05em', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 48, height: 2, background: ACCENT }}></span>Trending Units
                    </h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => goSlide(-1)} style={{ padding: 8, border: '1px solid rgba(28,43,74,0.2)', borderRadius: '50%', background: '#fff', color: ACCENT, display: 'flex', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = ACCENT; }}><ChevronLeftIcon /></button>
                      <button onClick={() => goSlide(1)} style={{ padding: 8, border: '1px solid rgba(28,43,74,0.2)', borderRadius: '50%', background: '#fff', color: ACCENT, display: 'flex', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = ACCENT; }}><ChevronRightIcon /></button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
                    <div className="glass-card" onClick={() => navigate(`/product/${featured.slug}`)} style={{ gridColumn: 'span 7', height: 500, borderRadius: 24, padding: 32, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', position: 'relative', zIndex: 10 }}>
                        <div style={{ maxWidth: '45%' }}>
                          <span style={{ color: ACCENT, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10 }}>Featured</span>
                          <h3 style={{ fontSize: 36, fontWeight: 900, color: TEXT, marginTop: 8, lineHeight: 1, textTransform: 'uppercase', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{featured.name}</h3>
                          <p style={{ color: MUTED, marginTop: 16, fontSize: 14, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{featured.description}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 30, fontWeight: 900, color: TEXT, letterSpacing: '-1px' }}>₹{featured.price}</span>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={(e) => handleCompare(e, featured as any)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, background: 'rgba(28,43,74,0.06)', color: TEXT, borderRadius: 12, border: '1px solid rgba(28,43,74,0.15)', transition: 'background .2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(28,43,74,0.12)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(28,43,74,0.06)'}><CompareArrowsIcon fontSize="small" /></button>
                            {featured.is_amazon_affiliate ? (
                              <button onClick={(e) => { e.stopPropagation(); if (featured.amazon_affiliate_link) window.open(featured.amazon_affiliate_link, '_blank'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: ACCENT, color: '#0C0B09', fontWeight: 900, borderRadius: 12, border: 'none', textTransform: 'uppercase', transition: 'transform .2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>Buy on Amazon</button>
                            ) : (
                              <button onClick={(e) => handleAddContext(e, featured)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: GREEN, color: '#000', fontWeight: 900, borderRadius: 12, border: 'none', textTransform: 'uppercase', transition: 'transform .2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}><AddShoppingCartIcon fontSize="small" /> order now</button>
                            )}
                          </div>
                        </div>
                      </div>
                      <img src={getImageUrl(featured.image)} style={{ position: 'absolute', bottom: 16, right: 16, width: '45%', objectFit: 'contain', zIndex: 1 }} />
                    </div>
                    <div style={{ gridColumn: 'span 5', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                      {sideTop1 && (
                        <div className="glass-card" onClick={() => navigate(`/product/${sideTop1.slug}`)} style={{ borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer' }}>
                          <img src={getImageUrl(sideTop1.image)} style={{ width: 100, height: 100, objectFit: 'contain', marginBottom: 16 }} />
                          <span style={{ fontSize: 10, fontWeight: 900, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.1em' }}>New Arrival</span>
                          <h4 style={{ color: TEXT, fontWeight: 700, fontSize: 13, marginTop: 4, textTransform: 'uppercase', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', display: '-webkit-box' }}>{sideTop1.name}</h4>
                          <p style={{ color: GREEN, fontSize: 13, fontWeight: 900, marginTop: 8, letterSpacing: '-0.5px' }}>₹{sideTop1.price}</p>
                        </div>
                      )}
                      {sideTop2 && (
                        <div className="glass-card" onClick={() => navigate(`/product/${sideTop2.slug}`)} style={{ borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer' }}>
                          <img src={getImageUrl(sideTop2.image)} style={{ width: 100, height: 100, objectFit: 'contain', marginBottom: 16 }} />
                          <span style={{ fontSize: 10, fontWeight: 900, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Premium</span>
                          <h4 style={{ color: TEXT, fontWeight: 700, fontSize: 13, marginTop: 4, textTransform: 'uppercase', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', display: '-webkit-box' }}>{sideTop2.name}</h4>
                          <p style={{ color: GREEN, fontSize: 13, fontWeight: 900, marginTop: 8, letterSpacing: '-0.5px' }}>₹{sideTop2.price}</p>
                        </div>
                      )}
                      {sideWide && (
                        <div className="glass-card" onClick={() => navigate(`/product/${sideWide.slug}`)} style={{ gridColumn: 'span 2', borderRadius: 24, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                          <div style={{ position: 'relative', zIndex: 10, maxWidth: '45%' }}>
                            <span style={{ fontSize: 10, fontWeight: 900, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Special Edition</span>
                            <h4 style={{ color: TEXT, fontWeight: 700, fontSize: 18, marginTop: 4, textTransform: 'uppercase', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', display: '-webkit-box' }}>{sideWide.name}</h4>
                            <span style={{ marginTop: 16, display: 'inline-block', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: GREEN, borderBottom: `1px solid ${GREEN}`, paddingBottom: 2 }}>View Details</span>
                          </div>
                          <img src={getImageUrl(sideWide.image)} style={{ width: 160, height: 160, objectFit: 'contain', position: 'relative', zIndex: 10 }} />
                          <div style={{ position: 'absolute', right: 0, top: 0, width: 100, height: '100%', background: 'rgba(250,248,245,0.05)', transform: 'skewX(-12deg) translateX(30px)' }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {!loading && restProducts.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24, marginTop: 40 }}>
                  {restProducts.map(p => (
                    <div key={p.id} onClick={() => navigate(`/product/${p.slug}`)} className="glass-card" style={{ borderRadius: 16, padding: 24, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', aspectRatio: '1/1', marginBottom: 16, borderRadius: 12, overflow: 'hidden', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                        <img src={getImageUrl(p.image)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <h4 style={{ color: TEXT, fontWeight: 700, fontSize: 14, textTransform: 'uppercase', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', display: '-webkit-box' }}>{p.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 16 }}>
                        <p style={{ color: GREEN, fontWeight: 900, letterSpacing: '-0.5px' }}>₹{p.price}</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={(e) => handleCompare(e, p as any)} style={{ padding: 8, background: 'rgba(28,43,74,0.06)', border: '1px solid rgba(28,43,74,0.15)', borderRadius: 8, color: TEXT, display: 'flex', transition: 'all .2s' }} onMouseEnter={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(28,43,74,0.06)'; e.currentTarget.style.color = TEXT; }}><CompareArrowsIcon fontSize="small" /></button>
                          {p.is_amazon_affiliate ? (
                            <button onClick={(e) => { e.stopPropagation(); if (p.amazon_affiliate_link) window.open(p.amazon_affiliate_link, '_blank'); }} style={{ padding: '8px 16px', background: ACCENT, border: `1px solid ${ACCENT}`, borderRadius: 8, color: '#fff', display: 'flex', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', alignItems: 'center', transition: 'all .2s' }}>Buy on Amazon</button>
                          ) : (
                            <button onClick={(e) => handleAddContext(e, p as any)} style={{ padding: 8, background: 'rgba(28,43,74,0.06)', border: '1px solid rgba(28,43,74,0.15)', borderRadius: 8, color: TEXT, display: 'flex', transition: 'all .2s' }} onMouseEnter={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(28,43,74,0.06)'; e.currentTarget.style.borderColor = 'rgba(28,43,74,0.15)'; e.currentTarget.style.color = TEXT; }}><AddIcon fontSize="small" /></button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && filteredProducts.length === 0 && <div style={{ textAlign: 'center', color: MUTED, padding: 80, fontSize: 18 }}>No products found.</div>}

              <section style={{ padding: '40px 0', borderTop: '1px solid rgba(28,43,74,0.1)', marginTop: 80 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48 }}>
                  {[
                    { icon: <RocketLaunchIcon sx={{ fontSize: 36, color: ACCENT }} />, title: 'Fast Delivery', desc: 'Express shipping for all components within 24-48 hours across India.', color: ACCENT },
                    { icon: <VerifiedUserIcon sx={{ fontSize: 36, color: GREEN }} />, title: 'Genuine Products', desc: '100% authentic items with manufacturer warranty coverage.', color: GREEN },
                    { icon: <SupportAgentIcon sx={{ fontSize: 36, color: ACCENT }} />, title: '24/7 Support', desc: 'Expert technicians available around the clock to assist you.', color: ACCENT }
                  ].map(stat => (
                    <div key={stat.title} style={{ display: 'flex', gap: 16 }}>
                      {stat.icon}
                      <div>
                        <h5 style={{ color: TEXT, fontWeight: 900, fontSize: 13, textTransform: 'uppercase' }}>{stat.title}</h5>
                        <p style={{ color: MUTED, fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>{stat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </main>
        </div>
      )}
    </>
  );
};
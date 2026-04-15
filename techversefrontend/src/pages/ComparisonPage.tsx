import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

import { useComparisonStore } from '../stores/comparisonStore';
import { useCartStore } from '../stores/cartStore';
import { getImageUrl } from '../api';

const ACCENT = '#1C2B4A';
const AMBER = '#D4922A';
const BG = '#FAF9F5';
const TEXT = '#1A1814';
const MUTED = '#6B6156';
const SURFACE = '#FFFFFF';
const BORDER = 'rgba(28,43,74,0.1)';

export const ComparisonPage: React.FC = () => {
    const { items, clearItems } = useComparisonStore();
    const { addToCart } = useCartStore();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
    const [showAllSpecs, setShowAllSpecs] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 900);
        window.addEventListener('resize', handleResize);
        window.scrollTo(0, 0);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [prod1, prod2] = items;

    const getSpecValue = (product: any, key: string) => {
        if (product.specifications_dict?.[key]) return product.specifications_dict[key];
        if (key === 'Brand') return product.brand || 'TechVerse';
        if (key === 'Category') return product.category?.name || 'Hardware';
        return null;
    };

    const allSpecKeys = useMemo(() => {
        if (!prod1 || !prod2) return [];
        const keys = new Set<string>();
        if (prod1.specifications_dict) Object.keys(prod1.specifications_dict).forEach(k => keys.add(k));
        if (prod2.specifications_dict) Object.keys(prod2.specifications_dict).forEach(k => keys.add(k));
        if (keys.size === 0) {
            keys.add('Brand'); keys.add('Category');
        }

        const keyArray = Array.from(keys);

        // Sort: Keys present in both come first.
        keyArray.sort((a, b) => {
            const aVal1 = getSpecValue(prod1, a);
            const aVal2 = getSpecValue(prod2, a);
            const aBoth = aVal1 && aVal2;

            const bVal1 = getSpecValue(prod1, b);
            const bVal2 = getSpecValue(prod2, b);
            const bBoth = bVal1 && bVal2;

            if (aBoth && !bBoth) return -1;
            if (!aBoth && bBoth) return 1;
            return 0;
        });

        return keyArray;
    }, [prod1, prod2]);

    if (items.length < 2) {
        return (
            <div style={{ minHeight: '100vh', background: BG, color: TEXT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ padding: 48, borderRadius: 24, background: 'transparent', textAlign: 'center', maxWidth: 460 }}>
                    <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(28,43,74,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                        <CompareArrowsIcon sx={{ fontSize: 36, color: ACCENT }} />
                    </div>
                    <h2 style={{ fontSize: 32, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px', marginBottom: 16 }}>
                        Compare <span style={{ color: ACCENT }}>Products</span>
                    </h2>
                    <p style={{ color: MUTED, marginBottom: 40, fontSize: 16, lineHeight: 1.6 }}>Select two products from the store to unleash the detailed comparison engine.</p>
                    <button onClick={() => navigate('/store')} style={{ padding: '16px 40px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 13, cursor: 'pointer', transition: 'transform .2s', boxShadow: '0 8px 24px rgba(28,43,74,0.2)' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Return to Store
                    </button>
                </div>
            </div>
        );
    }

    // Sub-components to keep render body clean
    const ProductHeader = ({ product, color }: { product: any, color: string }) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: SURFACE, padding: isMobile ? '12px 6px' : '40px 32px', borderRadius: isMobile ? 16 : 24, border: `1px solid ${BORDER}`, height: '100%', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
            <div style={{ height: isMobile ? 80 : 200, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: isMobile ? 12 : 24, background: 'rgba(28,43,74,0.02)', borderRadius: isMobile ? 8 : 16 }}>
                <img src={getImageUrl(product.image)} alt={product.name} style={{ maxHeight: '80%', maxWidth: '80%', objectFit: 'contain' }} />
            </div>
            <h3 style={{ fontSize: isMobile ? 11 : 20, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.3px', marginBottom: 4, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {product.name}
            </h3>
            <p style={{ color: MUTED, fontSize: isMobile ? 9 : 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'auto' }}>
                {product.brand || 'TechVerse'}
            </p>
            <div style={{ marginTop: isMobile ? 12 : 24, width: '100%' }}>
                <div style={{ fontSize: isMobile ? 15 : 32, fontWeight: 900, color: TEXT, letterSpacing: '-1px', marginBottom: isMobile ? 8 : 16 }}>
                    ₹{product.price?.toLocaleString?.() ?? product.price}
                </div>
                <button onClick={() => addToCart(product, 1)}
                    style={{ width: '100%', padding: isMobile ? '8px 0' : '16px 0', background: color, color: color === AMBER ? '#fff' : '#fff', border: 'none', borderRadius: isMobile ? 8 : 12, fontWeight: 900, fontSize: isMobile ? 9 : 13, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all .2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}40`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                    {!isMobile && <AddShoppingCartIcon sx={{ fontSize: 16 }} />} Add To Cart
                </button>
            </div>
        </div>
    );    const StickyTableHeader = ({ p1, p2 }: { p1: any, p2: any }) => (
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: BG, paddingBottom: 16, paddingTop: 16 }}>
            <div style={{ display: 'flex', background: SURFACE, border: `1px solid ${BORDER}`, borderBottom: 'none', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 0 }}>
                
                {/* Standardized Left Column identical to Matrix */}
                <div style={{ width: isMobile ? 80 : 260, flexShrink: 0, display: 'flex', alignItems: 'center', padding: isMobile ? '12px 8px' : '24px 32px' }}>
                    {!isMobile && <span style={{ fontSize: 13, fontWeight: 900, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Specifications</span>}
                </div>
                
                {/* Product 1 Sticky Slice */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12, padding: isMobile ? '12px 8px' : '24px 32px', borderLeft: `1px solid ${BORDER}` }}>
                    <img src={getImageUrl(p1.image)} style={{ flexShrink: 0, width: isMobile ? 24 : 32, height: isMobile ? 24 : 32, objectFit: 'contain' }} alt="P1" />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                       <span style={{ fontSize: isMobile ? 10 : 12, fontWeight: 800, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p1.name}</span>
                       {!isMobile && <span style={{ fontSize: 12, fontWeight: 900, color: ACCENT }}>₹{p1.price}</span>}
                    </div>
                </div>

                {/* Product 2 Sticky Slice */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12, padding: isMobile ? '12px 8px' : '24px 32px', borderLeft: `1px solid ${BORDER}` }}>
                    <img src={getImageUrl(p2.image)} style={{ flexShrink: 0, width: isMobile ? 24 : 32, height: isMobile ? 24 : 32, objectFit: 'contain' }} alt="P2" />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                       <span style={{ fontSize: isMobile ? 10 : 12, fontWeight: 800, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p2.name}</span>
                       {!isMobile && <span style={{ fontSize: 12, fontWeight: 900, color: AMBER }}>₹{p2.price}</span>}
                    </div>
                </div>
            </div>
        </div>
    );

    const visibleKeys = showAllSpecs ? allSpecKeys : allSpecKeys.slice(0, 15);

    return (
        <div style={{
            minHeight: '100vh',
            background: BG,
            color: TEXT,
            fontFamily: "'Inter', sans-serif",
            paddingTop: isMobile ? '80px' : '100px',
            paddingBottom: '100px',
        }}>
            <main style={{ maxWidth: '100%', margin: '0 auto', padding: isMobile ? '0 16px' : '0 40px' }}>

                {/* Nav */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                    <button onClick={() => navigate('/store')} style={{ background: 'transparent', border: 'none', color: MUTED, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, letterSpacing: '0.1em', transition: 'color 0.2s', padding: 0 }}
                        onMouseEnter={e => e.currentTarget.style.color = TEXT}
                        onMouseLeave={e => e.currentTarget.style.color = MUTED}>
                        <ArrowBackIcon sx={{ fontSize: 16 }} /> Back
                    </button>
                    <button onClick={() => { clearItems(); navigate('/store'); }}
                        style={{ background: 'rgba(28,43,74,0.05)', border: `1px solid ${BORDER}`, padding: '8px 16px', borderRadius: 8, color: MUTED, fontWeight: 800, fontSize: 11, textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.08em', transition: 'all .2s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = 'rgba(28,43,74,0.05)'; }}>
                        Clear Comparison
                    </button>
                </div>

                {/* Hero Title */}
                <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
                    <h1 style={{ fontSize: isMobile ? 32 : 56, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-2px', margin: '0 0 16px', lineHeight: 1 }}>
                        Head-To-Head
                    </h1>
                    <p style={{ color: MUTED, fontSize: isMobile ? 14 : 16, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
                        Compare tech specifications and find your perfect build.
                    </p>
                </div>

                {/* Premium Mobile Engine: Native Squeeze */}
                <div style={{ 
                    margin: isMobile ? '0 -16px' : '0', 
                    padding: isMobile ? '0 16px' : '0',
                }}>
                    <div>
                        
                        {/* Master Grid Header Elements */}
                        <div style={{ display: 'flex', gap: isMobile ? 8 : 32, marginBottom: isMobile ? 24 : 64, position: 'relative' }}>
                            {/* The VS Node */}
                            <div style={{ position: 'absolute', left: '50%', top: '40%', transform: 'translate(-50%, -50%)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: isMobile ? 28 : 64, height: isMobile ? 28 : 64, borderRadius: '50%', background: BG, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(28,43,74,0.08)' }}>
                                    <span style={{ fontSize: isMobile ? 10 : 18, fontWeight: 900, color: ACCENT, fontStyle: 'italic' }}>VS</span>
                                </div>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}><ProductHeader product={prod1} color={ACCENT} /></div>
                            <div style={{ flex: 1, minWidth: 0 }}><ProductHeader product={prod2} color={AMBER} /></div>
                        </div>

                        {/* Sticky Specification Matrix */}
                        <section style={{ position: 'relative' }}>
                            <StickyTableHeader p1={prod1} p2={prod2} />
                            
                            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderTop: 'none', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' }}>
                                {visibleKeys.map((key, idx) => {
                                    const val1 = getSpecValue(prod1, key);
                                    const val2 = getSpecValue(prod2, key);
                                    
                                    return (
                                        <div key={key} style={{
                                            display: 'flex',
                                            borderBottom: idx < visibleKeys.length - 1 ? `1px solid ${BORDER}` : 'none',
                                            background: idx % 2 === 0 ? 'transparent' : 'rgba(28,43,74,0.015)',
                                            alignItems: 'stretch'
                                        }}>
                                            {/* Left Column (Sticky Axis) */}
                                            <div style={{ 
                                                width: isMobile ? 80 : 260, 
                                                flexShrink: 0, 
                                                padding: isMobile ? '12px 8px' : '24px 32px', 
                                                display: 'flex', 
                                                alignItems: 'center',
                                                position: 'sticky',
                                                left: 0,
                                                background: idx % 2 === 0 ? SURFACE : '#FCFCFC',
                                                borderRight: `1px solid ${BORDER}`,
                                                zIndex: 10,
                                                boxShadow: isMobile ? '2px 0 8px rgba(0,0,0,0.02)' : 'none'
                                            }}>
                                                <span style={{ fontSize: isMobile ? 9 : 12, fontWeight: 800, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', wordBreak: 'break-word' }}>{key}</span>
                                            </div>
                                            
                                            {/* Product 1 Value */}
                                            <div style={{ flex: 1, minWidth: 0, padding: isMobile ? '12px 8px' : '24px 32px', borderRight: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center' }}>
                                                {val1 ? (
                                                    <span style={{ fontSize: isMobile ? 10 : 15, fontWeight: 600, color: TEXT, lineHeight: 1.4, wordBreak: 'break-word' }}>{val1}</span>
                                                ) : (
                                                    <span style={{ color: 'rgba(28,43,74,0.2)', fontSize: 16 }}>—</span>
                                                )}
                                            </div>
                                            
                                            {/* Product 2 Value */}
                                            <div style={{ flex: 1, minWidth: 0, padding: isMobile ? '12px 8px' : '24px 32px', display: 'flex', alignItems: 'center' }}>
                                                {val2 ? (
                                                    <span style={{ fontSize: isMobile ? 10 : 15, fontWeight: 600, color: TEXT, lineHeight: 1.4, wordBreak: 'break-word' }}>{val2}</span>
                                                ) : (
                                                    <span style={{ color: 'rgba(28,43,74,0.2)', fontSize: 16 }}>—</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {!showAllSpecs && allSpecKeys.length > 15 && (
                                    <div style={{ padding: '24px', textAlign: 'center', borderTop: `1px solid ${BORDER}` }}>
                                        <button onClick={() => setShowAllSpecs(true)} style={{ background: 'transparent', color: ACCENT, border: `1px solid ${ACCENT}`, borderRadius: 8, padding: '12px 24px', fontSize: 13, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.2s' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.color = '#fff'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ACCENT; }}>
                                            Show {allSpecKeys.length - 15} More Specs
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

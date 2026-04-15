import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComparisonStore } from '../stores/comparisonStore';
import { getImageUrl } from '../api';
import CloseIcon from '@mui/icons-material/Close';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

const ACCENT = '#1C2B4A';
const AMBER = '#D4922A';
const TEXT = '#1A1814';
const MUTED = '#6B6156';

export const ComparisonBar: React.FC = () => {
  const { items, removeItem, clearItems } = useComparisonStore();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (items.length === 0 || window.location.pathname === '/compare') return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: isMobile ? 16 : 0,
      left: isMobile ? 16 : 0,
      right: isMobile ? 16 : 0,
      width: isMobile ? 'calc(100% - 32px)' : '100%',
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: isMobile ? 'none' : `1px solid rgba(28,43,74,0.12)`,
      border: isMobile ? `1px solid rgba(28,43,74,0.12)` : undefined,
      borderRadius: isMobile ? 24 : 0,
      boxShadow: '0 -8px 32px rgba(28,43,74,0.12)',
      padding: isMobile ? '12px 16px' : '16px 32px',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: isMobile ? 12 : 32,
      zIndex: 9999,
      fontFamily: "'Inter', sans-serif"
    }}>
      
      {/* Mobile Header (Hidden on Desktop) */}
      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(28,43,74,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                 <CompareArrowsIcon sx={{ fontSize: 16, color: ACCENT }} />
                 <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: ACCENT }}>Compare ({items.length}/2)</span>
            </div>
            <button onClick={clearItems} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>Clear All</button>
        </div>
      )}

      {/* Main Container */ }
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 32, width: isMobile ? '100%' : 'auto', overflowX: 'auto', paddingBottom: isMobile ? 4 : 0 }}>
        
        {/* Desktop Title */}
        {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(28,43,74,0.06)', border: `1px solid rgba(28,43,74,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT }}>
                <CompareArrowsIcon />
            </div>
            <div>
                <h4 style={{ color: TEXT, margin: 0, fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.3px' }}>Compare Products</h4>
                <span style={{ color: MUTED, fontSize: 12, fontWeight: 500 }}>{items.length} / 2 Selected</span>
            </div>
            </div>
        )}

        <div style={{ display: 'flex', gap: isMobile ? 8 : 16, flex: isMobile ? 1 : 'none' }}>
          {[0, 1].map((index) => {
            const item = items[index];
            if (item) {
              return (
                <div key={item.id} style={{ display: 'flex', flex: isMobile ? 1 : 'none', alignItems: 'center', gap: 12, background: 'rgba(28,43,74,0.04)', padding: isMobile ? '6px 10px' : '8px 16px', borderRadius: 12, border: '1px solid rgba(28,43,74,0.1)', minWidth: isMobile ? 0 : 200, position: 'relative' }}>
                  <img src={getImageUrl(item.image)} alt={item.name} style={{ width: isMobile ? 28 : 40, height: isMobile ? 28 : 40, objectFit: 'contain' }} />
                  {!isMobile && (
                      <div>
                        <h5 style={{ color: TEXT, margin: 0, fontSize: 12, fontWeight: 700, WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', display: '-webkit-box', maxWidth: 120 }}>{item.name}</h5>
                        <span style={{ color: AMBER, fontSize: 12, fontWeight: 900 }}>₹{item.price}</span>
                      </div>
                  )}
                  <button onClick={() => removeItem(item.id)} style={{ position: 'absolute', top: -8, right: -8, background: 'rgba(255,255,255,1)', color: MUTED, border: '1px solid rgba(28,43,74,0.15)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(28,43,74,0.1)' }}>
                    <CloseIcon style={{ fontSize: 13 }} />
                  </button>
                </div>
              );
            }
            return (
              <div key={`empty-${index}`} style={{ display: 'flex', flex: isMobile ? 1 : 'none', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,43,74,0.02)', border: '1px dashed rgba(28,43,74,0.15)', padding: '8px 16px', borderRadius: 12, minWidth: isMobile ? 0 : 200, height: isMobile ? 42 : 58 }}>
                <span style={{ color: MUTED, fontSize: isMobile ? 10 : 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isMobile ? 'Slot' : 'Empty Slot'}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
        {!isMobile && (
            <button onClick={clearItems} style={{ background: 'transparent', border: 'none', color: MUTED, fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clear All</button>
        )}
        <button
          onClick={() => navigate('/compare')}
          disabled={items.length < 2}
          style={{
            background: items.length === 2 ? ACCENT : 'rgba(28,43,74,0.08)',
            color: items.length === 2 ? '#fff' : MUTED,
            padding: isMobile ? '12px 16px' : '12px 32px',
            borderRadius: 12,
            border: items.length === 2 ? 'none' : '1px solid rgba(28,43,74,0.12)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontSize: 12,
            cursor: items.length === 2 ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            boxShadow: items.length === 2 ? '0 4px 16px rgba(28,43,74,0.2)' : 'none',
            width: isMobile ? '100%' : 'auto'
          }}
        >
          {items.length === 2 ? 'Compare Now' : 'Select 2 Products'}
        </button>
      </div>
    </div>
  );
};

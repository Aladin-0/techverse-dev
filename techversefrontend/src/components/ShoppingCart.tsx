import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { getImageUrl } from '../api';

const ACCENT = '#1C2B4A';
const AMBER = '#D4922A';
const TEXT = '#1A1814';
const MUTED = '#8A8279';

export const CartIconButton: React.FC<{ onClick: () => void; totalItems: number }> = ({ onClick, totalItems }) => (
  <button
    onClick={onClick}
    style={{
      position: 'relative', background: 'rgba(28,43,74,0.06)',
      border: '1px solid rgba(28,43,74,0.1)', color: ACCENT, cursor: 'pointer',
      width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, transition: 'all 0.3s',
    }}
    onMouseOver={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.color = '#fff'; }}
    onMouseOut={e => { e.currentTarget.style.background = 'rgba(28,43,74,0.06)'; e.currentTarget.style.color = ACCENT; }}
  >
    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>shopping_cart</span>
    {totalItems > 0 && (
      <span style={{
        position: 'absolute', top: -6, right: -6, backgroundColor: AMBER,
        color: '#fff', borderRadius: 10, width: 20, height: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700,
      }}>
        {totalItems > 99 ? '99+' : totalItems}
      </span>
    )}
  </button>
);

export const ShoppingCart: React.FC = () => {
  const navigate = useNavigate();
  const { items, isOpen, closeCart, removeFromCart, updateQuantity, getTotalPrice, getTotalItems } = useCartStore();
  const totalPrice = getTotalPrice();

  const handleCheckout = () => { closeCart(); navigate('/checkout'); };
  const handleContinueShopping = () => { closeCart(); navigate('/store'); };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes cartSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes cartFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmerBtn { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={closeCart}
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)', zIndex: 1000,
          animation: 'cartFadeIn 0.3s ease-out',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '460px', maxWidth: '100vw',
        background: '#FAF9F5', borderLeft: '1px solid rgba(28,43,74,0.08)',
        color: TEXT, zIndex: 1001, display: 'flex', flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
        animation: 'cartSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.08)',
      }}>

        {/* Header */}
        <div style={{
          padding: '24px 28px', borderBottom: '1px solid rgba(28,43,74,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.03em' }}>
              Your Cart
            </h2>
            <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>{getTotalItems()} items</span>
          </div>
          <button
            onClick={closeCart}
            style={{
              background: 'rgba(28,43,74,0.04)', border: 'none', color: MUTED,
              cursor: 'pointer', width: 36, height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .2s',
            }}
            onMouseOver={e => { e.currentTarget.style.color = TEXT; e.currentTarget.style.background = 'rgba(28,43,74,0.08)'; }}
            onMouseOut={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.background = 'rgba(28,43,74,0.04)'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(28,43,74,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: MUTED }}>shopping_cart</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: TEXT }}>Your cart is empty</div>
              <div style={{ fontSize: 13, color: MUTED, marginBottom: 24, maxWidth: 240 }}>Looks like you haven't added anything yet.</div>
              <button
                onClick={handleContinueShopping}
                style={{
                  background: 'transparent', color: ACCENT, border: `1.5px solid rgba(28,43,74,0.15)`,
                  borderRadius: 24, padding: '10px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  transition: 'all .25s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = 'rgba(28,43,74,0.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(28,43,74,0.15)'; e.currentTarget.style.background = 'transparent'; }}
              >
                Browse Products
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  border: '1px solid rgba(28,43,74,0.06)',
                  padding: 16, borderRadius: 16,
                  display: 'flex', gap: 14, alignItems: 'center',
                  transition: 'all .25s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(28,43,74,0.12)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(28,43,74,0.06)'}
              >
                <div style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', background: 'rgba(28,43,74,0.03)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.product.image ? (
                    <img src={getImageUrl(item.product.image)} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 20, fontWeight: 700, color: MUTED }}>{item.product.name.charAt(0)}</span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.3, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{item.product.name}</h3>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: MUTED }}>{item.product.category.name}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', padding: 4, transition: 'color .2s', flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = MUTED}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(28,43,74,0.04)', borderRadius: 8, overflow: 'hidden' }}>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} style={{ background: 'none', border: 'none', color: TEXT, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600 }}>−</button>
                      <span style={{ width: 28, textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} style={{ background: 'none', border: 'none', color: TEXT, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600 }}>+</button>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>
                      ₹{(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        {items.length > 0 && (
          <div style={{ padding: '24px 28px', borderTop: '1px solid rgba(28,43,74,0.06)' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: MUTED }}>
              <span>Subtotal</span>
              <span style={{ color: TEXT, fontWeight: 600 }}>₹{totalPrice.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 13, color: MUTED }}>
              <span>Shipping</span>
              <span style={{ color: '#15803d', fontWeight: 600 }}>Free</span>
            </div>

            <div style={{ height: 1, background: 'rgba(28,43,74,0.06)', marginBottom: 20 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
              <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>Total</span>
              <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>₹{totalPrice.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              style={{
                width: '100%', padding: '16px', background: ACCENT, color: '#fff',
                border: 'none', borderRadius: 14, fontWeight: 600, fontSize: 14,
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(28,43,74,0.2)',
                transition: 'all .3s cubic-bezier(0.16,1,0.3,1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(28,43,74,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(28,43,74,0.2)'; }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', animation: 'shimmerBtn 2.5s infinite' }} />
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                Checkout <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, fontSize: 11, color: MUTED }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#15803d' }}>verified_user</span>
              Secure checkout · Free delivery
            </div>
          </div>
        )}
      </div>
    </>
  );
};

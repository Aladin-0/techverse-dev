import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { API_BASE_URL, getImageUrl } from '../api';

interface CartIconButtonProps {
  onClick: () => void;
  totalItems: number;
}

// Cart Icon Button Component
export const CartIconButton: React.FC<CartIconButtonProps> = ({ onClick, totalItems }) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        background: 'transparent',
        border: 'none',
        color: 'rgba(255, 255, 255, 0.8)',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
        transition: 'all 0.3s ease'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.color = '#ffffff';
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
      </svg>
      {totalItems > 0 && (
        <span style={{
          position: 'absolute',
          top: '0',
          right: '0',
          backgroundColor: '#60a5fa',
          color: 'white',
          borderRadius: '50%',
          width: '18px',
          height: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: '600',
          transform: 'translate(25%, -25%)'
        }}>
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
};

// Main Shopping Cart Component (Drawer/Sidebar)
export const ShoppingCart: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    isOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    getTotalItems
  } = useCartStore();

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  const handleCheckout = () => {
    closeCart();
    // Use React Router navigation instead of window.location
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    closeCart();
    // Use React Router navigation instead of window.location
    navigate('/store');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '420px',
          maxWidth: '100vw',
          background: `linear-gradient(135deg, rgba(10, 10, 10, 0.98) 0%, rgba(20, 20, 20, 0.95) 100%)`,
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
          color: 'white',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
            Shopping Cart ({totalItems})
          </div>
          <button
            onClick={closeCart}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {items.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              padding: '40px 24px',
              textAlign: 'center',
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="rgba(255, 255, 255, 0.3)" style={{ marginBottom: '16px' }}>
                <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                Your cart is empty
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', marginBottom: '24px' }}>
                Add some products to get started
              </div>
              <button
                onClick={handleContinueShopping}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  cursor: 'pointer',
                }}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '16px 0',
              }}>
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    style={{
                      padding: '16px 24px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                  >
                    {/* Product Image */}
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      {item.product.image ? (
                        <img
                          src={getImageUrl(item.product.image)}
                          alt={item.product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '18px' }}>
                          {item.product.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        color: 'white',
                        fontWeight: '500',
                        fontSize: '16px',
                        marginBottom: '4px',
                      }}>
                        {item.product.name}
                      </div>
                      <div style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '12px',
                        marginBottom: '8px',
                      }}>
                        {item.product.category.name}
                      </div>
                      <div style={{
                        color: '#60a5fa',
                        fontWeight: '600',
                        fontSize: '16px',
                      }}>
                        ₹{(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                      </div>
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(255, 255, 255, 0.5)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                      </button>

                      {/* Quantity Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.8)',
                            cursor: 'pointer',
                            padding: '8px',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px 0 0 8px',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 13H5v-2h14v2z" />
                          </svg>
                        </button>
                        <span style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          color: 'white',
                          fontWeight: '500',
                          minWidth: '40px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                        }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.8)',
                            cursor: 'pointer',
                            padding: '8px',
                            width: '32px',
                            height: '32px',
                            borderRadius: '0 8px 8px 0',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{
                padding: '24px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: `linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(10, 10, 10, 0.8) 100%)`,
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#60a5fa',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}>
                  Total: ₹{totalPrice.toFixed(2)}
                </div>
                <button
                  onClick={handleCheckout}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(96, 165, 250, 0.15)',
                    border: '1px solid rgba(96, 165, 250, 0.3)',
                    color: '#60a5fa',
                    borderRadius: '16px',
                    padding: '16px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.25)';
                    e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(96, 165, 250, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0px)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
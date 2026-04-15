// src/stores/cartStore.ts - Fixed to avoid circular dependency
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  image: string;
  category: {
    name: string;
  };
  is_amazon_affiliate?: boolean;
  amazon_affiliate_link?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  currentUserId: string | null;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  setCurrentUser: (userId: string | null) => void;
  switchUser: (userId: string | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      currentUserId: null,

      setCurrentUser: (userId) => {
        const state = get();

        // If switching to a different user, clear current cart and load user's cart
        if (state.currentUserId !== userId) {


          // Get the stored cart data for this user
          const storedData = localStorage.getItem('cart-storage');
          let userCarts: Record<string, CartItem[]> = {};

          if (storedData) {
            try {
              const parsed = JSON.parse(storedData);
              const container = parsed.state || parsed;
              userCarts = container.userCarts || {};
            } catch (error) {
              console.error('Error parsing stored cart data:', error);
            }
          }

          // Load this user's cart items
          let userCart: CartItem[] = userId ? (userCarts[userId] || []) : (userCarts['guest'] || []);

          // Strict isolation: do not merge guest cart into a user on login.
          // If logging in from guest -> user, clear any residual guest cart.
          const isGuestToUser = !state.currentUserId && !!userId;
          if (isGuestToUser) {
            userCarts['guest'] = [];
          }

          // When logging out (user -> guest), clear the guest cart so the next user won't see prior items.
          const isUserToGuest = !!state.currentUserId && !userId;
          if (isUserToGuest) {
            userCarts['guest'] = [];
            userCart = [];
          }

          set({
            currentUserId: userId,
            items: userCart,
            isOpen: false // Close cart when switching users
          });
        }
      },

      switchUser: (userId) => {
        get().setCurrentUser(userId);
      },

      addToCart: (product, quantity = 1) => {
        const state = get();
        const items = state.items;
        const existingItem = items.find(item => item.product.id === product.id);

        let newItems;
        if (existingItem) {
          newItems = items.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          newItems = [...items, { product, quantity }];
        }

        // Do not auto-open cart when adding items; keep current open state
        set({
          items: newItems
        });
      },

      removeFromCart: (productId) => {
        set({
          items: get().items.filter(item => item.product.id !== productId)
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        set({
          items: get().items.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          )
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          return total + (parseFloat(item.product.price) * item.quantity);
        }, 0);
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => {
        // Store cart data per user
        const storedData = localStorage.getItem('cart-storage');
        let userCarts: Record<string, CartItem[]> = {};

        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            const container = parsed.state || parsed;
            userCarts = container.userCarts || {};
          } catch (error) {
            console.error('Error parsing stored cart data:', error);
          }
        }
        // Update the current user's cart or guest cart when unauthenticated
        const key = state.currentUserId ?? 'guest';
        userCarts[key] = state.items;

        return {
          userCarts,
          currentUserId: state.currentUserId
        };
      },
      onRehydrateStorage: () => (state) => {
        // When rehydrating, restore items for current user or guest
        try {

          if (!state) return;

          const raw = localStorage.getItem('cart-storage');
          if (!raw) {
            state.items = [];
            return;
          }

          const parsed = JSON.parse(raw);
          const container = parsed.state || parsed;
          const userCarts: Record<string, CartItem[]> = container.userCarts || {};
          const key = state.currentUserId ?? 'guest';
          state.items = userCarts[key] || [];
        } catch (error) {
          console.error('Error during cart rehydration:', error);
          if (state) state.items = [];
        }
      }
    }
  )
);
import { create } from 'zustand';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  image: string;
  category: {
    name: string;
  };
  brand?: string;
  specifications_dict?: Record<string, string>;
  is_amazon_affiliate?: boolean;
  amazon_affiliate_link?: string;
}

interface ComparisonState {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  clearItems: () => void;
  isFull: () => boolean;
}

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  items: [],
  
  addItem: (product) => {
    const state = get();
    // Don't add if already exists
    if (state.items.find(item => item.id === product.id)) {
      return;
    }
    // Max 2 items for comparison
    if (state.items.length >= 2) {
      // Optional: Replace the oldest item or just reject.
      // E-commerce standard is often to reject or replace the first. We'll replace the first.
      set({ items: [state.items[1], product] });
    } else {
      set({ items: [...state.items, product] });
    }
  },
  
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId)
    }));
  },
  
  clearItems: () => {
    set({ items: [] });
  },

  isFull: () => {
    return get().items.length >= 2;
  }
}));

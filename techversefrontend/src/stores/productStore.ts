// src/stores/productStore.ts

import { create } from 'zustand';
import apiClient from '../api';

// Define the shape of a single product
interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  image: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  specifications_dict?: Record<string, string>;
  is_amazon_affiliate?: boolean;
  amazon_affiliate_link?: string;
}

// Define the shape of an address
interface Address {
  id: number;
  street_address: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

// Define the shape of our store's state
interface ProductState {
  products: Product[];
  addresses: Address[];
  trendingCategories: any[];
  fetchProducts: () => Promise<void>;
  fetchAddresses: () => Promise<void>;
  fetchTrendingCategories: () => Promise<void>;
}

// Create the store
export const useProductStore = create<ProductState>((set) => ({
  products: [],
  addresses: [],
  trendingCategories: [],
  fetchProducts: async () => {
    try {
      // Use apiClient for consistency and automatic base URL handling
      const response = await apiClient.get('/api/products/', {
        timeout: 10000 // Increased timeout for slower environments
      });

      // Handle both direct arrays and paginated results
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      set({ products: data });
    } catch (error) {
      console.error("Failed to fetch products:", error);
      set({ products: [] });
    }
  },
  fetchAddresses: async () => {
    try {
      const response = await apiClient.get('/api/addresses/');
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      set({ addresses: data });
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      set({ addresses: [] });
    }
  },
  fetchTrendingCategories: async () => {
    try {
      const response = await apiClient.get('/api/categories/trending/');
      const data = response.data?.categories || [];
      set({ trendingCategories: data });
    } catch (error) {
      console.error("Failed to fetch trending categories:", error);
      set({ trendingCategories: [] });
    }
  },
}));
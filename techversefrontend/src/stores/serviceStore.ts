// src/stores/serviceStore.ts - Fixed with is_free_for_user support
import { create } from 'zustand';
import apiClient from '../api';

interface ServiceIssue {
  id: number;
  description: string;
  price: string;
}

interface ServiceCategory {
  id: number;
  name: string;
  issues: ServiceIssue[];
  is_free_for_user?: boolean; // Add this field
}

interface ServiceState {
  categories: ServiceCategory[];
  trendingCategories: ServiceCategory[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  fetchTrendingCategories: () => Promise<void>;
}

export const useServiceStore = create<ServiceState>((set) => ({
  categories: [],
  trendingCategories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/api/service-categories/', {
        timeout: 5000
      });

      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format: expected array');
      }

      set({
        categories: response.data,
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error("Failed to fetch service categories:", error);
      const errorMessage = error?.response?.data?.error ||
        error?.message ||
        'Failed to load service categories';
      set({
        categories: [],
        loading: false,
        error: errorMessage
      });
    }
  },

  fetchTrendingCategories: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/api/trending-services/', {
        timeout: 5000
      });

      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format: expected array');
      }

      set({
        trendingCategories: response.data,
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error("Failed to fetch trending service categories:", error);
      const errorMessage = error?.response?.data?.error ||
        error?.message ||
        'Failed to load trending categories';
      set({
        trendingCategories: [],
        loading: false,
        error: errorMessage
      });
    }
  },
}));

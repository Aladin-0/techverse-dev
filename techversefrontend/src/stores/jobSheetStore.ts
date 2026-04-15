// src/stores/jobSheetStore.ts - Job Sheet State Management (FIXED)

import { create } from 'zustand';
import apiClient from '../api';

// Export the interfaces so they can be imported by other files
export type JobSheetMaterial = {
  id?: number;
  date_used: string;
  item_description: string;
  quantity: number;
  unit_cost: number;
  total_cost?: number;
}

export type JobSheet = {
  id: number;
  service_request_id: number;
  service_category_name: string;
  customer_name: string;
  customer_contact: string;
  service_address: string;
  equipment_type: string;
  serial_number: string;
  equipment_brand: string;
  equipment_model: string;
  problem_description: string;
  work_performed: string;
  date_of_service: string;
  start_time: string;
  finish_time: string;
  total_time_taken: string;
  approval_status: 'PENDING' | 'APPROVED' | 'DECLINED';
  declined_reason?: string;
  materials: JobSheetMaterial[];
  total_material_cost: number;
  technician_name: string;
  technician_phone: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
}

interface JobSheetStore {
  jobSheets: JobSheet[];
  loading: boolean;
  error: string | null;
  
  fetchJobSheets: () => Promise<void>;
  createJobSheet: (data: any) => Promise<JobSheet>;
  approveJobSheet: (jobSheetId: number) => Promise<void>;
  declineJobSheet: (jobSheetId: number, reason: string) => Promise<void>;
  getJobSheetDetail: (jobSheetId: number) => Promise<JobSheet>;
  clearError: () => void;
}

export const useJobSheetStore = create<JobSheetStore>((set, get) => ({
  jobSheets: [],
  loading: false,
  error: null,

  fetchJobSheets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/api/job-sheets/');
      set({ jobSheets: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch job sheets',
        loading: false 
      });
    }
  },

  createJobSheet: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/api/job-sheets/create/', data);
      
      // Refresh job sheets list
      await get().fetchJobSheets();
      
      set({ loading: false });
      return response.data.job_sheet;
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to create job sheet';
      set({ error: errorMsg, loading: false });
      throw new Error(errorMsg);
    }
  },

  approveJobSheet: async (jobSheetId) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post(`/api/job-sheets/${jobSheetId}/approve/`);
      
      // Refresh job sheets list
      await get().fetchJobSheets();
      
      set({ loading: false });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to approve job sheet';
      set({ error: errorMsg, loading: false });
      throw new Error(errorMsg);
    }
  },

  declineJobSheet: async (jobSheetId, reason) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post(`/api/job-sheets/${jobSheetId}/decline/`, { reason });
      
      // Refresh job sheets list
      await get().fetchJobSheets();
      
      set({ loading: false });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to decline job sheet';
      set({ error: errorMsg, loading: false });
      throw new Error(errorMsg);
    }
  },

  getJobSheetDetail: async (jobSheetId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/api/job-sheets/${jobSheetId}/`);
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to fetch job sheet details';
      set({ error: errorMsg, loading: false });
      throw new Error(errorMsg);
    }
  },

  clearError: () => set({ error: null }),
}));
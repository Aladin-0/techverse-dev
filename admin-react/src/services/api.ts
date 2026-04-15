import axios from 'axios';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Get CSRF token from cookie
function getCookie(name: string): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(name + '=')) {
      return decodeURIComponent(trimmed.substring(name.length + 1));
    }
  }
  return null;
}

// Add CSRF token and format=json
api.interceptors.request.use((config) => {
  if (config.method !== 'get') {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }

  // Add format=json to the URL parameters
  config.params = { ...config.params, format: 'json' };

  if (config.data instanceof FormData) {
    if (config.headers && config.headers['Content-Type']) {
      delete config.headers['Content-Type'];
    }
  }

  return config;
});


// On 401/403 redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API functions matching existing Django endpoints
export const adminApi = {
  // Stats / Dashboard
  getStats: () => api.get('/admin-panel/api/stats/'),
  getDashboard: () => api.get('/admin-panel/api/stats/'),

  // Auth
  getCsrf: () => api.get('/admin-panel/api/csrf/'),
  login: (email: string, password: string) =>
    api.post('/admin-panel/api/login/', { email, password }),

  // Users
  getUsers: (params?: { role?: string; search?: string; page?: number }) =>
    api.get('/admin-panel/api/users/', { params }),
  createUser: (data: FormData) =>
    api.post('/admin-panel/api/users/create/', data),
  updateUser: (id: number, data: FormData) =>
    api.post(`/admin-panel/api/users/${id}/edit/`, data),
  deleteUser: (id: number) => api.post(`/admin-panel/api/users/${id}/delete/`),

  // Products
  getProducts: (params?: { category?: string; status?: string; search?: string; page?: number }) =>
    api.get('/admin-panel/api/products/', { params }),
  getProductDetail: (id: number) => api.get(`/admin-panel/api/product/${id}/`),
  createProduct: (data: FormData) =>
    api.post('/admin-panel/api/products/create/', data),
  updateProduct: (id: number, data: FormData) =>
    api.post(`/admin-panel/api/products/${id}/edit/`, data),
  deleteProduct: (id: number) => api.post(`/admin-panel/api/products/${id}/delete/`),

  // Orders
  getOrders: (params?: { status?: string; technician?: string; search?: string; page?: number }) =>
    api.get('/admin-panel/api/orders/', { params }),
  getOrderDetails: (id: number) => api.get(`/admin-panel/api/orders/${id}/`),
  updateOrderStatus: (orderId: number, status: string) =>
    api.post('/admin-panel/api/update-order-status/', { order_id: orderId, status }),
  assignTechnician: (orderId: number, technicianId: number) =>
    api.post('/admin-panel/api/assign-technician/', { order_id: orderId, technician_id: technicianId }),
  deleteOrder: (id: number) => api.post(`/admin-panel/api/orders/${id}/delete/`),

  // Services
  getServices: (params?: { status?: string; category?: string; technician?: string; search?: string; page?: number }) =>
    api.get('/admin-panel/api/services/', { params }),
  getServiceDetail: (id: number) => api.get(`/admin-panel/api/service/${id}/`),
  updateServiceStatus: (serviceId: number, status: string) =>
    api.post('/admin-panel/api/update-service-status/', { service_id: serviceId, status }),
  assignServiceTechnician: (serviceId: number, technicianId: number) =>
    api.post('/admin-panel/api/assign-service-technician/', { service_id: serviceId, technician_id: technicianId }),

  // Categories
  getCategories: () => api.get('/admin-panel/api/categories/'),
  createCategory: (data: FormData) =>
    api.post('/admin-panel/api/categories/create/', data),
  editCategory: (id: number, data: FormData) =>
    api.post(`/admin-panel/api/categories/${id}/edit/`, data),
  deleteCategory: (id: number, type: string) =>
    api.post(`/admin-panel/api/categories/${id}/delete/`, { type }),

  // Analytics
  getAnalytics: (days?: number) => api.get('/admin-panel/api/analytics/', { params: { days } }),

  // Settings
  saveSettings: (data: Record<string, string>) =>
    api.post('/admin-panel/api/settings/', new URLSearchParams(data), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),

  // Job Sheets
  getJobSheets: () => api.get('/admin-panel/api/job-sheets/'),
  getJobSheetDetail: (id: number) => api.get(`/admin-panel/api/job-sheets/${id}/`),
  deleteJobSheet: (id: number) => api.post(`/admin-panel/api/job-sheets/${id}/delete/`),

  // Affiliates
  getAffiliates: () => api.get('/admin-panel/api/affiliates/'),
  createAffiliate: (data: FormData) =>
    api.post('/admin-panel/api/affiliates/create/', data),
  getAffiliateDetail: (id: number) => api.get(`/admin-panel/api/affiliates/${id}/`),
  updateAffiliate: (id: number, data: Record<string, unknown>) =>
    api.post(`/admin-panel/api/affiliates/${id}/update/`, data),

  // Banners
  getBanners: () => api.get('/admin-panel/api/banners/'),
  createBanner: (data: FormData) => {
    data.append('action', 'create');
    return api.post('/admin-panel/api/banners/', data);
  },
  editBanner: (data: FormData) => {
    data.append('action', 'edit');
    return api.post('/admin-panel/api/banners/', data);
  },
  deleteBanner: (id: number) => {
    const data = new FormData();
    data.append('action', 'delete');
    data.append('banner_id', String(id));
    return api.post('/admin-panel/api/banners/', data);
  },

  // Utils
  getImageUrl: (path: string | null | undefined): string => {
    if (!path) return '';
    if (path.startsWith('http')) {
      if (path.includes(':8000')) {
        return path.substring(path.indexOf('/media'));
      }
      return path;
    }
    if (path.startsWith('/media')) return path;
    return `/media/${path}`;
  },
};

export default api;

// src/stores/userStore.ts - Complete version with Google OAuth support
import { create } from 'zustand';
import apiClient, { API_BASE_URL } from '../api';

interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  has_password: boolean;  // false = Google-only user who hasn't set a password yet
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  setPassword: (newPassword: string, confirmPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (uid: string, token: string, newPassword: string, confirmPassword: string) => Promise<void>;
  setUserFromServer: (user: User) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });

    try {
      const response = await apiClient.post('/api/auth/login/', {
        email,
        password
      });

      const { access, refresh, user } = response.data;

      // Store JWT tokens
      localStorage.setItem('access_token', access);
      if (refresh) {
        localStorage.setItem('refresh_token', refresh);
      }

      // Sync cart for this user
      import('./cartStore').then(({ useCartStore }) => {
        useCartStore.getState().setCurrentUser(user.id.toString());
      }).catch(() => { });

      set({
        user,
        isAuthenticated: true,
        loading: false,
        error: null
      });

    } catch (error: any) {
      const errorMessage = error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        'Login failed. Please check your credentials.';

      set({
        loading: false,
        error: errorMessage,
        isAuthenticated: false,
        user: null
      });

      throw error;
    }
  },

  logout: async () => {
    try {
      // First, logout from Django session (clears session cookie)
      await apiClient.post('/api/users/logout-session/');  // Changed from /api/auth/logout/
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear JWT tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // Clear cart
    import('./cartStore').then(({ useCartStore }) => {
      useCartStore.getState().switchUser(null);
    }).catch(() => { });

    set({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });

    // Force redirect to home page after logout to clear all state
    window.location.href = '/';
  },

  checkAuthStatus: async () => {
    set({ loading: true });

    // First try JWT token
    const token = localStorage.getItem('access_token');

    if (token) {
      try {
        const response = await apiClient.get('/api/auth/user/');

        // Sync cart for this user
        import('./cartStore').then(({ useCartStore }) => {
          useCartStore.getState().setCurrentUser(response.data.id.toString());
        }).catch(() => { });

        set({
          user: response.data,
          isAuthenticated: true,
          loading: false,
          error: null
        });
        return;
      } catch (error) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }

    // If JWT fails, try session authentication
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/user/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();

        // Sync cart for this user
        import('./cartStore').then(({ useCartStore }) => {
          useCartStore.getState().setCurrentUser(userData.id.toString());
        }).catch(() => { });

        set({
          user: userData,
          isAuthenticated: true,
          loading: false,
          error: null
        });

        // Ensure CSRF cookie is set for subsequent writes
        try {
          await apiClient.get('/api/users/csrf/');
        } catch (e) { }

        return;
      }
    } catch (error) {
      // Silent fail
    }

    // If both fail, user is not authenticated
    // Clear cart when auth fails
    import('./cartStore').then(({ useCartStore }) => {
      useCartStore.getState().switchUser(null);
    }).catch(() => { });

    set({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });
  },

  updateProfile: async (data) => {
    set({ loading: true, error: null });

    try {
      // The api.ts interceptor handles JWT + CSRF automatically.
      // A single call is sufficient — no need to double-retry the same request.
      const response = await apiClient.patch('/api/users/profile/', data);

      set({
        user: response.data,
        loading: false,
        error: null
      });

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail ||
        'Failed to update profile';

      set({
        loading: false,
        error: errorMessage
      });

      throw error;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ loading: true, error: null });

    try {
      // The api.ts interceptor handles JWT + CSRF in a single call.
      await apiClient.post('/api/users/change-password/', {
        current_password: currentPassword,
        new_password: newPassword
      });

      // IMPORTANT: The backend invalidates the session on password change.
      // We must clear local auth state and tokens to match the server state.
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      });

    } catch (error: any) {
      const errorMessage = error.response?.data?.detail ||
        error.response?.data?.error ||
        error.response?.data?.current_password?.[0] ||
        error.response?.data?.new_password?.[0] ||
        'Failed to change password';

      set({
        loading: false,
        error: errorMessage
      });

      throw error;
    }
  },

  setPassword: async (newPassword, confirmPassword) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post('/api/users/set-password/', {
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      // Update has_password in local state so the UI immediately reflects the change
      const currentUser = get().user;
      if (currentUser) {
        set({ user: { ...currentUser, has_password: true }, loading: false, error: null });
      } else {
        set({ loading: false, error: null });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error ||
        error.response?.data?.detail ||
        'Failed to set password.';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  requestPasswordReset: async (email) => {
    set({ loading: true, error: null });
    try {
      // dj-rest-auth endpoint — sends reset email
      await apiClient.post('/api/auth/password/reset/', { email });
      set({ loading: false, error: null });
    } catch (error: any) {
      const errorMessage = error.response?.data?.email?.[0] ||
        error.response?.data?.detail ||
        'Failed to send reset email. Please try again.';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  confirmPasswordReset: async (uid, token, newPassword, confirmPassword) => {
    set({ loading: true, error: null });
    try {
      // dj-rest-auth endpoint — confirms reset with uid + token from email link
      await apiClient.post('/api/auth/password/reset/confirm/', {
        uid,
        token,
        new_password1: newPassword,
        new_password2: confirmPassword,
      });
      set({ loading: false, error: null });
    } catch (error: any) {
      const data = error.response?.data || {};
      const errorMessage =
        data?.new_password2?.[0] ||
        data?.new_password1?.[0] ||
        data?.token?.[0] ||
        data?.uid?.[0] ||
        data?.detail ||
        'Failed to reset password. The link may have expired.';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  setUserFromServer: (user) => {
    // Update store state without triggering any network request
    // Sync cart for this user
    import('./cartStore').then(({ useCartStore }) => {
      useCartStore.getState().setCurrentUser(user.id.toString());
    }).catch(() => { });

    set({
      user,
      isAuthenticated: true,
      loading: false,
      error: null
    });
  },
}));

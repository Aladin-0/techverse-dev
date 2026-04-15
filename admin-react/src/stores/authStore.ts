import { useState, useCallback, createContext, useContext, useEffect, type ReactNode, createElement } from 'react';
import api from '@/services/api';

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  user: { name: string; email: string; is_staff: boolean } | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
    user: null,
  });

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await api.get('/admin-panel/api/stats/');
      if (res.status === 200) {
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
          loading: false,
        }));
        return true;
      }
    } catch (err: unknown) {
      // 401 or 403 means not authenticated
    }
    setState({ isAuthenticated: false, loading: false, user: null });
    return false;
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    // First get CSRF token
    await api.get('/admin-panel/api/csrf/').catch(() => {});

    // Get cookie helper
    function getCookie(name: string): string | null {
      const cookies = document.cookie.split(';');
      for (const c of cookies) {
        const t = c.trim();
        if (t.startsWith(name + '=')) return decodeURIComponent(t.slice(name.length + 1));
      }
      return null;
    }

    const csrfToken = getCookie('csrftoken') || '';

    const res = await api.post(
      '/admin-panel/api/login/',
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
      }
    );

    if (res.data?.success) {
      setState({ isAuthenticated: true, loading: false, user: res.data.user ?? null });
    } else {
      throw new Error(res.data?.error || 'Login failed');
    }
  }, []);

  const logout = useCallback(() => {
    window.location.href = '/admin-panel/logout/';
  }, []);

  const value: AuthContextValue = { ...state, login, logout, checkAuth };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

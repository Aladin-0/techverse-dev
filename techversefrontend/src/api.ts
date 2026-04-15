// src/api.ts - Updated to fetch CSRF token from API
import axios from 'axios';

// Helper to get API URL from env
// In production (built static files served by nginx), use relative URLs — nginx
// proxies /api/, /auth/, /media/ etc to the backend container automatically.
// In local dev (Vite dev server), use the env var or fall back to localhost.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const getImageUrl = (imagePath: string | null | undefined): string => {
    if (!imagePath) return '';
    // If the backend returns an absolute URL with the Docker internal host or localhost:8000, strip it 
    // so the Vite proxy can handle it correctly relative to the frontend.
    if (imagePath.startsWith('http')) {
        if (imagePath.includes(':8000')) {
            return imagePath.substring(imagePath.indexOf('/media'));
        }
        return imagePath;
    }
    // Prepend API_BASE_URL if it's a relative path and doesn't already start with /media
    if (imagePath.startsWith('/media')) return imagePath;
    return `${API_BASE_URL}/media/${imagePath}`;
};

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // CRITICAL: Include cookies for session auth
    headers: {
        'Content-Type': 'application/json',
    },
});

// Cache for CSRF token (in-memory, cleared on page reload which also resets auth)
let csrfTokenCache: string | null = null;

// Function to fetch CSRF token from API, using in-memory cache to avoid
// a redundant network round-trip on every single POST/PATCH/DELETE request.
async function fetchCSRFToken(): Promise<string> {
    // Return cached value if we already have it
    if (csrfTokenCache) {
        return csrfTokenCache;
    }
    try {
        const response = await axios.get(`${API_BASE_URL}/api/users/csrf/`, {
            withCredentials: true
        });
        csrfTokenCache = response.data.csrfToken;
        return csrfTokenCache ?? '';
    } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
        return '';
    }
}

// This interceptor adds the auth token and CSRF token to every request
apiClient.interceptors.request.use(async (config) => {
    // Add JWT token if available
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach CSRF token for unsafe methods (POST, PATCH, PUT, DELETE)
    const method = (config.method || 'get').toUpperCase();
    const unsafe = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';

    if (unsafe) {
        const csrfToken = await fetchCSRFToken();
        if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken;
        }
    }

    return config;
});

// This interceptor handles token errors globally
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // If JWT token is invalid or expired, remove it and clear the CSRF
            // cache so the next request gets a fresh token for the new session.
            const token = localStorage.getItem('access_token');
            if (token) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                csrfTokenCache = null; // Invalidate the CSRF cache on auth failure
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;

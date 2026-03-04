// src/api.ts - Updated to fetch CSRF token from API
import axios from 'axios';

// Helper to get API URL from env
// In production (built static files served by nginx), use relative URLs — nginx
// proxies /api/, /auth/, /media/ etc to the backend container automatically.
// In local dev (Vite dev server), use the env var or fall back to localhost.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const getImageUrl = (imagePath: string | null | undefined): string => {
    if (!imagePath) return '';
    // If the backend returns an absolute URL with the Docker internal host, strip it 
    // so the Vite proxy can handle it correctly relative to the frontend.
    if (imagePath.startsWith('http://backend:8000')) {
        return imagePath.replace('http://backend:8000', '');
    }
    // If it's another absolute URL (like S3 or external), return it as is.
    // Otherwise, prepend the API_BASE_URL for correct resolution.
    return imagePath.startsWith('http') ? imagePath : `${API_BASE_URL}${imagePath}`;
};

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // CRITICAL: Include cookies for session auth
    headers: {
        'Content-Type': 'application/json',
    },
});

// Cache for CSRF token
let csrfTokenCache: string | null = null;

// Function to fetch CSRF token from API
async function fetchCSRFToken(): Promise<string> {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/users/csrf/`, {
            withCredentials: true
        });
        csrfTokenCache = response.data.csrfToken;
        return csrfTokenCache;
    } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
        return '';
    }
}

// This interceptor adds the auth token and CSRF token to every request
apiClient.interceptors.request.use(async (config) => {
    // Add JWT token if available (for backward compatibility)
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach CSRF token for unsafe methods
    const method = (config.method || 'get').toUpperCase();
    const unsafe = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';

    if (unsafe) {
        // Fetch fresh CSRF token for each unsafe request
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
            // If JWT token is invalid or expired, remove it
            const token = localStorage.getItem('access_token');
            if (token) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;

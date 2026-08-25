import axios from 'axios';

// All API calls go through nginx, which routes by path prefix to the right service.
// VITE_API_URL is set at build time. Defaults to "/api" (relative) so local dev
// uses Vite's proxy to nginx, and production builds use the ALB origin.
const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({ baseURL, timeout: 10000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      // hard reload to /login so React Router re-checks auth state
      if (location.pathname !== '/login') location.href = '/login';
    }
    return Promise.reject(err);
  }
);

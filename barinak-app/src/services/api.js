import axios from 'axios';

// Vite uses import.meta.env.VITE_*
const VITE_URL = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : undefined;
// Fallback for CRA-style envs if present
const REACT_APP_URL = typeof process !== 'undefined' && process.env ? process.env.REACT_APP_API_URL : undefined;

const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

const api = axios.create({
  // In dev, force Vite proxy to avoid CORS and port mismatch
  baseURL: isDev ? '/api' : (VITE_URL || REACT_APP_URL || '/api'),
  timeout: 10000,
});

// attach token automatically
api.interceptors.request.use(
  (cfg) => {
    const token = localStorage.getItem('token');
    if (token) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` };
    return cfg;
  },
  (err) => Promise.reject(err)
);

// global response handler: on 401 remove token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    try {
      if (err && err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?redirect=${redirect}`;
      }
    } catch (e) {
      // ignore errors during global handling
    }
    return Promise.reject(err);
  }
);

export function setAuthToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export default api;

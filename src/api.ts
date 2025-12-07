// frontend/src/api.ts - ULTIMATE VERSION
import axios from 'axios';
import { toast } from 'react-toastify';

const API = axios.create({
  baseURL: 'https://userbackend-slns.onrender.com/api',
  timeout: 90000, // 90 seconds — REQUIRED for Render free tier
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request →', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with toast + smart Render handling
API.interceptors.response.use(
  (response) => {
    // Optional: toast.success('Data loaded successfully');
    return response;
  },
  (error) => {
    const url = error.config?.url;
    const status = error.response?.status;

    // Render Free Tier Cold Start
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      toast.warn('Backend is waking up (free hosting)... Please wait 20-40 seconds', {
        autoClose: 8000,
        toastId: 'render-wakeup'
      });
      return Promise.reject(error);
    }

    // Server down / deploying
    if (status >= 500 || status === 502 || status === 503 || status === 404) {
      toast.error('Server is currently unavailable. Please try again in a minute.', {
        toastId: 'server-down'
      });
      return Promise.reject(error);
    }

    // Unauthorized - auto logout
    if (status === 401) {
      localStorage.removeItem('token');
      toast.error('Session expired. Please login again.');
      setTimeout(() => window.location.reload(), 2000);
      return Promise.reject(error);
    }

    // Client errors (400, 403, etc)
    const message = error.response?.data?.message || error.message || 'Request failed';
    toast.error(message);

    return Promise.reject(error);
  }
);

export default API;
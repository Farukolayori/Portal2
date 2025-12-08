// frontend/src/api.ts
import axios from 'axios';
import { toast } from 'react-toastify';

// Detect if backend is waking up from cold start
let isBackendWaking = false;
let wakeupToastId: string | number | null = null;

const API = axios.create({
  baseURL: 'https://userbackend-slns.onrender.com/api',
  timeout: 120000, // Increased to 120 seconds for cold starts
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
    
    // Show wakeup notification for first request after idle
    if (!isBackendWaking && (config.url?.includes('/auth/login') || config.url?.includes('/auth/register'))) {
      isBackendWaking = true;
      wakeupToastId = toast.info(
        '🚀 Backend server is waking up... This may take 20-40 seconds on free hosting',
        {
          autoClose: false,
          closeButton: false,
          isLoading: true,
          toastId: 'wakeup-toast'
        }
      );
    }
    
    console.log('Request →', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
API.interceptors.response.use(
  (response) => {
    // Clear wakeup notification when request succeeds
    if (wakeupToastId) {
      toast.dismiss(wakeupToastId);
      wakeupToastId = null;
    }
    isBackendWaking = false;
    return response;
  },
  (error) => {
    // Clear wakeup notification on any response
    if (wakeupToastId) {
      toast.dismiss(wakeupToastId);
      wakeupToastId = null;
    }
    
    const url = error.config?.url;
    const status = error.response?.status;
    const method = error.config?.method?.toUpperCase();

    console.error('API Error:', {
      url,
      method,
      status,
      error: error.message,
      code: error.code,
      response: error.response?.data
    });

    // Handle timeout/cold start specifically
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      toast.error(
        '⏱️ Backend is taking longer than usual to respond. This is normal for free hosting. Please wait and try again in 30 seconds.',
        { autoClose: 10000 }
      );
      return Promise.reject(error);
    }

    // Server errors (likely cold start)
    if (!error.response) {
      toast.error(
        'Please Wait a Minute.',
        { autoClose: 8000 }
      );
      return Promise.reject(error);
    }

    // Specific status code handling
    switch (status) {
      case 401:
        localStorage.removeItem('token');
        toast.error('Session expired. Please login again.');
        setTimeout(() => window.location.reload(), 2000);
        break;
      case 404:
        toast.error('API endpoint not found. Please check backend deployment.');
        break;
      case 500:
      case 502:
      case 503:
        toast.error('Server error. Backend might be deploying or restarting.');
        break;
      default:
        const message = error.response?.data?.message || 'Request failed';
        toast.error(`❌ ${message}`);
    }

    return Promise.reject(error);
  }
);

// Function to test backend connectivity
export const testBackendConnection = async () => {
  try {
    const response = await axios.get('https://userbackend-slns.onrender.com/health', {
      timeout: 30000
    });
    return { 
      status: 'online', 
      data: response.data,
      responseTime: response.headers['x-response-time']
    };
  } catch (error: any) {
    return { 
      status: 'offline', 
      error: error.message,
      code: error.code
    };
  }
};

export default API;
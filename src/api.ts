// frontend/src/api.ts - UPDATED
import axios from 'axios';

const API = axios.create({
  baseURL: 'https://userbackend-slns.onrender.com/api',  // Your actual backend URL
  withCredentials: true,
  timeout: 30000,  // Increase timeout for Render (free tier is slow)
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📡 Making request to:', config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
API.interceptors.response.use(
  (response) => {
    console.log('✅ Response from:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('🚨 API Error Details:');
    console.error('URL:', error.config?.url);
    console.error('Method:', error.config?.method);
    console.error('Status:', error.response?.status);
    console.error('Message:', error.message);
    console.error('Response Data:', error.response?.data);
    
    // Special handling for Render free tier
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Render free tier timeout - backend might be sleeping');
      alert('Backend is waking up (Render free tier). Please try again in 30 seconds.');
      return Promise.reject(new Error('Backend is waking up. Please wait and try again.'));
    }
    
    if (!error.response) {
      console.error('🌐 No response - Check: 1) Backend URL 2) CORS 3) Network');
      alert('Cannot connect to backend. Please check your internet connection.');
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    if (error.response?.status === 502 || error.response?.status === 503) {
      console.error('🔧 Backend is down or deploying');
      alert('Backend is currently unavailable. Please try again in a few minutes.');
    }
    
    return Promise.reject(error);
  }
);

export default API;
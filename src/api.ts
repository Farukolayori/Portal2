// frontend/src/api.ts
import axios from 'axios';

const API = axios.create({
  baseURL: 'https://userbackend-slns.onrender.com/api',  // This is your backend
  withCredentials: true
});

// Auto-add JWT token to every request
API.interceptors.request.use((config:any) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
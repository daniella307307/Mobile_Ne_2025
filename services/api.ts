import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This would normally be set to your API URL
const API_URL = 'https://68355da3cd78db2058c11959.mockapi.io/';

export const mockApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to add auth token to requests
mockApi.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
mockApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle unauthorized errors (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // In a real app, we would refresh the token here
      // For now, we'll just redirect to login
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // We can't use router here as it's outside of React context
      // In a real app, you would handle this differently
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../services/authService';
import { User } from '@/services/types';
import { router } from 'expo-router';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFromStorage = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    };
    loadFromStorage();
  }, []);

  const persistAuth = async (user: User, token: string) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('token', token);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { user, token } = await AuthService.login(email, password);
      setUser(user);
      setToken(token);
      await persistAuth(user, token);
      location.href = '/'; // Redirect to home page after login
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (firstName: string, lastName: string, email: string, password: string,  userData: Omit<User, 'id' | 'createdAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const { user, token } = await AuthService.register(userData);
      setUser(user);
      setToken(token);
      await persistAuth(user, token);
      window.location.href = '/'; // Redirect to home page after registration
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Omit<User, 'id'>>) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await AuthService.updateUser(user.id, updates);
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    router.push('/(auth)/login'); 
  };

  return {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };
}

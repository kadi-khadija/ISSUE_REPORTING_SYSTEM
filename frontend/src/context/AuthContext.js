import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const toastConfig = {
    position: 'top-right',
    autoClose: 2500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: 'light',
  };

  const checkAuth = useCallback(async () => {
    try {
      const response = await authAPI.checkAuth();

      if (response.data.authenticated) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      setUser(response.data.user);

      toast.success(`Welcome back, ${response.data.user.username}!`, toastConfig);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Invalid credentials';
      toast.error(message, toastConfig);
      return { success: false, error: message, data: error.response?.data };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      // Do NOT auto-login - user needs to verify email first
      toast.success('Account created! Please check your email to verify your account.', {
        ...toastConfig,
        autoClose: 5000,
      });

      return { success: true, email_sent: response.data.email_sent };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message, toastConfig);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);

      toast.info('You have been logged out.', toastConfig);

      return { success: true };
    } catch (error) {
      setUser(null);
      return { success: true };
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      setUser(response.data.user);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Profile update failed';
      toast.error(message, toastConfig);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
};

export default AuthContext;

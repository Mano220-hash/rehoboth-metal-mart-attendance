import React, { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => { try { return JSON.parse(localStorage.getItem('admin')); } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await authAPI.login(credentials);
      const { token: newToken, admin: adminData } = res.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('admin', JSON.stringify(adminData));
      setToken(newToken); setAdmin(adminData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    } finally { setLoading(false); }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token'); localStorage.removeItem('admin');
    setToken(null); setAdmin(null);
  }, []);

  const updateAdmin = (data) => {
    const updated = { ...admin, ...data };
    localStorage.setItem('admin', JSON.stringify(updated));
    setAdmin(updated);
  };

  return (
    <AuthContext.Provider value={{ admin, token, loading, isAuthenticated: !!token && !!admin, login, logout, updateAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

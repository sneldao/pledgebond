import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, getUser, setAuthTokens, clearAuth, refreshTokenIfNeeded } from '@/lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to refresh token on mount
    const initAuth = async () => {
      const token = await refreshTokenIfNeeded();
      if (!token) {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (authData) => {
    setAuthTokens(authData);
    setUser(authData.user);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

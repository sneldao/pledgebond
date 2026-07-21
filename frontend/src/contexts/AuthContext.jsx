import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getAuthToken, getUser, setAuthTokens, clearAuth, refreshTokenIfNeeded } from "@/lib/auth";
import { getSession } from "@/lib/session";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);

const DEFAULT_FEATURES = {
  auth: false,
  payments: false,
  websockets: false,
  referrals: false,
  leaderboards: false,
  templates: false,
  storage: false,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser());
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [demoMode, setDemoMode] = useState(true);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Fetch feature flags from backend on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`${API}/config`, { timeout: 8000 });
        if (cancelled) return;
        setFeatures({ ...DEFAULT_FEATURES, ...(data.features || {}) });
        setDemoMode(!!data.demo_mode);
      } catch (e) {
        // If /config fails, assume demo mode (safest default)
        console.warn("Could not load /api/config \u2014 defaulting to demo mode", e?.message);
      } finally {
        if (!cancelled) setConfigLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Try to refresh token on mount (only relevant if auth is enabled)
  useEffect(() => {
    if (!configLoaded) return;
    const initAuth = async () => {
      if (!features.auth) {
        // Demo mode: 'user' is derived from the localStorage session (role picker) if set
        const session = getSession();
        if (session) {
          setUser({
            id: `demo-${session.displayName}`,
            display_name: session.displayName,
            role: session.role,
            color: session.color,
            _demo: true,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
        return;
      }
      try {
        const token = await refreshTokenIfNeeded();
        if (!token) setUser(null);
      } catch {
        setUser(null);
      }
      setLoading(false);
    };
    initAuth();
    // eslint-disable-next-line
  }, [configLoaded, features.auth]);

  const login = useCallback((authData) => {
    setAuthTokens(authData);
    setUser(authData.user);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading: loading || !configLoaded,
    features,
    demoMode,
    authEnabled: features.auth,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Instead of throwing, fall back to demo defaults if provider missing (safer for storybook / tests)
    return {
      user: null,
      isAuthenticated: false,
      loading: false,
      features: DEFAULT_FEATURES,
      demoMode: true,
      authEnabled: false,
      login: () => {},
      logout: () => {},
      updateUser: () => {},
    };
  }
  return context;
}

export function useFeatures() {
  return useAuth().features;
}

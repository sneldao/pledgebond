const AUTH_TOKEN_KEY = "pledgebond.auth.token";
const REFRESH_TOKEN_KEY = "pledgebond.auth.refresh";
const USER_KEY = "pledgebond.auth.user";

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens({ access_token, refresh_token, user }) {
  if (access_token) {
    localStorage.setItem(AUTH_TOKEN_KEY, access_token);
  }
  if (refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getAuthToken();
}

export function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAuthHeader() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to decode token:', err);
    return null;
  }
}

export function isTokenExpired(token) {
  if (!token) return true;
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now + 60; // Consider expired if within 60 seconds
}

export async function refreshTokenIfNeeded() {
  const accessToken = getAuthToken();
  const refreshToken = getRefreshToken();

  if (!accessToken || !refreshToken) {
    return null;
  }

  if (!isTokenExpired(accessToken)) {
    return accessToken;
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearAuth();
      return null;
    }

    const data = await response.json();
    setAuthTokens(data);
    return data.access_token;
  } catch (err) {
    console.error('Token refresh failed:', err);
    clearAuth();
    return null;
  }
}

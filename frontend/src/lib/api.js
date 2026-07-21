import axios from "axios";
import { getAuthHeader } from "./auth";
import { getSession } from "./session";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Add auth headers + demo headers to all requests
client.interceptors.request.use((config) => {
  const authHeaders = getAuthHeader();
  Object.assign(config.headers, authHeaders);
  // Demo-mode identity: lets backend require_user synthesize a user when ENABLE_AUTH=0
  const session = getSession();
  if (session) {
    config.headers["X-Demo-Name"] = session.displayName;
    config.headers["X-Demo-Role"] = session.role;
  }
  return config;
});

export const api = {
  listBonds: async (params = {}) => {
    const { data } = await client.get("/bonds", { params });
    return data;
  },
  getBond: async (id) => {
    const { data } = await client.get(`/bonds/${id}`);
    return data;
  },
  createBond: async (body) => {
    const { data } = await client.post("/bonds", body);
    return data;
  },
  joinBond: async (id, body) => {
    const { data } = await client.post(`/bonds/${id}/join`, body);
    return data;
  },
  submitProof: async (id, body) => {
    const { data } = await client.post(`/bonds/${id}/proof`, body);
    return data;
  },
  release: async (id) => {
    const { data } = await client.post(`/bonds/${id}/release`);
    return data;
  },
  resetBond: async (id) => {
    const { data } = await client.post(`/bonds/${id}/reset`);
    return data;
  },
  deleteBond: async (id) => {
    const { data } = await client.delete(`/bonds/${id}`);
    return data;
  },
  // Witness tier — zero-friction observer
  witnessBond: async (id, body) => {
    const { data } = await client.post(`/bonds/${id}/witness`, body);
    return data;
  },
  // Notifications
  notifications: {
    list: async (owner) => {
      const { data } = await client.get("/notifications", { params: { owner } });
      return data;
    },
    markRead: async (owner, ids) => {
      const { data } = await client.post("/notifications/read", null, { params: { owner, ids } });
      return data;
    },
    unreadCount: async (owner) => {
      const { data } = await client.get("/notifications/unread-count", { params: { owner } });
      return data;
    },
  },
  // Proof feed — cross-bond feed of recent proof submissions
  proofFeed: async (limit = 50) => {
    const { data } = await client.get("/proofs", { params: { limit } });
    return data;
  },
  // OG card URL helper
  bondCardUrl: (id) => `${API}/bonds/${id}/card.png`,
  bondOgMeta: async (id) => {
    const { data } = await client.get(`/bonds/${id}/og`);
    return data;
  },
  // Auth endpoints
  auth: {
    register: async (body) => {
      const { data } = await client.post("/auth/register", body);
      return data;
    },
    login: async (body) => {
      const { data } = await client.post("/auth/login", body);
      return data;
    },
    sendMagicLink: async (email) => {
      const { data } = await client.post("/auth/magic-link/send", { email });
      return data;
    },
    verifyMagicLink: async (token, email) => {
      const { data } = await client.post("/auth/magic-link/verify?token=" + encodeURIComponent(token) + "&email=" + encodeURIComponent(email));
      return data;
    },
    refresh: async (refreshToken) => {
      const { data } = await client.post("/auth/refresh", { refresh_token: refreshToken });
      return data;
    },
    getMe: async () => {
      const { data } = await client.get("/auth/me");
      return data;
    },
    updateMe: async (body) => {
      const { data } = await client.put("/auth/me", body);
      return data;
    },
    getStats: async () => {
      const { data } = await client.get("/auth/stats");
      return data;
    },
  },
};

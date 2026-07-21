import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
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
};

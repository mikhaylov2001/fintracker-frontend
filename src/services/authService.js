// src/services/api.js
import axios from "axios";
import { STORAGE_KEYS } from "../utils/constants";

const api = axios.create({
  baseURL: "/api", // важно для CRA proxy -> http://localhost:8082 [file:7211]
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // оставь true, если refresh/logout завязаны на cookies
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

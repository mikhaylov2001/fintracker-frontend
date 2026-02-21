// src/api/authApi.js
import { apiFetch } from "./clientFetch";

export const login = (payload) =>
  apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const register = (payload) =>
  apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const googleAuth = (idToken) =>
  apiFetch("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });

export const refresh = () =>
  apiFetch("/api/auth/refresh", {
    method: "POST",
  });

export const logout = async () =>
  apiFetch("/api/auth/logout", {
    method: "POST",
  });

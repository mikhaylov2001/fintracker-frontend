// src/api/passwordResetApi.js
import { apiFetch } from "./clientFetch";

// если бэк сам берёт FRONTEND_URL из env, можно не передавать frontendBaseUrl
export const requestPasswordReset = (email) =>
  apiFetch("/api/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const confirmPasswordReset = (token, newPassword) =>
  apiFetch("/api/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });

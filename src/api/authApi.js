// src/api/authApi.js
import { api } from './http';

export const login = (payload) => api.post('/auth/login', payload);

export const register = (payload) => api.post('/auth/register', payload);

export const googleAuth = (idToken) =>
  api.post('/auth/google', { idToken }); // GoogleTokenRequest.idToken [file:7211]

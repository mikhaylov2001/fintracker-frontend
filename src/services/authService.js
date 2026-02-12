import api from '../api/api';
import { API_ENDPOINTS, STORAGE_KEYS } from '../utils/constants';

const saveAuth = (data) => {
  if (data?.token) localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
  if (data?.user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
};

const authService = {
  register: async (userData) => {
    const { data } = await api.post(API_ENDPOINTS.REGISTER, userData);
    saveAuth(data);
    return data;
  },

  login: async (credentials) => {
    const { data } = await api.post(API_ENDPOINTS.LOGIN, credentials);
    saveAuth(data);
    return data;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => !!localStorage.getItem(STORAGE_KEYS.TOKEN),
};

export default authService;

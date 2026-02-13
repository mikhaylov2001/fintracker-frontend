import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // если refresh/logout у тебя через cookies
});

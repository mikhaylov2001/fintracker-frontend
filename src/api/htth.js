import axios from "axios";

const API_ORIGIN = (process.env.REACT_APP_API_BASE_URL || "").trim();

export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`, // "" -> "/api" в prod
  withCredentials: true,
});

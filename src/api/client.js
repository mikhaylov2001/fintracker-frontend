// src/api/client.js
import { apiFetch } from "./clientFetch";

export const useApiClient = () => {
  const api = apiFetch;

  const asAxios = async (path, options) => ({
    data: await api(path, options),
  });

  return { apiFetch: api, asAxios };
};

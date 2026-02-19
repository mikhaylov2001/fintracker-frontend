// src/api/client.js
import { apiFetch } from "./clientFetch";

// clientFetch — это файл с твоим apiFetch из сообщения выше
// Переименуем, чтобы избежать циклического импорта (client.js ↔ clientFetch.js).

export const useApiClient = () => {
  const api = apiFetch; // просто алиас, если нужно будет расширять

  const asAxios = async (path, options) => ({ data: await api(path, options) });

  return { apiFetch: api, asAxios };
};

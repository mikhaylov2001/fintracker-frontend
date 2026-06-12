import { useApiClient } from "./client";

export const fetchMyCategories = (asAxios, type) =>
  asAxios(`/api/categories/me?type=${type}`);

export const fetchCreateCategory = (asAxios, payload) =>
  asAxios("/api/categories", { method: "POST", body: JSON.stringify(payload) });

export const fetchDeleteCategory = (asAxios, categoryId) =>
  asAxios(`/api/categories/${categoryId}`, { method: "DELETE" });

export const useCategoriesApi = () => {
  const { asAxios } = useApiClient();

  return {
    getMyCategories: (type) => fetchMyCategories(asAxios, type),
    createCategory: (payload) => fetchCreateCategory(asAxios, payload),
    deleteCategory: (categoryId) => fetchDeleteCategory(asAxios, categoryId),
  };
};

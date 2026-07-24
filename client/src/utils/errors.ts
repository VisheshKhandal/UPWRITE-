import type { ApiErrorShape } from "../types/api";

const authMessages = new Set(["Authentication required", "Unauthorized", "Invalid or expired access token"]);

export const isAuthError = (error: unknown) => {
  const apiError = error as ApiErrorShape;
  return apiError?.status === 401 || apiError?.status === "401" || authMessages.has(apiError?.data?.message ?? "") || apiError?.error === "Unauthorized";
};

export const isNetworkError = (error: unknown) => {
  const apiError = error as ApiErrorShape;
  const message = apiError?.error ?? apiError?.data?.message ?? "";
  return apiError?.status === "FETCH_ERROR" || message.toLowerCase().includes("failed to fetch");
};

export const getErrorMessage = (error: unknown, fallback = "Something went wrong") => {
  const apiError = error as ApiErrorShape;
  if (isNetworkError(error)) return fallback;
  if (isAuthError(error)) return fallback;
  if (apiError?.status === 403 || apiError?.status === "403") return fallback;
  if (apiError?.status === 500 || apiError?.status === "500") return apiError?.data?.message ?? apiError?.error ?? fallback;
  return apiError?.data?.message ?? apiError?.error ?? fallback;
};

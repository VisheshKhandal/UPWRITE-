import type { ApiErrorShape } from "../types/api";

const authMessages = new Set(["Authentication required", "Unauthorized", "Invalid or expired access token"]);

export const isAuthError = (error: unknown) => {
  const apiError = error as ApiErrorShape;
  return apiError?.status === 401 || apiError?.status === "401" || authMessages.has(apiError?.data?.message ?? "") || apiError?.error === "Unauthorized";
};

export const getErrorMessage = (error: unknown, fallback = "Something went wrong") => {
  const apiError = error as ApiErrorShape;
  if (isAuthError(error)) return fallback;
  if (apiError?.status === 403 || apiError?.status === "403") return fallback;
  if (apiError?.status === 500 || apiError?.status === "500") return apiError?.data?.message ?? apiError?.error ?? fallback;
  return apiError?.data?.message ?? apiError?.error ?? fallback;
};

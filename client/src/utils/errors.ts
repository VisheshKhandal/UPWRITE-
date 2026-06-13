import type { ApiErrorShape } from "../types/api";

export const getErrorMessage = (error: unknown, fallback = "Something went wrong") => {
  const apiError = error as ApiErrorShape;
  return apiError?.data?.message ?? apiError?.error ?? fallback;
};

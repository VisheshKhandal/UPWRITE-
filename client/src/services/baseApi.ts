import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../app/store";
import { logout, setCredentials } from "../features/auth/authSlice";
import type { ApiResponse } from "../types/api";

const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    return headers;
  }
});

const baseQueryWithRefresh: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshResult = await rawBaseQuery({ url: "/auth/refresh", method: "POST" }, api, extraOptions);
    const refreshData = refreshResult.data as ApiResponse<{ accessToken: string }> | undefined;

    if (refreshData?.data?.accessToken) {
      api.dispatch(setCredentials({ accessToken: refreshData.data.accessToken }));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithRefresh,
  tagTypes: [
    "Auth",
    "User",
    "Profile",
    "Feed",
    "Post",
    "Article",
    "Comment",
    "Bookmark",
    "Collection",
    "Saved",
    "Explore",
    "Notification",
    "Search",
    "Settings"
  ],
  endpoints: () => ({})
});

export const unwrapResponse = <T>(response: ApiResponse<T>) => response.data;

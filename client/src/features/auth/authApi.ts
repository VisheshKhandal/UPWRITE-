import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ApiResponse } from "../../types/api";
import type { User } from "../../types/models";

interface AuthResult {
  user: User;
  accessToken: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthResult, { name: string; username: string; email: string; password: string }>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      transformResponse: (response: ApiResponse<AuthResult>) => unwrapResponse(response),
      invalidatesTags: ["Auth"]
    }),
    login: builder.mutation<AuthResult, { emailOrUsername: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (response: ApiResponse<AuthResult>) => unwrapResponse(response),
      invalidatesTags: ["Auth"]
    }),
    refresh: builder.mutation<{ accessToken: string }, void>({
      query: () => ({ url: "/auth/refresh", method: "POST" }),
      transformResponse: (response: ApiResponse<{ accessToken: string }>) => unwrapResponse(response)
    }),
    logoutUser: builder.mutation<null, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      transformResponse: (response: ApiResponse<null>) => unwrapResponse(response),
      invalidatesTags: ["Auth"]
    }),
    logoutAll: builder.mutation<null, void>({
      query: () => ({ url: "/auth/logout-all", method: "POST" }),
      transformResponse: (response: ApiResponse<null>) => unwrapResponse(response),
      invalidatesTags: ["Auth"]
    }),
    me: builder.query<User, void>({
      query: () => "/auth/me",
      transformResponse: (response: ApiResponse<User>) => unwrapResponse(response),
      providesTags: ["Auth", "User"]
    }),
    forgotPassword: builder.mutation<null, { email: string }>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
      transformResponse: (response: ApiResponse<null>) => unwrapResponse(response)
    })
  })
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutUserMutation,
  useLogoutAllMutation,
  useMeQuery,
  useLazyMeQuery,
  useForgotPasswordMutation
} = authApi;

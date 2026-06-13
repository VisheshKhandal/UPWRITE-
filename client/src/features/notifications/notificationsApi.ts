import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ApiResponse, PaginationQuery } from "../../types/api";
import type { Notification } from "../../types/models";

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    notifications: builder.query<Notification[], (PaginationQuery & { unreadOnly?: boolean }) | void>({
      query: (params) => ({ url: "/notifications", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<Notification[]>) => unwrapResponse(response),
      providesTags: ["Notification"]
    }),
    markNotificationRead: builder.mutation<Notification, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      transformResponse: (response: ApiResponse<Notification>) => unwrapResponse(response),
      invalidatesTags: ["Notification"]
    }),
    markAllNotificationsRead: builder.mutation<null, void>({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      transformResponse: (response: ApiResponse<null>) => unwrapResponse(response),
      invalidatesTags: ["Notification"]
    })
  })
});

export const {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation
} = notificationsApi;

import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ApiResponse, PaginationMeta, PaginationQuery } from "../../types/api";
import type { Notification } from "../../types/models";

export type NotificationListResponse = Notification[] & {
  unreadCount?: number;
  meta?: PaginationMeta;
};

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    notifications: builder.query<NotificationListResponse, (PaginationQuery & { unreadOnly?: boolean }) | void>({
      query: (params) => ({ url: "/notifications", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<Notification[]>) => {
        const items = unwrapResponse(response);
        return Object.assign([...items], {
          unreadCount: response.meta?.unreadCount,
          meta: response.meta
        });
      },
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

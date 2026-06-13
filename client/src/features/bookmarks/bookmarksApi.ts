import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ApiResponse, PaginationQuery } from "../../types/api";
import type { Bookmark, ContentType } from "../../types/models";

export const bookmarksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    bookmarks: builder.query<Bookmark[], PaginationQuery | void>({
      query: (params) => ({ url: "/bookmarks", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<Bookmark[]>) => unwrapResponse(response),
      providesTags: ["Bookmark"]
    }),
    toggleBookmark: builder.mutation<
      { bookmarked: boolean },
      { contentType: ContentType; contentId: string; collection?: string }
    >({
      query: (body) => ({ url: "/bookmarks/toggle", method: "POST", body }),
      transformResponse: (response: ApiResponse<{ bookmarked: boolean }>) => unwrapResponse(response),
      invalidatesTags: ["Bookmark", "Feed", "Post", "Article"]
    })
  })
});

export const { useBookmarksQuery, useToggleBookmarkMutation } = bookmarksApi;

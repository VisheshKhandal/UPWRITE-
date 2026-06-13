import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ApiResponse, PaginationQuery } from "../../types/api";
import type { ContentType, SavedItem } from "../../types/models";

export const savedApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    saved: builder.query<SavedItem[], (PaginationQuery & { collection?: string }) | void>({
      query: (params) => ({ url: "/saved", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<SavedItem[]>) => unwrapResponse(response),
      providesTags: ["Saved"]
    }),
    saveContent: builder.mutation<
      { bookmarked: boolean },
      { contentType: ContentType; contentId: string; collection?: string }
    >({
      query: (body) => ({ url: "/saved", method: "POST", body }),
      transformResponse: (response: ApiResponse<{ bookmarked: boolean }>) => unwrapResponse(response),
      invalidatesTags: ["Saved", "Bookmark", "Collection", "Feed", "Post", "Article"]
    })
  })
});

export const { useSavedQuery, useSaveContentMutation } = savedApi;

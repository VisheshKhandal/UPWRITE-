import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ApiResponse, PaginatedResult, PaginationQuery } from "../../types/api";
import type { ContentType, FeedItem } from "../../types/models";

export type FeedQuery = PaginationQuery & {
  type?: ContentType;
};

export const feedApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    latestFeed: builder.query<PaginatedResult<FeedItem>, FeedQuery | void>({
      query: (params) => ({ url: "/feed/latest", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<FeedItem[]>) => ({
        items: unwrapResponse(response),
        meta: response.meta
      }),
      providesTags: ["Feed"]
    }),
    trendingFeed: builder.query<PaginatedResult<FeedItem>, FeedQuery | void>({
      query: (params) => ({ url: "/feed/trending", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<FeedItem[]>) => ({
        items: unwrapResponse(response),
        meta: response.meta
      }),
      providesTags: ["Feed"]
    })
  })
});

export const { useLatestFeedQuery, useTrendingFeedQuery } = feedApi;

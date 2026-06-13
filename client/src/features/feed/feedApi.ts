import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ApiResponse, PaginationQuery } from "../../types/api";
import type { FeedItem } from "../../types/models";

export const feedApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    latestFeed: builder.query<FeedItem[], PaginationQuery | void>({
      query: (params) => ({ url: "/feed/latest", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<FeedItem[]>) => unwrapResponse(response),
      providesTags: ["Feed"]
    }),
    trendingFeed: builder.query<FeedItem[], PaginationQuery | void>({
      query: (params) => ({ url: "/feed/trending", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<FeedItem[]>) => unwrapResponse(response),
      providesTags: ["Feed"]
    })
  })
});

export const { useLatestFeedQuery, useTrendingFeedQuery } = feedApi;

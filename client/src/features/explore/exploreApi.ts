import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ApiResponse } from "../../types/api";
import type { Article, Tag, User } from "../../types/models";

export const exploreApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    trendingTags: builder.query<Tag[], void>({
      query: () => "/explore/trending-tags",
      transformResponse: (response: ApiResponse<Tag[]>) => unwrapResponse(response),
      providesTags: ["Explore"]
    }),
    topArticles: builder.query<Article[], void>({
      query: () => "/explore/top-articles",
      transformResponse: (response: ApiResponse<Article[]>) => unwrapResponse(response),
      providesTags: ["Explore"]
    }),
    featuredCreators: builder.query<User[], void>({
      query: () => "/explore/featured-creators",
      transformResponse: (response: ApiResponse<User[]>) => unwrapResponse(response),
      providesTags: ["Explore"]
    }),
    peopleYouMayKnow: builder.query<User[], void>({
      query: () => "/explore/people-you-may-know",
      transformResponse: (response: ApiResponse<User[]>) => unwrapResponse(response),
      providesTags: ["Explore"]
    })
  })
});

export const {
  useTrendingTagsQuery,
  useTopArticlesQuery,
  useFeaturedCreatorsQuery,
  usePeopleYouMayKnowQuery
} = exploreApi;

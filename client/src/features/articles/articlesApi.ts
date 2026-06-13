import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ApiResponse, PaginationQuery } from "../../types/api";
import type { Article, ArticleStatus, ImageAsset } from "../../types/models";

export interface ArticleInput {
  title: string;
  content: string;
  excerpt?: string;
  status?: ArticleStatus;
  tags?: string[];
  coverImage?: ImageAsset;
}

export const articlesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    articles: builder.query<Article[], (PaginationQuery & { tag?: string; author?: string; authorId?: string }) | void>({
      query: (params) => ({ url: "/articles", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<Article[]>) => unwrapResponse(response),
      providesTags: ["Article"]
    }),
    myArticles: builder.query<Article[], (PaginationQuery & { status?: ArticleStatus }) | void>({
      query: (params) => ({ url: "/articles/me", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<Article[]>) => unwrapResponse(response),
      providesTags: ["Article"]
    }),
    myArticle: builder.query<Article, string>({
      query: (id) => `/articles/me/${id}`,
      transformResponse: (response: ApiResponse<Article>) => unwrapResponse(response),
      providesTags: (_result, _error, id) => [{ type: "Article", id }]
    }),
    articleBySlug: builder.query<Article, { username: string; slug: string }>({
      query: ({ username, slug }) => `/articles/${username}/${slug}`,
      transformResponse: (response: ApiResponse<Article>) => unwrapResponse(response),
      providesTags: (_result, _error, { username, slug }) => [{ type: "Article", id: `${username}/${slug}` }]
    }),
    incrementArticleView: builder.mutation<null, string>({
      query: (id) => ({ url: `/articles/${id}/view`, method: "POST" }),
      transformResponse: (response: ApiResponse<null>) => unwrapResponse(response)
    }),
    relatedArticles: builder.query<Article[], string>({
      query: (id) => `/articles/${id}/related`,
      transformResponse: (response: ApiResponse<Article[]>) => unwrapResponse(response),
      providesTags: (_result, _error, id) => [{ type: "Article", id: `related-${id}` }]
    }),
    createArticle: builder.mutation<Article, ArticleInput>({
      query: (body) => ({ url: "/articles", method: "POST", body }),
      transformResponse: (response: ApiResponse<Article>) => unwrapResponse(response),
      invalidatesTags: ["Article", "Feed"]
    }),
    updateArticle: builder.mutation<Article, { id: string; body: Partial<ArticleInput> }>({
      query: ({ id, body }) => ({ url: `/articles/${id}`, method: "PATCH", body }),
      transformResponse: (response: ApiResponse<Article>) => unwrapResponse(response),
      invalidatesTags: ["Article", "Feed"]
    }),
    deleteArticle: builder.mutation<null, string>({
      query: (id) => ({ url: `/articles/${id}`, method: "DELETE" }),
      transformResponse: (response: ApiResponse<null>) => unwrapResponse(response),
      invalidatesTags: ["Article", "Feed"]
    })
  })
});

export const {
  useArticlesQuery,
  useMyArticlesQuery,
  useMyArticleQuery,
  useArticleBySlugQuery,
  useIncrementArticleViewMutation,
  useRelatedArticlesQuery,
  useCreateArticleMutation,
  useUpdateArticleMutation,
  useDeleteArticleMutation
} = articlesApi;

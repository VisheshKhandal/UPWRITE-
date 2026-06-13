import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ApiResponse, PaginationQuery } from "../../types/api";
import type { Article, Post, Tag, User } from "../../types/models";

export type SearchType = "all" | "users" | "articles" | "posts" | "tags";

export interface SearchResult {
  users?: User[];
  articles?: Article[];
  posts?: Post[];
  tags?: Tag[];
}

export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    search: builder.query<SearchResult, { q: string; type?: SearchType } & PaginationQuery>({
      query: (params) => ({ url: "/search", params }),
      transformResponse: (response: ApiResponse<SearchResult>) => unwrapResponse(response),
      providesTags: ["Search"]
    })
  })
});

export const { useSearchQuery } = searchApi;

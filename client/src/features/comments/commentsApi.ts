import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ApiResponse, PaginationQuery } from "../../types/api";
import type { Comment, ContentType } from "../../types/models";

export interface CreatorComment extends Comment {
  article?: { _id: string; title: string; slug: string };
}

export const commentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    comments: builder.query<Comment[], { contentType: ContentType; contentId: string } & PaginationQuery>({
      query: (params) => ({ url: "/comments", params }),
      transformResponse: (response: ApiResponse<Comment[]>) => unwrapResponse(response),
      providesTags: ["Comment"]
    }),
    createComment: builder.mutation<Comment, { contentType: ContentType; contentId: string; body: string; parentComment?: string }>({
      query: (body) => ({ url: "/comments", method: "POST", body }),
      transformResponse: (response: ApiResponse<Comment>) => unwrapResponse(response),
      invalidatesTags: ["Comment", "Feed", "Post", "Article"]
    }),
    deleteComment: builder.mutation<null, string>({
      query: (id) => ({ url: `/comments/${id}`, method: "DELETE" }),
      transformResponse: (response: ApiResponse<null>) => unwrapResponse(response),
      invalidatesTags: ["Comment", "Feed", "Post", "Article"]
    }),
    creatorComments: builder.query<CreatorComment[], PaginationQuery | void>({
      query: (params) => ({ url: "/comments/creator-inbox", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<CreatorComment[]>) => unwrapResponse(response),
      providesTags: ["Comment"]
    })
  })
});

export const { useCommentsQuery, useCreateCommentMutation, useDeleteCommentMutation, useCreatorCommentsQuery } = commentsApi;

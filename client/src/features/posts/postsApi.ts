import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ApiResponse, PaginationQuery } from "../../types/api";
import type { Post, PostType, ImageAsset } from "../../types/models";

export interface CreatePostInput {
  title?: string;
  type?: PostType;
  body: string;
  tags?: string[];
  media?: ImageAsset[];
}

export const postsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    posts: builder.query<Post[], (PaginationQuery & { author?: string; authorId?: string }) | void>({
      query: (params) => ({ url: "/posts", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<Post[]>) => unwrapResponse(response),
      providesTags: ["Post"]
    }),
    post: builder.query<Post, string>({
      query: (id) => `/posts/${id}`,
      transformResponse: (response: ApiResponse<Post>) => unwrapResponse(response),
      providesTags: (_result, _error, id) => [{ type: "Post", id }]
    }),
    createPost: builder.mutation<Post, CreatePostInput>({
      query: (body) => ({ url: "/posts", method: "POST", body }),
      transformResponse: (response: ApiResponse<Post>) => unwrapResponse(response),
      invalidatesTags: ["Post", "Feed"]
    }),
    updatePost: builder.mutation<Post, { id: string; body: Partial<CreatePostInput> }>({
      query: ({ id, body }) => ({ url: `/posts/${id}`, method: "PATCH", body }),
      transformResponse: (response: ApiResponse<Post>) => unwrapResponse(response),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Post", id }, "Feed"]
    }),
    deletePost: builder.mutation<null, string>({
      query: (id) => ({ url: `/posts/${id}`, method: "DELETE" }),
      transformResponse: (response: ApiResponse<null>) => unwrapResponse(response),
      invalidatesTags: ["Post", "Feed"]
    })
  })
});

export const {
  usePostsQuery,
  usePostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation
} = postsApi;

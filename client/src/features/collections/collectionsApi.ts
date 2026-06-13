import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ApiResponse, PaginationQuery } from "../../types/api";
import type { Collection } from "../../types/models";

export const collectionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    collections: builder.query<Collection[], PaginationQuery | void>({
      query: (params) => ({ url: "/collections", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<Collection[]>) => unwrapResponse(response),
      providesTags: ["Collection"]
    }),
    createCollection: builder.mutation<Collection, { name: string; description?: string; isPublic?: boolean }>({
      query: (body) => ({ url: "/collections", method: "POST", body }),
      transformResponse: (response: ApiResponse<Collection>) => unwrapResponse(response),
      invalidatesTags: ["Collection"]
    }),
    updateCollection: builder.mutation<Collection, { id: string; body: Partial<Collection> }>({
      query: ({ id, body }) => ({ url: `/collections/${id}`, method: "PATCH", body }),
      transformResponse: (response: ApiResponse<Collection>) => unwrapResponse(response),
      invalidatesTags: ["Collection"]
    }),
    deleteCollection: builder.mutation<null, string>({
      query: (id) => ({ url: `/collections/${id}`, method: "DELETE" }),
      transformResponse: (response: ApiResponse<null>) => unwrapResponse(response),
      invalidatesTags: ["Collection", "Bookmark"]
    })
  })
});

export const {
  useCollectionsQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation
} = collectionsApi;

import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ApiResponse } from "../../types/api";
import type { ContentType } from "../../types/models";

export const likesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    toggleLike: builder.mutation<{ liked: boolean }, { contentType: ContentType; contentId: string }>({
      query: (body) => ({ url: "/likes/toggle", method: "POST", body }),
      transformResponse: (response: ApiResponse<{ liked: boolean }>) => unwrapResponse(response),
      invalidatesTags: ["Feed", "Post", "Article"]
    })
  })
});

export const { useToggleLikeMutation } = likesApi;

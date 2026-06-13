import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ApiResponse } from "../../types/api";
import type { UploadAsset } from "../../types/models";

export const uploadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadImage: builder.mutation<UploadAsset, { file: File; context: UploadAsset["context"] }>({
      query: ({ file, context }) => {
        const body = new FormData();
        body.append("image", file);
        body.append("context", context);
        return { url: "/uploads/image", method: "POST", body };
      },
      transformResponse: (response: ApiResponse<UploadAsset>) => {
        const asset = unwrapResponse(response);
        return {
          ...asset,
          url: asset.url ?? asset.secureUrl,
          secureUrl: asset.secureUrl ?? asset.url
        };
      },
      invalidatesTags: ["User", "Profile", "Article"]
    })
  })
});

export const { useUploadImageMutation } = uploadsApi;

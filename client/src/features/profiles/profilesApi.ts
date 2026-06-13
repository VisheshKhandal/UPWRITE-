import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ApiResponse, PaginationQuery } from "../../types/api";
import type { User } from "../../types/models";

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  socialLinks?: User["socialLinks"];
}

export const profilesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    profile: builder.query<User, string>({
      query: (username) => `/profiles/${username}`,
      transformResponse: (response: ApiResponse<User>) => unwrapResponse(response),
      providesTags: (_result, _error, username) => [{ type: "Profile", id: username }]
    }),
    updateProfile: builder.mutation<User, UpdateProfileInput>({
      query: (body) => ({ url: "/profiles/me", method: "PATCH", body }),
      transformResponse: (response: ApiResponse<User>) => unwrapResponse(response),
      invalidatesTags: ["Profile", "Auth", "User"]
    }),
    followers: builder.query<unknown[], { id: string } & PaginationQuery>({
      query: ({ id, ...params }) => ({ url: `/follows/${id}/followers`, params }),
      transformResponse: (response: ApiResponse<unknown[]>) => unwrapResponse(response)
    }),
    following: builder.query<unknown[], { id: string } & PaginationQuery>({
      query: ({ id, ...params }) => ({ url: `/follows/${id}/following`, params }),
      transformResponse: (response: ApiResponse<unknown[]>) => unwrapResponse(response)
    }),
    follow: builder.mutation<{ following: boolean; changed: boolean }, { id: string; username?: string }>({
      query: ({ id }) => ({ url: `/follows/${id}`, method: "POST" }),
      transformResponse: (response: ApiResponse<{ following: boolean; changed: boolean }>) => unwrapResponse(response),
      async onQueryStarted({ username }, { dispatch, queryFulfilled }) {
        const patch = username
          ? dispatch(
              profilesApi.util.updateQueryData("profile", username, (draft) => {
                draft.isFollowing = true;
                if (draft.stats) draft.stats.followersCount += 1;
              })
            )
          : null;
        try {
          await queryFulfilled;
        } catch {
          patch?.undo();
        }
      },
      invalidatesTags: ["Profile", "Feed", "Article", "Explore", "Search"]
    }),
    unfollow: builder.mutation<{ following: boolean; changed: boolean }, { id: string; username?: string }>({
      query: ({ id }) => ({ url: `/follows/${id}`, method: "DELETE" }),
      transformResponse: (response: ApiResponse<{ following: boolean; changed: boolean }>) => unwrapResponse(response),
      async onQueryStarted({ username }, { dispatch, queryFulfilled }) {
        const patch = username
          ? dispatch(
              profilesApi.util.updateQueryData("profile", username, (draft) => {
                draft.isFollowing = false;
                if (draft.stats) draft.stats.followersCount = Math.max(0, draft.stats.followersCount - 1);
              })
            )
          : null;
        try {
          await queryFulfilled;
        } catch {
          patch?.undo();
        }
      },
      invalidatesTags: ["Profile", "Feed", "Article", "Explore", "Search"]
    })
  })
});

export const {
  useProfileQuery,
  useUpdateProfileMutation,
  useFollowersQuery,
  useFollowingQuery,
  useFollowMutation,
  useUnfollowMutation
} = profilesApi;

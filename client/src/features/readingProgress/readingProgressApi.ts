import { baseApi, unwrapResponse } from "../../services/baseApi";

export interface ReadingProgress {
  _id: string;
  article: string | { _id: string; title: string; slug: string; coverImage?: { url?: string; secureUrl?: string }; author?: string | { username?: string; name?: string } };
  progressPercent: number;
  lastScrollPosition?: number;
  completedAt?: string;
  updatedAt: string;
}

export const readingProgressApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    readingProgress: builder.query<ReadingProgress[], void>({
      query: () => "/reading-progress",
      transformResponse: unwrapResponse<ReadingProgress[]>,
      providesTags: ["ReadingProgress"]
    }),
    syncReadingProgress: builder.mutation<ReadingProgress, { article: string; progressPercent: number; lastScrollPosition?: number; completedAt?: string }>({
      query: (body) => ({ url: "/reading-progress", method: "PUT", body }),
      transformResponse: unwrapResponse<ReadingProgress>,
      invalidatesTags: ["ReadingProgress"]
    })
  })
});

export const { useReadingProgressQuery, useSyncReadingProgressMutation } = readingProgressApi;

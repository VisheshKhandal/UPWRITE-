import { baseApi, unwrapResponse } from "../../services/baseApi";

export interface ReadingProgress {
  user?: string;
  _id: string;
  article:
    | string
    | {
        _id: string;
        title: string;
        slug: string;
        excerpt?: string;
        status?: "draft" | "published" | "archived";
        deletedAt?: string;
        readingTimeMinutes?: number;
        tags?: string[];
        coverImage?: { url?: string; secureUrl?: string };
        author?: string | { _id?: string; username?: string; name?: string; avatar?: { url?: string; secureUrl?: string } };
      };
  progressPercent: number;
  lastScrollPosition?: number;
  bodyPosition?: number;
  anchor?: { text: string; startOffset?: number; endOffset?: number; prefix?: string; suffix?: string };
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
    syncReadingProgress: builder.mutation<ReadingProgress, { article: string; progressPercent: number; clientUpdatedAt?: number; lastScrollPosition?: number; bodyPosition?: number; anchor?: ReadingProgress["anchor"]; completedAt?: string }>({
      query: (body) => ({ url: "/reading-progress", method: "PUT", keepalive: true, body }),
      transformResponse: unwrapResponse<ReadingProgress>,
      invalidatesTags: ["ReadingProgress"]
    })
  })
});

export const { useReadingProgressQuery, useSyncReadingProgressMutation } = readingProgressApi;

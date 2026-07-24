import { baseApi, unwrapResponse } from "../../services/baseApi";

export interface ReviewFlashcard {
  _id: string;
  article?: string;
  front: string;
  back: string;
  sourceText?: string;
  difficulty: "easy" | "medium" | "hard";
  dueAt: string;
  lastReviewedAt?: string;
  interval: number;
  easeFactor: number;
  createdAt: string;
}

export type ReviewRating = "again" | "hard" | "good" | "easy";

export const nextReview = (card: ReviewFlashcard, rating: ReviewRating) => {
  const easeFactor = Math.max(1.3, (card.easeFactor ?? 2.5) + (rating === "easy" ? 0.15 : rating === "hard" || rating === "again" ? -0.2 : 0));
  const multiplier = rating === "easy" ? 2 : rating === "good" ? 1.5 : rating === "hard" ? 1 : 1;
  const interval = rating === "again" ? 1 : Math.max(1, Math.round((card.interval || 1) * multiplier));
  const dueAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();
  const difficulty: ReviewFlashcard["difficulty"] = rating === "again" || rating === "hard" ? "hard" : rating === "easy" ? "easy" : "medium";
  return { dueAt, interval, easeFactor, lastReviewedAt: new Date().toISOString(), difficulty };
};

export const flashcardsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    flashcards: builder.query<ReviewFlashcard[], { article?: string; due?: boolean } | void>({
      query: (params) => ({ url: "/flashcards", params: params ?? undefined }),
      transformResponse: unwrapResponse<ReviewFlashcard[]>,
      providesTags: ["Flashcard"]
    }),
    createFlashcard: builder.mutation<ReviewFlashcard, Partial<ReviewFlashcard> & { front: string; back: string }>({
      query: (body) => ({ url: "/flashcards", method: "POST", body }),
      transformResponse: unwrapResponse<ReviewFlashcard>,
      invalidatesTags: ["Flashcard"]
    }),
    updateFlashcard: builder.mutation<ReviewFlashcard, Partial<ReviewFlashcard> & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/flashcards/${id}`, method: "PATCH", body }),
      transformResponse: unwrapResponse<ReviewFlashcard>,
      invalidatesTags: ["Flashcard"]
    })
  })
});

export const { useFlashcardsQuery, useCreateFlashcardMutation, useUpdateFlashcardMutation } = flashcardsApi;

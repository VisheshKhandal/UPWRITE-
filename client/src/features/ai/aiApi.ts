import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { Flashcard } from "../../components/article/FlashcardDeck";

export type AiAction =
  | "summarize"
  | "takeaways"
  | "eli15"
  | "insights"
  | "custom"
  | "explain-selection"
  | "summarize-selection"
  | "simplify-selection"
  | "translate-selection"
  | "learning-mode"
  | "generate-flashcards"
  | "generate-notes"
  | "writing-clarity"
  | "title-suggestions"
  | "excerpt-suggestions"
  | "tag-suggestions";

export interface AiArticleContext {
  id?: string;
  title: string;
  excerpt?: string | null;
  content: string;
  authorName?: string | null;
}

export interface AiLearningRequest {
  action: AiAction;
  article?: AiArticleContext;
  articleContent?: string;
  articleDraft?: string;
  selectedText?: string;
  question?: string;
  targetLanguage?: string;
  allowFallback?: boolean;
}

export interface AiLearningResponse {
  response: string;
  cached: boolean;
  source?: "openrouter" | "gemini" | "cache" | "local-fallback";
  provider?: "openrouter" | "gemini" | "local-fallback";
}

export interface SavedFlashcardSet {
  _id: string;
  articleId: string;
  articleTitle: string;
  cards: Flashcard[];
  updatedAt: string;
}

export const aiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    generateLearningResponse: builder.mutation<AiLearningResponse, AiLearningRequest>({
      query: (body) => ({
        url: "/ai/learning",
        method: "POST",
        body
      }),
      transformResponse: unwrapResponse<AiLearningResponse>
    }),
    saveFlashcardSet: builder.mutation<unknown, { articleId: string; articleTitle: string; cards: Flashcard[] }>({
      query: (body) => ({ url: "/ai/flashcards/save", method: "POST", body }),
      transformResponse: unwrapResponse<unknown>,
      invalidatesTags: ["Saved", "Flashcard"]
    }),
    flashcardSets: builder.query<SavedFlashcardSet[], void>({
      query: () => "/ai/flashcards/saved",
      transformResponse: unwrapResponse<SavedFlashcardSet[]>,
      providesTags: ["Saved"]
    })
  })
});

export const { useGenerateLearningResponseMutation, useSaveFlashcardSetMutation, useFlashcardSetsQuery } = aiApi;

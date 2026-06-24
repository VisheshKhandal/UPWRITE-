import { baseApi, unwrapResponse } from "../../services/baseApi";

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
  | "learning-mode";

export interface AiArticleContext {
  id?: string;
  title: string;
  excerpt?: string | null;
  content: string;
  authorName?: string | null;
}

export interface AiLearningRequest {
  action: AiAction;
  article: AiArticleContext;
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

export const aiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    generateLearningResponse: builder.mutation<AiLearningResponse, AiLearningRequest>({
      query: (body) => ({
        url: "/ai/learning",
        method: "POST",
        body
      }),
      transformResponse: unwrapResponse<AiLearningResponse>
    })
  })
});

export const { useGenerateLearningResponseMutation } = aiApi;

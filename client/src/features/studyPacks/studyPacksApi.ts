import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ReviewFlashcard } from "../flashcards/flashcardsApi";

export interface StudyPack {
  _id: string;
  article: string;
  title: string;
  summary?: string;
  notes?: string[];
  flashcards?: ReviewFlashcard[];
  updatedAt: string;
}

export const studyPacksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    studyPacks: builder.query<StudyPack[], { article?: string } | void>({
      query: (params) => ({ url: "/study-packs", params: params ?? undefined }),
      transformResponse: unwrapResponse<StudyPack[]>,
      providesTags: ["StudyPack"]
    }),
    saveStudyPack: builder.mutation<StudyPack, Partial<StudyPack> & { article: string; title: string }>({
      query: (body) => ({ url: "/study-packs", method: "POST", body }),
      transformResponse: unwrapResponse<StudyPack>,
      invalidatesTags: ["StudyPack"]
    })
  })
});

export const { useStudyPacksQuery, useSaveStudyPackMutation } = studyPacksApi;

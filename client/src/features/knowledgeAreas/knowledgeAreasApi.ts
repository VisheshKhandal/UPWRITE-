import { baseApi, unwrapResponse } from "../../services/baseApi";

export interface KnowledgeArea {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  articleCount?: number;
}

export const knowledgeAreasApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    knowledgeAreas: builder.query<KnowledgeArea[], void>({
      query: () => "/knowledge-areas",
      transformResponse: unwrapResponse<KnowledgeArea[]>,
      providesTags: ["KnowledgeArea"]
    })
  })
});

export const { useKnowledgeAreasQuery } = knowledgeAreasApi;

import { baseApi, unwrapResponse } from "../../services/baseApi";

export interface Highlight {
  _id: string;
  article: string;
  text: string;
  color?: string;
  noteCount?: number;
  startOffset?: number;
  endOffset?: number;
  createdAt: string;
}

export const highlightsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    highlightsByArticle: builder.query<Highlight[], string>({
      query: (article) => ({ url: "/highlights", params: { article } }),
      transformResponse: unwrapResponse<Highlight[]>,
      providesTags: (_result, _error, article) => [{ type: "Highlight", id: article }]
    }),
    createHighlight: builder.mutation<Highlight, Partial<Highlight> & { article: string; text: string }>({
      query: (body) => ({ url: "/highlights", method: "POST", body }),
      transformResponse: unwrapResponse<Highlight>,
      invalidatesTags: (_result, _error, body) => [{ type: "Highlight", id: body.article }]
    }),
    deleteHighlight: builder.mutation<unknown, { id: string; article: string }>({
      query: ({ id }) => ({ url: `/highlights/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, { article }) => [{ type: "Highlight", id: article }]
    })
  })
});

export const { useHighlightsByArticleQuery, useCreateHighlightMutation, useDeleteHighlightMutation } = highlightsApi;

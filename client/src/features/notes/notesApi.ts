import { baseApi, unwrapResponse } from "../../services/baseApi";

export interface ReaderNote {
  _id: string;
  article: string;
  highlight?: string;
  body: string;
  visibility: "private" | "public";
  createdAt: string;
  updatedAt: string;
}

export const notesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    notesByArticle: builder.query<ReaderNote[], string>({
      query: (article) => ({ url: "/notes", params: { article } }),
      transformResponse: unwrapResponse<ReaderNote[]>,
      providesTags: (_result, _error, article) => [{ type: "Note", id: article }]
    }),
    createNote: builder.mutation<ReaderNote, { article: string; body: string; highlight?: string; visibility?: "private" | "public" }>({
      query: (body) => ({ url: "/notes", method: "POST", body }),
      transformResponse: unwrapResponse<ReaderNote>,
      invalidatesTags: (_result, _error, body) => [{ type: "Note", id: body.article }]
    }),
    updateNote: builder.mutation<ReaderNote, Partial<ReaderNote> & { id: string; article: string }>({
      query: ({ id, ...body }) => ({ url: `/notes/${id}`, method: "PATCH", body }),
      transformResponse: unwrapResponse<ReaderNote>,
      invalidatesTags: (_result, _error, body) => [{ type: "Note", id: body.article }]
    }),
    deleteNote: builder.mutation<unknown, { id: string; article: string }>({
      query: ({ id }) => ({ url: `/notes/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, { article }) => [{ type: "Note", id: article }]
    })
  })
});

export const { useNotesByArticleQuery, useCreateNoteMutation, useUpdateNoteMutation, useDeleteNoteMutation } = notesApi;

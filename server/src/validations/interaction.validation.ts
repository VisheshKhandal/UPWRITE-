import { z } from "zod";
import { idParamsSchema, contentTargetSchema, paginationQuerySchema } from "./common.validation";

export const commentCreateSchema = z.object({
  body: contentTargetSchema.extend({
    body: z.string().trim().min(1).max(1200),
    parentComment: z.string().regex(/^[a-f\d]{24}$/i).optional()
  })
});

export const commentListSchema = z.object({
  query: contentTargetSchema.merge(paginationQuerySchema)
});

export const commentIdParamsSchema = z.object({
  params: idParamsSchema
});

export const likeToggleSchema = z.object({
  body: contentTargetSchema
});

export const bookmarkToggleSchema = z.object({
  body: contentTargetSchema.extend({
    collection: z.string().regex(/^[a-f\d]{24}$/i).optional()
  })
});

export const createCollectionSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(240).optional(),
    isPublic: z.boolean().optional()
  })
});

export const updateCollectionSchema = z.object({
  params: idParamsSchema,
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().max(240).optional(),
    isPublic: z.boolean().optional()
  })
});

export const collectionIdParamsSchema = z.object({
  params: idParamsSchema
});

export const collectionItemParamsSchema = z.object({
  params: z.object({
    id: idParamsSchema.shape.id,
    itemId: idParamsSchema.shape.id
  })
});

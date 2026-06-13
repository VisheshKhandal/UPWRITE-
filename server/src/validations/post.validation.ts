import { z } from "zod";
import { PostType } from "../models/Post";
import { idParamsSchema, paginationQuerySchema } from "./common.validation";

export const createPostSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(120).optional(),
    type: z.nativeEnum(PostType).optional(),
    body: z.string().trim().min(1).max(500),
    tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
    media: z
      .array(
        z.object({
          url: z.string().url(),
          publicId: z.string().min(1),
          resourceType: z.string().default("image")
        })
      )
      .max(4)
      .optional()
  })
});

export const updatePostSchema = z.object({
  params: idParamsSchema,
  body: z.object({
    title: z.string().trim().min(1).max(120).optional(),
    type: z.nativeEnum(PostType).optional(),
    body: z.string().trim().min(1).max(500).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
    media: z
      .array(
        z.object({
          url: z.string().url(),
          publicId: z.string().min(1),
          resourceType: z.string().default("image")
        })
      )
      .max(4)
      .optional()
  })
});

export const postIdParamsSchema = z.object({
  params: idParamsSchema
});

export const postListQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    author: z.string().trim().optional(),
    authorId: z.string().trim().optional()
  })
});

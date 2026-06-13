import { z } from "zod";
import { ArticleStatus } from "../models/Article";
import { idParamsSchema, paginationQuerySchema } from "./common.validation";

const coverImageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1)
});

export const createArticleSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(140),
    content: z.string().min(1),
    excerpt: z.string().trim().max(260).optional(),
    status: z.nativeEnum(ArticleStatus).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
    coverImage: coverImageSchema.optional()
  })
});

export const updateArticleSchema = z.object({
  params: idParamsSchema,
  body: z.object({
    title: z.string().trim().min(3).max(140).optional(),
    content: z.string().min(1).optional(),
    excerpt: z.string().trim().max(260).optional(),
    status: z.nativeEnum(ArticleStatus).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
    coverImage: coverImageSchema.optional()
  })
});

export const articleIdParamsSchema = z.object({
  params: idParamsSchema
});

export const articleSlugParamsSchema = z.object({
  params: z.object({
    slug: z.string().trim().min(1)
  })
});

export const articleUsernameSlugParamsSchema = z.object({
  params: z.object({
    username: z.string().trim().min(3).max(30),
    slug: z.string().trim().min(1)
  })
});

export const articleListQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    tag: z.string().trim().optional(),
    status: z.nativeEnum(ArticleStatus).optional(),
    author: z.string().trim().optional(),
    authorId: z.string().trim().optional()
  })
});

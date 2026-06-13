import { z } from "zod";
import { ContentType } from "../models/Comment";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional()
});

export const contentTargetSchema = z.object({
  contentType: z.nativeEnum(ContentType),
  contentId: objectIdSchema
});

export const idParamsSchema = z.object({
  id: objectIdSchema
});

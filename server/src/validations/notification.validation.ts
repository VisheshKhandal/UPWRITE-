import { z } from "zod";
import { idParamsSchema, paginationQuerySchema } from "./common.validation";

export const notificationListSchema = z.object({
  query: paginationQuerySchema.extend({
    unreadOnly: z.coerce.boolean().optional()
  })
});

export const notificationIdParamsSchema = z.object({
  params: idParamsSchema
});

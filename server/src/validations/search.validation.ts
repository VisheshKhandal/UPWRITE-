import { z } from "zod";
import { paginationQuerySchema } from "./common.validation";

export const searchQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    q: z.string().trim().min(2),
    type: z.enum(["all", "users", "articles", "posts", "tags"]).default("all")
  })
});

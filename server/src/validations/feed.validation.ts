import { z } from "zod";
import { paginationQuerySchema } from "./common.validation";

export const feedQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    type: z.enum(["article", "post"]).optional()
  })
});

import { z } from "zod";
import { UploadContext } from "../models/UploadAsset";

export const uploadQuerySchema = z.object({
  body: z.object({
    context: z.nativeEnum(UploadContext)
  })
});

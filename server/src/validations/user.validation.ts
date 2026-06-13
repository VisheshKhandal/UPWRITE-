import { z } from "zod";
import { idParamsSchema } from "./common.validation";

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    bio: z.string().trim().max(280).optional(),
    skills: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    interests: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    socialLinks: z
      .object({
        website: z.string().url().optional().or(z.literal("")),
        github: z.string().url().optional().or(z.literal("")),
        linkedin: z.string().url().optional().or(z.literal("")),
        twitter: z.string().url().optional().or(z.literal(""))
      })
      .optional()
  })
});

export const usernameParamsSchema = z.object({
  params: z.object({
    username: z.string().trim().min(3).max(30)
  })
});

export const userIdParamsSchema = z.object({
  params: idParamsSchema
});

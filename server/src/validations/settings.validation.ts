import { z } from "zod";
import { idParamsSchema } from "./common.validation";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/\d/, "Password must contain a number");

export const appearanceSettingsSchema = z.object({
  body: z
    .object({
      theme: z.enum(["light", "dark", "system"]).optional(),
      fontSize: z.enum(["small", "medium", "large", "extra-large"]).optional(),
      readingWidth: z.enum(["narrow", "comfortable", "wide"]).optional(),
      reduceMotion: z.boolean().optional(),
      highContrast: z.boolean().optional(),
      compactLayout: z.boolean().optional(),
      showReadingTime: z.boolean().optional(),
      showViewCounts: z.boolean().optional(),
      showLikeCounts: z.boolean().optional(),
      showAuthorStats: z.boolean().optional(),
      language: z.enum(["en", "hi"]).optional(),
      autoSaveInterval: z.enum(["30s", "1m", "5m", "disabled"]).optional(),
      focusWritingMode: z.boolean().optional()
    })
    .strict()
});

export const privacySettingsSchema = z.object({
  body: z
    .object({
      profileVisibility: z.enum(["public", "private"]).optional(),
      showEmail: z.boolean().optional(),
      showJoinDate: z.boolean().optional(),
      showSocialLinks: z.boolean().optional()
    })
    .strict()
});

export const passwordUpdateSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1)
  }).refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match"
  })
});

export const sessionParamsSchema = z.object({
  params: idParamsSchema
});

export const twoFactorEnableSchema = z.object({
  body: z.object({
    secret: z.string().min(16),
    token: z.string().regex(/^\d{6}$/, "Enter the 6-digit authenticator code")
  })
});

export const passwordConfirmationSchema = z.object({
  body: z.object({
    password: z.string().min(1)
  })
});

export const recoverySettingsSchema = z.object({
  body: z
    .object({
      recoveryEmail: z.string().trim().email().toLowerCase().optional().or(z.literal("")),
      emailAlerts: z.boolean().optional(),
      inAppNotifications: z.boolean().optional()
    })
    .strict()
});

export const onboardingSchema = z.object({
  body: z
    .object({
      interests: z.array(z.string().trim().min(1).max(40)).min(3).max(12),
      identity: z.enum(["student", "developer", "creator", "writer", "freelancer", "founder", "learner"]),
      goals: z
        .array(z.enum(["learn_skills", "build_personal_brand", "share_knowledge", "document_journey", "grow_audience", "find_opportunities"]))
        .min(1)
        .max(6),
      learningPreferences: z.array(z.enum(["short_reads", "deep_dives", "project_based", "community_discussion"])).min(1).max(4),
      writingPreferences: z.array(z.enum(["quick_posts", "long_form", "learning_logs", "tutorials"])).min(1).max(4),
      tourCompleted: z.boolean().optional()
    })
    .strict()
});

export const exportQuerySchema = z.object({
  query: z.object({
    format: z.enum(["json", "csv"]).optional()
  })
});

export const accountDeletionSchema = z.object({
  body: z.object({
    password: z.string().min(1),
    confirmation: z.string()
  })
});

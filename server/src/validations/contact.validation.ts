import { z } from "zod";
import { ContactSubmissionPriority, ContactSubmissionType } from "../models/ContactSubmission";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

const metadataSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}, z
  .object({
    browser: optionalText(240),
    operatingSystem: optionalText(120),
    theme: optionalText(40),
    viewport: optionalText(40),
    currentUrl: optionalText(600),
    currentRoute: optionalText(240),
    userAgent: optionalText(600),
    user: optionalText(120),
    timestamp: optionalText(80)
  })
  .strict()
  .optional());

const baseBodySchema = z.object({
  type: z.nativeEnum(ContactSubmissionType),
  name: optionalText(80),
  email: z.string().trim().email("Enter a valid email address").toLowerCase().max(160),
  title: optionalText(140),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000),
  expectedBehavior: optionalText(2500),
  actualBehavior: optionalText(2500),
  expectedBenefit: optionalText(2500),
  priority: z.nativeEnum(ContactSubmissionPriority).optional(),
  satisfactionRating: z.coerce.number().int().min(1).max(5).optional(),
  metadata: metadataSchema
});

export const createContactSubmissionSchema = z.object({
  body: baseBodySchema.superRefine((value, ctx) => {
    if (value.type === ContactSubmissionType.FEATURE_REQUEST) {
      if (!value.title) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["title"],
          message: "Feature title is required"
        });
      }
      if (!value.expectedBenefit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expectedBenefit"],
          message: "Expected benefit is required"
        });
      }
    }
  })
});

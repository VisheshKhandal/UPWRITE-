import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const personalEmailDomains = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com"
]);

const getEmailDomain = (email?: string) => email?.split("@")[1]?.toLowerCase();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  API_VERSION: z.string().default("v1"),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  CLIENT_ORIGINS: z.string().optional(),
  CLIENT_URL: z.string().optional(),
  COOKIE_DOMAIN: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().url().optional(),
  ACCESS_TOKEN_SECRET: z.string().min(24, "ACCESS_TOKEN_SECRET must be at least 24 characters"),
  REFRESH_TOKEN_SECRET: z.string().min(24, "REFRESH_TOKEN_SECRET must be at least 24 characters"),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(30),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("openrouter/free"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_MODE: z.enum(["development", "production"]).default("development"),
  ADMIN_EMAIL: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().default("Upwrite"),
  EMAIL_FROM_ADDRESS: z.string().email().optional(),
  REPLY_TO_EMAIL: z.string().email().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(200),
  UPLOAD_MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(5)
}).superRefine((value, ctx) => {
  if (!value.RESEND_API_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["RESEND_API_KEY"],
      message: "RESEND_API_KEY is required for Contact & Feedback emails"
    });
  }

  if (!value.ADMIN_EMAIL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ADMIN_EMAIL"],
      message: "ADMIN_EMAIL is required for Contact & Feedback emails"
    });
  }

  if (!value.REPLY_TO_EMAIL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["REPLY_TO_EMAIL"],
      message: "REPLY_TO_EMAIL is required so recipients can reply to Upwrite"
    });
  }

  if (value.EMAIL_MODE === "production") {
    if (!value.EMAIL_FROM_ADDRESS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["EMAIL_FROM_ADDRESS"],
        message: "EMAIL_FROM_ADDRESS is required in production email mode"
      });
    }

    const senderDomain = getEmailDomain(value.EMAIL_FROM_ADDRESS);
    if (senderDomain && personalEmailDomains.has(senderDomain)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["EMAIL_FROM_ADDRESS"],
        message: "EMAIL_FROM_ADDRESS must use a Resend verified domain in production, not Gmail/Yahoo/Outlook"
      });
    }
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  CLIENT_URL: parsed.data.CLIENT_URL ?? parsed.data.CLIENT_ORIGIN,
  CLIENT_ORIGINS: [
    ...(parsed.data.CLIENT_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    parsed.data.CLIENT_ORIGIN
  ],
  isProduction: parsed.data.NODE_ENV === "production",
  isDevelopment: parsed.data.NODE_ENV === "development"
};

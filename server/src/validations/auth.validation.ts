import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/\d/, "Password must contain a number");

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    username: usernameSchema,
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    password: passwordSchema
  })
});

export const loginSchema = z.object({
  body: z.object({
    emailOrUsername: z.string().trim().min(3),
    password: z.string().min(1)
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email().transform((value) => value.toLowerCase())
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(16),
    password: passwordSchema
  })
});

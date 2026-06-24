import { z } from "zod";

export const aiActionSchema = z.enum([
  "summarize",
  "takeaways",
  "eli15",
  "insights",
  "custom",
  "explain-selection",
  "summarize-selection",
  "simplify-selection",
  "translate-selection",
  "learning-mode"
]);

export const aiRequestSchema = z.object({
  body: z.object({
    action: aiActionSchema,
    article: z.object({
      id: z.string().optional(),
      title: z.string().min(1).max(220),
      excerpt: z.string().max(1000).optional().nullable(),
      content: z.string().min(1).max(60000),
      authorName: z.string().max(120).optional().nullable()
    }),
    selectedText: z.string().max(6000).optional(),
    question: z.string().max(1000).optional(),
    targetLanguage: z.string().max(60).optional(),
    allowFallback: z.boolean().optional()
  })
});

export type AiAction = z.infer<typeof aiActionSchema>;

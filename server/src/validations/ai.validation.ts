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
  "learning-mode",
  "generate-flashcards",
  "generate-notes",
  "writing-clarity",
  "title-suggestions",
  "excerpt-suggestions",
  "tag-suggestions"
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
    }).optional(),
    articleContent: z.string().min(1).max(60000).optional(),
    articleDraft: z.string().min(1).max(60000).optional(),
    selectedText: z.string().max(6000).optional(),
    question: z.string().max(1000).optional(),
    targetLanguage: z.string().max(60).optional(),
    allowFallback: z.boolean().optional()
  })
});

export const flashcardSetSchema = z.object({
  body: z.object({
    articleId: z.string().regex(/^[a-f\d]{24}$/i),
    articleTitle: z.string().trim().min(1).max(220),
    cards: z.array(z.object({
      question: z.string().trim().min(1).max(1000),
      answer: z.string().trim().min(1).max(3000)
    })).min(1).max(20)
  })
});

export type AiAction = z.infer<typeof aiActionSchema>;

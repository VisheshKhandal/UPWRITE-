import crypto from "crypto";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import type { AiAction } from "../validations/ai.validation";

interface ArticleContext {
  id?: string;
  title: string;
  excerpt?: string | null;
  content: string;
  authorName?: string | null;
}

interface AiRequest {
  action: AiAction;
  article: ArticleContext;
  selectedText?: string;
  question?: string;
  targetLanguage?: string;
  allowFallback?: boolean;
}

interface CacheEntry {
  response: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const FALLBACK_CACHE_TTL_MS = 1000 * 60 * 5;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`;
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

const actionPrompts: Record<AiAction, string> = {
  summarize: "Write a concise summary of the article in 4-6 bullets. Focus on understanding, not hype.",
  takeaways: "Extract the most important key takeaways. Make each takeaway specific and useful for later recall.",
  eli15: "Explain the article like the reader is 15: clear, respectful, concrete, and free of jargon where possible.",
  insights: "Turn the article into actionable insights. Include practical ways a reader could apply the knowledge.",
  custom: "Answer the reader's question using only the article as source context. Say when the article does not contain enough evidence.",
  "explain-selection": "Explain the selected passage in context of the full article.",
  "summarize-selection": "Summarize the selected passage in context of the full article.",
  "simplify-selection": "Simplify the selected passage while preserving its meaning and nuance.",
  "translate-selection": "Translate the selected passage contextually, preserving meaning rather than translating word-for-word.",
  "learning-mode": "Create concise summary notes followed by useful revision flashcards. Format with headings: Summary Notes and Flashcards."
};

const createCacheKey = (request: AiRequest) =>
  crypto
    .createHash("sha256")
    .update(JSON.stringify(request))
    .digest("hex");

const buildPrompt = (request: AiRequest) => {
  const selected = request.selectedText ? `\nSelected text:\n${request.selectedText}` : "";
  const question = request.question ? `\nReader question:\n${request.question}` : "";
  const targetLanguage = request.targetLanguage ? `\nTarget language: ${request.targetLanguage}` : "";

  return [
    "You are Upwrite's learning assistant. Help readers understand, retain, and apply knowledge.",
    "Be accurate, concise, warm, and grounded in the provided article. Do not invent facts.",
    actionPrompts[request.action],
    question,
    targetLanguage,
    selected,
    `\nArticle title: ${request.article.title}`,
    request.article.excerpt ? `Article excerpt: ${request.article.excerpt}` : "",
    request.article.authorName ? `Author: ${request.article.authorName}` : "",
    `\nArticle content:\n${request.article.content}`
  ]
    .filter(Boolean)
    .join("\n");
};

const readGeminiText = (payload: unknown) => {
  const data = payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
};

const readOpenRouterText = (payload: unknown) => {
  const data = payload as { choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }> };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  return content?.map((part) => part.text ?? "").join("").trim() ?? "";
};

const parseResetAt = (headers: Headers) => {
  const retryAfter = headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return new Date(Date.now() + seconds * 1000).toISOString();
    const date = new Date(retryAfter);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  const reset = headers.get("x-ratelimit-reset") ?? headers.get("x-rate-limit-reset");
  if (!reset) return undefined;

  const numeric = Number(reset);
  if (Number.isFinite(numeric)) {
    return new Date(numeric > 10_000_000_000 ? numeric : numeric * 1000).toISOString();
  }

  const date = new Date(reset);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const buildRateLimitDetails = (provider: "openrouter" | "gemini", response: Response, body: string) => ({
  code: "AI_PRIMARY_RATE_LIMITED",
  provider,
  fallbackProvider: "gemini",
  fallbackAvailable: provider === "openrouter" && !!env.GEMINI_API_KEY,
  resetAt: parseResetAt(response.headers),
  retryAfterSeconds: Number(response.headers.get("retry-after")) || undefined,
  message:
    provider === "openrouter"
      ? "OpenRouter free AI quota is exhausted or temporarily rate-limited."
      : "Gemini fallback is exhausted or temporarily rate-limited.",
  providerMessage: body.slice(0, 500)
});

const stripMarkdown = (value: string) =>
  value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_>`~\-[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getSentences = (value: string) =>
  stripMarkdown(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 35)
    .slice(0, 12);

const pickImportantSentences = (value: string, limit: number) => {
  const sentences = getSentences(value);
  const scored = sentences.map((sentence, index) => {
    const lower = sentence.toLowerCase();
    const score =
      (lower.includes("important") ? 3 : 0) +
      (lower.includes("because") ? 2 : 0) +
      (lower.includes("therefore") ? 2 : 0) +
      (lower.includes("learn") ? 2 : 0) +
      (lower.includes("understand") ? 2 : 0) +
      Math.max(0, 4 - index * 0.25);
    return { sentence, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.sentence);
};

const buildLocalFallback = (request: AiRequest) => {
  const source = request.selectedText?.trim() || request.article.content;
  const important = pickImportantSentences(source, 6);
  const title = request.article.title;
  const bullets = important.length ? important : [request.article.excerpt || `This article explains ${title}.`];

  if (request.action === "learning-mode") {
    const flashcards = bullets.slice(0, 5).map((sentence, index) => {
      const answer = sentence.length > 180 ? `${sentence.slice(0, 177)}...` : sentence;
      return `**Q${index + 1}. What is one key idea from "${title}"?**\nA: ${answer}`;
    });

    return [
      "## Summary Notes",
      ...bullets.slice(0, 5).map((sentence) => `- ${sentence}`),
      "",
      "## Flashcards",
      ...flashcards
    ].join("\n");
  }

  if (request.action === "takeaways" || request.action === "insights") {
    return bullets.slice(0, 5).map((sentence) => `- ${sentence}`).join("\n");
  }

  if (request.action === "eli15" || request.action === "simplify-selection") {
    return [
      `Here is the simple version of "${title}":`,
      "",
      ...bullets.slice(0, 4).map((sentence) => `- ${sentence}`)
    ].join("\n");
  }

  if (request.action === "translate-selection") {
    return [
      "Contextual translation needs the AI provider, but the current free-tier limit is exhausted.",
      "",
      "Selected meaning to preserve:",
      request.selectedText || bullets[0]
    ].join("\n");
  }

  if (request.action === "custom") {
    return [
      "The AI provider is rate-limited, so here is the closest article-grounded answer available locally:",
      "",
      ...bullets.slice(0, 4).map((sentence) => `- ${sentence}`)
    ].join("\n");
  }

  return [
    `## ${title}`,
    "",
    ...bullets.slice(0, 5).map((sentence) => `- ${sentence}`)
  ].join("\n");
};

const isRateLimitResponse = (status: number, body: string) =>
  status === 429 || body.toLowerCase().includes("quota") || body.toLowerCase().includes("rate limit");

const callOpenRouter = async (request: AiRequest) => {
  if (!env.OPENROUTER_API_KEY) {
    throw new AppError("OpenRouter is not configured on this server.", 503);
  }

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": env.CLIENT_ORIGIN,
      "X-Title": "Upwrite"
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      messages: [
        {
          role: "user",
          content: buildPrompt(request)
        }
      ],
      temperature: 0.35,
      top_p: 0.9,
      max_tokens: request.action === "learning-mode" ? 1600 : 900
    })
  });

  if (!response.ok) {
    const body = await response.text();
    if (isRateLimitResponse(response.status, body)) {
      throw new AppError("OpenRouter free AI quota has been reached.", 429, buildRateLimitDetails("openrouter", response, body));
    }
    throw new AppError("OpenRouter AI response failed. Please try again in a moment.", response.status >= 500 ? 502 : 400);
  }

  const text = readOpenRouterText(await response.json());
  if (!text) throw new AppError("OpenRouter returned an empty response. Please try again.", 502);
  return text;
};

const callGemini = async (request: AiRequest) => {
  if (!env.GEMINI_API_KEY) {
    throw new AppError("Gemini fallback is not configured on this server.", 503);
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildPrompt(request) }] }],
      generationConfig: {
        temperature: 0.35,
        topP: 0.9,
        maxOutputTokens: request.action === "learning-mode" ? 1600 : 900
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    if (isRateLimitResponse(response.status, body)) {
      throw new AppError("Gemini fallback quota has been reached.", 429, buildRateLimitDetails("gemini", response, body));
    }
    throw new AppError("Gemini AI response failed. Please try again in a moment.", response.status >= 500 ? 502 : 400);
  }

  const text = readGeminiText(await response.json());
  if (!text) throw new AppError("Gemini returned an empty response. Please try again.", 502);
  return text;
};

export const generateLearningResponse = async (request: AiRequest) => {
  const key = createCacheKey(request);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return { response: cached.response, cached: true, source: "cache", provider: "openrouter" };
  }

  try {
    const text = await callOpenRouter(request);
    cache.set(key, { response: text, expiresAt: Date.now() + CACHE_TTL_MS });
    return { response: text, cached: false, source: "openrouter", provider: "openrouter" };
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 429 && !request.allowFallback) {
      throw error;
    }

    if (request.allowFallback) {
      try {
        const text = await callGemini(request);
        cache.set(key, { response: text, expiresAt: Date.now() + CACHE_TTL_MS });
        return { response: text, cached: false, source: "gemini", provider: "gemini" };
      } catch (fallbackError) {
        if (fallbackError instanceof AppError && fallbackError.statusCode === 429) {
          throw fallbackError;
        }
      }
    }

    const fallback = buildLocalFallback(request);
    cache.set(key, { response: fallback, expiresAt: Date.now() + FALLBACK_CACHE_TTL_MS });
    return { response: fallback, cached: false, source: "local-fallback", provider: "local-fallback" };
  }
};

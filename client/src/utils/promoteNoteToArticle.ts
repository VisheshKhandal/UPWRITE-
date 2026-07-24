import type { ImageAsset } from "../types/models";

export interface PromotedNoteDraft {
  title: string;
  body: string;
  tags: string[];
  cover?: ImageAsset | null;
  promotedAt: string;
}

const PROMOTE_KEY = "upwrite-promote-note";

export const storePromotedNote = (draft: Omit<PromotedNoteDraft, "promotedAt">) => {
  const payload: PromotedNoteDraft = { ...draft, promotedAt: new Date().toISOString() };
  sessionStorage.setItem(PROMOTE_KEY, JSON.stringify(payload));
};

export const consumePromotedNote = (): PromotedNoteDraft | null => {
  const raw = sessionStorage.getItem(PROMOTE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(PROMOTE_KEY);
  try {
    return JSON.parse(raw) as PromotedNoteDraft;
  } catch {
    return null;
  }
};

export const noteToArticleContent = (body: string) => {
  const paragraphs = body
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) return body.trim();
  return paragraphs.map((block) => (block.startsWith("#") ? block : block)).join("\n\n");
};

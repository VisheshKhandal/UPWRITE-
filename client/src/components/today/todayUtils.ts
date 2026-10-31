import type { ReadingProgress } from "../../features/readingProgress/readingProgressApi";
import type { Article } from "../../types/models";

export type TodayContentFilter = "articles" | "logs";
export type TodayFeedSort = "latest" | "trending";
export type WriteTab = "article" | "post";

export interface ParsedTodayFeedParams {
  contentFilter: TodayContentFilter;
  feedSort: TodayFeedSort;
  page: number;
  apiType: "article" | "post";
}

export const parseFeedSearchParams = (searchParams: URLSearchParams): ParsedTodayFeedParams => {
  const rawType = searchParams.get("type")?.toLowerCase();
  const contentFilter: TodayContentFilter =
    rawType === "logs" || rawType === "post" || rawType === "posts" ? "logs" : "articles";

  const rawFeed = (searchParams.get("feed") ?? searchParams.get("sort"))?.toLowerCase();
  const feedSort: TodayFeedSort = rawFeed === "trending" ? "trending" : "latest";

  const rawPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  return {
    contentFilter,
    feedSort,
    page,
    apiType: contentFilter === "logs" ? "post" : "article"
  };
};

export const updateFeedSearchParams = (
  current: URLSearchParams,
  updates: {
    contentFilter?: TodayContentFilter;
    feedSort?: TodayFeedSort;
    page?: number;
  }
): URLSearchParams => {
  const next = new URLSearchParams(current);
  const prevParsed = parseFeedSearchParams(current);

  const nextContent = updates.contentFilter ?? prevParsed.contentFilter;
  const nextSort = updates.feedSort ?? prevParsed.feedSort;
  const filterChanged =
    (updates.contentFilter && updates.contentFilter !== prevParsed.contentFilter) ||
    (updates.feedSort && updates.feedSort !== prevParsed.feedSort);

  const nextPage =
    updates.page !== undefined ? Math.max(1, Math.floor(updates.page)) : filterChanged ? 1 : prevParsed.page;

  if (nextContent === "logs") {
    next.set("type", "logs");
  } else {
    next.delete("type");
  }

  if (nextSort === "trending") {
    next.set("feed", "trending");
  } else {
    next.delete("feed");
  }
  next.delete("sort");

  if (nextPage > 1) {
    next.set("page", String(nextPage));
  } else {
    next.delete("page");
  }

  return next;
};

export type PaginationToken = number | "ellipsis-start" | "ellipsis-end";

export const buildPaginationRange = (currentPage: number, totalPages: number): PaginationToken[] => {
  const total = Math.max(1, Math.floor(totalPages));
  const current = Math.min(total, Math.max(1, Math.floor(currentPage)));

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-end", total];
  }

  if (current >= total - 3) {
    return [1, "ellipsis-start", total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, "ellipsis-start", current - 1, current, current + 1, "ellipsis-end", total];
};

export interface EligibleContinueReadingItem {
  progressId: string;
  articleId: string;
  title: string;
  slug: string;
  excerpt?: string;
  authorName: string;
  authorUsername: string;
  readingTimeMinutes?: number;
  coverImage?: { url?: string; secureUrl?: string };
  progressPercent: number;
  lastScrollPosition?: number;
  updatedAt: string;
  articleHref: string;
}

export const selectContinueReading = (
  records: ReadingProgress[] | undefined | null
): EligibleContinueReadingItem | null => {
  if (!records?.length) return null;

  const eligible = records
    .filter((record) => {
      if (!record || typeof record.article !== "object" || !record.article) return false;
      const article = record.article;
      if (!article._id || !article.title?.trim() || !article.slug?.trim()) return false;
      if (article.deletedAt) return false;
      if (article.status && article.status !== "published") return false;
      if (record.completedAt) return false;
      const pct = Number(record.progressPercent ?? 0);
      if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) return false;
      const author = typeof article.author === "object" && article.author ? article.author : null;
      if (!author?.username?.trim()) return false;
      return true;
    })
    .sort((a, b) => {
      const timeDiff = new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      if (timeDiff !== 0) return timeDiff;
      return String(b._id).localeCompare(String(a._id));
    });

  const chosen = eligible[0];
  if (!chosen || typeof chosen.article !== "object" || !chosen.article) return null;
  const article = chosen.article;
  const author = typeof article.author === "object" && article.author ? article.author : {};
  const authorUsername = author.username?.trim() ?? "";
  const clampedPercent = Math.min(99, Math.max(1, Math.round(Number(chosen.progressPercent))));

  return {
    progressId: chosen._id,
    articleId: article._id,
    title: article.title.trim(),
    slug: article.slug.trim(),
    excerpt: article.excerpt?.trim() || undefined,
    authorName: author.name?.trim() || authorUsername || "Upwrite writer",
    authorUsername,
    readingTimeMinutes: article.readingTimeMinutes,
    coverImage: article.coverImage,
    progressPercent: clampedPercent,
    lastScrollPosition: chosen.lastScrollPosition,
    updatedAt: chosen.updatedAt,
    articleHref: `/articles/${authorUsername}/${article.slug.trim()}`
  };
};

export interface EligibleDraftSummary {
  id: string;
  title: string;
  excerpt?: string;
  updatedAt: string;
  editHref: string;
}

export const selectLatestDraft = (drafts: Article[] | undefined | null): EligibleDraftSummary | null => {
  if (!drafts?.length) return null;

  const validDrafts = drafts
    .filter((draft) => {
      if (!draft || !draft._id) return false;
      if (draft.deletedAt) return false;
      if (draft.status && draft.status !== "draft") return false;
      return true;
    })
    .sort((a, b) => {
      const aTime = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const bTime = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      if (bTime !== aTime) return bTime - aTime;
      return String(b._id).localeCompare(String(a._id));
    });

  const latest = validDrafts[0];
  if (!latest) return null;

  return {
    id: latest._id,
    title: latest.title?.trim() || "Untitled draft",
    excerpt: latest.excerpt?.trim() || undefined,
    updatedAt: latest.updatedAt ?? latest.createdAt,
    editHref: `/write/${latest._id}`
  };
};

export const resolveWriteTab = (options: {
  articleId?: string;
  modeParam?: string | null;
  hasPromotedNote?: boolean;
  rememberedTab?: string | null;
}): WriteTab => {
  if (options.articleId) return "article";
  if (options.hasPromotedNote) return "article";

  const normalizedMode = options.modeParam?.trim().toLowerCase();
  if (normalizedMode === "article" || normalizedMode === "articles") {
    return "article";
  }
  if (normalizedMode === "log" || normalizedMode === "logs" || normalizedMode === "post") {
    return "post";
  }

  if (options.rememberedTab === "post") {
    return "post";
  }
  return "article";
};


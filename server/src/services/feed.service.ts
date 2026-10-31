import { ArticleModel, ArticleStatus } from "../models/Article";
import { FollowModel } from "../models/Follow";
import { PostModel } from "../models/Post";
import { UserModel } from "../models/User";
import { getPagination, paginationMeta } from "../utils/pagination";
import { attachViewerStateToFeedItems } from "./content.service";
import type { Request } from "express";

type FeedContentType = "article" | "post";

const parseRequestedFeedType = (rawType: unknown): FeedContentType | undefined => {
  if (rawType === "article" || rawType === "post") return rawType;
  return undefined;
};

const compareTieBreaker = (aId: unknown, bId: unknown) =>
  String(bId ?? "").localeCompare(String(aId ?? ""));

export const feedService = {
  async latest(req: Request, userId?: string) {
    const { page, limit, skip } = getPagination(req);
    const requestedType = parseRequestedFeedType(req.query.type);
    let authors: string[] | undefined;
    let interests: string[] = [];

    if (userId) {
      const [following, user] = await Promise.all([
        FollowModel.find({ follower: userId }).select("following").lean(),
        UserModel.findById(userId).select("interests").lean()
      ]);
      authors = [userId, ...following.map((item) => String(item.following))];
      interests = Array.isArray(user?.interests) ? user.interests.map((interest) => String(interest)) : [];
    }

    const postFilter: Record<string, unknown> = { deletedAt: { $exists: false } };
    const articleFilter: Record<string, unknown> = {
      deletedAt: { $exists: false },
      status: ArticleStatus.PUBLISHED
    };

    if (authors?.length) {
      postFilter.author = { $in: authors };
      articleFilter.author = { $in: authors };
    }

    const [posts, articles] = await Promise.all([
      !requestedType || requestedType === "post"
        ? PostModel.find(postFilter)
            .sort({ createdAt: -1, _id: -1 })
            .populate("author", "name username avatar")
            .lean()
        : Promise.resolve([]),
      !requestedType || requestedType === "article"
        ? ArticleModel.find(articleFilter)
            .sort({ createdAt: -1, _id: -1 })
            .select("-content")
            .populate("author", "name username avatar")
            .lean()
        : Promise.resolve([])
    ]);

    const score = (tags?: string[]) => {
      if (!interests.length || !tags?.length) return 0;
      const normalized = tags.map((tag) => tag.toLowerCase());
      return interests.filter((interest) => normalized.includes(interest)).length;
    };

    const merged = [
      ...posts.map((post) => ({
        type: "post" as const,
        createdAt: post.createdAt,
        score: score(post.tags),
        item: post
      })),
      ...articles.map((article) => ({
        type: "article" as const,
        createdAt: article.createdAt,
        score: score(article.tags),
        item: article
      }))
    ].sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
        compareTieBreaker(a.item._id, b.item._id)
    );

    const pageSlice = merged.slice(skip, skip + limit).map(({ score: _score, ...item }) => item);
    const items = await attachViewerStateToFeedItems(pageSlice, userId);

    return {
      items,
      meta: paginationMeta(page, limit, merged.length)
    };
  },

  async trending(req: Request, userId?: string) {
    const { page, limit, skip } = getPagination(req);
    const requestedType = parseRequestedFeedType(req.query.type);

    const [posts, articles] = await Promise.all([
      !requestedType || requestedType === "post"
        ? PostModel.find({ deletedAt: { $exists: false } })
            .sort({ "engagement.likesCount": -1, "engagement.commentsCount": -1, createdAt: -1, _id: -1 })
            .populate("author", "name username avatar")
            .lean()
        : Promise.resolve([]),
      !requestedType || requestedType === "article"
        ? ArticleModel.find({
            deletedAt: { $exists: false },
            status: ArticleStatus.PUBLISHED
          })
            .sort({
              "stats.likesCount": -1,
              "stats.viewsCount": -1,
              "stats.bookmarksCount": -1,
              createdAt: -1,
              _id: -1
            })
            .select("-content")
            .populate("author", "name username avatar")
            .lean()
        : Promise.resolve([])
    ]);

    const ranked = [
      ...posts.map((post) => ({
        type: "post" as const,
        popularity:
          (post.engagement?.likesCount ?? 0) +
          (post.engagement?.bookmarksCount ?? 0) +
          (post.engagement?.sharesCount ?? 0),
        createdAt: post.createdAt,
        item: post
      })),
      ...articles.map((article) => ({
        type: "article" as const,
        popularity:
          (article.stats?.likesCount ?? 0) +
          (article.stats?.viewsCount ?? 0) +
          (article.stats?.bookmarksCount ?? 0),
        createdAt: article.createdAt,
        item: article
      }))
    ].sort(
      (a, b) =>
        b.popularity - a.popularity ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
        compareTieBreaker(a.item._id, b.item._id)
    );

    const pageSlice = ranked.slice(skip, skip + limit).map(({ popularity: _popularity, ...item }) => item);
    const items = await attachViewerStateToFeedItems(pageSlice, userId);

    return {
      items,
      meta: paginationMeta(page, limit, ranked.length)
    };
  }
};

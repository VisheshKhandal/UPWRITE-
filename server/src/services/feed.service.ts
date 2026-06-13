import { ArticleModel, ArticleStatus } from "../models/Article";
import { FollowModel } from "../models/Follow";
import { PostModel } from "../models/Post";
import { UserModel } from "../models/User";
import { getPagination, paginationMeta } from "../utils/pagination";
import type { Request } from "express";

export const feedService = {
  async latest(req: Request, userId?: string) {
    const { page, limit, skip } = getPagination(req);
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
      PostModel.find(postFilter)
        .sort({ createdAt: -1 })
        .limit(skip + limit)
        .populate("author", "name username avatar")
        .lean(),
      ArticleModel.find(articleFilter)
        .sort({ publishedAt: -1 })
        .limit(skip + limit)
        .select("-content")
        .populate("author", "name username avatar")
        .lean()
    ]);

    const score = (tags?: string[]) => {
      if (!interests.length || !tags?.length) return 0;
      const normalized = tags.map((tag) => tag.toLowerCase());
      return interests.filter((interest) => normalized.includes(interest)).length;
    };

    const merged = [
      ...posts.map((post) => ({ type: "post", createdAt: post.createdAt, score: score(post.tags), item: post })),
      ...articles.map((article) => ({
        type: "article",
        createdAt: article.publishedAt ?? article.createdAt,
        score: score(article.tags),
        item: article
      }))
    ].sort((a, b) => b.score - a.score || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      items: merged.slice(skip, skip + limit).map(({ score: _score, ...item }) => item),
      meta: paginationMeta(page, limit, merged.length)
    };
  },

  async trending(req: Request) {
    const { page, limit, skip } = getPagination(req);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [posts, articles] = await Promise.all([
      PostModel.find({ deletedAt: { $exists: false }, createdAt: { $gte: since } })
        .sort({ "engagement.likesCount": -1, "engagement.commentsCount": -1, createdAt: -1 })
        .limit(skip + limit)
        .populate("author", "name username avatar")
        .lean(),
      ArticleModel.find({
        deletedAt: { $exists: false },
        status: ArticleStatus.PUBLISHED,
        publishedAt: { $gte: since }
      })
        .sort({ "stats.likesCount": -1, "stats.commentsCount": -1, publishedAt: -1 })
        .select("-content")
        .limit(skip + limit)
        .populate("author", "name username avatar")
        .lean()
    ]);

    const items = [
      ...posts.map((post) => ({ type: "post", item: post })),
      ...articles.map((article) => ({ type: "article", item: article }))
    ];

    return { items: items.slice(skip, skip + limit), meta: paginationMeta(page, limit, items.length) };
  }
};

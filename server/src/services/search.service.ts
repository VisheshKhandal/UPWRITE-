import { ArticleModel, ArticleStatus } from "../models/Article";
import { PostModel } from "../models/Post";
import { TagModel } from "../models/Tag";
import { UserModel } from "../models/User";
import { getPagination } from "../utils/pagination";
import type { Request } from "express";

export const searchService = {
  async search(req: Request) {
    const { limit } = getPagination(req);
    const q = String(req.query.q).trim();
    const type = String(req.query.type ?? "all");
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escaped, "i");

    const tasks: Record<string, Promise<unknown>> = {};

    if (type === "all" || type === "users") {
      tasks.users = UserModel.find({
        $or: [
          { name: pattern },
          { username: pattern },
          { bio: pattern },
          { skills: pattern },
          { interests: pattern }
        ],
        deletedAt: { $exists: false }
      })
        .select("name username avatar bio skills interests stats")
        .limit(limit)
        .lean();
    }

    if (type === "all" || type === "articles") {
      tasks.articles = ArticleModel.find({
        $or: [
          { title: pattern },
          { excerpt: pattern },
          { content: pattern },
          { tags: pattern }
        ],
        status: ArticleStatus.PUBLISHED,
        deletedAt: { $exists: false }
      })
        .select("-content")
        .populate("author", "name username avatar")
        .limit(limit)
        .lean();
    }

    if (type === "all" || type === "posts") {
      tasks.posts = PostModel.find({
        $or: [
          { title: pattern },
          { body: pattern },
          { tags: pattern }
        ],
        deletedAt: { $exists: false }
      })
        .populate("author", "name username avatar")
        .limit(limit)
        .lean();
    }

    if (type === "all" || type === "tags") {
      tasks.tags = TagModel.find({ $or: [{ name: pattern }, { slug: pattern }] }).sort({ usageCount: -1 }).limit(limit).lean();
    }

    return Object.fromEntries(await Promise.all(Object.entries(tasks).map(async ([key, task]) => [key, await task])));
  }
};

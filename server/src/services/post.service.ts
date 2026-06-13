import { PostModel } from "../models/Post";
import { ArticleModel } from "../models/Article";
import { UserModel } from "../models/User";
import { AppError } from "../utils/AppError";
import { getPagination, paginationMeta } from "../utils/pagination";
import { normalizeTags, upsertTags } from "./tag.service";
import type { Request } from "express";

export const postService = {
  async create(authorId: string, input: Record<string, unknown>) {
    const tags = normalizeTags(input.tags as string[] | undefined);
    const post = await PostModel.create({
      ...input,
      tags,
      author: authorId
    });

    await Promise.all([
      UserModel.findByIdAndUpdate(authorId, {
        $inc: {
          "stats.postsCount": 1,
          ...(input.type === "achievement" ? { "stats.achievementsCount": 1 } : {})
        }
      }),
      upsertTags(tags)
    ]);

    return post.populate("author", "name username avatar");
  },

  async list(req: Request) {
    const { page, limit, skip } = getPagination(req);
    const filter: Record<string, unknown> = { deletedAt: { $exists: false } };

    if (req.query.authorId) {
      filter.author = String(req.query.authorId);
    } else if (req.query.author) {
      const author = await UserModel.findOne({ username: String(req.query.author) }).select("_id").lean();
      if (!author) return { items: [], meta: paginationMeta(page, limit, 0) };
      filter.author = author._id;
    }

    const [items, total] = await Promise.all([
      PostModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name username avatar bio")
        .lean(),
      PostModel.countDocuments(filter)
    ]);

    return { items, meta: paginationMeta(page, limit, total) };
  },

  async getById(postId: string) {
    const post = await PostModel.findOne({ _id: postId, deletedAt: { $exists: false } })
      .populate("author", "name username avatar bio")
      .lean();

    if (!post) throw new AppError("Post not found", 404);
    return post;
  },

  async update(postId: string, authorId: string, input: Record<string, unknown>) {
    const existing = await PostModel.findOne({ _id: postId, deletedAt: { $exists: false } });
    if (!existing) throw new AppError("Post not found", 404);
    if (String(existing.author) !== authorId) throw new AppError("You can only update your own post", 403);

    if (input.tags) input.tags = normalizeTags(input.tags as string[]);

    Object.assign(existing, input);
    await existing.save();

    if (input.tags) await upsertTags(input.tags as string[]);

    return existing.populate("author", "name username avatar");
  },

  async remove(postId: string, authorId: string) {
    const post = await PostModel.findOne({ _id: postId, deletedAt: { $exists: false } });
    if (!post) throw new AppError("Post not found", 404);
    if (String(post.author) !== authorId) throw new AppError("You can only delete your own post", 403);

    post.deletedAt = new Date();
    await post.save();

    await UserModel.findByIdAndUpdate(authorId, { $inc: { "stats.postsCount": -1 } });
  }
};

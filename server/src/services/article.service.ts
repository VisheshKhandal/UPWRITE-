import { ArticleModel, ArticleStatus } from "../models/Article";
import { FollowModel } from "../models/Follow";
import { UserModel } from "../models/User";
import { AppError } from "../utils/AppError";
import { createExcerpt, createSlug, estimateReadingTime } from "../utils/content";
import { getPagination, paginationMeta } from "../utils/pagination";
import { normalizeTags, upsertTags } from "./tag.service";
import type { Request } from "express";

const makeUniqueSlug = async (title: string, authorId: string, currentId?: string) => {
  const base = createSlug(title);
  let slug = base;
  let count = 2;

  while (
    await ArticleModel.exists({
      slug,
      author: authorId,
      ...(currentId ? { _id: { $ne: currentId } } : {})
    })
  ) {
    slug = `${base}-${count++}`;
  }

  return slug;
};

export const articleService = {
  async create(authorId: string, input: Record<string, unknown>) {
    const tags = normalizeTags(input.tags as string[] | undefined);
    const status = (input.status as ArticleStatus | undefined) ?? ArticleStatus.DRAFT;
    const content = String(input.content);
    const article = await ArticleModel.create({
      ...input,
      author: authorId,
      tags,
      status,
      slug: await makeUniqueSlug(String(input.title), authorId),
      excerpt: input.excerpt ?? createExcerpt(content),
      readingTimeMinutes: estimateReadingTime(content),
      publishedAt: status === ArticleStatus.PUBLISHED ? new Date() : undefined
    });

    await Promise.all([
      status === ArticleStatus.PUBLISHED
        ? UserModel.findByIdAndUpdate(authorId, { $inc: { "stats.articlesCount": 1 } })
        : Promise.resolve(),
      upsertTags(tags)
    ]);

    return article.populate("author", "name username avatar");
  },

  async list(req: Request) {
    const { page, limit, skip } = getPagination(req);
    const filter: Record<string, unknown> = {
      deletedAt: { $exists: false },
      status: ArticleStatus.PUBLISHED
    };

    if (req.query.tag) filter.tags = String(req.query.tag).toLowerCase();
    if (req.query.authorId) {
      filter.author = String(req.query.authorId);
    } else if (req.query.author) {
      const author = await UserModel.findOne({ username: String(req.query.author) }).select("_id").lean();
      if (!author) {
        return { items: [], meta: paginationMeta(page, limit, 0) };
      }
      filter.author = author._id;
    }

    const [items, total] = await Promise.all([
      ArticleModel.find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-content")
        .populate("author", "name username avatar bio")
        .lean(),
      ArticleModel.countDocuments(filter)
    ]);

    return { items, meta: paginationMeta(page, limit, total) };
  },

  async listMine(req: Request, authorId: string) {
    const { page, limit, skip } = getPagination(req);
    const filter: Record<string, unknown> = { author: authorId, deletedAt: { $exists: false } };
    if (req.query.status) filter.status = req.query.status;

    const [items, total] = await Promise.all([
      ArticleModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      ArticleModel.countDocuments(filter)
    ]);

    return { items, meta: paginationMeta(page, limit, total) };
  },

  async getBySlug(username: string, slug: string, currentUserId?: string) {
    const author = await UserModel.findOne({ username }).select("_id").lean();
    if (!author) throw new AppError("Article not found", 404);

    const article = await ArticleModel.findOne({
      slug,
      author: author._id,
      status: ArticleStatus.PUBLISHED,
      deletedAt: { $exists: false }
    })
      .populate("author", "name username avatar bio stats")
      .lean();

    if (!article) throw new AppError("Article not found", 404);

    const isFollowing =
      currentUserId && String(author._id) !== currentUserId
        ? await FollowModel.exists({ follower: currentUserId, following: author._id }).then(Boolean)
        : false;

    return {
      ...article,
      author: article.author ? { ...(article.author as object), isFollowing } : article.author
    };
  },

  async incrementViewCount(articleId: string) {
    await ArticleModel.findByIdAndUpdate(articleId, { $inc: { "stats.viewsCount": 1 } });
  },

  async getRelated(articleId: string) {
    const article = await ArticleModel.findOne({
      _id: articleId,
      status: ArticleStatus.PUBLISHED,
      deletedAt: { $exists: false }
    }).lean();

    if (!article) throw new AppError("Article not found", 404);

    const related = await ArticleModel.find({
      _id: { $ne: articleId },
      status: ArticleStatus.PUBLISHED,
      deletedAt: { $exists: false },
      $or: [
        { author: article.author },
        ...(article.tags?.length ? [{ tags: { $in: article.tags } }] : [])
      ]
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(3)
      .select("-content")
      .populate("author", "name username avatar bio")
      .lean();

    return related;
  },

  async getByIdForOwner(articleId: string, authorId: string) {
    const article = await ArticleModel.findOne({
      _id: articleId,
      author: authorId,
      deletedAt: { $exists: false }
    }).lean();

    if (!article) throw new AppError("Article not found", 404);
    return article;
  },

  async update(articleId: string, authorId: string, input: Record<string, unknown>) {
    const article = await ArticleModel.findOne({ _id: articleId, deletedAt: { $exists: false } });
    if (!article) throw new AppError("Article not found", 404);
    if (String(article.author) !== authorId) throw new AppError("You can only update your own article", 403);

    const wasPublished = article.status === ArticleStatus.PUBLISHED;

    if (input.title) {
      article.title = String(input.title);
      article.slug = await makeUniqueSlug(article.title, authorId, articleId);
    }

    if (input.content) {
      article.content = String(input.content);
      article.readingTimeMinutes = estimateReadingTime(article.content);
      if (!input.excerpt) article.excerpt = createExcerpt(article.content);
    }

    if (input.excerpt !== undefined) article.excerpt = String(input.excerpt);
    if (input.tags) article.tags = normalizeTags(input.tags as string[]);
    if (input.coverImage) article.coverImage = input.coverImage as { url?: string; publicId?: string };
    if (input.status) article.status = input.status as ArticleStatus;

    if (!wasPublished && article.status === ArticleStatus.PUBLISHED) {
      article.publishedAt = new Date();
      await UserModel.findByIdAndUpdate(authorId, { $inc: { "stats.articlesCount": 1 } });
    }

    if (wasPublished && article.status !== ArticleStatus.PUBLISHED) {
      await UserModel.findByIdAndUpdate(authorId, { $inc: { "stats.articlesCount": -1 } });
    }

    await article.save();
    if (input.tags) await upsertTags(article.tags);

    return article.populate("author", "name username avatar");
  },

  async remove(articleId: string, authorId: string) {
    const article = await ArticleModel.findOne({ _id: articleId, deletedAt: { $exists: false } });
    if (!article) throw new AppError("Article not found", 404);
    if (String(article.author) !== authorId) throw new AppError("You can only delete your own article", 403);

    article.deletedAt = new Date();
    await article.save();

    if (article.status === ArticleStatus.PUBLISHED) {
      await UserModel.findByIdAndUpdate(authorId, { $inc: { "stats.articlesCount": -1 } });
    }
  }
};

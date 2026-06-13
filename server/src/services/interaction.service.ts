import { BookmarkModel } from "../models/Bookmark";
import { CommentModel, ContentType } from "../models/Comment";
import { LikeModel } from "../models/Like";
import { NotificationType } from "../models/Notification";
import { ArticleModel } from "../models/Article";
import { CollectionModel } from "../models/Collection";
import { PostModel } from "../models/Post";
import { AppError } from "../utils/AppError";
import { getPagination, paginationMeta } from "../utils/pagination";
import { getContentOrThrow, incrementEngagement } from "./content.service";
import { notificationService } from "./notification.service";
import type { Request } from "express";

export const interactionService = {
  async toggleLike(userId: string, input: { contentType: ContentType; contentId: string }) {
    const content = await getContentOrThrow(input.contentType, input.contentId);
    const existing = await LikeModel.findOne({
      user: userId,
      contentType: input.contentType,
      contentId: input.contentId
    });

    if (existing) {
      await existing.deleteOne();
      await incrementEngagement(input.contentType, input.contentId, "likesCount", -1);
      return { liked: false };
    }

    await LikeModel.create({
      user: userId,
      contentType: input.contentType,
      contentId: input.contentId
    });
    await Promise.all([
      incrementEngagement(input.contentType, input.contentId, "likesCount", 1),
      notificationService.create({
        recipient: content.ownerId,
        actor: userId,
        type: NotificationType.LIKE,
        message: `liked your ${input.contentType}`,
        entityType: input.contentType,
        entityId: input.contentId
      })
    ]);

    return { liked: true };
  },

  async createComment(userId: string, input: { contentType: ContentType; contentId: string; body: string; parentComment?: string }) {
    const content = await getContentOrThrow(input.contentType, input.contentId);

    if (input.parentComment) {
      const parent = await CommentModel.findOne({
        _id: input.parentComment,
        contentType: input.contentType,
        contentId: input.contentId,
        deletedAt: { $exists: false }
      });

      if (!parent) throw new AppError("Parent comment not found", 404);
    }

    const comment = await CommentModel.create({
      author: userId,
      contentType: input.contentType,
      contentId: input.contentId,
      body: input.body,
      parentComment: input.parentComment
    });

    await Promise.all([
      incrementEngagement(input.contentType, input.contentId, "commentsCount", 1),
      notificationService.create({
        recipient: content.ownerId,
        actor: userId,
        type: input.parentComment ? NotificationType.REPLY : NotificationType.COMMENT,
        message: input.parentComment ? "replied to a comment" : `commented on your ${input.contentType}`,
        entityType: input.contentType,
        entityId: input.contentId
      })
    ]);

    return comment.populate("author", "name username avatar");
  },

  async listComments(req: Request) {
    const { page, limit, skip } = getPagination(req);
    const filter = {
      contentType: req.query.contentType,
      contentId: req.query.contentId,
      deletedAt: { $exists: false }
    };

    const [items, total] = await Promise.all([
      CommentModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name username avatar")
        .lean(),
      CommentModel.countDocuments(filter)
    ]);

    return { items, meta: paginationMeta(page, limit, total) };
  },

  async deleteComment(commentId: string, userId: string) {
    const comment = await CommentModel.findOne({ _id: commentId, deletedAt: { $exists: false } });
    if (!comment) throw new AppError("Comment not found", 404);
    if (String(comment.author) !== userId) throw new AppError("You can only delete your own comment", 403);

    comment.deletedAt = new Date();
    await comment.save();
    await incrementEngagement(comment.contentType as ContentType, String(comment.contentId), "commentsCount", -1);
  },

  async toggleBookmark(
    userId: string,
    input: { contentType: ContentType; contentId: string; collection?: string }
  ) {
    await getContentOrThrow(input.contentType, input.contentId);
    const existing = await BookmarkModel.findOne({
      user: userId,
      contentType: input.contentType,
      contentId: input.contentId
    });

    if (existing) {
      await existing.deleteOne();
      await incrementEngagement(input.contentType, input.contentId, "bookmarksCount", -1);
      return { bookmarked: false };
    }

    await BookmarkModel.create({
      user: userId,
      contentType: input.contentType,
      contentId: input.contentId,
      collection: input.collection
    });
    await incrementEngagement(input.contentType, input.contentId, "bookmarksCount", 1);

    return { bookmarked: true };
  },

  async save(userId: string, input: { contentType: ContentType; contentId: string; collection?: string }) {
    await getContentOrThrow(input.contentType, input.contentId);

    if (input.collection) {
      const collection = await CollectionModel.findOne({
        _id: input.collection,
        owner: userId,
        deletedAt: { $exists: false }
      }).lean();
      if (!collection) throw new AppError("Collection not found", 404);
    }

    const existing = await BookmarkModel.findOne({
      user: userId,
      contentType: input.contentType,
      contentId: input.contentId
    });

    if (existing) {
      existing.collection = input.collection as never;
      await existing.save();
      return { bookmarked: true, bookmark: existing };
    }

    const bookmark = await BookmarkModel.create({
      user: userId,
      contentType: input.contentType,
      contentId: input.contentId,
      collection: input.collection
    });
    await incrementEngagement(input.contentType, input.contentId, "bookmarksCount", 1);
    if (input.collection) await CollectionModel.findByIdAndUpdate(input.collection, { $inc: { itemsCount: 1 } });

    return { bookmarked: true, bookmark };
  },

  async listBookmarks(req: Request, userId: string) {
    const { page, limit, skip } = getPagination(req);
    const filter = { user: userId };

    const [items, total] = await Promise.all([
      BookmarkModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      BookmarkModel.countDocuments(filter)
    ]);

    return { items, meta: paginationMeta(page, limit, total) };
  },

  async listSaved(req: Request, userId: string) {
    const { page, limit, skip } = getPagination(req);
    const collection = req.query.collection ? String(req.query.collection) : undefined;
    const filter: Record<string, unknown> = { user: userId };
    if (collection) filter.collection = collection;

    const [bookmarks, total] = await Promise.all([
      BookmarkModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("collection", "name description isPublic itemsCount")
        .lean(),
      BookmarkModel.countDocuments(filter)
    ]);

    const articleIds = bookmarks.filter((item) => item.contentType === ContentType.ARTICLE).map((item) => item.contentId);
    const postIds = bookmarks.filter((item) => item.contentType === ContentType.POST).map((item) => item.contentId);
    const [articles, posts] = await Promise.all([
      ArticleModel.find({ _id: { $in: articleIds }, deletedAt: { $exists: false } })
        .select("-content")
        .populate("author", "name username avatar bio")
        .lean(),
      PostModel.find({ _id: { $in: postIds }, deletedAt: { $exists: false } })
        .populate("author", "name username avatar bio")
        .lean()
    ]);

    const articleMap = new Map(articles.map((article) => [String(article._id), article]));
    const postMap = new Map(posts.map((post) => [String(post._id), post]));
    const items = bookmarks
      .map((bookmark) => ({
        ...bookmark,
        item:
          bookmark.contentType === ContentType.ARTICLE
            ? articleMap.get(String(bookmark.contentId))
            : postMap.get(String(bookmark.contentId))
      }))
      .filter((bookmark) => bookmark.item);

    return { items, meta: paginationMeta(page, limit, total) };
  },

  async listCollectionItems(req: Request, userId: string, collectionId: string) {
    const collection = await CollectionModel.findOne({
      _id: collectionId,
      owner: userId,
      deletedAt: { $exists: false }
    }).lean();

    if (!collection) throw new AppError("Collection not found", 404);
    req.query.collection = collectionId;
    return this.listSaved(req, userId);
  },

  async removeFromCollection(userId: string, collectionId: string, bookmarkId: string) {
    const bookmark = await BookmarkModel.findOne({ _id: bookmarkId, user: userId, collection: collectionId });
    if (!bookmark) throw new AppError("Saved item not found", 404);

    bookmark.collection = undefined as never;
    await bookmark.save();
    await CollectionModel.findByIdAndUpdate(collectionId, { $inc: { itemsCount: -1 } });
  }
};

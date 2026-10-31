import { isValidObjectId, Types } from "mongoose";
import { ArticleModel } from "../models/Article";
import { NotificationModel, NotificationType } from "../models/Notification";
import { getPagination, paginationMeta } from "../utils/pagination";
import type { Request } from "express";

interface CreateNotificationInput {
  recipient: string | Types.ObjectId;
  actor?: string | Types.ObjectId;
  type: NotificationType;
  message: string;
  entityType?: string;
  entityId?: string | Types.ObjectId;
}

export const notificationService = {
  async create(input: CreateNotificationInput) {
    if (input.actor && input.recipient.toString() === input.actor.toString()) {
      return null;
    }

    return NotificationModel.create(input);
  },

  async listForUser(req: Request, userId: string) {
    const { page, limit, skip } = getPagination(req);
    const filter: Record<string, unknown> = { recipient: userId };

    if (req.query.unreadOnly === "true") {
      filter.readAt = { $exists: false };
    }

    const [rawItems, total, unreadCount] = await Promise.all([
      NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("actor", "name username avatar")
        .lean(),
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments({ recipient: userId, readAt: { $exists: false } })
    ]);

    const articleEntityIds = rawItems
      .filter((item) => item.entityType === "article" && item.entityId && isValidObjectId(String(item.entityId)))
      .map((item) => String(item.entityId));

    const articles =
      articleEntityIds.length > 0
        ? await ArticleModel.find({ _id: { $in: articleEntityIds }, deletedAt: { $exists: false } })
            .select("_id slug")
            .populate("author", "username")
            .lean()
        : [];

    const articleUrlMap = new Map<string, string>();
    for (const article of articles) {
      const author = article.author as { username?: string } | undefined;
      if (author?.username && article.slug) {
        articleUrlMap.set(String(article._id), `/articles/@${author.username}/${article.slug}`);
      }
    }

    const items = rawItems.map((item) => {
      const actor = item.actor as { username?: string } | undefined;
      let targetUrl = "/notifications";
      if (item.entityType === "article" && item.entityId) {
        targetUrl = articleUrlMap.get(String(item.entityId)) ?? "/notifications";
      } else if (item.entityType === "post") {
        targetUrl = "/?type=logs";
      } else if (item.type === NotificationType.FOLLOW && actor?.username) {
        targetUrl = `/profile/${actor.username}`;
      }
      return { ...item, targetUrl };
    });

    return { items, meta: { ...paginationMeta(page, limit, total), unreadCount } };
  },

  async markRead(notificationId: string, userId: string) {
    return NotificationModel.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { $set: { readAt: new Date() } },
      { new: true }
    );
  },

  async markAllRead(userId: string) {
    return NotificationModel.updateMany(
      { recipient: userId, readAt: { $exists: false } },
      { $set: { readAt: new Date() } }
    );
  }
};

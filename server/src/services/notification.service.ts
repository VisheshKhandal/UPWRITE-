import { Types } from "mongoose";
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

    const [items, total] = await Promise.all([
      NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("actor", "name username avatar")
        .lean(),
      NotificationModel.countDocuments(filter)
    ]);

    return { items, meta: paginationMeta(page, limit, total) };
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

import { FollowModel } from "../models/Follow";
import { NotificationType } from "../models/Notification";
import { UserModel } from "../models/User";
import { AppError } from "../utils/AppError";
import { getPagination, paginationMeta } from "../utils/pagination";
import { notificationService } from "./notification.service";
import type { Request } from "express";

export const followService = {
  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new AppError("You cannot follow yourself", 400);
    }

    const target = await UserModel.findById(followingId).select("name username");
    if (!target || target.deletedAt) {
      throw new AppError("User to follow not found", 404);
    }

    const existing = await FollowModel.exists({ follower: followerId, following: followingId });

    if (existing) {
      return { following: true, changed: false };
    }

    await FollowModel.create({ follower: followerId, following: followingId });

    await Promise.all([
      UserModel.findByIdAndUpdate(followerId, { $inc: { "stats.followingCount": 1 } }),
      UserModel.findByIdAndUpdate(followingId, { $inc: { "stats.followersCount": 1 } }),
      notificationService.create({
        recipient: followingId,
        actor: followerId,
        type: NotificationType.FOLLOW,
        message: "started following you",
        entityType: "user",
        entityId: followerId
      })
    ]);

    return { following: true, changed: true };
  },

  async unfollow(followerId: string, followingId: string) {
    const deleted = await FollowModel.findOneAndDelete({ follower: followerId, following: followingId });

    if (!deleted) {
      return { following: false, changed: false };
    }

    await Promise.all([
      UserModel.findByIdAndUpdate(followerId, { $inc: { "stats.followingCount": -1 } }),
      UserModel.findByIdAndUpdate(followingId, { $inc: { "stats.followersCount": -1 } })
    ]);

    return { following: false, changed: true };
  },

  async listFollowers(req: Request, userId: string) {
    const { page, limit, skip } = getPagination(req);
    const filter = { following: userId };
    const [items, total] = await Promise.all([
      FollowModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("follower", "name username avatar bio")
        .lean(),
      FollowModel.countDocuments(filter)
    ]);

    return { items, meta: paginationMeta(page, limit, total) };
  },

  async listFollowing(req: Request, userId: string) {
    const { page, limit, skip } = getPagination(req);
    const filter = { follower: userId };
    const [items, total] = await Promise.all([
      FollowModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("following", "name username avatar bio")
        .lean(),
      FollowModel.countDocuments(filter)
    ]);

    return { items, meta: paginationMeta(page, limit, total) };
  }
};

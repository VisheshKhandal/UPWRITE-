import { ArticleModel } from "../models/Article";
import { PostModel } from "../models/Post";
import { UserModel } from "../models/User";
import { FollowModel } from "../models/Follow";
import { AppError } from "../utils/AppError";
import { getPagination, paginationMeta } from "../utils/pagination";
import type { Request } from "express";

const profileFields = "name username avatar bio skills interests socialLinks stats createdAt";

export const userService = {
  async getByUsername(username: string, currentUserId?: string) {
    const user = await UserModel.findOne({
      username: username.toLowerCase(),
      deletedAt: { $exists: false }
    })
      .select(profileFields)
      .lean();

    if (!user) throw new AppError("Profile not found", 404);

    const [articleLikes, isFollowing] = await Promise.all([
      ArticleModel.aggregate([
      { $match: { author: user._id, deletedAt: { $exists: false } } },
      { $group: { _id: null, total: { $sum: "$stats.likesCount" } } }
      ]).then(([result]) => result),
      currentUserId && String(user._id) !== currentUserId
        ? FollowModel.exists({ follower: currentUserId, following: user._id }).then(Boolean)
        : Promise.resolve(false)
    ]);
    const [postLikes] = await PostModel.aggregate([
      { $match: { author: user._id, deletedAt: { $exists: false } } },
      { $group: { _id: null, total: { $sum: "$engagement.likesCount" } } }
    ]);

    return {
      ...user,
      isFollowing,
      likesReceived: (articleLikes?.total ?? 0) + (postLikes?.total ?? 0)
    };
  },

  async updateProfile(userId: string, input: Record<string, unknown>) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          ...input,
          ...(Array.isArray(input.skills)
            ? { skills: input.skills.map((item) => String(item).toLowerCase()) }
            : {}),
          ...(Array.isArray(input.interests)
            ? { interests: input.interests.map((item) => String(item).toLowerCase()) }
            : {})
        }
      },
      { new: true, runValidators: true }
    )
      .select(profileFields)
      .lean();

    if (!user) throw new AppError("User not found", 404);
    return user;
  },

  async list(req: Request) {
    const { page, limit, skip } = getPagination(req);
    const filter = { deletedAt: { $exists: false } };

    const [items, total] = await Promise.all([
      UserModel.find(filter).select(profileFields).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      UserModel.countDocuments(filter)
    ]);

    return { items, meta: paginationMeta(page, limit, total) };
  }
};

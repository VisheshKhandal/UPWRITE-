import { ArticleModel, ArticleStatus } from "../models/Article";
import { FollowModel } from "../models/Follow";
import { TagModel } from "../models/Tag";
import { UserModel } from "../models/User";

const ONE_HOUR_MS = 60 * 60 * 1000;

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const cache = new Map<string, CacheEntry<unknown>>();

const cached = async <T>(key: string, loader: () => Promise<T>) => {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const value = await loader();
  cache.set(key, { value, expiresAt: Date.now() + ONE_HOUR_MS });
  return value;
};

export const exploreService = {
  async trendingTags() {
    return cached("explore:trending-tags", () =>
      TagModel.find({ usageCount: { $gt: 0 } }).sort({ usageCount: -1, name: 1 }).limit(20).lean()
    );
  },

  async topArticles() {
    return cached("explore:top-articles", () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return ArticleModel.find({
        status: ArticleStatus.PUBLISHED,
        deletedAt: { $exists: false },
        publishedAt: { $gte: weekAgo }
      })
        .sort({
          "stats.viewsCount": -1,
          "stats.likesCount": -1,
          "stats.bookmarksCount": -1,
          publishedAt: -1
        })
        .limit(5)
        .select("-content")
        .populate("author", "name username avatar bio stats")
        .lean();
    });
  },

  async featuredCreators() {
    return cached("explore:featured-creators", () =>
      UserModel.find({ deletedAt: { $exists: false } })
        .sort({
          "stats.followersCount": -1,
          "stats.articlesCount": -1,
          "stats.postsCount": -1,
          createdAt: -1
        })
        .limit(8)
        .select("name username avatar bio skills interests stats")
        .lean()
    );
  },

  async peopleYouMayKnow(userId?: string) {
    if (!userId) return this.featuredCreators();

    const viewer = await UserModel.findById(userId).select("interests skills").lean();
    const following = await FollowModel.find({ follower: userId }).select("following").lean();
    const excludedIds = [userId, ...following.map((follow) => String(follow.following))];
    const interests = [...(viewer?.interests ?? []), ...(viewer?.skills ?? [])];

    return UserModel.find({
      _id: { $nin: excludedIds },
      deletedAt: { $exists: false },
      ...(interests.length ? { $or: [{ interests: { $in: interests } }, { skills: { $in: interests } }] } : {})
    })
      .sort({ "stats.followersCount": -1, createdAt: -1 })
      .limit(8)
      .select("name username avatar bio skills interests stats")
      .lean();
  }
};

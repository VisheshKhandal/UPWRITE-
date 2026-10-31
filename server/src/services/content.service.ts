import { ArticleModel, ArticleStatus } from "../models/Article";
import { BookmarkModel } from "../models/Bookmark";
import { ContentType } from "../models/Comment";
import { LikeModel } from "../models/Like";
import { PostModel } from "../models/Post";
import { AppError } from "../utils/AppError";

export const getContentOrThrow = async (contentType: ContentType, contentId: string) => {
  if (contentType === ContentType.POST) {
    const post = await PostModel.findOne({ _id: contentId, deletedAt: { $exists: false } });
    if (!post) throw new AppError("Post not found", 404);
    return {
      ownerId: String(post.author),
      title: "post"
    };
  }

  const article = await ArticleModel.findOne({
    _id: contentId,
    status: ArticleStatus.PUBLISHED,
    deletedAt: { $exists: false }
  });
  if (!article) throw new AppError("Article not found", 404);

  return {
    ownerId: String(article.author),
    title: article.title
  };
};

export const incrementEngagement = async (
  contentType: ContentType,
  contentId: string,
  field: "likesCount" | "commentsCount" | "bookmarksCount",
  value: 1 | -1
): Promise<number> => {
  if (contentType === ContentType.POST) {
    const updated = await PostModel.findByIdAndUpdate(
      contentId,
      { $inc: { [`engagement.${field}`]: value } },
      { new: true }
    )
      .select(`engagement.${field}`)
      .lean();
    const current = updated?.engagement?.[field] ?? 0;
    if (current < 0) {
      await PostModel.findByIdAndUpdate(contentId, { $set: { [`engagement.${field}`]: 0 } });
      return 0;
    }
    return current;
  }

  const updated = await ArticleModel.findByIdAndUpdate(
    contentId,
    { $inc: { [`stats.${field}`]: value } },
    { new: true }
  )
    .select(`stats.${field}`)
    .lean();
  const current = updated?.stats?.[field] ?? 0;
  if (current < 0) {
    await ArticleModel.findByIdAndUpdate(contentId, { $set: { [`stats.${field}`]: 0 } });
    return 0;
  }
  return current;
};

export const getViewerInteractionSets = async (
  userId: string | undefined,
  contentIds: Array<unknown>
): Promise<{ likedKeys: Set<string>; savedKeys: Set<string> }> => {
  const likedKeys = new Set<string>();
  const savedKeys = new Set<string>();
  if (!userId || !contentIds.length) {
    return { likedKeys, savedKeys };
  }

  const uniqueIds = Array.from(new Set(contentIds.filter(Boolean).map((id) => String(id))));
  if (!uniqueIds.length) {
    return { likedKeys, savedKeys };
  }

  const [likes, bookmarks] = await Promise.all([
    LikeModel.find({ user: userId, contentId: { $in: uniqueIds } })
      .select("contentType contentId")
      .lean(),
    BookmarkModel.find({ user: userId, contentId: { $in: uniqueIds } })
      .select("contentType contentId")
      .lean()
  ]);

  for (const like of likes) {
    likedKeys.add(`${like.contentType}:${String(like.contentId)}`);
  }
  for (const bookmark of bookmarks) {
    savedKeys.add(`${bookmark.contentType}:${String(bookmark.contentId)}`);
  }

  return { likedKeys, savedKeys };
};

export const attachViewerStateToContentList = async <T extends { _id?: unknown }>(
  contentType: "article" | "post",
  items: T[],
  userId?: string
): Promise<Array<T & { viewerLiked: boolean; viewerSaved: boolean }>> => {
  if (!items.length) return [];
  const { likedKeys, savedKeys } = await getViewerInteractionSets(
    userId,
    items.map((item) => item._id)
  );
  return items.map((item) => {
    const key = `${contentType}:${String(item._id)}`;
    return {
      ...item,
      viewerLiked: likedKeys.has(key),
      viewerSaved: savedKeys.has(key)
    };
  });
};

export const attachViewerStateToFeedItems = async <
  T extends { type: "article" | "post"; item: { _id?: unknown } & Record<string, unknown> }
>(
  feedItems: T[],
  userId?: string
): Promise<T[]> => {
  if (!feedItems.length) return [];
  const { likedKeys, savedKeys } = await getViewerInteractionSets(
    userId,
    feedItems.map((entry) => entry.item?._id)
  );
  return feedItems.map((entry) => {
    const key = `${entry.type}:${String(entry.item?._id)}`;
    return {
      ...entry,
      item: {
        ...entry.item,
        viewerLiked: likedKeys.has(key),
        viewerSaved: savedKeys.has(key)
      }
    };
  });
};

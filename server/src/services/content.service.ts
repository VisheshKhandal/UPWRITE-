import { ArticleModel, ArticleStatus } from "../models/Article";
import { ContentType } from "../models/Comment";
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
) => {
  if (contentType === ContentType.POST) {
    await PostModel.findByIdAndUpdate(contentId, { $inc: { [`engagement.${field}`]: value } });
    return;
  }

  await ArticleModel.findByIdAndUpdate(contentId, { $inc: { [`stats.${field}`]: value } });
};

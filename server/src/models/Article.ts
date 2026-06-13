import { Schema, model, type InferSchemaType } from "mongoose";

export enum ArticleStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  SCHEDULED = "scheduled",
  ARCHIVED = "archived"
}

const articleStatsSchema = new Schema(
  {
    viewsCount: { type: Number, default: 0, min: 0 },
    likesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
    bookmarksCount: { type: Number, default: 0, min: 0 },
    sharesCount: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const articleSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    excerpt: { type: String, trim: true, maxlength: 260 },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(ArticleStatus),
      default: ArticleStatus.DRAFT,
      index: true
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    coverImage: {
      url: String,
      publicId: String
    },
    readingTimeMinutes: { type: Number, default: 1, min: 1 },
    stats: { type: articleStatsSchema, default: {} },
    publishedAt: Date,
    deletedAt: Date
  },
  { timestamps: true }
);

articleSchema.index({ author: 1, slug: 1 }, { unique: true });
articleSchema.index({ author: 1, status: 1, createdAt: -1 });
articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ tags: 1, status: 1, publishedAt: -1 });
articleSchema.index({ title: "text", excerpt: "text", content: "text", tags: "text" });

export type Article = InferSchemaType<typeof articleSchema>;
export const ArticleModel = model("Article", articleSchema);

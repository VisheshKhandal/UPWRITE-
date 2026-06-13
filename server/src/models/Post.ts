import { Schema, model, type InferSchemaType } from "mongoose";

export enum PostType {
  LEARNING = "learning",
  ACHIEVEMENT = "achievement",
  INSIGHT = "insight",
  UPDATE = "update"
}

const engagementSchema = new Schema(
  {
    likesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
    bookmarksCount: { type: Number, default: 0, min: 0 },
    sharesCount: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const postSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, trim: true, maxlength: 120 },
    type: { type: String, enum: Object.values(PostType), default: PostType.UPDATE },
    body: { type: String, required: true, trim: true, maxlength: 2200 },
    tags: [{ type: String, trim: true, lowercase: true }],
    media: [
      {
        url: String,
        publicId: String,
        resourceType: { type: String, default: "image" }
      }
    ],
    engagement: { type: engagementSchema, default: {} },
    deletedAt: Date
  },
  { timestamps: true }
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ tags: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ title: "text", body: "text", tags: "text" });

export type Post = InferSchemaType<typeof postSchema>;
export const PostModel = model("Post", postSchema);

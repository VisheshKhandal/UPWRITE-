import { Schema, model, type InferSchemaType } from "mongoose";

export enum ContentType {
  POST = "post",
  ARTICLE = "article"
}

const commentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contentType: { type: String, enum: Object.values(ContentType), required: true },
    contentId: { type: Schema.Types.ObjectId, required: true, index: true },
    parentComment: { type: Schema.Types.ObjectId, ref: "Comment" },
    body: { type: String, required: true, trim: true, maxlength: 1200 },
    deletedAt: Date
  },
  { timestamps: true }
);

commentSchema.index({ contentType: 1, contentId: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });

export type Comment = InferSchemaType<typeof commentSchema>;
export const CommentModel = model("Comment", commentSchema);

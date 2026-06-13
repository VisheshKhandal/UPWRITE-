import { Schema, model, type InferSchemaType } from "mongoose";
import { ContentType } from "./Comment";

const likeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contentType: { type: String, enum: Object.values(ContentType), required: true },
    contentId: { type: Schema.Types.ObjectId, required: true, index: true }
  },
  { timestamps: true }
);

likeSchema.index({ user: 1, contentType: 1, contentId: 1 }, { unique: true });
likeSchema.index({ contentType: 1, contentId: 1, createdAt: -1 });

export type Like = InferSchemaType<typeof likeSchema>;
export const LikeModel = model("Like", likeSchema);

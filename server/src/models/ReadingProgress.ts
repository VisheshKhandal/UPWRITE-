import { Schema, model, type InferSchemaType } from "mongoose";
const schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  article: { type: Schema.Types.ObjectId, ref: "Article", required: true, index: true },
  progressPercent: { type: Number, default: 0, min: 0, max: 100 },
  lastScrollPosition: { type: Number, default: 0, min: 0 },
  completedAt: Date
}, { timestamps: { createdAt: false, updatedAt: true } });
schema.index({ user: 1, article: 1 }, { unique: true });
export type ReadingProgress = InferSchemaType<typeof schema>;
export const ReadingProgressModel = model("ReadingProgress", schema);

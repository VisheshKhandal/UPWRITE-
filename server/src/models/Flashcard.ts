import { Schema, model, type InferSchemaType } from "mongoose";
const schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  article: { type: Schema.Types.ObjectId, ref: "Article", index: true },
  collection: { type: Schema.Types.ObjectId, ref: "Collection" },
  front: { type: String, required: true, trim: true },
  back: { type: String, required: true, trim: true },
  sourceText: String,
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  dueAt: { type: Date, default: Date.now, index: true },
  lastReviewedAt: Date,
  interval: { type: Number, default: 1, min: 1 },
  easeFactor: { type: Number, default: 2.5, min: 1.3 },
  createdAt: { type: Date, default: Date.now }
});
schema.index({ user: 1, dueAt: 1 });
export type Flashcard = InferSchemaType<typeof schema>;
export const FlashcardModel = model("Flashcard", schema);

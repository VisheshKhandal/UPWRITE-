import { Schema, model, type InferSchemaType } from "mongoose";

const flashcardSchema = new Schema(
  { question: { type: String, required: true, trim: true }, answer: { type: String, required: true, trim: true } },
  { _id: false }
);

const flashcardSetSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    articleId: { type: Schema.Types.ObjectId, ref: "Article", required: true, index: true },
    articleTitle: { type: String, required: true, trim: true },
    cards: { type: [flashcardSchema], required: true }
  },
  { timestamps: true }
);

flashcardSetSchema.index({ user: 1, articleId: 1 }, { unique: true });

export type FlashcardSet = InferSchemaType<typeof flashcardSetSchema>;
export const FlashcardSetModel = model("FlashcardSet", flashcardSetSchema);

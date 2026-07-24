import { Schema, model, type InferSchemaType } from "mongoose";
const schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  article: { type: Schema.Types.ObjectId, ref: "Article", required: true, index: true },
  summaryNotes: String,
  keyTakeaways: { type: [String], default: [] },
  glossary: { type: [{ term: String, definition: String }], default: [] },
  flashcards: [{ type: Schema.Types.ObjectId, ref: "Flashcard" }],
  generatedByModel: String
}, { timestamps: true });
schema.index({ user: 1, article: 1 }, { unique: true });
export type StudyPack = InferSchemaType<typeof schema>;
export const StudyPackModel = model("StudyPack", schema);

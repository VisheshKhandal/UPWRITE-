import { Schema, model, type InferSchemaType } from "mongoose";
const schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  article: { type: Schema.Types.ObjectId, ref: "Article", required: true, index: true },
  highlight: { type: Schema.Types.ObjectId, ref: "Highlight" },
  body: { type: String, required: true, trim: true },
  visibility: { type: String, enum: ["private", "public"], default: "private" }
}, { timestamps: true });
schema.index({ user: 1, article: 1, createdAt: -1 });
export type ReaderNote = InferSchemaType<typeof schema>;
export const ReaderNoteModel = model("ReaderNote", schema);

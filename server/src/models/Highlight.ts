import { Schema, model, type InferSchemaType } from "mongoose";
const schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  article: { type: Schema.Types.ObjectId, ref: "Article", required: true, index: true },
  text: { type: String, required: true, trim: true },
  noteCount: { type: Number, default: 0, min: 0 },
  color: { type: String, default: "yellow" },
  startOffset: Number,
  endOffset: Number,
  createdAt: { type: Date, default: Date.now }
});
schema.index({ user: 1, article: 1, createdAt: -1 });
export type Highlight = InferSchemaType<typeof schema>;
export const HighlightModel = model("Highlight", schema);

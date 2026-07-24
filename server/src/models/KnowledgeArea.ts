import { Schema, model, type InferSchemaType } from "mongoose";
const schema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: String,
  icon: String,
  parent: { type: Schema.Types.ObjectId, ref: "KnowledgeArea" },
  articleCount: { type: Number, default: 0, min: 0 }
}, { timestamps: true });
export type KnowledgeArea = InferSchemaType<typeof schema>;
export const KnowledgeAreaModel = model("KnowledgeArea", schema);

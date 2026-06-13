import { Schema, model, type InferSchemaType } from "mongoose";

const tagSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    usageCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

tagSchema.index({ name: "text", slug: "text" });
tagSchema.index({ usageCount: -1 });

export type Tag = InferSchemaType<typeof tagSchema>;
export const TagModel = model("Tag", tagSchema);

import { Schema, model, type InferSchemaType } from "mongoose";

const collectionSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 240 },
    isPublic: { type: Boolean, default: false },
    itemsCount: { type: Number, default: 0, min: 0 },
    deletedAt: Date
  },
  { timestamps: true }
);

collectionSchema.index({ owner: 1, name: 1 }, { unique: true });
collectionSchema.index({ owner: 1, createdAt: -1 });

export type Collection = InferSchemaType<typeof collectionSchema>;
export const CollectionModel = model("Collection", collectionSchema);

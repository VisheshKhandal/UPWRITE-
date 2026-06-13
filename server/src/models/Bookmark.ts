import { Schema, model, type InferSchemaType } from "mongoose";
import { ContentType } from "./Comment";

const bookmarkSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contentType: { type: String, enum: Object.values(ContentType), required: true },
    contentId: { type: Schema.Types.ObjectId, required: true, index: true },
    collection: { type: Schema.Types.ObjectId, ref: "Collection" }
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, contentType: 1, contentId: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, createdAt: -1 });
bookmarkSchema.index({ collection: 1, createdAt: -1 });

export type Bookmark = InferSchemaType<typeof bookmarkSchema>;
export const BookmarkModel = model("Bookmark", bookmarkSchema);

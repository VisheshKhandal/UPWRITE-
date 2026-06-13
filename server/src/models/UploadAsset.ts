import { Schema, model, type InferSchemaType } from "mongoose";

export enum UploadContext {
  AVATAR = "avatar",
  ARTICLE_COVER = "article_cover",
  POST_MEDIA = "post_media"
}

const uploadAssetSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    publicId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    secureUrl: { type: String, required: true },
    resourceType: { type: String, default: "image" },
    format: String,
    bytes: Number,
    width: Number,
    height: Number,
    context: { type: String, enum: Object.values(UploadContext), required: true },
    linkedEntityType: String,
    linkedEntityId: Schema.Types.ObjectId
  },
  { timestamps: true }
);

uploadAssetSchema.index({ owner: 1, context: 1, createdAt: -1 });

export type UploadAsset = InferSchemaType<typeof uploadAssetSchema>;
export const UploadAssetModel = model("UploadAsset", uploadAssetSchema);

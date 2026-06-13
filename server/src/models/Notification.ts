import { Schema, model, type InferSchemaType } from "mongoose";

export enum NotificationType {
  FOLLOW = "follow",
  LIKE = "like",
  COMMENT = "comment",
  REPLY = "reply",
  MENTION = "mention",
  ARTICLE_INTERACTION = "article_interaction"
}

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", index: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    message: { type: String, required: true, maxlength: 180 },
    entityType: String,
    entityId: Schema.Types.ObjectId,
    readAt: Date
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

export type Notification = InferSchemaType<typeof notificationSchema>;
export const NotificationModel = model("Notification", notificationSchema);

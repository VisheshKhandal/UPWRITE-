import { Schema, model, Types, type InferSchemaType } from "mongoose";

const refreshTokenSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    userAgent: String,
    ipAddress: String,
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: Date,
    replacedByTokenHash: String
  },
  { timestamps: true }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshToken = InferSchemaType<typeof refreshTokenSchema> & {
  user: Types.ObjectId;
};

export const RefreshTokenModel = model("RefreshToken", refreshTokenSchema);

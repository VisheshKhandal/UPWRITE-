import { Schema, model, type InferSchemaType } from "mongoose";

export enum SecurityEventType {
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILED = "login_failed",
  PASSWORD_CHANGED = "password_changed",
  TWO_FACTOR_ENABLED = "two_factor_enabled",
  TWO_FACTOR_DISABLED = "two_factor_disabled",
  BACKUP_CODES_REGENERATED = "backup_codes_regenerated",
  NEW_DEVICE_LOGIN = "new_device_login",
  UNUSUAL_LOCATION_LOGIN = "unusual_location_login",
  MULTIPLE_FAILED_ATTEMPTS = "multiple_failed_attempts",
  SESSION_REVOKED = "session_revoked",
  ACCOUNT_DELETION_REQUESTED = "account_deletion_requested",
  DATA_EXPORT_REQUESTED = "data_export_requested",
  VERIFICATION_EMAIL_SENT = "verification_email_sent"
}

const securityEventSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    emailOrUsername: { type: String, trim: true, lowercase: true },
    type: { type: String, enum: Object.values(SecurityEventType), required: true, index: true },
    device: String,
    browser: String,
    os: String,
    ipAddress: String,
    location: String,
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

securityEventSchema.index({ user: 1, createdAt: -1 });
securityEventSchema.index({ emailOrUsername: 1, createdAt: -1 });

export type SecurityEvent = InferSchemaType<typeof securityEventSchema>;
export const SecurityEventModel = model("SecurityEvent", securityEventSchema);

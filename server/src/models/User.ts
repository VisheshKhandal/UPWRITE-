import { Schema, model, type InferSchemaType } from "mongoose";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  MODERATOR = "moderator"
}

const socialLinksSchema = new Schema(
  {
    website: String,
    github: String,
    linkedin: String,
    twitter: String
  },
  { _id: false }
);

const userStatsSchema = new Schema(
  {
    followersCount: { type: Number, default: 0, min: 0 },
    followingCount: { type: Number, default: 0, min: 0 },
    postsCount: { type: Number, default: 0, min: 0 },
    articlesCount: { type: Number, default: 0, min: 0 },
    achievementsCount: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const appearanceSettingsSchema = new Schema(
  {
    theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    fontSize: { type: String, enum: ["small", "medium", "large", "extra-large"], default: "medium" },
    readingWidth: { type: String, enum: ["narrow", "comfortable", "wide"], default: "comfortable" },
    reduceMotion: { type: Boolean, default: false },
    highContrast: { type: Boolean, default: false },
    compactLayout: { type: Boolean, default: false },
    showReadingTime: { type: Boolean, default: true },
    showViewCounts: { type: Boolean, default: true },
    showLikeCounts: { type: Boolean, default: true },
    showAuthorStats: { type: Boolean, default: true },
    language: { type: String, enum: ["en", "hi"], default: "en" },
    autoSaveInterval: { type: String, enum: ["30s", "1m", "5m", "disabled"], default: "1m" },
    focusWritingMode: { type: Boolean, default: false }
  },
  { _id: false }
);

const privacySettingsSchema = new Schema(
  {
    profileVisibility: { type: String, enum: ["public", "private"], default: "public" },
    showEmail: { type: Boolean, default: false },
    showJoinDate: { type: Boolean, default: true },
    showSocialLinks: { type: Boolean, default: true }
  },
  { _id: false }
);

const securitySettingsSchema = new Schema(
  {
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    backupCodes: {
      type: [
        {
          codeHash: { type: String, required: true },
          usedAt: Date
        }
      ],
      default: [],
      select: false
    },
    recoveryEmail: { type: String, lowercase: true, trim: true },
    recoveryEmailVerified: { type: Boolean, default: false },
    emailAlerts: { type: Boolean, default: true },
    inAppNotifications: { type: Boolean, default: true }
  },
  { _id: false }
);

const onboardingSchema = new Schema(
  {
    required: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    completedAt: Date,
    identity: {
      type: String,
      enum: ["student", "developer", "creator", "writer", "freelancer", "founder", "learner"]
    },
    goals: {
      type: [String],
      enum: ["learn_skills", "build_personal_brand", "share_knowledge", "document_journey", "grow_audience", "find_opportunities"],
      default: []
    },
    learningPreferences: {
      type: [String],
      enum: ["short_reads", "deep_dives", "project_based", "community_discussion"],
      default: []
    },
    writingPreferences: {
      type: [String],
      enum: ["quick_posts", "long_form", "learning_logs", "tutorials"],
      default: []
    },
    tourCompletedAt: Date
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER
    },
    emailVerified: { type: Boolean, default: false },
    avatar: {
      url: String,
      publicId: String
    },
    bio: { type: String, maxlength: 280, default: "" },
    skills: [{ type: String, trim: true, lowercase: true }],
    interests: [{ type: String, trim: true, lowercase: true }],
    socialLinks: { type: socialLinksSchema, default: {} },
    stats: { type: userStatsSchema, default: {} },
    appearanceSettings: { type: appearanceSettingsSchema, default: {} },
    privacySettings: { type: privacySettingsSchema, default: {} },
    securitySettings: { type: securitySettingsSchema, default: {} },
    onboarding: { type: onboardingSchema, default: {} },
    lastLoginAt: Date,
    deletedAt: Date
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const safeRet = ret as Record<string, unknown>;
        delete safeRet.passwordHash;
        delete safeRet.__v;
        return ret;
      }
    }
  }
);

userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ name: "text", username: "text", bio: "text", skills: "text", interests: "text" });

export type User = InferSchemaType<typeof userSchema>;
export const UserModel = model("User", userSchema);

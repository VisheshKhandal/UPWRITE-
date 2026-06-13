import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { ArticleModel } from "../models/Article";
import { BookmarkModel } from "../models/Bookmark";
import { CommentModel } from "../models/Comment";
import { PostModel } from "../models/Post";
import { RefreshTokenModel } from "../models/RefreshToken";
import { SecurityEventModel, SecurityEventType } from "../models/SecurityEvent";
import { UserModel } from "../models/User";
import { AppError } from "../utils/AppError";
import { hashToken } from "../utils/tokens";

interface ClientContext {
  userAgent?: string;
  ipAddress?: string;
}

const publicUserFields =
  "name username email role emailVerified avatar bio skills interests socialLinks stats appearanceSettings privacySettings securitySettings.recoveryEmail securitySettings.recoveryEmailVerified securitySettings.emailAlerts securitySettings.inAppNotifications securitySettings.twoFactorEnabled onboarding createdAt";

const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const parseUserAgent = (userAgent = "Unknown") => {
  const browser =
    userAgent.match(/Edg\/[\d.]+/)?.[0].replace("/", " ") ??
    userAgent.match(/Chrome\/[\d.]+/)?.[0].replace("/", " ") ??
    userAgent.match(/Firefox\/[\d.]+/)?.[0].replace("/", " ") ??
    userAgent.match(/Safari\/[\d.]+/)?.[0].replace("/", " ") ??
    "Unknown browser";
  const os = /Windows/i.test(userAgent)
    ? "Windows"
    : /Mac OS|Macintosh/i.test(userAgent)
      ? "macOS"
      : /Android/i.test(userAgent)
        ? "Android"
        : /iPhone|iPad/i.test(userAgent)
          ? "iOS"
          : /Linux/i.test(userAgent)
            ? "Linux"
            : "Unknown OS";
  const device = /Mobile|Android|iPhone/i.test(userAgent) ? "Mobile device" : "Desktop device";
  return { browser, os, device };
};

const createSecurityEvent = async (
  userId: string | undefined,
  type: SecurityEventType,
  context: ClientContext,
  metadata: Record<string, unknown> = {},
  emailOrUsername?: string
) => {
  const parsed = parseUserAgent(context.userAgent);
  await SecurityEventModel.create({
    user: userId,
    emailOrUsername,
    type,
    ...parsed,
    ipAddress: context.ipAddress,
    location: context.ipAddress ? "Location unavailable" : undefined,
    metadata
  });
};

const randomBase32 = (length = 32) => {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (byte) => base32Alphabet[byte % base32Alphabet.length]).join("");
};

const decodeBase32 = (value: string) => {
  const clean = value.replace(/=+$/, "").toUpperCase();
  let bits = "";
  for (const char of clean) {
    const index = base32Alphabet.indexOf(char);
    if (index < 0) throw new AppError("Invalid authenticator secret", 400);
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = bits.match(/.{1,8}/g)?.filter((chunk) => chunk.length === 8).map((chunk) => parseInt(chunk, 2)) ?? [];
  return Buffer.from(bytes);
};

const generateTotp = (secret: string, step = Math.floor(Date.now() / 30000)) => {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(step));
  const hmac = crypto.createHmac("sha1", decodeBase32(secret)).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
  return code;
};

const verifyTotp = (secret: string, token: string) => {
  const normalized = token.replace(/\s/g, "");
  const step = Math.floor(Date.now() / 30000);
  return [-1, 0, 1].some((window) => generateTotp(secret, step + window) === normalized);
};

const createBackupCodes = async () => {
  const codes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString("hex").toUpperCase());
  const hashedCodes = await Promise.all(codes.map(async (code) => ({ codeHash: await bcrypt.hash(code, 12) })));
  return { codes, hashedCodes };
};

const toCsv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
};

export const settingsService = {
  createSecurityEvent,

  async getOverview(userId: string, refreshToken?: string) {
    const [user, sessions, activity] = await Promise.all([
      UserModel.findById(userId).select(publicUserFields).lean(),
      RefreshTokenModel.find({ user: userId, revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } })
        .sort({ updatedAt: -1 })
        .lean(),
      SecurityEventModel.find({ user: userId }).sort({ createdAt: -1 }).limit(30).lean()
    ]);

    if (!user) throw new AppError("User not found", 404);
    const currentHash = refreshToken ? hashToken(refreshToken) : undefined;

    return {
      user,
      sessions: sessions.map((session) => ({
        id: String(session._id),
        ...parseUserAgent(session.userAgent ?? undefined),
        ipAddress: session.ipAddress,
        location: session.ipAddress ? "Location unavailable" : undefined,
        lastActiveAt: session.updatedAt ?? session.createdAt,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        current: currentHash === session.tokenHash
      })),
      activity: activity.map((event) => ({
        id: String(event._id),
        type: event.type,
        device: event.device,
        browser: event.browser,
        os: event.os,
        ipAddress: event.ipAddress,
        location: event.location,
        time: event.createdAt,
        metadata: event.metadata
      })),
      monitoring: {
        newDeviceLogin: activity.some((event) => event.type === SecurityEventType.NEW_DEVICE_LOGIN),
        unusualLocationLogin: activity.some((event) => event.type === SecurityEventType.UNUSUAL_LOCATION_LOGIN),
        multipleFailedAttempts: activity.some((event) => event.type === SecurityEventType.MULTIPLE_FAILED_ATTEMPTS)
      }
    };
  },

  async updateAppearance(userId: string, appearanceSettings: Record<string, unknown>) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: Object.fromEntries(Object.entries(appearanceSettings).map(([key, value]) => [`appearanceSettings.${key}`, value])) },
      { new: true, runValidators: true }
    ).select(publicUserFields);
    if (!user) throw new AppError("User not found", 404);
    return user;
  },

  async resetAppearance(userId: string) {
    const user = await UserModel.findByIdAndUpdate(userId, { $set: { appearanceSettings: {} } }, { new: true, runValidators: true }).select(
      publicUserFields
    );
    if (!user) throw new AppError("User not found", 404);
    return user;
  },

  async updatePrivacy(userId: string, privacySettings: Record<string, unknown>) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: Object.fromEntries(Object.entries(privacySettings).map(([key, value]) => [`privacySettings.${key}`, value])) },
      { new: true, runValidators: true }
    ).select(publicUserFields);
    if (!user) throw new AppError("User not found", 404);
    return user;
  },

  async updatePassword(userId: string, input: { currentPassword: string; newPassword: string }, context: ClientContext) {
    const user = await UserModel.findById(userId).select("+passwordHash");
    if (!user) throw new AppError("User not found", 404);
    const valid = await bcrypt.compare(input.currentPassword, String(user.passwordHash));
    if (!valid) throw new AppError("Current password is incorrect", 400);
    user.passwordHash = await bcrypt.hash(input.newPassword, 12);
    await user.save();
    await RefreshTokenModel.updateMany({ user: userId, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
    await createSecurityEvent(userId, SecurityEventType.PASSWORD_CHANGED, context);
  },

  async listSessions(userId: string, refreshToken?: string) {
    return (await this.getOverview(userId, refreshToken)).sessions;
  },

  async revokeSession(userId: string, sessionId: string, context: ClientContext) {
    const session = await RefreshTokenModel.findOneAndUpdate(
      { _id: sessionId, user: userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
      { new: true }
    );
    if (!session) throw new AppError("Session not found", 404);
    await createSecurityEvent(userId, SecurityEventType.SESSION_REVOKED, context, { sessionId });
  },

  async startTwoFactor(userId: string) {
    const user = await UserModel.findById(userId).select("email username");
    if (!user) throw new AppError("User not found", 404);
    const secret = randomBase32();
    const account = String(user.email);
    const otpauthUrl = `otpauth://totp/Upwrite:${encodeURIComponent(account)}?secret=${secret}&issuer=Upwrite&algorithm=SHA1&digits=6&period=30`;
    return { secret, otpauthUrl, account };
  },

  async enableTwoFactor(userId: string, input: { secret: string; token: string }, context: ClientContext) {
    if (!verifyTotp(input.secret, input.token)) throw new AppError("Invalid authenticator code", 400);
    const backup = await createBackupCodes();
    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          "securitySettings.twoFactorEnabled": true,
          "securitySettings.twoFactorSecret": input.secret,
          "securitySettings.backupCodes": backup.hashedCodes
        }
      },
      { new: true, runValidators: true }
    ).select(publicUserFields);
    if (!user) throw new AppError("User not found", 404);
    await createSecurityEvent(userId, SecurityEventType.TWO_FACTOR_ENABLED, context);
    return { user, backupCodes: backup.codes };
  },

  async disableTwoFactor(userId: string, password: string, context: ClientContext) {
    const user = await UserModel.findById(userId).select("+passwordHash");
    if (!user) throw new AppError("User not found", 404);
    const valid = await bcrypt.compare(password, String(user.passwordHash));
    if (!valid) throw new AppError("Password confirmation failed", 400);
    user.set("securitySettings.twoFactorEnabled", false);
    user.set("securitySettings.twoFactorSecret", undefined);
    user.set("securitySettings.backupCodes", []);
    await user.save();
    await createSecurityEvent(userId, SecurityEventType.TWO_FACTOR_DISABLED, context);
    return UserModel.findById(userId).select(publicUserFields);
  },

  async regenerateBackupCodes(userId: string, password: string, context: ClientContext) {
    const user = await UserModel.findById(userId).select("+passwordHash +securitySettings.backupCodes");
    if (!user) throw new AppError("User not found", 404);
    const valid = await bcrypt.compare(password, String(user.passwordHash));
    if (!valid) throw new AppError("Password confirmation failed", 400);
    if (!user.securitySettings?.twoFactorEnabled) throw new AppError("Two-factor authentication is not enabled", 400);
    const backup = await createBackupCodes();
    user.set("securitySettings.backupCodes", backup.hashedCodes);
    await user.save();
    await createSecurityEvent(userId, SecurityEventType.BACKUP_CODES_REGENERATED, context);
    return backup.codes;
  },

  async updateRecovery(userId: string, input: { recoveryEmail?: string; emailAlerts?: boolean; inAppNotifications?: boolean }) {
    const update: Record<string, unknown> = {};
    if (input.recoveryEmail !== undefined) {
      update["securitySettings.recoveryEmail"] = input.recoveryEmail;
      update["securitySettings.recoveryEmailVerified"] = false;
    }
    if (input.emailAlerts !== undefined) update["securitySettings.emailAlerts"] = input.emailAlerts;
    if (input.inAppNotifications !== undefined) update["securitySettings.inAppNotifications"] = input.inAppNotifications;
    const user = await UserModel.findByIdAndUpdate(userId, { $set: update }, { new: true, runValidators: true }).select(publicUserFields);
    if (!user) throw new AppError("User not found", 404);
    return user;
  },

  async completeOnboarding(
    userId: string,
    input: { interests: string[]; identity: string; goals: string[]; learningPreferences: string[]; writingPreferences: string[]; tourCompleted?: boolean }
  ) {
    const normalizedInterests = Array.from(new Set(input.interests.map((item) => item.trim().toLowerCase()).filter(Boolean)));
    const now = new Date();
    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          interests: normalizedInterests,
          "onboarding.required": false,
          "onboarding.completed": true,
          "onboarding.completedAt": now,
          "onboarding.identity": input.identity,
          "onboarding.goals": input.goals,
          "onboarding.learningPreferences": input.learningPreferences,
          "onboarding.writingPreferences": input.writingPreferences,
          ...(input.tourCompleted ? { "onboarding.tourCompletedAt": now } : {})
        }
      },
      { new: true, runValidators: true }
    ).select(publicUserFields);
    if (!user) throw new AppError("User not found", 404);
    return user;
  },

  async markTourComplete(userId: string) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { "onboarding.tourCompletedAt": new Date() } },
      { new: true, runValidators: true }
    ).select(publicUserFields);
    if (!user) throw new AppError("User not found", 404);
    return user;
  },

  async resendVerification(userId: string, context: ClientContext) {
    await createSecurityEvent(userId, SecurityEventType.VERIFICATION_EMAIL_SENT, context);
  },

  async exportData(userId: string, format: "json" | "csv", context: ClientContext) {
    const [user, articles, posts, comments, bookmarks] = await Promise.all([
      UserModel.findById(userId).select(publicUserFields).lean(),
      ArticleModel.find({ author: userId, deletedAt: { $exists: false } }).lean(),
      PostModel.find({ author: userId, deletedAt: { $exists: false } }).lean(),
      CommentModel.find({ author: userId }).lean(),
      BookmarkModel.find({ user: userId }).lean()
    ]);
    if (!user) throw new AppError("User not found", 404);
    await createSecurityEvent(userId, SecurityEventType.DATA_EXPORT_REQUESTED, context, { format });
    const payload = { profile: user, articles, posts, comments, bookmarks, exportedAt: new Date().toISOString() };
    if (format === "json") return { contentType: "application/json", body: JSON.stringify(payload, null, 2) };
    return {
      contentType: "text/csv",
      body: [
        "# profile",
        toCsv([user as Record<string, unknown>]),
        "# articles",
        toCsv(articles as Record<string, unknown>[]),
        "# posts",
        toCsv(posts as Record<string, unknown>[]),
        "# comments",
        toCsv(comments as Record<string, unknown>[]),
        "# bookmarks",
        toCsv(bookmarks as Record<string, unknown>[])
      ].join("\n")
    };
  },

  async deleteAccount(userId: string, input: { password: string; confirmation: string }, context: ClientContext) {
    if (input.confirmation !== "DELETE MY ACCOUNT") throw new AppError("Confirmation phrase does not match", 400);
    const user = await UserModel.findById(userId).select("+passwordHash");
    if (!user) throw new AppError("User not found", 404);
    const valid = await bcrypt.compare(input.password, String(user.passwordHash));
    if (!valid) throw new AppError("Password confirmation failed", 400);
    user.deletedAt = new Date();
    await user.save();
    await RefreshTokenModel.updateMany({ user: userId, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
    await createSecurityEvent(userId, SecurityEventType.ACCOUNT_DELETION_REQUESTED, context);
  }
};

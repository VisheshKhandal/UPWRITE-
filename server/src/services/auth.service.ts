import bcrypt from "bcryptjs";
import { RefreshTokenModel } from "../models/RefreshToken";
import { SecurityEventModel, SecurityEventType } from "../models/SecurityEvent";
import { UserModel, UserRole } from "../models/User";
import { AppError } from "../utils/AppError";
import {
  hashToken,
  refreshTokenExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../utils/tokens";

interface ClientContext {
  userAgent?: string;
  ipAddress?: string;
}

const publicUserFields =
  "name username email role emailVerified avatar bio skills interests socialLinks stats appearanceSettings privacySettings securitySettings.recoveryEmail securitySettings.recoveryEmailVerified securitySettings.emailAlerts securitySettings.inAppNotifications securitySettings.twoFactorEnabled onboarding createdAt";

interface AuthUser {
  _id: unknown;
  role: UserRole;
  emailVerified: boolean;
}

const asAuthUser = (user: unknown): AuthUser => {
  const item = user as { _id: unknown; role?: UserRole; emailVerified?: boolean };
  return {
    _id: item._id,
    role: item.role ?? UserRole.USER,
    emailVerified: Boolean(item.emailVerified)
  };
};

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

const recordSecurityEvent = async (
  type: SecurityEventType,
  context: ClientContext,
  userId?: unknown,
  emailOrUsername?: string,
  metadata: Record<string, unknown> = {}
) => {
  await SecurityEventModel.create({
    user: userId,
    emailOrUsername,
    type,
    ...parseUserAgent(context.userAgent),
    ipAddress: context.ipAddress,
    location: context.ipAddress ? "Location unavailable" : undefined,
    metadata
  });
};

const issueTokenPair = async (user: AuthUser, context: ClientContext) => {
  const payload = {
    sub: String(user._id),
    role: user.role,
    emailVerified: user.emailVerified
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const tokenHash = hashToken(refreshToken);

  await RefreshTokenModel.create({
    user: user._id,
    tokenHash,
    userAgent: context.userAgent,
    ipAddress: context.ipAddress,
    expiresAt: refreshTokenExpiryDate()
  });

  return { accessToken, refreshToken };
};

export const authService = {
  async register(input: { name: string; username: string; email: string; password: string }, context: ClientContext) {
    const existing = await UserModel.exists({
      $or: [{ email: input.email }, { username: input.username }]
    });

    if (existing) {
      throw new AppError("Email or username is already in use", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await UserModel.create({
      name: input.name,
      username: input.username,
      email: input.email,
      passwordHash,
      onboarding: { required: true, completed: false }
    });

    const tokens = await issueTokenPair(asAuthUser(user), context);
    const publicUser = await UserModel.findById(user._id).select(publicUserFields).lean();

    return { user: publicUser, ...tokens };
  },

  async login(input: { emailOrUsername: string; password: string }, context: ClientContext) {
    const identifier = input.emailOrUsername.toLowerCase();
    const user = await UserModel.findOne({
      $or: [{ email: identifier }, { username: identifier }],
      deletedAt: { $exists: false }
    }).select("+passwordHash");

    if (!user) {
      await recordSecurityEvent(SecurityEventType.LOGIN_FAILED, context, undefined, identifier);
      throw new AppError("Invalid credentials", 401);
    }

    const valid = await bcrypt.compare(input.password, String(user.passwordHash));
    if (!valid) {
      await recordSecurityEvent(SecurityEventType.LOGIN_FAILED, context, user._id, identifier);
      const failedAttempts = await SecurityEventModel.countDocuments({
        $or: [{ user: user._id }, { emailOrUsername: identifier }],
        type: SecurityEventType.LOGIN_FAILED,
        createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
      });
      if (failedAttempts >= 5) {
        await recordSecurityEvent(SecurityEventType.MULTIPLE_FAILED_ATTEMPTS, context, user._id, identifier, { failedAttempts });
      }
      throw new AppError("Invalid credentials", 401);
    }

    const seenDevice = await RefreshTokenModel.exists({
      user: user._id,
      userAgent: context.userAgent,
      revokedAt: { $exists: false }
    });
    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await issueTokenPair(asAuthUser(user), context);
    const publicUser = await UserModel.findById(user._id).select(publicUserFields).lean();
    await recordSecurityEvent(SecurityEventType.LOGIN_SUCCESS, context, user._id, identifier);
    if (!seenDevice) {
      await recordSecurityEvent(SecurityEventType.NEW_DEVICE_LOGIN, context, user._id, identifier);
    }

    return { user: publicUser, ...tokens };
  },

  async refresh(refreshToken?: string, context?: ClientContext) {
    if (!refreshToken) {
      throw new AppError("Refresh token missing", 401);
    }

    const payload = verifyRefreshToken(refreshToken);
    const oldHash = hashToken(refreshToken);
    const storedToken = await RefreshTokenModel.findOne({
      tokenHash: oldHash,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() }
    });

    if (!storedToken) {
      throw new AppError("Invalid refresh token", 401);
    }

    const user = await UserModel.findById(payload.sub);
    if (!user || user.deletedAt) {
      throw new AppError("User no longer exists", 401);
    }

    const tokens = await issueTokenPair(asAuthUser(user), context ?? {});
    storedToken.revokedAt = new Date();
    storedToken.replacedByTokenHash = hashToken(tokens.refreshToken);
    await storedToken.save();

    return tokens;
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) return;

    await RefreshTokenModel.findOneAndUpdate(
      { tokenHash: hashToken(refreshToken), revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    );
  },

  async logoutAll(userId: string) {
    await RefreshTokenModel.updateMany(
      { user: userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    );
  },

  async me(userId: string) {
    const user = await UserModel.findById(userId).select(publicUserFields).lean();
    if (!user) throw new AppError("User not found", 404);
    return user;
  },

  async forgotPassword(email: string) {
    const user = await UserModel.exists({ email });
    // In production this should enqueue an email job. The neutral response prevents account enumeration.
    return { emailQueued: Boolean(user) };
  },

  async resetPassword() {
    throw new AppError("Password reset email flow is prepared but not wired to an email provider yet", 501);
  }
};

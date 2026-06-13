import type { Request, Response } from "express";
import { env } from "../config/env";
import { authService } from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

const refreshCookieName = "upwrite_refresh";

const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? ("none" as const) : ("lax" as const),
  domain: env.COOKIE_DOMAIN || undefined,
  maxAge: env.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000
};

const clientContext = (req: Request) => ({
  userAgent: req.headers["user-agent"],
  ipAddress: req.ip
});

const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie(refreshCookieName, refreshToken, cookieOptions);
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie(refreshCookieName, cookieOptions);
};

export const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body, clientContext(req));
    setRefreshCookie(res, result.refreshToken);
    return sendSuccess(res, { user: result.user, accessToken: result.accessToken }, "Account created", 201);
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body, clientContext(req));
    setRefreshCookie(res, result.refreshToken);
    return sendSuccess(res, { user: result.user, accessToken: result.accessToken }, "Logged in");
  }),

  refresh: asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.cookies?.[refreshCookieName], clientContext(req));
    setRefreshCookie(res, result.refreshToken);
    return sendSuccess(res, { accessToken: result.accessToken }, "Token refreshed");
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.cookies?.[refreshCookieName]);
    clearRefreshCookie(res);
    return sendSuccess(res, null, "Logged out");
  }),

  logoutAll: asyncHandler(async (req, res) => {
    await authService.logoutAll(req.user!.id);
    clearRefreshCookie(res);
    return sendSuccess(res, null, "Logged out from all devices");
  }),

  me: asyncHandler(async (req, res) => {
    const user = await authService.me(req.user!.id);
    return sendSuccess(res, user, "Current user");
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    return sendSuccess(res, null, "If that email exists, password reset instructions will be sent");
  }),

  resetPassword: asyncHandler(async (_req, res) => {
    await authService.resetPassword();
    return sendSuccess(res, null, "Password reset");
  })
};

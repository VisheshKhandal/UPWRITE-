import type { Request, Response } from "express";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";
import { authService } from "../services/auth.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

const refreshCookieName = "upwrite_refresh";
const googleStateCookieName = "upwrite_google_state";
const githubStateCookieName = "upwrite_github_state";
const googleReturnCookieName = "upwrite_google_return";
const githubReturnCookieName = "upwrite_github_return";

const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? ("none" as const) : ("lax" as const),
  domain: env.COOKIE_DOMAIN || undefined,
  maxAge: env.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000
};

const oauthStateCookieOptions = {
  ...cookieOptions,
  maxAge: 10 * 60 * 1000
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

const googleClient = () => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
    throw new AppError("Google authentication is not configured", 503);
  }

  return new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_CALLBACK_URL);
};

const githubConfig = () => {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.GITHUB_CALLBACK_URL) {
    throw new AppError("GitHub authentication is not configured", 503);
  }

  return {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    callbackUrl: env.GITHUB_CALLBACK_URL
  };
};

const redirectToClient = (res: Response, path = "/") => {
  const target = new URL(path, env.CLIENT_URL || env.CLIENT_ORIGIN);
  return res.redirect(target.toString());
};

const safeReturnPath = (value: unknown) => {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.length > 500) return "/";
  return value;
};

const githubRequest = async <T>(url: string, init: RequestInit) => {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Upwrite OAuth",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers
    }
  });

  if (!response.ok) {
    throw new AppError("GitHub authentication failed", 401);
  }

  return (await response.json()) as T;
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

  googleStart: asyncHandler(async (req, res) => {
    const state = crypto.randomBytes(32).toString("hex");
    const authorizationUrl = googleClient().generateAuthUrl({
      access_type: "offline",
      prompt: "select_account",
      scope: ["openid", "email", "profile"],
      state
    });

    res.cookie(googleStateCookieName, state, oauthStateCookieOptions);
    res.cookie(googleReturnCookieName, safeReturnPath(req.query.returnTo), oauthStateCookieOptions);
    return res.redirect(authorizationUrl);
  }),

  googleCallback: asyncHandler(async (req, res) => {
    const { code, error, state } = req.query;
    const storedState = req.cookies?.[googleStateCookieName];
    const returnTo = safeReturnPath(req.cookies?.[googleReturnCookieName]);
    res.clearCookie(googleStateCookieName, oauthStateCookieOptions);
    res.clearCookie(googleReturnCookieName, oauthStateCookieOptions);

    if (error) {
      console.warn("Google OAuth was cancelled or failed", { error });
      return redirectToClient(res, "/login?oauth=cancelled");
    }

    if (!code || typeof code !== "string" || !state || typeof state !== "string" || !storedState || state !== storedState) {
      throw new AppError("Invalid Google authentication request", 400);
    }

    try {
      const client = googleClient();
      const { tokens } = await client.getToken(code);
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token ?? "",
        audience: env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email || !payload.email_verified) {
        throw new AppError("Google account did not provide the required email", 400);
      }

      const result = await authService.loginWithOAuth(
        {
          provider: "google",
          providerId: payload.sub,
          name: payload.name || payload.email.split("@")[0],
          email: payload.email
        },
        clientContext(req)
      );

      setRefreshCookie(res, result.refreshToken);
      return redirectToClient(res, returnTo);
    } catch (error) {
      console.error("Google OAuth callback failed", error);
      throw new AppError("Google authentication failed", 401);
    }
  }),

  githubStart: asyncHandler(async (req, res) => {
    const state = crypto.randomBytes(32).toString("hex");
    const config = githubConfig();
    const authorizationUrl = new URL("https://github.com/login/oauth/authorize");
    authorizationUrl.searchParams.set("client_id", config.clientId);
    authorizationUrl.searchParams.set("redirect_uri", config.callbackUrl);
    authorizationUrl.searchParams.set("scope", "read:user user:email");
    authorizationUrl.searchParams.set("state", state);
    authorizationUrl.searchParams.set("allow_signup", "true");

    res.cookie(githubStateCookieName, state, oauthStateCookieOptions);
    res.cookie(githubReturnCookieName, safeReturnPath(req.query.returnTo), oauthStateCookieOptions);
    return res.redirect(authorizationUrl.toString());
  }),

  githubCallback: asyncHandler(async (req, res) => {
    const { code, error, state } = req.query;
    const storedState = req.cookies?.[githubStateCookieName];
    const returnTo = safeReturnPath(req.cookies?.[githubReturnCookieName]);
    res.clearCookie(githubStateCookieName, oauthStateCookieOptions);
    res.clearCookie(githubReturnCookieName, oauthStateCookieOptions);

    if (error) {
      console.warn("GitHub OAuth was cancelled or failed", { error });
      return redirectToClient(res, "/login?oauth=cancelled");
    }

    if (!code || typeof code !== "string" || !state || typeof state !== "string" || !storedState || state !== storedState) {
      throw new AppError("Invalid GitHub authentication request", 400);
    }

    try {
      const config = githubConfig();
      const token = await githubRequest<{ access_token?: string }>("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          redirect_uri: config.callbackUrl
        })
      });

      if (!token.access_token) {
        throw new AppError("GitHub did not return an access token", 401);
      }

      const [profile, emails] = await Promise.all([
        githubRequest<{ id?: number; name?: string | null; login?: string }>("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${token.access_token}` }
        }),
        githubRequest<Array<{ email: string; primary: boolean; verified: boolean }>>("https://api.github.com/user/emails", {
          headers: { Authorization: `Bearer ${token.access_token}` }
        })
      ]);
      const primaryEmail = emails.find((item) => item.primary && item.verified)?.email ?? emails.find((item) => item.verified)?.email;

      if (!profile.id || !primaryEmail) {
        throw new AppError("GitHub account did not provide a verified email", 400);
      }

      const result = await authService.loginWithOAuth(
        {
          provider: "github",
          providerId: String(profile.id),
          name: profile.name || profile.login || primaryEmail.split("@")[0],
          email: primaryEmail
        },
        clientContext(req)
      );

      setRefreshCookie(res, result.refreshToken);
      return redirectToClient(res, returnTo);
    } catch (error) {
      console.error("GitHub OAuth callback failed", error);
      throw new AppError("GitHub authentication failed", 401);
    }
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

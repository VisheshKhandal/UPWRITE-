import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { UserRole } from "../models/User";

export interface TokenPayload {
  sub: string;
  role: UserRole;
  emailVerified: boolean;
}

export const signAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });

export const signRefreshToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: `${env.REFRESH_TOKEN_EXPIRES_IN_DAYS}d` as jwt.SignOptions["expiresIn"]
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.ACCESS_TOKEN_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.REFRESH_TOKEN_SECRET) as TokenPayload;

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const refreshTokenExpiryDate = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS);
  return expiresAt;
};

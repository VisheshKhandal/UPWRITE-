import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { verifyAccessToken } from "../utils/tokens";
import { UserRole } from "../models/User";

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    throw new AppError("Authentication required", 401);
  }

  const token = header.split(" ")[1];
  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      role: payload.role,
      emailVerified: payload.emailVerified
    };

    next();
  } catch {
    throw new AppError("Invalid or expired access token", 401);
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next();
  }

  const token = header.split(" ")[1];
  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      role: payload.role,
      emailVerified: payload.emailVerified
    };

    return next();
  } catch {
    throw new AppError("Invalid or expired access token", 401);
  }
};

export const requireVerifiedEmail = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user?.emailVerified) {
    throw new AppError("Please verify your email before performing this action", 403);
  }

  next();
};

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError("You are not allowed to perform this action", 403);
    }

    next();
  };

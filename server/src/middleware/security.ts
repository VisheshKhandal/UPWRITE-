import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import type { Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "../config/env";

const localOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:(\d+))?$/;

const isAllowedOrigin = (origin: string | undefined) => {
  // No Origin header: same-origin, server-side, or proxied dev requests (e.g. Vite).
  if (!origin) return true;
  return origin === env.CLIENT_ORIGIN || (env.isDevelopment && localOriginRegex.test(origin));
};

export const applySecurityMiddleware = (app: Express) => {
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin as string)) {
          callback(null, true);
        } else {
          callback(new Error("CORS origin not allowed"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      optionsSuccessStatus: 204
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(morgan(env.isProduction ? "combined" : "dev"));
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
};

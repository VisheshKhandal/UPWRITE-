import express from "express";
import { env } from "./config/env";
import apiRoutes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { applySecurityMiddleware } from "./middleware/security";
import { sendSuccess } from "./utils/apiResponse";

export const createApp = () => {
  const app = express();

  applySecurityMiddleware(app);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.get("/health", (_req, res) =>
    sendSuccess(res, {
      status: "ok",
      service: "upwrite-backend",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
  );

  app.use(`/api/${env.API_VERSION}`, apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

import express from "express";
import { env } from "./config/env";
import apiRoutes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { applySecurityMiddleware } from "./middleware/security";
import { sendSuccess } from "./utils/apiResponse";
import { asyncHandler } from "./utils/asyncHandler";
import { sharePreviewService } from "./services/sharePreview.service";

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

  app.get(
    "/articles/:username/:slug",
    asyncHandler(async (req, res, next) => {
      const username = String(req.params.username);
      const slug = String(req.params.slug);
      const meta = await sharePreviewService.article(username, slug);
      if (!meta) return next();

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
      return res.send(sharePreviewService.renderArticleHtml(meta));
    })
  );

  app.get(
    "/share/articles/:username/:slug/preview.svg",
    asyncHandler(async (req, res, next) => {
      const username = String(req.params.username);
      const slug = String(req.params.slug);
      const meta = await sharePreviewService.article(username, slug);
      if (!meta) return next();

      res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
      return res.send(sharePreviewService.renderFallbackImage(meta));
    })
  );

  app.use(`/api/${env.API_VERSION}`, apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

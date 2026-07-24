import { Router } from "express";
import { flashcardsController, highlightsController, knowledgeAreasController, notesController, readingProgressController, studyPacksController } from "../controllers/learning.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { UserRole } from "../models/User";

export const highlightsRoutes = Router().use(requireAuth).post("/", highlightsController.create).get("/", highlightsController.byArticle).delete("/:id", highlightsController.remove);
export const notesRoutes = Router().use(requireAuth).post("/", notesController.create).get("/", notesController.byArticle).patch("/:id", notesController.update).delete("/:id", notesController.remove);
export const flashcardsRoutes = Router().use(requireAuth).post("/", flashcardsController.create).get("/", flashcardsController.list).patch("/:id", flashcardsController.update).delete("/:id", flashcardsController.remove);
export const studyPacksRoutes = Router().use(requireAuth).post("/", studyPacksController.create).get("/", studyPacksController.list).patch("/:id", studyPacksController.update);
export const readingProgressRoutes = Router().use(requireAuth).put("/", readingProgressController.upsert).post("/", readingProgressController.upsert).get("/", readingProgressController.list);
export const knowledgeAreasRoutes = Router().get("/", knowledgeAreasController.list).get("/:slug", knowledgeAreasController.bySlug).post("/", requireAuth, requireRole(UserRole.ADMIN), knowledgeAreasController.create);

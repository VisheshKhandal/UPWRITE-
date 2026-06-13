import { Router } from "express";
import { articleController } from "../controllers/article.controller";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import {
  articleIdParamsSchema,
  articleListQuerySchema,
  articleUsernameSlugParamsSchema,
  articleSlugParamsSchema,
  createArticleSchema,
  updateArticleSchema
} from "../validations/article.validation";

const router = Router();

router.get("/", validateRequest(articleListQuerySchema), articleController.list);
router.post("/", requireAuth, validateRequest(createArticleSchema), articleController.create);
router.get("/me", requireAuth, validateRequest(articleListQuerySchema), articleController.listMine);
router.get("/me/:id", requireAuth, validateRequest(articleIdParamsSchema), articleController.getMineById);
router.post("/:id/view", validateRequest(articleIdParamsSchema), articleController.incrementView);
router.get("/:id/related", validateRequest(articleIdParamsSchema), articleController.getRelated);
router.get("/:username/:slug", optionalAuth, validateRequest(articleUsernameSlugParamsSchema), articleController.getBySlug);
router.patch("/:id", requireAuth, validateRequest(updateArticleSchema), articleController.update);
router.delete("/:id", requireAuth, validateRequest(articleIdParamsSchema), articleController.remove);

export default router;

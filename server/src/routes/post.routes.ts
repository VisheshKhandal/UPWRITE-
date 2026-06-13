import { Router } from "express";
import { postController } from "../controllers/post.controller";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import {
  createPostSchema,
  postIdParamsSchema,
  postListQuerySchema,
  updatePostSchema
} from "../validations/post.validation";

const router = Router();

router.get("/", validateRequest(postListQuerySchema), postController.list);
router.post("/", requireAuth, validateRequest(createPostSchema), postController.create);
router.get("/:id", validateRequest(postIdParamsSchema), postController.getById);
router.patch("/:id", requireAuth, validateRequest(updatePostSchema), postController.update);
router.delete("/:id", requireAuth, validateRequest(postIdParamsSchema), postController.remove);

export default router;

import { Router } from "express";
import { followController } from "../controllers/follow.controller";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import { userIdParamsSchema } from "../validations/user.validation";
import { postListQuerySchema } from "../validations/post.validation";

const router = Router();

router.post("/:id", requireAuth, validateRequest(userIdParamsSchema), followController.follow);
router.delete("/:id", requireAuth, validateRequest(userIdParamsSchema), followController.unfollow);
router.get("/:id/followers", validateRequest(userIdParamsSchema.merge(postListQuerySchema)), followController.followers);
router.get("/:id/following", validateRequest(userIdParamsSchema.merge(postListQuerySchema)), followController.following);

export default router;

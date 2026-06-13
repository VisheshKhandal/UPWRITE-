import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import { usernameParamsSchema, updateProfileSchema } from "../validations/user.validation";
import { postListQuerySchema } from "../validations/post.validation";

const router = Router();

router.get("/", validateRequest(postListQuerySchema), userController.list);
router.patch("/me/profile", requireAuth, validateRequest(updateProfileSchema), userController.updateProfile);
router.get("/:username", validateRequest(usernameParamsSchema), userController.getProfile);

export default router;

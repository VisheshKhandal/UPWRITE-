import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import { updateProfileSchema, usernameParamsSchema } from "../validations/user.validation";

const router = Router();

router.get("/:username", optionalAuth, validateRequest(usernameParamsSchema), userController.getProfile);
router.patch("/me", requireAuth, validateRequest(updateProfileSchema), userController.updateProfile);

export default router;

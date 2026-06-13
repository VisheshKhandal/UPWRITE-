import { Router } from "express";
import { interactionController } from "../controllers/interaction.controller";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import { likeToggleSchema } from "../validations/interaction.validation";

const router = Router();

router.post("/toggle", requireAuth, validateRequest(likeToggleSchema), interactionController.toggleLike);

export default router;

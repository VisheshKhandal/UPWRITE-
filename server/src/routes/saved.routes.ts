import { Router } from "express";
import { interactionController } from "../controllers/interaction.controller";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import { bookmarkToggleSchema } from "../validations/interaction.validation";
import { postListQuerySchema } from "../validations/post.validation";

const router = Router();

router.get("/", requireAuth, validateRequest(postListQuerySchema), interactionController.listSaved);
router.post("/", requireAuth, validateRequest(bookmarkToggleSchema), interactionController.save);

export default router;

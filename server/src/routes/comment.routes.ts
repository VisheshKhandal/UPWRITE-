import { Router } from "express";
import { interactionController } from "../controllers/interaction.controller";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import {
  commentCreateSchema,
  commentIdParamsSchema,
  commentListSchema
} from "../validations/interaction.validation";

const router = Router();

router.get("/", validateRequest(commentListSchema), interactionController.listComments);
router.post("/", requireAuth, validateRequest(commentCreateSchema), interactionController.createComment);
router.delete("/:id", requireAuth, validateRequest(commentIdParamsSchema), interactionController.deleteComment);

export default router;

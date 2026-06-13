import { Router } from "express";
import { interactionController } from "../controllers/interaction.controller";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import {
  collectionIdParamsSchema,
  collectionItemParamsSchema,
  createCollectionSchema,
  updateCollectionSchema
} from "../validations/interaction.validation";
import { postListQuerySchema } from "../validations/post.validation";

const router = Router();

router.get("/", requireAuth, validateRequest(postListQuerySchema), interactionController.listCollections);
router.post("/", requireAuth, validateRequest(createCollectionSchema), interactionController.createCollection);
router.patch("/:id", requireAuth, validateRequest(updateCollectionSchema), interactionController.updateCollection);
router.delete("/:id", requireAuth, validateRequest(collectionIdParamsSchema), interactionController.deleteCollection);
router.get("/:id/items", requireAuth, validateRequest(collectionIdParamsSchema), interactionController.listCollectionItems);
router.delete("/:id/items/:itemId", requireAuth, validateRequest(collectionItemParamsSchema), interactionController.removeCollectionItem);

export default router;
